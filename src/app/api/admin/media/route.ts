import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { apiAuthorize } from "@/lib/api-guard";
import { audit } from "@/lib/audit";
import { createMedia, toAsset } from "@/lib/media";
import { MAX_VIDEO_BYTES, MediaError } from "@/lib/media/process";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 36;

export async function GET(request: Request) {
  const user = await apiAuthorize(request, []);
  if (user instanceof Response) return user;
  // Anyone who can edit content may browse media to pick images.
  if (!["media.manage", "pages.edit", "services.edit", "blog.edit", "collections.edit", "settings.edit", "seo.edit"].some((p) => user.permissions.has(p as never))) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim().slice(0, 80) ?? "";
  const type = url.searchParams.get("type") ?? "all";
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const where = {
    ...(q ? { originalName: { contains: q, mode: "insensitive" as const } } : {}),
    ...(type === "image" ? { mimeType: { startsWith: "image/" } } : type === "video" ? { mimeType: { startsWith: "video/" } } : {}),
  };
  const [total, items] = await Promise.all([
    db.media.count({ where }),
    db.media.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
  ]);
  return Response.json({
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    items: items.map((m) => ({ ...toAsset(m), originalName: m.originalName, size: m.size, createdAt: m.createdAt, caption: m.caption })),
  });
}

export async function POST(request: Request) {
  const user = await apiAuthorize(request, ["media.manage"], { mutation: true });
  if (user instanceof Response) return user;
  const limit = await rateLimit(`upload:${user.id}`, 120, 3600);
  if (!limit.ok) return Response.json({ error: "rate_limited" }, { status: 429 });

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_VIDEO_BYTES + 1024 * 1024) return Response.json({ error: "too_large" }, { status: 413 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "invalid_upload" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return Response.json({ error: "invalid_upload" }, { status: 400 });

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const alt = { ar: String(form.get("alt_ar") ?? "").slice(0, 300), en: String(form.get("alt_en") ?? "").slice(0, 300) };
    const media = await createMedia(buf, file.name || "upload", { userId: user.id, alt });
    await audit({ action: "media.upload", userId: user.id, actorEmail: user.email, entityType: "media", entityId: media.id, metadata: { name: media.originalName, size: media.size } });
    revalidateTag("media", { expire: 0 });
    return Response.json({ item: { ...toAsset(media), originalName: media.originalName, size: media.size, createdAt: media.createdAt } }, { status: 201 });
  } catch (error) {
    if (error instanceof MediaError) return Response.json({ error: error.code }, { status: 415 });
    console.error("[media] upload failed", error);
    return Response.json({ error: "server" }, { status: 500 });
  }
}

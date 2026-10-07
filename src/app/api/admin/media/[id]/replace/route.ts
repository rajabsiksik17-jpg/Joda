import { revalidateTag } from "next/cache";
import { apiAuthorize } from "@/lib/api-guard";
import { audit } from "@/lib/audit";
import { replaceMediaFile, toAsset } from "@/lib/media";
import { MediaError } from "@/lib/media/process";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiAuthorize(request, ["media.manage"], { mutation: true });
  if (user instanceof Response) return user;
  const { id } = await params;
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) return Response.json({ error: "invalid_upload" }, { status: 400 });
  try {
    const media = await replaceMediaFile(id, Buffer.from(await file.arrayBuffer()), file.name || "upload");
    await audit({ action: "media.replace", userId: user.id, actorEmail: user.email, entityType: "media", entityId: id });
    revalidateTag("content", { expire: 0 });
    return Response.json({ item: { ...toAsset(media), originalName: media.originalName, size: media.size, createdAt: media.createdAt } });
  } catch (error) {
    if (error instanceof MediaError) return Response.json({ error: error.code }, { status: 415 });
    if ((error as { code?: string })?.code === "P2025") return Response.json({ error: "not_found" }, { status: 404 });
    console.error("[media] replace failed", error);
    return Response.json({ error: "server" }, { status: 500 });
  }
}

import { db } from "@/lib/db";
import { apiAuthorize } from "@/lib/api-guard";
import { toAsset } from "@/lib/media";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiAuthorize(request, []);
  if (user instanceof Response) return user;
  const { id } = await params;
  const m = await db.media.findUnique({ where: { id } });
  if (!m) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ item: { ...toAsset(m), originalName: m.originalName, size: m.size, createdAt: m.createdAt, caption: m.caption } });
}

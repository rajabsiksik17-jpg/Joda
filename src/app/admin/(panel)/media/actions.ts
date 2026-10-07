"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { authorize } from "@/lib/auth/session";
import { guarded, invalidateContent, type ActionResult } from "@/lib/actions";
import { deleteObject } from "@/lib/media/storage";
import { findMediaUsage, type MediaUsage } from "@/lib/media/usage";

const metaSchema = z.object({
  alt: z.object({ ar: z.string().trim().max(300).default(""), en: z.string().trim().max(300).default("") }),
  caption: z.object({ ar: z.string().trim().max(500).default(""), en: z.string().trim().max(500).default("") }),
});

export async function updateMediaMeta(id: string, input: unknown): Promise<ActionResult> {
  return guarded(async () => {
    const user = await authorize("media.manage");
    const data = metaSchema.parse(input);
    await db.media.update({ where: { id }, data });
    await audit({ action: "media.update", userId: user.id, actorEmail: user.email, entityType: "media", entityId: id });
    invalidateContent();
    return { ok: true };
  });
}

export async function getMediaUsage(id: string): Promise<ActionResult<MediaUsage[]>> {
  return guarded(async () => {
    await authorize("media.manage");
    return { ok: true, data: await findMediaUsage(id) };
  });
}

export async function deleteMedia(id: string): Promise<ActionResult> {
  return guarded(async () => {
    const user = await authorize("media.manage");
    const media = await db.media.delete({ where: { id } });
    await deleteObject(media.key);
    await audit({ action: "media.delete", userId: user.id, actorEmail: user.email, entityType: "media", entityId: id, metadata: { name: media.originalName } });
    invalidateContent();
    return { ok: true };
  });
}

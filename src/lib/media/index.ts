import "server-only";
import { randomBytes } from "node:crypto";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { db } from "../db";
import type { L } from "../i18n/localized";
import { processUpload, slugifyFilename } from "./process";
import { deleteObject, putObject, publicUrl } from "./storage";

export type MediaAsset = { id: string; url: string; mimeType: string; width: number | null; height: number | null; alt: L; isVideo: boolean; isSvg: boolean };

function newKey(originalName: string, ext: string) {
  const now = new Date();
  const month = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return `${month}/${slugifyFilename(originalName)}-${randomBytes(5).toString("hex")}.${ext}`;
}

export async function createMedia(buf: Buffer, originalName: string, opts: { userId?: string | null; alt?: L; folder?: string | null } = {}) {
  const processed = await processUpload(buf);
  const key = newKey(originalName, processed.ext);
  await putObject(key, processed.data);
  try {
    return await db.media.create({
      data: {
        key,
        originalName: originalName.slice(0, 200),
        mimeType: processed.mime,
        size: processed.data.length,
        width: processed.width,
        height: processed.height,
        alt: opts.alt ?? { ar: "", en: "" },
        folder: opts.folder ?? null,
        uploadedById: opts.userId ?? null,
      },
    });
  } catch (error) {
    await deleteObject(key);
    throw error;
  }
}

/** Replaces the file behind an existing media record; every reference (by id) picks up the new file. */
export async function replaceMediaFile(id: string, buf: Buffer, originalName: string) {
  const existing = await db.media.findUniqueOrThrow({ where: { id } });
  const processed = await processUpload(buf);
  const key = newKey(originalName, processed.ext);
  await putObject(key, processed.data);
  const updated = await db.media.update({
    where: { id },
    data: { key, originalName: originalName.slice(0, 200), mimeType: processed.mime, size: processed.data.length, width: processed.width, height: processed.height },
  });
  await deleteObject(existing.key);
  return updated;
}

export function toAsset(m: { id: string; key: string; mimeType: string; width: number | null; height: number | null; alt: unknown }): MediaAsset {
  return {
    id: m.id,
    url: publicUrl(m.key),
    mimeType: m.mimeType,
    width: m.width,
    height: m.height,
    alt: (m.alt as L) ?? {},
    isVideo: m.mimeType.startsWith("video/"),
    isSvg: m.mimeType === "image/svg+xml",
  };
}

const cachedMedia = unstable_cache(
  async (id: string) => {
    const m = await db.media.findUnique({ where: { id } });
    return m ? toAsset(m) : null;
  },
  ["media-by-id"],
  { tags: ["content", "media"] },
);

/** Resolves a media id for rendering (cached across requests, memoised within a request). */
export const getMedia = cache(async (id: string | null | undefined): Promise<MediaAsset | null> => {
  if (!id || typeof id !== "string" || id.length > 64) return null;
  return cachedMedia(id);
});

import "server-only";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { db } from "../db";

/**
 * Media storage with two drivers:
 * - "db" (default): file bytes are stored in PostgreSQL (MediaBlob). Moving the site to another
 *   server only needs a database backup/restore — nothing else to copy.
 * - "local": files on a persistent disk (UPLOAD_DIR), outside /public.
 * Either way files are served through /uploads/… with the same URLs and strict security headers.
 */
const DRIVER = process.env.STORAGE_DRIVER === "local" ? "local" : "db";
const ROOT = path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.UPLOAD_DIR || "./storage/uploads");
const KEY_RE = /^[a-z0-9][a-z0-9/_.-]{0,200}$/;

export function isValidKey(key: string) {
  return KEY_RE.test(key) && !key.includes("..") && !key.includes("//");
}

function resolveKey(key: string) {
  if (!isValidKey(key)) throw new Error("Invalid storage key");
  const full = path.resolve(ROOT, key);
  if (!full.startsWith(ROOT + path.sep)) throw new Error("Invalid storage key");
  return full;
}

function assertKey(key: string) {
  if (!isValidKey(key)) throw new Error("Invalid storage key");
}

export async function putObject(key: string, data: Buffer) {
  if (DRIVER === "db") {
    assertKey(key);
    const bytes = new Uint8Array(data);
    await db.mediaBlob.upsert({ where: { key }, create: { key, data: bytes, size: data.length }, update: { data: bytes, size: data.length } });
    return;
  }
  const full = resolveKey(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
}

export async function getObject(key: string): Promise<Buffer> {
  if (DRIVER === "db") {
    assertKey(key);
    const row = await db.mediaBlob.findUnique({ where: { key }, select: { data: true } });
    if (!row) throw new Error("Not found");
    return Buffer.from(row.data);
  }
  return readFile(resolveKey(key));
}

export async function statObject(key: string): Promise<{ size: number; mtime: Date } | null> {
  try {
    if (DRIVER === "db") {
      assertKey(key);
      const row = await db.mediaBlob.findUnique({ where: { key }, select: { size: true, createdAt: true } });
      return row ? { size: row.size, mtime: row.createdAt } : null;
    }
    const s = await stat(resolveKey(key));
    return s.isFile() ? { size: s.size, mtime: s.mtime } : null;
  } catch {
    return null;
  }
}

export async function streamObject(key: string, range?: { start: number; end: number }): Promise<Readable> {
  if (DRIVER === "db") {
    assertKey(key);
    if (range) {
      // Read only the requested byte range (video seeking) instead of the whole file.
      const rows = await db.$queryRaw<{ chunk: Uint8Array }[]>`SELECT substring(data FROM ${range.start + 1}::int FOR ${range.end - range.start + 1}::int) AS chunk FROM "MediaBlob" WHERE key = ${key}`;
      if (!rows[0]) throw new Error("Not found");
      return Readable.from([Buffer.from(rows[0].chunk)]);
    }
    return Readable.from([await getObject(key)]);
  }
  return createReadStream(resolveKey(key), range);
}

export async function deleteObject(key: string) {
  if (DRIVER === "db") {
    assertKey(key);
    await db.mediaBlob.deleteMany({ where: { key } });
    return;
  }
  await rm(resolveKey(key), { force: true });
}

export function publicUrl(key: string) {
  return `/uploads/${key}`;
}

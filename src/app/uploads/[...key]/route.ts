import { Readable } from "node:stream";
import { isValidKey, statObject, streamObject } from "@/lib/media/storage";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
};

/**
 * Serves uploaded media with strict headers. Keys are unique per upload, so responses are cached
 * immutably. SVGs are sandboxed so an image can never execute script in the site's origin.
 */
export async function GET(request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: parts } = await params;
  const key = parts.join("/");
  if (!isValidKey(key)) return new Response("Not found", { status: 404 });
  const ext = key.split(".").pop() ?? "";
  const type = TYPES[ext];
  if (!type) return new Response("Not found", { status: 404 });
  const info = await statObject(key);
  if (!info) return new Response("Not found", { status: 404 });

  const headers = new Headers({
    "Content-Type": type,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Accept-Ranges": "bytes",
    "Last-Modified": info.mtime.toUTCString(),
  });

  // Byte-range support for video seeking.
  const range = request.headers.get("range");
  if (range && type.startsWith("video/")) {
    const m = range.match(/bytes=(\d*)-(\d*)/);
    if (m) {
      const start = m[1] ? Number(m[1]) : Math.max(0, info.size - Number(m[2]));
      const end = m[1] && m[2] ? Math.min(Number(m[2]), info.size - 1) : info.size - 1;
      if (start >= info.size || start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
      headers.set("Content-Range", `bytes ${start}-${end}/${info.size}`);
      headers.set("Content-Length", String(end - start + 1));
      return new Response(Readable.toWeb(await streamObject(key, { start, end })) as ReadableStream, { status: 206, headers });
    }
  }
  headers.set("Content-Length", String(info.size));
  return new Response(Readable.toWeb(await streamObject(key)) as ReadableStream, { status: 200, headers });
}

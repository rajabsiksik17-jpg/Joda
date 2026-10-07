import "server-only";
import sharp, { type Sharp } from "sharp";
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_SVG_BYTES = 1 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 60 * 1024 * 1024;
export const MAX_IMAGE_EDGE = 2560;

export type DetectedType = { mime: string; ext: string; kind: "image" | "svg" | "video" };

/** Detects the real file type from its bytes. The client-supplied MIME type is never trusted. */
export function detectType(buf: Buffer): DetectedType | null {
  const hex = buf.subarray(0, 16).toString("hex");
  const ascii = buf.subarray(0, 16).toString("latin1");
  if (hex.startsWith("ffd8ff")) return { mime: "image/jpeg", ext: "jpg", kind: "image" };
  if (hex.startsWith("89504e470d0a1a0a")) return { mime: "image/png", ext: "png", kind: "image" };
  if (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP") return { mime: "image/webp", ext: "webp", kind: "image" };
  if (ascii.slice(4, 8) === "ftyp") {
    const brand = ascii.slice(8, 12);
    if (brand === "avif" || brand === "avis") return { mime: "image/avif", ext: "avif", kind: "image" };
    if (["isom", "iso2", "mp41", "mp42", "avc1", "M4V ", "dash"].includes(brand)) return { mime: "video/mp4", ext: "mp4", kind: "video" };
  }
  if (hex.startsWith("1a45dfa3")) return { mime: "video/webm", ext: "webm", kind: "video" };
  const head = buf.subarray(0, 1024).toString("utf8").trimStart().toLowerCase();
  if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) return { mime: "image/svg+xml", ext: "svg", kind: "svg" };
  return null;
}

export type ProcessedFile = { data: Buffer; mime: string; ext: string; width: number | null; height: number | null };

export class MediaError extends Error {
  constructor(public code: "unsupported_type" | "too_large" | "corrupt" | "unsafe_svg") {
    super(code);
  }
}

export async function processUpload(buf: Buffer): Promise<ProcessedFile> {
  const type = detectType(buf);
  if (!type) throw new MediaError("unsupported_type");

  if (type.kind === "svg") {
    if (buf.length > MAX_SVG_BYTES) throw new MediaError("too_large");
    const clean = sanitizeSvg(buf.toString("utf8"));
    const dims = svgDimensions(clean);
    return { data: Buffer.from(clean, "utf8"), mime: type.mime, ext: "svg", ...dims };
  }

  if (type.kind === "video") {
    if (buf.length > MAX_VIDEO_BYTES) throw new MediaError("too_large");
    return { data: buf, mime: type.mime, ext: type.ext, width: null, height: null };
  }

  if (buf.length > MAX_IMAGE_BYTES) throw new MediaError("too_large");
  try {
    // Re-encoding strips EXIF/GPS metadata and neutralises malformed payloads.
    const pipeline = sharp(buf, { failOn: "error", limitInputPixels: 80_000_000 })
      .rotate()
      .resize({ width: MAX_IMAGE_EDGE, height: MAX_IMAGE_EDGE, fit: "inside", withoutEnlargement: true });
    let out: Sharp;
    switch (type.ext) {
      case "jpg": out = pipeline.jpeg({ quality: 84, mozjpeg: true }); break;
      case "png": out = pipeline.png({ compressionLevel: 9, palette: false }); break;
      case "webp": out = pipeline.webp({ quality: 84 }); break;
      default: out = pipeline.avif({ quality: 62 });
    }
    const { data, info } = await out.toBuffer({ resolveWithObject: true });
    return { data, mime: type.mime, ext: type.ext, width: info.width, height: info.height };
  } catch {
    throw new MediaError("corrupt");
  }
}

let purifier: ReturnType<typeof createDOMPurify> | null = null;

export function sanitizeSvg(svg: string): string {
  if (!purifier) purifier = createDOMPurify(new JSDOM("").window as unknown as Parameters<typeof createDOMPurify>[0]);
  const clean = purifier.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ["script", "foreignObject", "iframe", "embed", "object", "use"],
    FORBID_ATTR: ["xlink:href"],
  });
  if (!clean || !/^\s*<svg[\s>]/i.test(clean)) throw new MediaError("unsafe_svg");
  // External references are not allowed (tracking pixels, CSS imports).
  if (/(https?:)?\/\/|@import|url\(\s*['"]?(?!#)/i.test(clean.replace(/xmlns(:\w+)?="[^"]*"/g, ""))) throw new MediaError("unsafe_svg");
  return clean;
}

function svgDimensions(svg: string): { width: number | null; height: number | null } {
  const tag = svg.match(/<svg[^>]*>/i)?.[0] ?? "";
  const num = (attr: string) => {
    const m = tag.match(new RegExp(`\\s${attr}="([\\d.]+)(px)?"`, "i"));
    return m ? Math.round(Number(m[1])) : null;
  };
  let width = num("width");
  let height = num("height");
  const vb = tag.match(/viewBox="[\d.\-]+[\s,]+[\d.\-]+[\s,]+([\d.]+)[\s,]+([\d.]+)"/i);
  if ((!width || !height) && vb) {
    width = Math.round(Number(vb[1]));
    height = Math.round(Number(vb[2]));
  }
  return { width, height };
}

export function slugifyFilename(name: string) {
  const base = name.replace(/\.[^.]+$/, "");
  const slug = base
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  return slug || "file";
}

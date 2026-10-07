import { describe, expect, it } from "vitest";
import { sanitizeRichText, toPlainText } from "@/lib/sanitize";
import { detectType, sanitizeSvg, MediaError } from "@/lib/media/process";
import { isValidKey } from "@/lib/media/storage";
import { contactSchema } from "@/lib/contact-schema";
import { SECTIONS, defaultSectionData, sectionSchema, sectionSettingsSchema } from "@/lib/sections/registry";
import { buildSchema, zHref } from "@/lib/sections/fields";
import { matchAcceptLanguage } from "@/lib/i18n/config";
import { tr } from "@/lib/i18n/localized";
import { channelHref, localizeHref } from "@/lib/links";
import { parseSetting } from "@/lib/settings-schema";
import { toEmbedUrl } from "@/lib/video";

describe("rich text sanitisation", () => {
  it("removes scripts, event handlers and javascript: links", () => {
    const out = sanitizeRichText(`<p onclick="x()">Hi<script>alert(1)</script></p><a href="javascript:alert(1)">x</a><img src="x" onerror="y">`);
    expect(out).not.toMatch(/script|onclick|onerror|javascript:/i);
  });

  it("keeps editorial formatting and adds safe attributes to external links", () => {
    const out = sanitizeRichText(`<h2>Title</h2><p><strong>B</strong> <a href="https://example.com">link</a></p><ul><li>a</li></ul>`);
    expect(out).toContain("<h2>Title</h2>");
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it("only allows images uploaded to the site", () => {
    expect(sanitizeRichText(`<img src="https://tracker.example/p.gif">`)).not.toContain("<img");
    expect(sanitizeRichText(`<img src="/uploads/2026/10/a.webp" alt="a">`)).toContain('src="/uploads/2026/10/a.webp"');
  });

  it("produces plain-text excerpts", () => {
    expect(toPlainText("<p>Hello <b>world</b></p>", 50)).toBe("Hello world");
    expect(toPlainText(`<p>${"word ".repeat(100)}</p>`, 20).length).toBeLessThanOrEqual(20);
  });
});

describe("upload safety", () => {
  it("detects real file types from bytes, not names", () => {
    expect(detectType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]))?.mime).toBe("image/jpeg");
    expect(detectType(Buffer.from("89504e470d0a1a0a0000", "hex"))?.mime).toBe("image/png");
    expect(detectType(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>"))?.kind).toBe("svg");
    expect(detectType(Buffer.from("<?php echo 1; ?>"))).toBeNull();
    expect(detectType(Buffer.from("MZ\x90\x00"))).toBeNull();
  });

  it("strips scripts and event handlers from SVG", () => {
    const clean = sanitizeSvg(`<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><rect onload="x()" width="10" height="10"/></svg>`);
    expect(clean).not.toMatch(/script|onload/i);
    expect(clean).toContain("<rect");
  });

  it("rejects SVGs that reference external resources", () => {
    expect(() => sanitizeSvg(`<svg xmlns="http://www.w3.org/2000/svg"><image href="https://evil.example/x.png"/></svg>`)).toThrow(MediaError);
  });

  it("rejects storage keys that try to escape the upload directory", () => {
    expect(isValidKey("2026/10/logo-ab12.png")).toBe(true);
    for (const bad of ["../.env", "a/../../b", "/etc/passwd", "C:\\x", "a//b"]) expect(isValidKey(bad)).toBe(false);
  });
});

describe("contact form validation", () => {
  const valid = { name: "Test Person", email: "t@example.com", phone: "", company: "", service: "", subject: "", message: "I would like to know more about governance.", consent: true };

  it("accepts a valid enquiry", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("requires consent, a real e-mail and a meaningful message", () => {
    expect(contactSchema.safeParse({ ...valid, consent: false }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, message: "hi" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, phone: "call me maybe" }).success).toBe(false);
  });
});

describe("page builder schemas", () => {
  it("every section type validates its own defaults", () => {
    for (const s of SECTIONS) {
      const result = sectionSchema(s.type)!.safeParse(defaultSectionData(s.type));
      // Required fields may be empty in defaults; everything else must parse.
      const nonRequired = result.success || result.error.issues.every((i) => i.message === "required");
      expect(nonRequired, s.type).toBe(true);
    }
  });

  it("rejects unsafe links in buttons", () => {
    expect(zHref.safeParse("javascript:alert(1)").success).toBe(false);
    expect(zHref.safeParse("//evil.example").success).toBe(false);
    for (const ok of ["/contact", "https://example.com", "mailto:a@b.co", "tel:+962", "#top", ""]) expect(zHref.safeParse(ok).success, ok).toBe(true);
  });

  it("validates nested repeaters", () => {
    const schema = buildSchema(SECTIONS.find((s) => s.type === "cards")!.fields);
    const ok = schema.safeParse({ items: [{ icon: "landmark", title: { en: "A" }, text: { ar: "ب" }, link: { label: {}, href: "/a" } }] });
    expect(ok.success).toBe(true);
    const bad = schema.safeParse({ items: [{ link: { label: {}, href: "javascript:x" } }] });
    expect(bad.success).toBe(false);
  });

  it("restricts anchors to safe identifiers", () => {
    expect(sectionSettingsSchema.safeParse({ anchor: "our-services" }).success).toBe(true);
    expect(sectionSettingsSchema.safeParse({ anchor: "x\" onmouseover=\"y" }).success).toBe(false);
  });
});

describe("i18n & links", () => {
  it("negotiates the visitor language", () => {
    expect(matchAcceptLanguage("en-US,en;q=0.9,ar;q=0.8")).toBe("en");
    expect(matchAcceptLanguage("ar-JO,ar;q=0.9")).toBe("ar");
    expect(matchAcceptLanguage("fr-FR,de;q=0.5")).toBeNull();
  });

  it("resolves localized values without mixing languages unless asked", () => {
    expect(tr({ ar: "مرحبا", en: "" }, "en")).toBe("");
    expect(tr({ ar: "مرحبا", en: "" }, "en", true)).toBe("مرحبا");
  });

  it("prefixes internal links with the locale and leaves external links alone", () => {
    expect(localizeHref("ar", "/contact")).toBe("/ar/contact");
    expect(localizeHref("en", "/")).toBe("/en");
    expect(localizeHref("en", "https://example.com")).toBe("https://example.com");
    expect(localizeHref("en", "/ar/about")).toBe("/ar/about");
  });

  it("builds contact links from channel values", () => {
    expect(channelHref("PHONE", "+962 7 9823 6864")).toBe("tel:+962798236864");
    expect(channelHref("WHATSAPP", "+962 7 9823 6864")).toBe("https://wa.me/962798236864");
    expect(channelHref("EMAIL", "info@qc-jo.com")).toBe("mailto:info@qc-jo.com");
  });

  it("only produces privacy-friendly video embeds", () => {
    expect(toEmbedUrl("https://www.youtube.com/watch?v=abc123")).toContain("youtube-nocookie.com/embed/abc123");
    expect(toEmbedUrl("https://vimeo.com/123456")).toContain("dnt=1");
    expect(toEmbedUrl("https://evil.example/video")).toBeNull();
  });
});

describe("settings", () => {
  it("falls back to safe defaults for missing or invalid values", () => {
    const sec = parseSetting("security", { otpTtlMinutes: 999 });
    expect(sec.otpTtlMinutes).toBe(5);
    expect(parseSetting("analytics", undefined).provider).toBe("none");
  });
});

import sanitizeHtml from "sanitize-html";

/**
 * Sanitises rich text produced by the CMS editor. Applied on save (defence in depth: content
 * is also only ever written by authenticated editors).
 */
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li", "blockquote",
      "h2", "h3", "h4", "hr", "code", "pre", "img", "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td", "span",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "title"],
      img: ["src", "alt", "width", "height", "loading"],
      p: ["style", "dir"],
      h2: ["style", "id", "dir"],
      h3: ["style", "id", "dir"],
      h4: ["style", "dir"],
      li: ["dir"],
      span: ["dir"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
    },
    allowedStyles: { "*": { "text-align": [/^(left|right|center|justify|start|end)$/] } },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https"] },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => {
        const external = /^https?:\/\//i.test(attribs.href ?? "");
        return { tagName, attribs: { ...attribs, ...(external ? { target: "_blank", rel: "noopener noreferrer" } : {}) } };
      },
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
    },
    // Only same-origin uploaded images may be embedded (relative /uploads paths).
    exclusiveFilter: (frame) => frame.tag === "img" && !!frame.attribs.src && !frame.attribs.src.startsWith("/uploads/"),
  });
}

/** Strips all markup — for excerpts, meta descriptions and search snippets. */
export function toPlainText(html: string, max = 300): string {
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export function readingMinutes(html: string) {
  const words = toPlainText(html, 1_000_000).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

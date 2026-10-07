import "server-only";
import { sanitizeRichText } from "../sanitize";
import type { Field, FieldValues } from "./fields";

/** Sanitises every rich-text value (including inside repeaters) according to the field definitions. */
export function sanitizeByFields(fields: Field[], values: FieldValues): FieldValues {
  const out: FieldValues = { ...values };
  for (const f of fields) {
    const v = out[f.name];
    if (f.type === "richtext" && v && typeof v === "object") {
      const l = v as Record<string, string>;
      out[f.name] = Object.fromEntries(Object.entries(l).map(([k, html]) => [k, typeof html === "string" ? sanitizeRichText(html) : ""]));
    } else if (f.type === "list" && Array.isArray(v)) {
      out[f.name] = v.map((item) => sanitizeByFields(f.fields, item as FieldValues));
    }
  }
  return out;
}

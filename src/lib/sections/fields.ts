import { z } from "zod";

/** Bilingual label used throughout the admin UI. */
export type Bi = { ar: string; en: string };

type Base = { name: string; label: Bi; help?: Bi; required?: boolean; width?: "full" | "half" };

export type ReferenceCollection = "services" | "teamMembers" | "serviceCategories" | "blogCategories" | "clientGroups" | "pages";

export type Field =
  | (Base & { type: "text"; localized?: boolean; max?: number; placeholder?: Bi; format?: "url" | "email" | "slug" | "href" | "phone" })
  | (Base & { type: "textarea"; localized?: boolean; max?: number; rows?: number })
  | (Base & { type: "richtext" })
  | (Base & { type: "number"; min?: number; max?: number; step?: number })
  | (Base & { type: "boolean" })
  | (Base & { type: "select"; options: { value: string; label: Bi }[] })
  | (Base & { type: "media"; accept?: "image" | "video" })
  | (Base & { type: "link" })
  | (Base & { type: "icon" })
  | (Base & { type: "reference"; collection: ReferenceCollection; multiple?: boolean })
  | (Base & { type: "list"; fields: Field[]; itemTitle?: string; max?: number; addLabel?: Bi })
  | (Base & { type: "datetime" })
  | (Base & { type: "tags"; max?: number });

export type FieldValues = Record<string, unknown>;

/** Accepts internal paths, in-page anchors and safe absolute URLs only. */
export const SAFE_HREF = /^(\/(?!\/)[^\s]*|#[\w-]*|https?:\/\/[^\s]+|mailto:[^\s]+|tel:[+\d\s()-]+)$/i;

export const zHref = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v === "" || SAFE_HREF.test(v), { message: "invalid_link" });

export const zLocalized = (max: number, required = false) =>
  z
    .object({ ar: z.string().trim().max(max).optional().default(""), en: z.string().trim().max(max).optional().default("") })
    .default({ ar: "", en: "" })
    .refine((v) => !required || !!(v.ar || v.en), { message: "required" });

export const zLink = z
  .object({ label: zLocalized(80), href: zHref.default("") })
  .default({ label: { ar: "", en: "" }, href: "" });

export const zId = z.string().max(64);

export const FORMATS = {
  url: /^https?:\/\/[^\s]+$/i,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  slug: /^[a-z0-9]+(-[a-z0-9]+)*$/,
  href: SAFE_HREF,
  phone: /^\+?[\d\s()./-]{4,40}$/,
} as const;

function fieldSchema(field: Field): z.ZodType {
  switch (field.type) {
    case "text":
    case "textarea":
      if (field.localized === false) {
        let s: z.ZodType<string> = z.string().trim().max(field.max ?? (field.type === "text" ? 300 : 5000));
        const fmt = field.type === "text" ? field.format : undefined;
        if (fmt) s = (s as z.ZodString).refine((v) => v === "" || FORMATS[fmt].test(v), { message: `invalid_${fmt}` });
        if (field.required) return (s as z.ZodString).refine((v) => v.length > 0, { message: "required" });
        return s.default("");
      }
      return zLocalized(field.max ?? (field.type === "text" ? 300 : 5000), field.required);
    case "richtext":
      return zLocalized(100_000, field.required);
    case "number": {
      let s = z.coerce.number();
      if (field.min !== undefined) s = s.min(field.min);
      if (field.max !== undefined) s = s.max(field.max);
      return s.optional();
    }
    case "boolean":
      return z.boolean().default(false);
    case "select": {
      const values = field.options.map((o) => o.value) as [string, ...string[]];
      return z.enum(values).default(values[0]);
    }
    case "media":
      return zId.nullable().default(null);
    case "icon":
      return z.string().max(40).default("");
    case "link":
      return zLink;
    case "reference":
      return field.multiple ? z.array(zId).max(50).default([]) : zId.nullable().default(null);
    case "list":
      return z.array(buildSchema(field.fields)).max(field.max ?? 50).default([]);
    case "datetime":
      return z
        .string()
        .trim()
        .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), { message: "invalid_date" })
        .nullable()
        .default(null);
    case "tags":
      return z.array(z.string().trim().min(1).max(40)).max(field.max ?? 20).default([]);
  }
}

export function buildSchema(fields: Field[]) {
  const shape: Record<string, z.ZodType> = {};
  for (const f of fields) shape[f.name] = fieldSchema(f);
  return z.object(shape);
}

/** Produces an empty value for a field list (used when adding sections or list items). */
export function emptyValues(fields: Field[]): FieldValues {
  const out: FieldValues = {};
  for (const f of fields) {
    switch (f.type) {
      case "text":
      case "textarea":
        out[f.name] = f.localized === false ? "" : { ar: "", en: "" };
        break;
      case "richtext":
        out[f.name] = { ar: "", en: "" };
        break;
      case "boolean":
        out[f.name] = false;
        break;
      case "select":
        out[f.name] = f.options[0]?.value ?? "";
        break;
      case "link":
        out[f.name] = { label: { ar: "", en: "" }, href: "" };
        break;
      case "list":
        out[f.name] = [];
        break;
      case "reference":
        out[f.name] = f.multiple ? [] : null;
        break;
      case "media":
        out[f.name] = null;
        break;
      case "number":
        out[f.name] = undefined;
        break;
      case "icon":
        out[f.name] = "";
        break;
      case "datetime":
        out[f.name] = null;
        break;
      case "tags":
        out[f.name] = [];
    }
  }
  return out;
}

export const bi = (en: string, ar: string): Bi => ({ en, ar });

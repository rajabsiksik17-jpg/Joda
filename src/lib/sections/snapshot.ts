import type { L } from "../i18n/localized";
import type { SectionSettings } from "./registry";

export type RenderSection = { id: string; type: string; data: Record<string, unknown>; settings: Partial<SectionSettings> };
export type PageSeo = { title?: L; description?: L; ogTitle?: L; ogDescription?: L; ogImageId?: string | null; noindex?: boolean };
export type PageSnapshot = { title: L; seo: PageSeo; sections: RenderSection[]; kind: string; updatedAt: string };

/** Freezes the current editable state of a page into what the public site renders. */
export function buildSnapshot(
  page: { title: unknown; seo: unknown; kind: string },
  sections: { id: string; type: string; data: unknown; settings: unknown; visible: boolean }[],
): PageSnapshot {
  return {
    title: page.title as L,
    seo: (page.seo as PageSeo) ?? {},
    kind: page.kind,
    updatedAt: new Date().toISOString(),
    sections: sections
      .filter((s) => s.visible)
      .map((s) => ({ id: s.id, type: s.type, data: (s.data as Record<string, unknown>) ?? {}, settings: (s.settings as Partial<SectionSettings>) ?? {} })),
  };
}

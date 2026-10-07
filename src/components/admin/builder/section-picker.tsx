"use client";

import { useState } from "react";
import { Bookmark, Trash2 } from "lucide-react";
import { SECTIONS, SECTION_CATEGORIES, SECTION_MAP, type SectionCategory } from "@/lib/sections/registry";
import { cn } from "@/lib/cn";
import { useAdminI18n } from "../i18n";
import { Button, EmptyState, Modal } from "../ui";
import { SectionIcon } from "./section-icons";

type Template = { id: string; name: string; type: string };

export function SectionPicker({ open, onOpenChange, onPick, templates, onPickTemplate, onDeleteTemplate }: { open: boolean; onOpenChange: (o: boolean) => void; onPick: (type: string) => void; templates: Template[]; onPickTemplate: (id: string) => void; onDeleteTemplate: (id: string) => void }) {
  const { tx, locale } = useAdminI18n();
  const [cat, setCat] = useState<SectionCategory | "templates">("hero");
  const cats = Object.entries(SECTION_CATEGORIES) as [SectionCategory, { en: string; ar: string }][];
  const list = cat === "templates" ? [] : SECTIONS.filter((s) => s.category === cat);

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={tx("Add a section", "إضافة قسم")} description={tx("Sections are inserted after the selected one.", "تُدرج الأقسام بعد القسم المحدد.")} size="xl">
      <div className="grid gap-5 md:grid-cols-[13rem_1fr]">
        <nav className="flex gap-1 overflow-x-auto md:flex-col" aria-label={tx("Categories", "الفئات")}>
          {cats.map(([key, label]) => (
            <button key={key} type="button" onClick={() => setCat(key)} className={cn("shrink-0 rounded-md px-3 py-2 text-start text-sm font-medium transition-colors", cat === key ? "bg-navy text-white" : "text-ink hover:bg-surface")}>
              {locale === "ar" ? label.ar : label.en}
            </button>
          ))}
          <button type="button" onClick={() => setCat("templates")} className={cn("flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-start text-sm font-medium transition-colors md:mt-2 md:border-t md:border-line md:pt-3", cat === "templates" ? "bg-navy text-white" : "text-ink hover:bg-surface")}>
            <Bookmark className="size-4" />
            {tx("Saved templates", "القوالب المحفوظة")} <span className="text-xs opacity-70" dir="ltr">({templates.length})</span>
          </button>
        </nav>
        <div>
          {cat === "templates" ? (
            templates.length === 0 ? (
              <EmptyState icon={<Bookmark className="size-5" />} title={tx("No saved templates", "لا توجد قوالب محفوظة")} text={tx("Use “Save as template” on any section to reuse it across pages.", "استخدم «حفظ كقالب» على أي قسم لإعادة استخدامه في صفحات أخرى.")} />
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {templates.map((t) => {
                  const def = SECTION_MAP[t.type];
                  return (
                    <li key={t.id} className="flex items-center gap-3 rounded-lg border border-line p-3 hover:border-tech">
                      <button type="button" onClick={() => onPickTemplate(t.id)} className="flex min-w-0 flex-1 items-center gap-3 text-start">
                        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-sky-50 text-tech-600"><SectionIcon name={def?.icon ?? ""} className="size-5" /></span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-ink">{t.name}</span>
                          <span className="block truncate text-xs text-muted">{def ? (locale === "ar" ? def.label.ar : def.label.en) : t.type}</span>
                        </span>
                      </button>
                      <Button size="icon" variant="ghost" className="size-8 text-red-600" onClick={() => onDeleteTemplate(t.id)} aria-label={tx("Delete template", "حذف القالب")}><Trash2 className="size-4" /></Button>
                    </li>
                  );
                })}
              </ul>
            )
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {list.map((s) => (
                <li key={s.type}>
                  <button type="button" onClick={() => onPick(s.type)} className="group flex h-full w-full items-start gap-3 rounded-lg border border-line p-4 text-start transition-[border-color,box-shadow] hover:border-tech hover:shadow-soft">
                    <span className="grid size-10 shrink-0 place-items-center rounded-md bg-sky-50 text-tech-600 transition-colors group-hover:bg-tech group-hover:text-white"><SectionIcon name={s.icon} className="size-5" /></span>
                    <span>
                      <span className="block text-sm font-semibold text-ink">{locale === "ar" ? s.label.ar : s.label.en}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted">{locale === "ar" ? s.description.ar : s.description.en}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}

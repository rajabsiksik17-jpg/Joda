"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useId } from "react";
import { toast } from "sonner";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertCircle, ArrowDown, ArrowLeft, ArrowUp, Bookmark, Copy, ExternalLink, Eye, EyeOff, GripVertical, History, Laptop, MoreHorizontal, PanelRightClose, PanelRightOpen,
  Plus, RotateCcw, Save, Send, Settings2, Smartphone, Tablet, Trash2, Undo2,
} from "lucide-react";
import { SECTION_MAP, SECTION_SETTINGS_FIELDS, defaultSectionData, defaultSectionSettings } from "@/lib/sections/registry";
import type { FieldValues } from "@/lib/sections/fields";
import { relativeTime, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import {
  deletePage, deleteSectionTemplate, duplicatePage, getSectionTemplate, listRevisions, publishPage, restoreRevision, savePageSections, saveSectionTemplate, unpublishPage, updatePageMeta,
} from "@/app/admin/(panel)/pages/actions";
import { StatusBadge } from "@/app/admin/(panel)/pages/pages-table";
import { useAdminI18n } from "../i18n";
import { FieldForm, stripKeys } from "../fields/field-form";
import { FieldEnvProvider, actionErrorText, errorText, type LinkSuggestion, type RefOption } from "../fields/env";
import { LocalizedInput } from "../fields/localized-input";
import { MediaField } from "../fields/media-field";
import { Badge, Button, ConfirmDialog, Drawer, EmptyState, FieldShell, Input, Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, Modal, Switch, Tabs } from "../ui";
import { SectionIcon } from "./section-icons";
import { SectionPicker } from "./section-picker";

type Section = { id: string; type: string; visible: boolean; data: FieldValues; settings: FieldValues };
type PageInfo = { id: string; slug: string; kind: string; title: { ar: string; en: string }; seo: Record<string, unknown>; status: string; changed: boolean; publishedAt: string | null; updatedAt: string };
type Props = {
  page: PageInfo;
  initialSections: Section[];
  env: { refs: Record<string, RefOption[]>; links: LinkSuggestion[] };
  templates: { id: string; name: string; type: string }[];
  can: { edit: boolean; publish: boolean; del: boolean };
};

let tmpSeq = 0;
const tmpId = () => `tmp-${Date.now()}-${++tmpSeq}`;

function preview(s: Section, locale: "ar" | "en") {
  const d = s.data as Record<string, unknown>;
  for (const k of ["title", "eyebrow", "text", "attribution"]) {
    const v = d[k] as { ar?: string; en?: string } | undefined;
    const t = v && (locale === "ar" ? v.ar || v.en : v.en || v.ar);
    if (t) return t.replace(/\s+/g, " ").slice(0, 70);
  }
  return "";
}

export function PageBuilder({ page: initialPage, initialSections, env, templates: initialTemplates, can }: Props) {
  const { tx, locale } = useAdminI18n();
  const router = useRouter();
  const [page, setPage] = useState(initialPage);
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initialSections));
  const [selected, setSelected] = useState<string | null>(initialSections[0]?.id ?? null);
  const [tab, setTab] = useState<"content" | "design">("content");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  // Remount drawers on every opening so they start from fresh state.
  const [drawerKey, setDrawerKey] = useState(0);
  const openSettings = () => { setDrawerKey((k) => k + 1); setSettingsOpen(true); };
  const openRevisions = () => { setDrawerKey((k) => k + 1); setRevisionsOpen(true); };
  const [templates, setTemplates] = useState(initialTemplates);
  const [templateFor, setTemplateFor] = useState<Section | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Section | null>(null);
  const [confirmPageDelete, setConfirmPageDelete] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLocale, setPreviewLocale] = useState<"ar" | "en">(locale);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewVersion, setPreviewVersion] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);

  const dirty = JSON.stringify(sections) !== savedJson;
  const current = sections.find((s) => s.id === selected) ?? null;
  const currentIndex = current ? sections.indexOf(current) : -1;
  const def = current ? SECTION_MAP[current.type] : null;
  const dndId = useId();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const sectionErrors = useMemo(() => {
    const byIndex = new Map<number, Record<string, string>>();
    for (const [k, v] of Object.entries(errors)) {
      const [idx, ...rest] = k.split(".");
      const i = Number(idx);
      if (!byIndex.has(i)) byIndex.set(i, {});
      byIndex.get(i)![rest.join(".")] = v;
    }
    return byIndex;
  }, [errors]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const update = (id: string, patch: Partial<Section>) => setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const save = useCallback(async (): Promise<boolean> => {
    if (!can.edit) return false;
    setSaving(true);
    const payload = sections.map((s) => ({ id: s.id.startsWith("tmp-") ? null : s.id, type: s.type, visible: s.visible, data: stripKeys(s.data), settings: s.settings }));
    const res = await savePageSections(page.id, payload);
    setSaving(false);
    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      const firstBad = Object.keys(res.fieldErrors ?? {})[0];
      if (firstBad !== undefined) setSelected(sections[Number(firstBad.split(".")[0])]?.id ?? selected);
      toast.error(actionErrorText(res.error, tx));
      return false;
    }
    const next = res.data!.map((s) => ({ ...s, data: s.data as FieldValues, settings: s.settings as FieldValues }));
    const selIdx = sections.findIndex((s) => s.id === selected);
    setSections(next);
    setSavedJson(JSON.stringify(next));
    setErrors({});
    if (selIdx >= 0) setSelected(next[selIdx]?.id ?? null);
    setPage((p) => ({ ...p, changed: true, updatedAt: new Date().toISOString() }));
    setPreviewVersion((v) => v + 1);
    toast.success(tx("Draft saved", "تم حفظ المسودة"));
    return true;
  }, [can.edit, page.id, sections, selected, tx]);

  // Ctrl/⌘ + S saves the draft.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !saving) save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dirty, saving, save]);

  const publish = async () => {
    if (dirty && !(await save())) return;
    setPublishing(true);
    const res = await publishPage(page.id);
    setPublishing(false);
    if (!res.ok) return toast.error(actionErrorText(res.error, tx));
    setPage((p) => ({ ...p, status: "PUBLISHED", changed: false, publishedAt: p.publishedAt ?? res.data!.publishedAt }));
    toast.success(tx("Published — the live website is updated.", "تم النشر — تم تحديث الموقع المباشر."));
  };

  const insert = (section: Section) => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === selected);
      const next = [...prev];
      next.splice(idx >= 0 ? idx + 1 : prev.length, 0, section);
      return next;
    });
    setSelected(section.id);
    setTab("content");
    setPickerOpen(false);
    setTimeout(() => editorRef.current?.scrollTo({ top: 0 }), 50);
  };

  const addSection = (type: string) => insert({ id: tmpId(), type, visible: true, data: defaultSectionData(type), settings: defaultSectionSettings() });

  const move = (id: string, dir: -1 | 1) => {
    setSections((prev) => {
      const i = prev.findIndex((s) => s.id === id);
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      return arrayMove(prev, i, j);
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    setSections((prev) => arrayMove(prev, prev.findIndex((s) => s.id === e.active.id), prev.findIndex((s) => s.id === e.over!.id)));
  };

  const pagePath = page.slug === "home" ? "" : `/${page.slug}`;
  const deviceWidth = { desktop: "100%", tablet: "820px", mobile: "390px" }[device];
  const previewSrc = `/${previewLocale}/preview/${page.id}?v=${previewVersion}${current && !current.id.startsWith("tmp-") ? `#s-${current.id}` : ""}`;

  return (
    <FieldEnvProvider value={env}>
      <div className="-mx-4 -my-6 flex min-h-[calc(100svh-4rem)] flex-col sm:-mx-6 lg:-mx-8 lg:-my-8">
        {/* ── Top bar ── */}
        <div className="sticky top-16 z-20 flex flex-wrap items-center gap-3 border-b border-line bg-white px-4 py-3 sm:px-6">
          <Link href="/admin/pages" className="grid size-9 place-items-center rounded-md text-muted hover:bg-surface hover:text-ink" aria-label={tx("Back to pages", "العودة إلى الصفحات")}>
            <ArrowLeft className="size-4 rtl:-scale-x-100" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-base font-bold text-ink">{(locale === "ar" ? page.title.ar || page.title.en : page.title.en || page.title.ar) || tx("Untitled", "بدون عنوان")}</h1>
              <StatusBadge status={page.status} changed={page.changed || dirty} />
              {dirty && <Badge tone="warning">{tx("Unsaved", "غير محفوظ")}</Badge>}
            </div>
            <p className="truncate text-xs text-muted" dir="ltr">/{locale}{pagePath} · {tx("saved", "حُفظ")} {relativeTime(page.updatedAt, locale)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="ghost" onClick={openSettings}><Settings2 className="size-4" /><span className="hidden sm:inline">{tx("Page settings", "إعدادات الصفحة")}</span></Button>
            <Button size="sm" variant="ghost" onClick={() => setShowPreview((v) => !v)} className="hidden xl:inline-flex">
              {showPreview ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}{tx("Live preview", "معاينة مباشرة")}
            </Button>
            <Button size="sm" onClick={async () => { if (dirty) await save(); window.open(`/${locale}/preview/${page.id}`, "_blank"); }}>
              <Eye className="size-4" /><span className="hidden sm:inline">{tx("Preview", "معاينة")}</span>
            </Button>
            {can.edit && <Button size="sm" onClick={save} loading={saving} disabled={!dirty}><Save className="size-4" />{tx("Save draft", "حفظ المسودة")}</Button>}
            {can.publish && (
              <Button size="sm" variant="primary" onClick={publish} loading={publishing} disabled={!dirty && !page.changed && page.status === "PUBLISHED"}>
                <Send className="size-4 rtl:-scale-x-100" />{page.status === "PUBLISHED" ? tx("Publish changes", "نشر التغييرات") : tx("Publish", "نشر")}
              </Button>
            )}
            <Menu>
              <MenuTrigger className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface hover:text-ink" aria-label={tx("More", "المزيد")}><MoreHorizontal className="size-4" /></MenuTrigger>
              <MenuContent>
                <MenuItem onSelect={openRevisions}><History className="size-4" />{tx("Revision history", "سجل النسخ")}</MenuItem>
                {page.status === "PUBLISHED" && <MenuItem onSelect={() => window.open(`/${locale}${pagePath}`, "_blank")}><ExternalLink className="size-4" />{tx("View live page", "عرض الصفحة المنشورة")}</MenuItem>}
                {dirty && <MenuItem onSelect={() => { const s = JSON.parse(savedJson); setSections(s); setErrors({}); setSelected(s[0]?.id ?? null); }}><Undo2 className="size-4" />{tx("Discard unsaved changes", "تجاهل التغييرات غير المحفوظة")}</MenuItem>}
                {can.edit && <MenuItem onSelect={async () => { const r = await duplicatePage(page.id); if (r.ok) router.push(`/admin/pages/${r.data!.id}`); }}><Copy className="size-4" />{tx("Duplicate page", "نسخ الصفحة")}</MenuItem>}
                {can.publish && page.status === "PUBLISHED" && page.kind !== "HOME" && (
                  <MenuItem onSelect={async () => { const r = await unpublishPage(page.id); if (r.ok) { setPage((p) => ({ ...p, status: "DRAFT" })); toast.success(tx("Page unpublished", "تم إلغاء نشر الصفحة")); } else toast.error(actionErrorText(r.error, tx)); }}>
                    <EyeOff className="size-4" />{tx("Unpublish", "إلغاء النشر")}
                  </MenuItem>
                )}
                {can.del && page.kind !== "HOME" && (<><MenuSeparator /><MenuItem danger onSelect={() => setConfirmPageDelete(true)}><Trash2 className="size-4" />{tx("Delete page", "حذف الصفحة")}</MenuItem></>)}
              </MenuContent>
            </Menu>
          </div>
        </div>

        <div className={cn("grid flex-1 lg:grid-cols-[19rem_1fr]", showPreview && "xl:grid-cols-[17rem_minmax(0,1fr)_minmax(0,1fr)]")}>
          {/* ── Outline ── */}
          <aside className="border-b border-line bg-white lg:sticky lg:top-[8.4rem] lg:h-[calc(100svh-8.4rem)] lg:overflow-y-auto lg:border-e lg:border-b-0">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <p className="text-xs font-semibold tracking-wide text-muted uppercase rtl:tracking-normal">{tx("Sections", "الأقسام")} <span dir="ltr">({sections.length})</span></p>
              {can.edit && <Button size="sm" variant="primary" onClick={() => setPickerOpen(true)}><Plus className="size-3.5" />{tx("Add", "إضافة")}</Button>}
            </div>
            <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <ul className="space-y-1 px-2 pb-4">
                  {sections.map((s, i) => {
                    const d = SECTION_MAP[s.type];
                    return (
                      <OutlineItem
                        key={s.id}
                        id={s.id}
                        active={s.id === selected}
                        hidden={!s.visible}
                        hasError={sectionErrors.has(i)}
                        icon={d?.icon ?? ""}
                        label={d ? (locale === "ar" ? d.label.ar : d.label.en) : s.type}
                        hint={preview(s, locale)}
                        canEdit={can.edit}
                        onSelect={() => { setSelected(s.id); setTab("content"); }}
                        onToggle={() => update(s.id, { visible: !s.visible })}
                      />
                    );
                  })}
                </ul>
              </SortableContext>
            </DndContext>
            {sections.length === 0 && (
              <div className="px-4 pb-6">
                <EmptyState title={tx("This page is empty", "هذه الصفحة فارغة")} text={tx("Add a first section to start building.", "أضف أول قسم لبدء البناء.")} action={can.edit ? <Button variant="primary" onClick={() => setPickerOpen(true)}><Plus className="size-4" />{tx("Add section", "إضافة قسم")}</Button> : undefined} />
              </div>
            )}
          </aside>

          {/* ── Editor ── */}
          <section ref={editorRef} className="min-w-0 bg-surface p-4 sm:p-6 lg:h-[calc(100svh-8.4rem)] lg:overflow-y-auto">
            {current && def ? (
              <div className="mx-auto max-w-3xl">
                <div className="mb-4 flex flex-wrap items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-navy text-sky"><SectionIcon name={def.icon} className="size-5" /></span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-ink">{locale === "ar" ? def.label.ar : def.label.en}</h2>
                    <p className="text-sm text-muted">{locale === "ar" ? def.description.ar : def.description.en}</p>
                  </div>
                  {can.edit && (
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => move(current.id, -1)} disabled={currentIndex === 0} aria-label={tx("Move up", "تحريك لأعلى")}><ArrowUp className="size-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => move(current.id, 1)} disabled={currentIndex === sections.length - 1} aria-label={tx("Move down", "تحريك لأسفل")}><ArrowDown className="size-4" /></Button>
                      <Menu>
                        <MenuTrigger className="grid size-9 place-items-center rounded-md text-muted hover:bg-white hover:text-ink" aria-label={tx("Section actions", "إجراءات القسم")}><MoreHorizontal className="size-4" /></MenuTrigger>
                        <MenuContent>
                          <MenuItem onSelect={() => update(current.id, { visible: !current.visible })}>{current.visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}{current.visible ? tx("Hide section", "إخفاء القسم") : tx("Show section", "إظهار القسم")}</MenuItem>
                          <MenuItem onSelect={() => insert({ ...structuredClone(current), id: tmpId() })}><Copy className="size-4" />{tx("Duplicate", "تكرار")}</MenuItem>
                          <MenuItem onSelect={() => { setTemplateFor(current); setTemplateName(""); }}><Bookmark className="size-4" />{tx("Save as template", "حفظ كقالب")}</MenuItem>
                          <MenuSeparator />
                          <MenuItem danger onSelect={() => setConfirmDelete(current)}><Trash2 className="size-4" />{tx("Delete section", "حذف القسم")}</MenuItem>
                        </MenuContent>
                      </Menu>
                    </div>
                  )}
                </div>
                {!current.visible && (
                  <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"><EyeOff className="size-4" />{tx("This section is hidden and won't appear on the website.", "هذا القسم مخفي ولن يظهر على الموقع.")}</div>
                )}
                {sectionErrors.has(currentIndex) && (
                  <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"><AlertCircle className="size-4" />{tx("Please fix the highlighted fields.", "يرجى تصحيح الحقول المحددة.")}</div>
                )}
                <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} items={[{ value: "content", label: tx("Content", "المحتوى") }, { value: "design", label: tx("Design", "التصميم") }]} className="mb-5" />
                <fieldset disabled={!can.edit} className="rounded-lg border border-line bg-white p-5 shadow-[0_1px_2px_rgba(7,31,63,0.04)]">
                  {tab === "content" ? (
                    def.fields.length ? (
                      <FieldForm key={current.id} fields={def.fields} value={current.data} onChange={(data) => update(current.id, { data })} errors={sectionErrors.get(currentIndex) ?? {}} />
                    ) : (
                      <p className="text-sm text-muted">{tx("This section has no content options.", "لا توجد خيارات محتوى لهذا القسم.")}</p>
                    )
                  ) : (
                    <FieldForm key={`${current.id}-s`} fields={SECTION_SETTINGS_FIELDS} value={current.settings} onChange={(settings) => update(current.id, { settings })} errors={Object.fromEntries(Object.entries(sectionErrors.get(currentIndex) ?? {}).filter(([k]) => k.startsWith("settings.")).map(([k, v]) => [k.slice(9), v]))} />
                  )}
                </fieldset>
              </div>
            ) : (
              <div className="mx-auto max-w-md pt-16">
                <EmptyState title={tx("Select a section to edit", "اختر قسماً لتحريره")} text={tx("Choose a section from the outline, or add a new one.", "اختر قسماً من القائمة أو أضف قسماً جديداً.")} />
              </div>
            )}
          </section>

          {/* ── Live preview ── */}
          {showPreview && (
            <section className="hidden border-s border-line bg-[#e9edf1] xl:sticky xl:top-[8.4rem] xl:flex xl:h-[calc(100svh-8.4rem)] xl:flex-col">
              <div className="flex items-center justify-between gap-2 border-b border-line bg-white px-3 py-2">
                <div className="flex gap-1">
                  {([["desktop", Laptop], ["tablet", Tablet], ["mobile", Smartphone]] as const).map(([d, Icon]) => (
                    <button key={d} type="button" onClick={() => setDevice(d)} aria-pressed={device === d} aria-label={d} className={cn("grid size-8 place-items-center rounded-md", device === d ? "bg-navy text-white" : "text-muted hover:bg-surface")}><Icon className="size-4" /></button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  {(["ar", "en"] as const).map((l) => (
                    <button key={l} type="button" onClick={() => setPreviewLocale(l)} aria-pressed={previewLocale === l} className={cn("rounded-md px-2.5 py-1 text-xs font-semibold", previewLocale === l ? "bg-navy text-white" : "text-muted hover:bg-surface")}>{l.toUpperCase()}</button>
                  ))}
                  <Button size="icon" variant="ghost" className="size-8" onClick={() => setPreviewVersion((v) => v + 1)} aria-label={tx("Reload preview", "إعادة تحميل المعاينة")}><RotateCcw className="size-4" /></Button>
                </div>
              </div>
              {dirty && <p className="bg-amber-50 px-3 py-1.5 text-xs text-amber-900">{tx("Save the draft to see your latest changes in the preview.", "احفظ المسودة لرؤية آخر التغييرات في المعاينة.")}</p>}
              <div className="flex flex-1 justify-center overflow-auto p-3">
                <iframe key={`${previewVersion}-${previewLocale}`} src={previewSrc} title={tx("Page preview", "معاينة الصفحة")} className="h-full rounded-md border border-line bg-white shadow-soft" style={{ width: deviceWidth }} />
              </div>
            </section>
          )}
        </div>
      </div>

      <SectionPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={addSection}
        templates={templates}
        onPickTemplate={async (id) => {
          const r = await getSectionTemplate(id);
          if (r.ok && r.data) insert({ id: tmpId(), type: r.data.type, visible: true, data: r.data.data as FieldValues, settings: r.data.settings as FieldValues });
          else toast.error(actionErrorText(r.ok ? "server" : r.error, tx));
        }}
        onDeleteTemplate={async (id) => {
          const r = await deleteSectionTemplate(id);
          if (r.ok) setTemplates((t) => t.filter((x) => x.id !== id));
        }}
      />

      <PageSettingsDrawer
        key={`settings-${drawerKey}`}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        page={page}
        canEdit={can.edit}
        onSaved={(p) => setPage((prev) => ({ ...prev, ...p, changed: true }))}
      />

      <RevisionsDrawer
        key={`revisions-${drawerKey}`}
        open={revisionsOpen}
        onOpenChange={setRevisionsOpen}
        pageId={page.id}
        canEdit={can.edit}
        onRestored={() => {
          toast.success(tx("Revision restored as a draft. Review it, then publish.", "تمت استعادة النسخة كمسودة. راجعها ثم انشرها."));
          router.refresh();
          setTimeout(() => location.reload(), 300);
        }}
      />

      <Modal
        open={!!templateFor}
        onOpenChange={(o) => !o && setTemplateFor(null)}
        title={tx("Save section as template", "حفظ القسم كقالب")}
        size="sm"
        footer={
          <>
            <Button onClick={() => setTemplateFor(null)}>{tx("Cancel", "إلغاء")}</Button>
            <Button
              variant="primary"
              disabled={!templateName.trim()}
              onClick={async () => {
                if (!templateFor) return;
                const r = await saveSectionTemplate({ name: templateName, type: templateFor.type, data: stripKeys(templateFor.data), settings: templateFor.settings });
                if (r.ok) {
                  setTemplates((t) => [r.data!, ...t]);
                  setTemplateFor(null);
                  toast.success(tx("Template saved", "تم حفظ القالب"));
                } else toast.error(actionErrorText(r.error, tx));
              }}
            >
              {tx("Save template", "حفظ القالب")}
            </Button>
          </>
        }
      >
        <FieldShell label={tx("Template name", "اسم القالب")} htmlFor="tpl-name">
          <Input id="tpl-name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} maxLength={80} autoFocus />
        </FieldShell>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title={tx("Delete this section?", "حذف هذا القسم؟")}
        description={tx("It will be removed when you save the draft.", "سيُحذف عند حفظ المسودة.")}
        onConfirm={() => {
          if (!confirmDelete) return;
          const idx = sections.findIndex((s) => s.id === confirmDelete.id);
          const next = sections.filter((s) => s.id !== confirmDelete.id);
          setSections(next);
          setSelected(next[Math.max(0, idx - 1)]?.id ?? null);
        }}
      />
      <ConfirmDialog
        open={confirmPageDelete}
        onOpenChange={setConfirmPageDelete}
        title={tx("Delete this page?", "حذف هذه الصفحة؟")}
        description={tx("The page will be removed from the website and its menus.", "ستُزال الصفحة من الموقع والقوائم.")}
        onConfirm={async () => {
          const r = await deletePage(page.id);
          if (r.ok) {
            setSavedJson(JSON.stringify(sections));
            router.push("/admin/pages");
          } else toast.error(actionErrorText(r.error, tx));
        }}
      />
    </FieldEnvProvider>
  );
}

function OutlineItem({ id, active, hidden, hasError, icon, label, hint, canEdit, onSelect, onToggle }: { id: string; active: boolean; hidden: boolean; hasError: boolean; icon: string; label: string; hint: string; canEdit: boolean; onSelect: () => void; onToggle: () => void }) {
  const { tx } = useAdminI18n();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !canEdit });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("group flex items-center gap-1 rounded-md border transition-colors", active ? "border-tech/50 bg-sky-50" : "border-transparent hover:bg-surface", isDragging && "relative z-10 bg-white shadow-lift", hasError && "border-red-300 bg-red-50")}>
      {canEdit && (
        <button type="button" className="grid size-7 shrink-0 cursor-grab touch-none place-items-center rounded text-mist hover:text-ink active:cursor-grabbing" aria-label={tx("Drag to reorder", "اسحب لإعادة الترتيب")} {...attributes} {...listeners}>
          <GripVertical className="size-3.5" />
        </button>
      )}
      <button type="button" onClick={onSelect} className={cn("flex min-w-0 flex-1 items-center gap-2.5 py-2 text-start", !canEdit && "ps-2", hidden && "opacity-50")} aria-current={active ? "true" : undefined}>
        <span className={cn("grid size-7 shrink-0 place-items-center rounded", active ? "bg-tech-600 text-white" : "bg-surface-2 text-slate")}><SectionIcon name={icon} className="size-3.5" /></span>
        <span className="min-w-0">
          <span className="block truncate text-[0.82rem] font-semibold text-ink">{label}</span>
          {hint && <span className="block truncate text-[0.72rem] text-muted">{hint}</span>}
        </span>
      </button>
      {canEdit && (
        <button type="button" onClick={onToggle} className={cn("me-1 grid size-7 shrink-0 place-items-center rounded text-muted hover:bg-white hover:text-ink", !hidden && "opacity-0 group-hover:opacity-100 focus:opacity-100")} aria-label={hidden ? tx("Show section", "إظهار القسم") : tx("Hide section", "إخفاء القسم")}>
          {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
      )}
    </li>
  );
}

function PageSettingsDrawer({ open, onOpenChange, page, canEdit, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; page: PageInfo; canEdit: boolean; onSaved: (p: Partial<PageInfo>) => void }) {
  const { tx, locale } = useAdminI18n();
  type Lz = { ar?: string; en?: string };
  const seo0 = page.seo as { title?: Lz; description?: Lz; ogTitle?: Lz; ogDescription?: Lz; ogImageId?: string | null; noindex?: boolean };
  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug);
  const [seo, setSeo] = useState({ title: seo0.title ?? {}, description: seo0.description ?? {}, ogTitle: seo0.ogTitle ?? {}, ogDescription: seo0.ogDescription ?? {}, ogImageId: seo0.ogImageId ?? null, noindex: !!seo0.noindex });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);


  const save = async () => {
    setBusy(true);
    const r = await updatePageMeta(page.id, { title, slug, seo });
    setBusy(false);
    if (!r.ok) {
      setErrors(r.fieldErrors ?? {});
      return toast.error(actionErrorText(r.error, tx));
    }
    onSaved({ title, slug, seo });
    onOpenChange(false);
    toast.success(tx("Page settings saved. Publish to apply them to the live page.", "تم حفظ إعدادات الصفحة. انشر لتطبيقها على الصفحة المباشرة."));
  };

  const descLen = (l: "ar" | "en") => (seo.description[l] ?? "").length;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title={tx("Page settings & SEO", "إعدادات الصفحة وتحسين محركات البحث")} footer={canEdit && <><Button onClick={() => onOpenChange(false)}>{tx("Cancel", "إلغاء")}</Button><Button variant="primary" loading={busy} onClick={save}>{tx("Save", "حفظ")}</Button></>}>
      <fieldset disabled={!canEdit} className="space-y-5">
        <FieldShell label={tx("Page title", "عنوان الصفحة")} required error={errorText(errors.title, tx)}>
          <LocalizedInput id="ps-title" value={title} onChange={(v) => setTitle({ ar: v.ar ?? "", en: v.en ?? "" })} max={160} />
        </FieldShell>
        <FieldShell label={tx("Address (URL)", "العنوان (الرابط)")} htmlFor="ps-slug" error={errorText(errors.slug, tx)} help={page.kind === "HOME" ? tx("The home page address cannot change.", "لا يمكن تغيير عنوان الصفحة الرئيسية.") : tx("Changing the address breaks existing links to this page.", "تغيير العنوان يعطّل الروابط الحالية لهذه الصفحة.")}>
          <div className="flex items-center" dir="ltr">
            <span className="flex h-10 items-center rounded-s-md border border-e-0 border-line-strong bg-surface px-3 text-sm text-muted">/{locale}/</span>
            <Input id="ps-slug" value={page.kind === "HOME" ? "" : slug} onChange={(e) => setSlug(e.target.value)} disabled={page.kind === "HOME"} className="rounded-s-none" />
          </div>
        </FieldShell>
        <div className="rounded-lg border border-line p-4">
          <p className="mb-4 text-sm font-semibold text-ink">{tx("Search engines & social sharing", "محركات البحث والمشاركة الاجتماعية")}</p>
          <div className="space-y-4">
            <FieldShell label={tx("Meta title (defaults to the page title)", "عنوان الميتا (افتراضياً عنوان الصفحة)")}>
              <LocalizedInput id="ps-seo-title" value={seo.title} onChange={(v) => setSeo({ ...seo, title: v })} max={120} />
            </FieldShell>
            <FieldShell label={tx("Meta description", "وصف الميتا")} help={tx(`Aim for 120–160 characters. AR: ${descLen("ar")} · EN: ${descLen("en")}`, `يُفضّل 120–160 حرفاً. ع: ${descLen("ar")} · EN: ${descLen("en")}`)}>
              <LocalizedInput id="ps-seo-desc" value={seo.description} onChange={(v) => setSeo({ ...seo, description: v })} multiline rows={3} max={320} />
            </FieldShell>
            <FieldShell label={tx("Social sharing title (optional)", "عنوان المشاركة الاجتماعية (اختياري)")}>
              <LocalizedInput id="ps-og-title" value={seo.ogTitle} onChange={(v) => setSeo({ ...seo, ogTitle: v })} max={120} />
            </FieldShell>
            <FieldShell label={tx("Social sharing description (optional)", "وصف المشاركة الاجتماعية (اختياري)")}>
              <LocalizedInput id="ps-og-desc" value={seo.ogDescription} onChange={(v) => setSeo({ ...seo, ogDescription: v })} multiline rows={2} max={320} />
            </FieldShell>
            <FieldShell label={tx("Social sharing image (1200×630 recommended)", "صورة المشاركة الاجتماعية (يُنصح بـ 1200×630)")}>
              <MediaField value={seo.ogImageId} onChange={(v) => setSeo({ ...seo, ogImageId: v })} />
            </FieldShell>
            <div className="flex items-center justify-between gap-4 rounded-md border border-line px-3.5 py-3">
              <span className="text-sm text-ink">{tx("Hide from search engines (noindex)", "إخفاء عن محركات البحث (noindex)")}</span>
              <Switch checked={seo.noindex} onCheckedChange={(v) => setSeo({ ...seo, noindex: v })} />
            </div>
          </div>
        </div>
      </fieldset>
    </Drawer>
  );
}

function RevisionsDrawer({ open, onOpenChange, pageId, canEdit, onRestored }: { open: boolean; onOpenChange: (o: boolean) => void; pageId: string; canEdit: boolean; onRestored: () => void }) {
  const { tx, locale } = useAdminI18n();
  const [items, setItems] = useState<{ id: string; note: string | null; createdAt: string; by: string | null; sections: number }[] | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    let alive = true;
    listRevisions(pageId).then((r) => {
      if (alive) setItems(r.ok ? r.data ?? [] : []);
    });
    return () => {
      alive = false;
    };
  }, [open, pageId]);
  return (
    <Drawer open={open} onOpenChange={onOpenChange} title={tx("Revision history", "سجل النسخ")} description={tx("A revision is saved every time the page is published.", "تُحفظ نسخة في كل مرة يتم فيها نشر الصفحة.")} width="md">
      {items === null ? (
        <p className="text-sm text-muted">{tx("Loading…", "جارٍ التحميل…")}</p>
      ) : items.length === 0 ? (
        <EmptyState title={tx("No revisions yet", "لا توجد نسخ بعد")} text={tx("Publish the page to create the first revision.", "انشر الصفحة لإنشاء أول نسخة.")} />
      ) : (
        <ol className="space-y-2">
          {items.map((r, i) => (
            <li key={r.id} className="flex items-center gap-3 rounded-lg border border-line p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{formatDateTime(r.createdAt, locale)} {i === 0 && <Badge tone="success">{tx("Latest", "الأحدث")}</Badge>}</p>
                <p className="text-xs text-muted">{r.by ?? tx("System", "النظام")} · {r.sections} {tx("sections", "أقسام")}{r.note ? ` · ${r.note}` : ""}</p>
              </div>
              {canEdit && (
                <Button size="sm" loading={restoring === r.id} onClick={async () => { setRestoring(r.id); const res = await restoreRevision(r.id); setRestoring(null); if (res.ok) onRestored(); else toast.error(actionErrorText(res.error, tx)); }}>
                  <RotateCcw className="size-3.5" />{tx("Restore", "استعادة")}
                </Button>
              )}
            </li>
          ))}
        </ol>
      )}
    </Drawer>
  );
}

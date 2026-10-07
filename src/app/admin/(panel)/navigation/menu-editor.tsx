"use client";

import { useMemo, useState, useId } from "react";
import { toast } from "sonner";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeftToLine, ArrowRightToLine, EyeOff, GripVertical, Link2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { bi, type Field, type FieldValues } from "@/lib/sections/fields";
import { cn } from "@/lib/cn";
import { useAdminI18n } from "@/components/admin/i18n";
import { FieldForm } from "@/components/admin/fields/field-form";
import { FieldEnvProvider, actionErrorText, type LinkSuggestion, type RefOption } from "@/components/admin/fields/env";
import { Badge, Button, Drawer, EmptyState, Tabs } from "@/components/admin/ui";
import { saveMenu } from "./actions";

export type MenuRow = {
  id?: string | null;
  key?: string;
  label: { ar: string; en: string };
  description: { ar: string; en: string };
  linkType: "PAGE" | "SERVICE" | "INTERNAL" | "EXTERNAL" | "SERVICES_MENU";
  pageId: string | null;
  serviceId: string | null;
  url: string;
  openInNewTab: boolean;
  visible: boolean;
  depth: number;
};

type MenuKey = "header" | "footer" | "legal";
let seq = 0;
const withKey = (r: MenuRow): MenuRow => ({ ...r, key: r.key ?? r.id ?? `n${++seq}` });

function itemFields(linkType: MenuRow["linkType"], isHeader: boolean): Field[] {
  const opt = (value: string, en: string, ar: string) => ({ value, label: bi(en, ar) });
  const fields: Field[] = [
    { type: "text", name: "label", label: bi("Label", "النص"), required: true, max: 80 },
    {
      type: "select",
      name: "linkType",
      label: bi("Links to", "يرتبط بـ"),
      options: [
        opt("PAGE", "A page", "صفحة"),
        opt("SERVICE", "A service", "خدمة"),
        opt("INTERNAL", "Internal path", "مسار داخلي"),
        opt("EXTERNAL", "External website", "موقع خارجي"),
        ...(isHeader ? [opt("SERVICES_MENU", "Services mega menu", "قائمة الخدمات الموسعة")] : []),
      ],
    },
  ];
  if (linkType === "PAGE") fields.push({ type: "reference", name: "pageId", label: bi("Page", "الصفحة"), collection: "pages", required: true });
  if (linkType === "SERVICE") fields.push({ type: "reference", name: "serviceId", label: bi("Service", "الخدمة"), collection: "services", required: true });
  if (linkType === "INTERNAL") fields.push({ type: "text", name: "url", label: bi("Path (e.g. /contact or /services/governance)", "المسار (مثل ‎/contact)"), localized: false, format: "href", required: true, max: 300 });
  if (linkType === "EXTERNAL") fields.push({ type: "text", name: "url", label: bi("URL", "الرابط"), localized: false, format: "href", required: true, max: 500 });
  if (linkType === "SERVICES_MENU") fields.push({ type: "text", name: "url", label: bi("“All services” link", "رابط «جميع الخدمات»"), localized: false, format: "href", max: 300 });
  fields.push({ type: "boolean", name: "openInNewTab", label: bi("Open in a new tab", "فتح في تبويب جديد") });
  fields.push({ type: "boolean", name: "visible", label: bi("Visible", "ظاهر") });
  return fields;
}

export function MenuEditor({ menus, env }: { menus: Record<MenuKey, MenuRow[]>; env: { refs: Record<string, RefOption[]>; links: LinkSuggestion[] } }) {
  const { tx, locale } = useAdminI18n();
  const [active, setActive] = useState<MenuKey>("header");
  const [state, setState] = useState<Record<MenuKey, MenuRow[]>>(() => ({ header: menus.header.map(withKey), footer: menus.footer.map(withKey), legal: menus.legal.map(withKey) }));
  const [saved, setSaved] = useState(() => JSON.stringify(state));
  const [editing, setEditing] = useState<{ index: number | null; values: FieldValues } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const dndId = useId();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const items = state[active];
  const dirty = JSON.stringify(state) !== saved;
  const refLabel = useMemo(() => new Map(Object.values(env.refs).flat().map((o) => [o.value, o.label])), [env.refs]);

  const setItems = (next: MenuRow[]) => setState((s) => ({ ...s, [active]: next }));
  const target = (r: MenuRow) =>
    r.linkType === "PAGE" ? refLabel.get(r.pageId ?? "") ?? tx("(missing page)", "(صفحة مفقودة)") : r.linkType === "SERVICE" ? refLabel.get(r.serviceId ?? "") ?? "" : r.linkType === "SERVICES_MENU" ? tx("Services mega menu", "قائمة الخدمات الموسعة") : r.url;

  const save = async () => {
    setSaving(true);
    const r = await saveMenu(active, items.map(({ key: _k, ...rest }) => rest));
    setSaving(false);
    if (!r.ok) return toast.error(actionErrorText(r.error, tx));
    toast.success(tx("Menu saved — the website is updated.", "تم حفظ القائمة — تم تحديث الموقع."));
    setSaved(JSON.stringify(state));
    location.reload();
  };

  const commitEdit = () => {
    if (!editing) return;
    const v = editing.values as unknown as MenuRow;
    const errs: Record<string, string> = {};
    if (!v.label?.ar && !v.label?.en) errs.label = "required";
    if (v.linkType === "PAGE" && !v.pageId) errs.pageId = "required";
    if (v.linkType === "SERVICE" && !v.serviceId) errs.serviceId = "required";
    if ((v.linkType === "INTERNAL" || v.linkType === "EXTERNAL") && !v.url) errs.url = "required";
    if (v.linkType === "INTERNAL" && v.url && !v.url.startsWith("/")) errs.url = "invalid_href";
    if (Object.keys(errs).length) return setErrors(errs);
    const row = withKey({ ...(editing.index !== null ? items[editing.index] : { depth: 0, description: { ar: "", en: "" } }), ...v } as MenuRow);
    setItems(editing.index !== null ? items.map((it, i) => (i === editing.index ? row : it)) : [...items, row]);
    setEditing(null);
  };

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const next = arrayMove(items, items.findIndex((i) => i.key === e.active.id), items.findIndex((i) => i.key === e.over!.id));
    if (next[0]) next[0] = { ...next[0], depth: 0 };
    setItems(next);
  };

  return (
    <FieldEnvProvider value={env}>
      <Tabs value={active} onValueChange={(v) => setActive(v as MenuKey)} className="mb-5" items={[{ value: "header", label: tx("Header", "الرأس") }, { value: "footer", label: tx("Footer", "التذييل") }, { value: "legal", label: tx("Legal links", "الروابط القانونية") }]} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button onClick={() => { setErrors({}); setEditing({ index: null, values: { label: { ar: "", en: "" }, linkType: "PAGE", pageId: null, serviceId: null, url: "", openInNewTab: false, visible: true } }); }}><Plus className="size-4" />{tx("Add link", "إضافة رابط")}</Button>
        <div className="ms-auto flex items-center gap-2">
          {dirty && <Badge tone="warning">{tx("Unsaved changes", "تغييرات غير محفوظة")}</Badge>}
          <Button variant="primary" loading={saving} disabled={!dirty} onClick={save}><Save className="size-4" />{tx("Save menu", "حفظ القائمة")}</Button>
        </div>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={<Link2 className="size-5" />} title={tx("This menu is empty", "هذه القائمة فارغة")} />
      ) : (
        <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.key!)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-1.5">
              {items.map((it, i) => (
                <Row
                  key={it.key}
                  id={it.key!}
                  item={it}
                  label={(locale === "ar" ? it.label.ar || it.label.en : it.label.en || it.label.ar) || "—"}
                  target={target(it)}
                  canIndent={active === "header" && i > 0 && it.depth === 0 && items[i - 1] && !items.slice(i + 1).some((n, k) => k === 0 && n.depth === 1)}
                  onIndent={() => setItems(items.map((x, k) => (k === i ? { ...x, depth: 1 } : x)))}
                  onOutdent={() => setItems(items.map((x, k) => (k === i ? { ...x, depth: 0 } : x)))}
                  onEdit={() => { setErrors({}); setEditing({ index: i, values: { ...it } as unknown as FieldValues }); }}
                  onRemove={() => setItems(items.filter((_, k) => k !== i && !(it.depth === 0 && k > i && items.slice(i + 1, k + 1).every((n) => n.depth === 1))))}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      {active === "header" && <p className="mt-3 text-xs text-muted">{tx("Indent a link to place it in the dropdown of the link above it.", "أزِح الرابط لوضعه في القائمة المنسدلة للرابط الذي فوقه.")}</p>}

      <Drawer
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing?.index !== null && editing ? tx("Edit link", "تحرير الرابط") : tx("New link", "رابط جديد")}
        width="md"
        footer={<><Button onClick={() => setEditing(null)}>{tx("Cancel", "إلغاء")}</Button><Button variant="primary" onClick={commitEdit}>{tx("Apply", "تطبيق")}</Button></>}
      >
        {editing && <FieldForm fields={itemFields(editing.values.linkType as MenuRow["linkType"], active === "header")} value={editing.values} onChange={(values) => setEditing({ ...editing, values })} errors={errors} />}
        <p className="mt-4 text-xs text-muted">{tx("Click “Save menu” to publish your changes.", "اضغط «حفظ القائمة» لنشر التغييرات.")}</p>
      </Drawer>
    </FieldEnvProvider>
  );
}

function Row({ id, item, label, target, canIndent, onIndent, onOutdent, onEdit, onRemove }: { id: string; item: MenuRow; label: string; target: string; canIndent: boolean; onIndent: () => void; onOutdent: () => void; onEdit: () => void; onRemove: () => void }) {
  const { tx } = useAdminI18n();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("flex items-center gap-2 rounded-lg border border-line bg-white px-2 py-2", item.depth === 1 && "ms-10", isDragging && "relative z-10 shadow-lift")}>
      <button type="button" className="grid size-8 cursor-grab touch-none place-items-center rounded text-muted hover:bg-surface" aria-label={tx("Drag to reorder", "اسحب لإعادة الترتيب")} {...attributes} {...listeners}><GripVertical className="size-4" /></button>
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-start">
        <span className="flex items-center gap-2 text-sm font-semibold text-ink">{label}{!item.visible && <EyeOff className="size-3.5 text-muted" />}</span>
        <span className="block truncate text-xs text-muted" dir="auto">{target}</span>
      </button>
      {item.depth === 1 ? (
        <Button size="icon" variant="ghost" className="size-8" onClick={onOutdent} aria-label={tx("Move out of dropdown", "إخراج من القائمة المنسدلة")}><ArrowLeftToLine className="size-4 rtl:-scale-x-100" /></Button>
      ) : canIndent ? (
        <Button size="icon" variant="ghost" className="size-8" onClick={onIndent} aria-label={tx("Move into dropdown above", "نقل إلى القائمة المنسدلة أعلاه")}><ArrowRightToLine className="size-4 rtl:-scale-x-100" /></Button>
      ) : null}
      <Button size="icon" variant="ghost" className="size-8" onClick={onEdit} aria-label={tx("Edit", "تحرير")}><Pencil className="size-4" /></Button>
      <Button size="icon" variant="ghost" className="size-8 text-red-600 hover:bg-red-50" onClick={onRemove} aria-label={tx("Remove", "إزالة")}><Trash2 className="size-4" /></Button>
    </li>
  );
}

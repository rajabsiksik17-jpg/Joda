"use client";

import Image from "next/image";
import { useMemo, useState, useTransition, useId } from "react";
import { toast } from "sonner";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, MoreHorizontal, Pencil, Plus, Trash2, Inbox } from "lucide-react";
import type { CollectionConfig } from "@/lib/admin/collections";
import { emptyValues, type FieldValues } from "@/lib/sections/fields";
import { cn } from "@/lib/cn";
import { deleteCollectionItem, reorderCollection, saveCollectionItem, setCollectionVisibility } from "@/app/admin/(panel)/collections/actions";
import { useAdminI18n } from "./i18n";
import { FieldForm, stripKeys } from "./fields/field-form";
import { FieldEnvProvider, actionErrorText, type LinkSuggestion, type RefOption } from "./fields/env";
import { useMediaItem } from "./fields/media-field";
import { Badge, Button, ConfirmDialog, Drawer, EmptyState, Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, SearchInput, Switch } from "./ui";

type Row = Record<string, unknown> & { id: string };
type Env = { refs: Record<string, RefOption[]>; links: LinkSuggestion[] };

function text(v: unknown, locale: "ar" | "en"): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const l = v as { ar?: string; en?: string };
    return (locale === "ar" ? l.ar || l.en : l.en || l.ar) ?? "";
  }
  return "";
}

export function CollectionManager({ config, initialRows, env, compact = false }: { config: CollectionConfig; initialRows: Row[]; env: Env; compact?: boolean }) {
  const { tx, locale } = useAdminI18n();
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<{ id: string | null; values: FieldValues } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [, startTransition] = useTransition();
  const dndId = useId();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const singular = locale === "ar" ? config.singular.ar : config.singular.en;

  const refLabel = useMemo(() => {
    const m = new Map<string, string>();
    for (const list of Object.values(env.refs)) for (const o of list) m.set(o.value, o.label);
    return m;
  }, [env.refs]);

  const subtitle = (r: Row) => {
    if (!config.subtitleField) return "";
    const v = r[config.subtitleField];
    if (typeof v === "string" && refLabel.has(v)) return refLabel.get(v)!;
    const f = config.fields.find((x) => x.name === config.subtitleField);
    if (f?.type === "select") {
      const o = f.options.find((o) => o.value === v);
      if (o) return locale === "ar" ? o.label.ar : o.label.en;
    }
    return text(v, locale);
  };

  const filtered = q ? rows.filter((r) => `${text(r[config.titleField], "ar")} ${text(r[config.titleField], "en")} ${subtitle(r)}`.toLowerCase().includes(q.toLowerCase())) : rows;

  const openNew = () => {
    setErrors({});
    setEditing({ id: null, values: { ...emptyValues(config.fields), ...(config.defaults ?? {}) } });
  };
  const openEdit = (r: Row) => {
    setErrors({});
    const values: FieldValues = {};
    for (const f of config.fields) values[f.name] = r[f.name] ?? emptyValues([f])[f.name];
    setEditing({ id: r.id, values });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const res = await saveCollectionItem(config.key, editing.id, stripKeys(editing.values));
    setSaving(false);
    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      toast.error(actionErrorText(res.error, tx));
      return;
    }
    const row = res.data as Row;
    setRows((prev) => (editing.id ? prev.map((r) => (r.id === row.id ? row : r)) : [...prev, row]));
    setEditing(null);
    toast.success(tx("Saved — the website is updated.", "تم الحفظ — تم تحديث الموقع."));
  };

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id || q) return;
    const from = rows.findIndex((r) => r.id === e.active.id);
    const to = rows.findIndex((r) => r.id === e.over!.id);
    const next = arrayMove(rows, from, to);
    setRows(next);
    startTransition(async () => {
      const res = await reorderCollection(config.key, next.map((r) => r.id));
      if (!res.ok) toast.error(actionErrorText(res.error, tx));
    });
  };

  const toggleVisible = async (r: Row) => {
    const visible = !r.visible;
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, visible } : x)));
    const res = await setCollectionVisibility(config.key, r.id, visible);
    if (!res.ok) {
      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, visible: !visible } : x)));
      toast.error(actionErrorText(res.error, tx));
    }
  };

  return (
    <FieldEnvProvider value={env}>
      <div className={cn("mb-4 flex flex-col gap-3 sm:flex-row sm:items-center", compact && "mb-3")}>
        {rows.length > 6 && <SearchInput value={q} onChange={setQ} className="flex-1 sm:max-w-sm" />}
        <Button variant="primary" onClick={openNew} className="sm:ms-auto"><Plus className="size-4" />{tx(`Add ${singular}`, `إضافة ${singular}`)}</Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<Inbox className="size-5" />} title={tx("Nothing here yet", "لا يوجد شيء بعد")} text={locale === "ar" ? config.emptyText.ar : config.emptyText.en} action={<Button variant="primary" onClick={openNew}><Plus className="size-4" />{tx(`Add ${singular}`, `إضافة ${singular}`)}</Button>} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-white">
          <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={filtered.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              <ul className="divide-y divide-line">
                {filtered.map((r) => (
                  <SortableRow key={r.id} id={r.id} disabled={!!q}>
                    {config.imageField && <Thumb id={r[config.imageField] as string | null} />}
                    <button type="button" onClick={() => openEdit(r)} className="min-w-0 flex-1 py-3 text-start">
                      <span className={cn("block truncate text-sm font-semibold", r.visible === false ? "text-muted line-through decoration-mist" : "text-ink")}>{text(r[config.titleField], locale) || tx("(untitled)", "(بدون عنوان)")}</span>
                      {subtitle(r) && <span className="block truncate text-xs text-muted">{subtitle(r)}</span>}
                    </button>
                    {"isStrategic" in r && r.isStrategic ? <Badge tone="info">{tx("Strategic", "استراتيجي")}</Badge> : null}
                    {"isLeadership" in r && r.isLeadership ? <Badge tone="info">{tx("Leadership", "قيادة")}</Badge> : null}
                    {"isPrimary" in r && r.isPrimary ? <Badge tone="info">{tx("Primary", "أساسي")}</Badge> : null}
                    {config.hasVisible && (
                      <span className="hidden items-center gap-2 sm:flex">
                        <span className="text-xs text-muted">{r.visible ? tx("Visible", "ظاهر") : tx("Hidden", "مخفي")}</span>
                        <Switch checked={!!r.visible} onCheckedChange={() => toggleVisible(r)} label={tx("Visible on website", "ظاهر على الموقع")} />
                      </span>
                    )}
                    <Menu>
                      <MenuTrigger className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface hover:text-ink" aria-label={tx("Actions", "الإجراءات")}><MoreHorizontal className="size-4" /></MenuTrigger>
                      <MenuContent>
                        <MenuItem onSelect={() => openEdit(r)}><Pencil className="size-4" />{tx("Edit", "تحرير")}</MenuItem>
                        {config.hasVisible && <MenuItem onSelect={() => toggleVisible(r)}>{r.visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}{r.visible ? tx("Hide", "إخفاء") : tx("Show", "إظهار")}</MenuItem>}
                        <MenuSeparator />
                        <MenuItem danger onSelect={() => setDeleting(r)}><Trash2 className="size-4" />{tx("Delete", "حذف")}</MenuItem>
                      </MenuContent>
                    </Menu>
                  </SortableRow>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
      )}
      {rows.length > 1 && !q && <p className="mt-2 text-xs text-muted">{tx("Drag rows to change the order shown on the website.", "اسحب الصفوف لتغيير ترتيب العرض على الموقع.")}</p>}

      <Drawer
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing?.id ? tx(`Edit ${singular}`, `تحرير ${singular}`) : tx(`New ${singular}`, `${singular} جديد`)}
        footer={<><Button onClick={() => setEditing(null)}>{tx("Cancel", "إلغاء")}</Button><Button variant="primary" loading={saving} onClick={save}>{tx("Save", "حفظ")}</Button></>}
      >
        {editing && (
          <form onSubmit={(e) => { e.preventDefault(); save(); }}>
            <FieldForm fields={config.fields} value={editing.values} onChange={(values) => setEditing({ ...editing, values })} errors={errors} />
          </form>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={tx(`Delete this ${singular}?`, `حذف ${singular}؟`)}
        onConfirm={async () => {
          if (!deleting) return;
          const res = await deleteCollectionItem(config.key, deleting.id);
          if (res.ok) {
            setRows((prev) => prev.filter((r) => r.id !== deleting.id));
            toast.success(tx("Deleted", "تم الحذف"));
          } else toast.error(actionErrorText(res.error, tx));
        }}
      />
    </FieldEnvProvider>
  );
}

function Thumb({ id }: { id: string | null }) {
  const item = useMediaItem(id);
  return (
    <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-surface">
      {item && !item.isVideo && <Image src={item.url} alt="" fill sizes="44px" className="object-contain p-0.5" unoptimized={item.isSvg} />}
    </span>
  );
}

function SortableRow({ id, disabled, children }: { id: string; disabled: boolean; children: React.ReactNode }) {
  const { tx } = useAdminI18n();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("flex items-center gap-3 bg-white px-3", isDragging && "relative z-10 shadow-lift")}>
      <button type="button" className={cn("grid size-8 shrink-0 touch-none place-items-center rounded text-muted hover:bg-surface", disabled ? "cursor-not-allowed opacity-30" : "cursor-grab active:cursor-grabbing")} aria-label={tx("Drag to reorder", "اسحب لإعادة الترتيب")} {...attributes} {...listeners}>
        <GripVertical className="size-4" />
      </button>
      {children}
    </li>
  );
}

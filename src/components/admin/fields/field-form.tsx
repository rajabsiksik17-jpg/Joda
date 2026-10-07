"use client";

import dynamic from "next/dynamic";
import { useId, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, Copy, GripVertical, Plus, Trash2, X } from "lucide-react";
import { emptyValues, type Field, type FieldValues } from "@/lib/sections/fields";
import { ICONS, ICON_KEYS, Icon } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { useAdminI18n } from "../i18n";
import { Button, FieldShell, Input, PopoverContent, PopoverRoot, PopoverTrigger, Select, Skeleton, Switch, inputCls } from "../ui";
import { LocalizedInput } from "./localized-input";
import { MediaField } from "./media-field";
import { errorText, useFieldEnv } from "./env";

const RichTextEditor = dynamic(() => import("./rich-text-editor"), { ssr: false, loading: () => <Skeleton className="h-56" /> });

type L = { ar?: string; en?: string };
type Errors = Record<string, string>;

/** Renders an editable form for a list of field definitions (shared by every editor in the CMS). */
export function FieldForm({ fields, value, onChange, errors = {}, path = "" }: { fields: Field[]; value: FieldValues; onChange: (v: FieldValues) => void; errors?: Errors; path?: string }) {
  return (
    <div className="@container">
    <div className="grid gap-5 @2xl:grid-cols-2">
      {fields.map((f) => (
        <FieldControl
          key={f.name}
          field={f}
          value={value?.[f.name]}
          onChange={(v) => onChange({ ...value, [f.name]: v })}
          errors={errors}
          path={path ? `${path}.${f.name}` : f.name}
        />
      ))}
    </div>
    </div>
  );
}

function wide(f: Field) {
  if (f.width === "half") return false;
  if (f.width === "full") return true;
  return ["textarea", "richtext", "list", "link", "media"].includes(f.type) || ((f.type === "text") && f.localized !== false);
}

function FieldControl({ field: f, value, onChange, errors, path }: { field: Field; value: unknown; onChange: (v: unknown) => void; errors: Errors; path: string }) {
  const { tx, locale } = useAdminI18n();
  const id = useId();
  const label = locale === "ar" ? f.label.ar : f.label.en;
  const help = f.help ? (locale === "ar" ? f.help.ar : f.help.en) : undefined;
  const err = errorText(errors[path], tx);
  const cls = wide(f) ? "@2xl:col-span-2" : "";

  switch (f.type) {
    case "text":
    case "textarea":
      if (f.localized === false) {
        const ltr = f.type === "text" && f.format && f.format !== "phone" ? "ltr" : undefined;
        return (
          <FieldShell label={label} htmlFor={id} help={help} error={err} required={f.required} className={cls}>
            {f.type === "textarea" ? (
              <textarea id={id} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} rows={f.rows ?? 3} maxLength={f.max} className={cn(inputCls, "py-2")} aria-invalid={!!err || undefined} />
            ) : (
              <Input id={id} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} maxLength={f.max} dir={ltr} aria-invalid={!!err || undefined} className={ltr ? "rtl:text-right" : undefined} />
            )}
          </FieldShell>
        );
      }
      return (
        <FieldShell label={label} help={help} error={err} required={f.required} className={cls}>
          <LocalizedInput id={id} value={value as L} onChange={onChange} multiline={f.type === "textarea"} rows={f.type === "textarea" ? f.rows : undefined} max={f.max} invalid={!!err} />
        </FieldShell>
      );
    case "richtext":
      return (
        <FieldShell label={label} help={help} error={err} required={f.required} className={cls}>
          <RichTextPair value={value as L} onChange={onChange} />
        </FieldShell>
      );
    case "number":
      return (
        <FieldShell label={label} htmlFor={id} help={help} error={err} className={cls}>
          <Input id={id} type="number" min={f.min} max={f.max} step={f.step} value={value === undefined || value === null ? "" : String(value)} onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))} dir="ltr" className="max-w-40" />
        </FieldShell>
      );
    case "boolean":
      return (
        <div className={cn("flex items-center justify-between gap-4 rounded-md border border-line bg-white px-3.5 py-3", cls)}>
          <label htmlFor={id} className="text-sm font-medium text-ink">{label}{help && <span className="mt-0.5 block text-xs font-normal text-muted">{help}</span>}</label>
          <Switch id={id} checked={!!value} onCheckedChange={onChange} />
        </div>
      );
    case "select":
      return (
        <FieldShell label={label} htmlFor={id} help={help} error={err} className={cls}>
          <Select id={id} value={(value as string) ?? f.options[0]?.value} onChange={(e) => onChange(e.target.value)}>
            {f.options.map((o) => <option key={o.value} value={o.value}>{locale === "ar" ? o.label.ar : o.label.en}</option>)}
          </Select>
        </FieldShell>
      );
    case "media":
      return (
        <FieldShell label={label} help={help} error={err} required={f.required} className={cls}>
          <MediaField value={value as string | null} onChange={onChange} accept={f.accept} id={id} />
        </FieldShell>
      );
    case "icon":
      return (
        <FieldShell label={label} help={help} className={cls}>
          <IconPicker value={(value as string) ?? ""} onChange={onChange} />
        </FieldShell>
      );
    case "link":
      return (
        <FieldShell label={label} help={help} error={errorText(errors[`${path}.href`], tx)} className={cls}>
          <LinkInput value={value as { label?: L; href?: string }} onChange={onChange} id={id} />
        </FieldShell>
      );
    case "reference":
      return (
        <FieldShell label={label} htmlFor={id} help={help} error={err} required={f.required} className={cls}>
          <ReferenceInput field={f} value={value} onChange={onChange} id={id} />
        </FieldShell>
      );
    case "datetime":
      return (
        <FieldShell label={label} htmlFor={id} help={help} error={err} className={cls}>
          <Input id={id} type="datetime-local" value={toLocalInput(value as string | null)} onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)} dir="ltr" className="max-w-64" />
        </FieldShell>
      );
    case "tags":
      return (
        <FieldShell label={label} help={help} error={err} className={cls}>
          <TagsInput value={(value as string[]) ?? []} onChange={onChange} max={f.max ?? 20} />
        </FieldShell>
      );
    case "list":
      return (
        <div className={cls}>
          <ListField field={f} value={(value as FieldValues[]) ?? []} onChange={onChange} errors={errors} path={path} label={label} help={help} />
        </div>
      );
  }
}

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function RichTextPair({ value, onChange }: { value: L | undefined; onChange: (v: L) => void }) {
  const [tab, setTab] = useState<"ar" | "en">("ar");
  const v = value ?? {};
  return (
    <div>
      <div className="mb-2 inline-flex rounded-md border border-line bg-surface p-0.5" role="tablist">
        {(["ar", "en"] as const).map((l) => (
          <button key={l} type="button" role="tab" aria-selected={tab === l} onClick={() => setTab(l)} className={cn("flex items-center gap-1.5 rounded px-3 py-1 text-xs font-semibold", tab === l ? "bg-white text-ink shadow-sm" : "text-muted")}>
            {l === "ar" ? "العربية" : "English"}
            <span className={cn("size-1.5 rounded-full", (v[l] ?? "").trim() ? "bg-emerald-500" : "bg-amber-400")} aria-hidden />
          </button>
        ))}
      </div>
      {(["ar", "en"] as const).map((l) => (
        <div key={l} hidden={tab !== l}>
          <RichTextEditor value={v[l] ?? ""} onChange={(html) => onChange({ ...v, [l]: html })} dir={l === "ar" ? "rtl" : "ltr"} lang={l} />
        </div>
      ))}
    </div>
  );
}

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { tx } = useAdminI18n();
  const [open, setOpen] = useState(false);
  return (
    <PopoverRoot open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={cn(inputCls, "flex h-10 items-center gap-2.5 text-start")}>
        <span className="grid size-7 place-items-center rounded bg-sky-50 text-tech-600"><Icon name={value} className="size-4" /></span>
        <span className="flex-1 truncate text-sm" dir="ltr">{value || tx("Choose an icon", "اختر أيقونة")}</span>
        <ChevronDown className="size-4 text-muted" />
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid max-h-64 grid-cols-6 gap-1 overflow-y-auto">
          {ICON_KEYS.map((k) => {
            const Cmp = ICONS[k];
            return (
              <button key={k} type="button" title={k} aria-label={k} onClick={() => { onChange(k); setOpen(false); }} className={cn("grid aspect-square place-items-center rounded-md transition-colors hover:bg-sky-50 hover:text-tech-600", value === k ? "bg-tech-600 text-white hover:bg-tech hover:text-white" : "text-slate")}>
                <Cmp className="size-5" />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </PopoverRoot>
  );
}

function LinkInput({ value, onChange, id }: { value: { label?: L; href?: string } | undefined; onChange: (v: unknown) => void; id: string }) {
  const { tx } = useAdminI18n();
  const { links } = useFieldEnv();
  const v = value ?? { label: {}, href: "" };
  const listId = `${id}-links`;
  return (
    <div className="space-y-2 rounded-md border border-line bg-surface/50 p-3">
      <LocalizedInput id={`${id}-label`} value={v.label} onChange={(label) => onChange({ ...v, label })} max={80} placeholder={{ ar: "نص الزر", en: "Button text" }} />
      <Input value={v.href ?? ""} onChange={(e) => onChange({ ...v, href: e.target.value })} placeholder={tx("Link: /contact, /services/governance or https://…", "الرابط: /contact أو /services/governance أو https://…")} dir="ltr" list={listId} className="rtl:text-right" />
      <datalist id={listId}>
        {links.map((l) => <option key={l.href} value={l.href}>{l.label}</option>)}
      </datalist>
    </div>
  );
}

function ReferenceInput({ field, value, onChange, id }: { field: Extract<Field, { type: "reference" }>; value: unknown; onChange: (v: unknown) => void; id: string }) {
  const { tx } = useAdminI18n();
  const { refs } = useFieldEnv();
  const options = refs[field.collection] ?? [];
  if (field.multiple) {
    const selected = (value as string[]) ?? [];
    return (
      <div className="flex flex-wrap gap-1.5 rounded-md border border-line-strong bg-white p-2">
        {options.map((o) => {
          const on = selected.includes(o.value);
          return (
            <button key={o.value} type="button" aria-pressed={on} onClick={() => onChange(on ? selected.filter((s) => s !== o.value) : [...selected, o.value])} className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors", on ? "border-tech bg-tech-600 text-white" : "border-line-strong text-ink hover:border-tech")}>
              {o.label}
            </button>
          );
        })}
        {options.length === 0 && <span className="text-xs text-muted">{tx("Nothing to choose from yet.", "لا توجد عناصر للاختيار بعد.")}</span>}
      </div>
    );
  }
  return (
    <Select id={id} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">{tx("— None —", "— لا شيء —")}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </Select>
  );
}

function TagsInput({ value, onChange, max }: { value: string[]; onChange: (v: string[]) => void; max: number }) {
  const { tx } = useAdminI18n();
  const [draft, setDraft] = useState("");
  const add = () => {
    const parts = draft.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) onChange(Array.from(new Set([...value, ...parts])).slice(0, max));
    setDraft("");
  };
  return (
    <div className={cn(inputCls, "flex min-h-10 flex-wrap items-center gap-1.5 py-1.5")}>
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-tech-700">
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={tx(`Remove ${t}`, `إزالة ${t}`)}><X className="size-3" /></button>
        </span>
      ))}
      <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }} onBlur={add} placeholder={value.length ? "" : tx("Type and press Enter", "اكتب ثم اضغط Enter")} className="min-w-24 flex-1 bg-transparent text-sm outline-none" maxLength={40} />
    </div>
  );
}

// ───────────────────────── Repeater ─────────────────────────
type Item = FieldValues & { __key?: string };

function itemSummary(item: FieldValues, field: Extract<Field, { type: "list" }>, locale: "ar" | "en") {
  const key = field.itemTitle ?? field.fields.find((f) => f.type === "text" || f.type === "textarea")?.name;
  const v = key ? item[key] : undefined;
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const l = v as L;
    return (locale === "ar" ? l.ar || l.en : l.en || l.ar) ?? "";
  }
  return "";
}

let keySeq = 0;
const stableKeys = new WeakMap<object, string>();
/** Gives each list item a stable identity across renders without storing it on the server. */
const withKey = (i: FieldValues): Item => {
  const existing = (i as Item).__key;
  if (existing) return i as Item;
  let k = stableKeys.get(i);
  if (!k) {
    k = `k${++keySeq}`;
    stableKeys.set(i, k);
  }
  const keyed = { ...i, __key: k };
  stableKeys.set(keyed, k);
  return keyed;
};

function ListField({ field, value, onChange, errors, path, label, help }: { field: Extract<Field, { type: "list" }>; value: FieldValues[]; onChange: (v: unknown) => void; errors: Errors; path: string; label: string; help?: string }) {
  const { tx, locale } = useAdminI18n();
  const items = value.map(withKey);
  const [open, setOpen] = useState<string | null>(null);
  const dndId = useId();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const max = field.max ?? 50;

  const commit = (next: Item[]) => onChange(next);
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = items.findIndex((i) => i.__key === e.active.id);
    const to = items.findIndex((i) => i.__key === e.over!.id);
    commit(arrayMove(items, from, to));
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[0.8rem] font-semibold text-ink">{label} <span className="font-normal text-muted" dir="ltr">({items.length})</span></p>
      </div>
      {help && <p className="-mt-1 mb-2 text-xs text-muted">{help}</p>}
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.__key!)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {items.map((item, idx) => (
              <SortableItem
                key={item.__key}
                id={item.__key!}
                title={itemSummary(item, field, locale) || `${tx("Item", "عنصر")} ${idx + 1}`}
                open={open === item.__key}
                hasError={Object.keys(errors).some((k) => k.startsWith(`${path}.${idx}.`))}
                onToggle={() => setOpen(open === item.__key ? null : item.__key!)}
                onDuplicate={items.length < max ? () => commit([...items.slice(0, idx + 1), { ...structuredClone({ ...item, __key: undefined }), __key: `k${++keySeq}` }, ...items.slice(idx + 1)]) : undefined}
                onRemove={() => commit(items.filter((_, i) => i !== idx))}
              >
                <FieldForm fields={field.fields} value={item} onChange={(v) => commit(items.map((it, i) => (i === idx ? { ...(v as Item), __key: it.__key } : it)))} errors={errors} path={`${path}.${idx}`} />
              </SortableItem>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {items.length < max && (
        <Button
          type="button"
          size="sm"
          className="mt-2"
          onClick={() => {
            const fresh = withKey(emptyValues(field.fields));
            commit([...items, fresh]);
            setOpen(fresh.__key!);
          }}
        >
          <Plus className="size-3.5" />
          {field.addLabel ? (locale === "ar" ? field.addLabel.ar : field.addLabel.en) : tx("Add item", "إضافة عنصر")}
        </Button>
      )}
    </div>
  );
}

function SortableItem({ id, title, open, hasError, onToggle, onDuplicate, onRemove, children }: { id: string; title: string; open: boolean; hasError: boolean; onToggle: () => void; onDuplicate?: () => void; onRemove: () => void; children: React.ReactNode }) {
  const { tx } = useAdminI18n();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("rounded-md border bg-white", isDragging ? "z-10 shadow-lift" : "", hasError ? "border-red-300" : "border-line")}>
      <div className="flex items-center gap-1 px-1.5 py-1">
        <button type="button" className="grid size-8 cursor-grab touch-none place-items-center rounded text-muted hover:bg-surface active:cursor-grabbing" aria-label={tx("Drag to reorder", "اسحب لإعادة الترتيب")} {...attributes} {...listeners}>
          <GripVertical className="size-4" />
        </button>
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-start text-sm font-medium text-ink" aria-expanded={open}>
          <ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform", !open && "-rotate-90 rtl:rotate-90")} />
          <span className="truncate">{title}</span>
        </button>
        {onDuplicate && <Button type="button" size="icon" variant="ghost" onClick={onDuplicate} aria-label={tx("Duplicate", "تكرار")} className="size-8"><Copy className="size-3.5" /></Button>}
        <Button type="button" size="icon" variant="ghost" onClick={onRemove} aria-label={tx("Remove", "إزالة")} className="size-8 text-red-600 hover:bg-red-50"><Trash2 className="size-3.5" /></Button>
      </div>
      {open && <div className="border-t border-line p-4">{children}</div>}
    </li>
  );
}

/** Removes client-only keys (drag handles) before sending values to the server. */
export function stripKeys<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripKeys) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) if (k !== "__key") out[k] = stripKeys(v);
    return out as T;
  }
  return value;
}

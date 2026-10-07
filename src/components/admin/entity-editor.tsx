"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Save, Trash2 } from "lucide-react";
import type { Field, FieldValues } from "@/lib/sections/fields";
import type { ActionResult } from "@/lib/actions";
import { useAdminI18n } from "./i18n";
import { FieldForm, stripKeys } from "./fields/field-form";
import { FieldEnvProvider, actionErrorText, type LinkSuggestion, type RefOption } from "./fields/env";
import { Badge, Button, Card, ConfirmDialog } from "./ui";

type Props = {
  backHref: string;
  backLabel: string;
  title: string;
  badge?: React.ReactNode;
  viewHref?: string | null;
  mainFields: Field[];
  sideFields: Field[];
  seoFields: Field[];
  initial: FieldValues;
  env: { refs: Record<string, RefOption[]>; links: LinkSuggestion[] };
  onSave: (values: FieldValues) => Promise<ActionResult<{ id: string }>>;
  onSaved?: (id: string, values: FieldValues) => void;
  onDelete?: () => Promise<ActionResult>;
  onDeleted?: () => void;
  readOnly?: boolean;
};

/** Two-column editor (content + settings sidebar) used for services and insights. */
export function EntityEditor({ backHref, backLabel, title, badge, viewHref, mainFields, sideFields, seoFields, initial, env, onSave, onSaved, onDelete, onDeleted, readOnly }: Props) {
  const { tx } = useAdminI18n();
  const [values, setValues] = useState<FieldValues>(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const dirty = JSON.stringify(values) !== saved;

  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => dirty && e.preventDefault();
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [dirty]);

  const save = async () => {
    setSaving(true);
    const r = await onSave(stripKeys(values));
    setSaving(false);
    if (!r.ok) {
      setErrors(r.fieldErrors ?? {});
      return toast.error(actionErrorText(r.error, tx));
    }
    setErrors({});
    setSaved(JSON.stringify(values));
    toast.success(tx("Saved", "تم الحفظ"));
    onSaved?.(r.data!.id, values);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !saving && !readOnly) save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <FieldEnvProvider value={env}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link href={backHref} className="grid size-9 place-items-center rounded-md text-muted hover:bg-white hover:text-ink" aria-label={backLabel}><ArrowLeft className="size-4 rtl:-scale-x-100" /></Link>
          <div className="min-w-0 flex-1">
            <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold text-ink">
              <span className="truncate">{title}</span>
              {badge}
              {dirty && <Badge tone="warning">{tx("Unsaved", "غير محفوظ")}</Badge>}
            </h1>
          </div>
          {viewHref && <a href={viewHref} target="_blank" rel="noopener noreferrer"><Button size="sm"><ExternalLink className="size-4" />{tx("View on website", "عرض على الموقع")}</Button></a>}
          {onDelete && !readOnly && <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setConfirm(true)}><Trash2 className="size-4" />{tx("Delete", "حذف")}</Button>}
          {!readOnly && <Button variant="primary" loading={saving} disabled={!dirty} onClick={save}><Save className="size-4" />{tx("Save", "حفظ")}</Button>}
        </div>
        {Object.keys(errors).length > 0 && <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">{tx("Please fix the highlighted fields.", "يرجى تصحيح الحقول المحددة.")}</div>}
        <fieldset disabled={readOnly} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Card className="p-5 sm:p-6">
            <FieldForm fields={mainFields} value={values} onChange={setValues} errors={errors} />
          </Card>
          <div className="space-y-6">
            <Card className="p-5">
              <FieldForm fields={sideFields} value={values} onChange={setValues} errors={errors} />
            </Card>
            <Card className="p-5">
              <p className="mb-4 text-sm font-semibold text-ink">{tx("Search engines & sharing", "محركات البحث والمشاركة")}</p>
              <FieldForm fields={seoFields} value={values} onChange={setValues} errors={errors} />
            </Card>
          </div>
        </fieldset>
      </div>
      {onDelete && (
        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          title={tx("Delete permanently from the website?", "الحذف نهائياً من الموقع؟")}
          onConfirm={async () => {
            const r = await onDelete();
            if (r.ok) {
              setSaved(JSON.stringify(values));
              onDeleted?.();
            } else toast.error(actionErrorText(r.error, tx));
          }}
        />
      )}
    </FieldEnvProvider>
  );
}

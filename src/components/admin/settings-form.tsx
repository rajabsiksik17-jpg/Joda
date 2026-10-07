"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import type { Field, FieldValues } from "@/lib/sections/fields";
import { saveSettings } from "@/app/admin/(panel)/settings/actions";
import { useAdminI18n } from "./i18n";
import { FieldForm, stripKeys } from "./fields/field-form";
import { FieldEnvProvider, actionErrorText, type LinkSuggestion, type RefOption } from "./fields/env";
import { Badge, Button, Card } from "./ui";

export function SettingsForm({ settingKey, title, description, fields, initial, env }: { settingKey: string; title: string; description: string; fields: Field[]; initial: FieldValues; env: { refs: Record<string, RefOption[]>; links: LinkSuggestion[] } }) {
  const { tx } = useAdminI18n();
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(values) !== saved;

  const save = async () => {
    setBusy(true);
    const r = await saveSettings(settingKey, stripKeys(values));
    setBusy(false);
    if (!r.ok) {
      setErrors(r.fieldErrors ?? {});
      return toast.error(actionErrorText(r.error, tx));
    }
    setErrors({});
    setSaved(JSON.stringify(values));
    toast.success(tx("Settings saved — the website is updated.", "تم حفظ الإعدادات — تم تحديث الموقع."));
  };

  return (
    <FieldEnvProvider value={env}>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="font-semibold text-ink">{title}</h2>
            <p className="mt-0.5 max-w-2xl text-sm text-muted">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            {dirty && <Badge tone="warning">{tx("Unsaved", "غير محفوظ")}</Badge>}
            <Button variant="primary" size="sm" loading={busy} disabled={!dirty} onClick={save}><Save className="size-4" />{tx("Save", "حفظ")}</Button>
          </div>
        </div>
        <form className="p-5" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <FieldForm fields={fields} value={values} onChange={setValues} errors={errors} />
        </form>
      </Card>
    </FieldEnvProvider>
  );
}

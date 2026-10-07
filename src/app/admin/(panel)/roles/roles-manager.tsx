"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Lock, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { PERMISSIONS, PERMISSION_GROUPS, type Permission } from "@/lib/auth/permissions";
import { useAdminI18n } from "@/components/admin/i18n";
import { actionErrorText } from "@/components/admin/fields/env";
import { LocalizedInput } from "@/components/admin/fields/localized-input";
import { Badge, Button, Card, ConfirmDialog, Drawer, FieldShell } from "@/components/admin/ui";
import { deleteRole, saveRole } from "./actions";

type Role = { id: string; key: string; name: { ar: string; en: string }; description: { ar: string; en: string }; permissions: string[]; isSystem: boolean; users: number };

export function RolesManager({ roles }: { roles: Role[] }) {
  const { tx, locale } = useAdminI18n();
  const router = useRouter();
  const [editing, setEditing] = useState<Role | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<Role | null>(null);
  const groups = Object.entries(PERMISSION_GROUPS) as [keyof typeof PERMISSION_GROUPS, { en: string; ar: string }][];
  const isSuper = editing?.key === "super_admin";

  const toggle = (p: Permission) => {
    if (!editing || isSuper) return;
    const has = editing.permissions.includes(p);
    setEditing({ ...editing, permissions: has ? editing.permissions.filter((x) => x !== p) : [...editing.permissions, p] });
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" onClick={() => setEditing({ id: "", key: "", name: { ar: "", en: "" }, description: { ar: "", en: "" }, permissions: ["dashboard.view"], isSystem: false, users: 0 })}><Plus className="size-4" />{tx("New role", "دور جديد")}</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((r) => (
          <Card key={r.id} className="flex flex-col p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-sky-50 text-tech-600"><ShieldCheck className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">{locale === "ar" ? r.name.ar || r.name.en : r.name.en || r.name.ar}{r.isSystem && <Badge>{tx("System", "نظامي")}</Badge>}</p>
                <p className="mt-0.5 text-sm text-muted">{locale === "ar" ? r.description.ar : r.description.en}</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted">{r.key === "super_admin" ? tx("All permissions", "جميع الصلاحيات") : tx(`${r.permissions.length} permissions`, `${r.permissions.length} صلاحية`)} · {tx(`${r.users} user(s)`, `${r.users} مستخدم`)}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={() => setEditing(r)}>{tx("Edit", "تحرير")}</Button>
              {!r.isSystem && r.users === 0 && <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setDeleting(r)}><Trash2 className="size-3.5" />{tx("Delete", "حذف")}</Button>}
            </div>
          </Card>
        ))}
      </div>

      <Drawer
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing?.id ? tx("Edit role", "تحرير الدور") : tx("New role", "دور جديد")}
        width="lg"
        footer={
          <>
            <Button onClick={() => setEditing(null)}>{tx("Cancel", "إلغاء")}</Button>
            <Button variant="primary" loading={busy} onClick={async () => {
              if (!editing) return;
              setBusy(true);
              const r = await saveRole(editing.id || null, { name: editing.name, description: editing.description, permissions: editing.permissions });
              setBusy(false);
              if (!r.ok) return toast.error(actionErrorText(r.error, tx));
              setEditing(null);
              toast.success(tx("Role saved. Changes apply on the users' next request.", "تم حفظ الدور. تُطبّق التغييرات في الطلب التالي للمستخدمين."));
              router.refresh();
            }}>{tx("Save", "حفظ")}</Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-5">
            <FieldShell label={tx("Name", "الاسم")} required><LocalizedInput id="role-name" value={editing.name} onChange={(v) => setEditing({ ...editing, name: { ar: v.ar ?? "", en: v.en ?? "" } })} max={80} /></FieldShell>
            <FieldShell label={tx("Description", "الوصف")}><LocalizedInput id="role-desc" value={editing.description} onChange={(v) => setEditing({ ...editing, description: { ar: v.ar ?? "", en: v.en ?? "" } })} max={200} /></FieldShell>
            {isSuper && <p className="flex items-center gap-2 rounded-md bg-surface px-3 py-2 text-sm text-muted"><Lock className="size-4" />{tx("Super Admin always has every permission.", "يمتلك المدير العام جميع الصلاحيات دائماً.")}</p>}
            {groups.map(([g, label]) => (
              <fieldset key={g} className="rounded-lg border border-line p-4">
                <legend className="px-1 text-sm font-semibold text-ink">{locale === "ar" ? label.ar : label.en}</legend>
                <div className="mt-1 grid gap-2 sm:grid-cols-2">
                  {(Object.entries(PERMISSIONS) as [Permission, (typeof PERMISSIONS)[Permission]][]).filter(([, p]) => p.group === g).map(([key, p]) => (
                    <label key={key} className="flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-surface">
                      <input type="checkbox" className="mt-0.5 size-4 accent-tech" checked={isSuper || editing.permissions.includes(key)} disabled={isSuper} onChange={() => toggle(key)} />
                      <span>
                        <span className="text-ink">{locale === "ar" ? p.ar : p.en}</span>
                        <span className="block font-mono text-[0.68rem] text-muted" dir="ltr">{key}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        )}
      </Drawer>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title={tx("Delete this role?", "حذف هذا الدور؟")} onConfirm={async () => {
        if (!deleting) return;
        const r = await deleteRole(deleting.id);
        if (r.ok) router.refresh(); else toast.error(actionErrorText(r.error, tx));
      }} />
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, KeyRound, LogOut, MoreHorizontal, Pencil, Trash2, Unlock, UserPlus } from "lucide-react";
import { useAdminI18n } from "@/components/admin/i18n";
import { actionErrorText } from "@/components/admin/fields/env";
import { Badge, Button, ConfirmDialog, Drawer, FieldShell, Input, Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, Modal, Select, Switch } from "@/components/admin/ui";
import { relativeTime } from "@/lib/format";
import { createUser, deleteUser, resetUserPassword, revokeUserSessions, unlockUser, updateUser } from "./actions";

type U = { id: string; name: string; email: string; roleId: string; roleKey: string; roleName: string; isActive: boolean; locked: boolean; lastLoginAt: string | null; sessions: number };
type Role = { id: string; key: string; name: string };

export function passwordErrorText(code: string | undefined, tx: (en: string, ar: string) => string) {
  if (!code) return null;
  return (
    {
      too_short: tx("At least 10 characters.", "10 أحرف على الأقل."),
      too_long: tx("Too long.", "طويلة جداً."),
      too_weak: tx("Use at least three of: lowercase, uppercase, numbers, symbols.", "استخدم ثلاثة على الأقل من: أحرف صغيرة، أحرف كبيرة، أرقام، رموز."),
      mismatch: tx("Passwords do not match.", "كلمتا المرور غير متطابقتين."),
      wrong_password: tx("Current password is incorrect.", "كلمة المرور الحالية غير صحيحة."),
    } as Record<string, string>
  )[code] ?? tx("Invalid value.", "قيمة غير صالحة.");
}

export function UsersManager({ users, roles, meId, meIsSuper, openId }: { users: U[]; roles: Role[]; meId: string; meIsSuper: boolean; openId?: string }) {
  const { tx, locale } = useAdminI18n();
  const router = useRouter();
  const [editing, setEditing] = useState<U | null>(users.find((u) => u.id === openId) ?? null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", roleId: roles.find((r) => r.key === "editor")?.id ?? roles[0]?.id ?? "", password: "", isActive: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [secret, setSecret] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState<U | null>(null);
  const assignable = roles.filter((r) => meIsSuper || r.key !== "super_admin");

  const submitCreate = async () => {
    setBusy(true);
    const r = await createUser({ name: form.name, email: form.email, roleId: form.roleId, password: form.password });
    setBusy(false);
    if (!r.ok) {
      setErrors(r.fieldErrors ?? {});
      return toast.error(actionErrorText(r.error, tx));
    }
    setCreating(false);
    if (r.data?.tempPassword) setSecret({ email: form.email, password: r.data.tempPassword });
    else toast.success(tx("User created", "تم إنشاء المستخدم"));
    router.refresh();
  };

  const submitEdit = async () => {
    if (!editing) return;
    setBusy(true);
    const r = await updateUser(editing.id, { name: editing.name, roleId: editing.roleId, isActive: editing.isActive });
    setBusy(false);
    if (!r.ok) return toast.error(actionErrorText(r.error, tx));
    setEditing(null);
    toast.success(tx("User updated", "تم تحديث المستخدم"));
    router.refresh();
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" onClick={() => { setErrors({}); setForm({ ...form, name: "", email: "", password: "" }); setCreating(true); }}><UserPlus className="size-4" />{tx("Add user", "إضافة مستخدم")}</Button>
      </div>
      <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
        {users.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-navy font-semibold text-white">{u.name.slice(0, 1).toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                {u.name}
                {u.id === meId && <Badge tone="info">{tx("You", "أنت")}</Badge>}
                {!u.isActive && <Badge tone="danger">{tx("Deactivated", "معطّل")}</Badge>}
                {u.locked && <Badge tone="warning">{tx("Locked", "مقفل")}</Badge>}
              </p>
              <p className="truncate text-xs text-muted"><span dir="ltr">{u.email}</span> · {u.lastLoginAt ? `${tx("last sign-in", "آخر دخول")} ${relativeTime(u.lastLoginAt, locale)}` : tx("never signed in", "لم يسجل الدخول بعد")}</p>
            </div>
            <Badge tone={u.roleKey === "super_admin" ? "navy" : "neutral"}>{u.roleName}</Badge>
            <Menu>
              <MenuTrigger className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface hover:text-ink" aria-label={tx("Actions", "الإجراءات")}><MoreHorizontal className="size-4" /></MenuTrigger>
              <MenuContent>
                <MenuItem onSelect={() => setEditing(u)}><Pencil className="size-4" />{tx("Edit", "تحرير")}</MenuItem>
                {u.locked && <MenuItem onSelect={async () => { const r = await unlockUser(u.id); if (r.ok) { toast.success(tx("Account unlocked", "تم فتح الحساب")); router.refresh(); } }}><Unlock className="size-4" />{tx("Unlock", "فتح القفل")}</MenuItem>}
                <MenuItem disabled={u.roleKey === "super_admin" && !meIsSuper} onSelect={async () => { const r = await resetUserPassword(u.id); if (r.ok) setSecret({ email: u.email, password: r.data!.tempPassword }); else toast.error(actionErrorText(r.error, tx)); }}>
                  <KeyRound className="size-4" />{tx("Reset password", "إعادة تعيين كلمة المرور")}
                </MenuItem>
                <MenuItem disabled={u.sessions === 0} onSelect={async () => { const r = await revokeUserSessions(u.id); if (r.ok) { toast.success(tx("Signed out of all devices", "تم تسجيل الخروج من جميع الأجهزة")); router.refresh(); } }}>
                  <LogOut className="size-4" />{tx(`Sign out everywhere (${u.sessions})`, `تسجيل الخروج من كل الأجهزة (${u.sessions})`)}
                </MenuItem>
                {u.id !== meId && (<><MenuSeparator /><MenuItem danger onSelect={() => setDeleting(u)}><Trash2 className="size-4" />{tx("Delete", "حذف")}</MenuItem></>)}
              </MenuContent>
            </Menu>
          </li>
        ))}
      </ul>

      <Drawer open={creating} onOpenChange={setCreating} title={tx("Add user", "إضافة مستخدم")} width="md" footer={<><Button onClick={() => setCreating(false)}>{tx("Cancel", "إلغاء")}</Button><Button variant="primary" loading={busy} onClick={submitCreate}>{tx("Create user", "إنشاء المستخدم")}</Button></>}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submitCreate(); }}>
          <FieldShell label={tx("Full name", "الاسم الكامل")} htmlFor="u-name" required error={errors.name && tx("Required", "مطلوب")}><Input id="u-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FieldShell>
          <FieldShell label={tx("E-mail (used to sign in and receive codes)", "البريد (للدخول واستلام الرموز)")} htmlFor="u-email" required error={errors.email === "duplicate" ? tx("A user with this e-mail exists.", "يوجد مستخدم بهذا البريد.") : errors.email && tx("Invalid e-mail", "بريد غير صالح")}><Input id="u-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} dir="ltr" /></FieldShell>
          <FieldShell label={tx("Role", "الدور")} htmlFor="u-role"><Select id="u-role" value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>{assignable.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select></FieldShell>
          <FieldShell label={tx("Password (leave empty to generate a temporary one)", "كلمة المرور (اتركها فارغة لإنشاء كلمة مؤقتة)")} htmlFor="u-pass" error={passwordErrorText(errors.password, tx)}><Input id="u-pass" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></FieldShell>
        </form>
      </Drawer>

      <Drawer open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={tx("Edit user", "تحرير المستخدم")} width="md" footer={<><Button onClick={() => setEditing(null)}>{tx("Cancel", "إلغاء")}</Button><Button variant="primary" loading={busy} onClick={submitEdit}>{tx("Save", "حفظ")}</Button></>}>
        {editing && (
          <div className="space-y-4">
            <FieldShell label={tx("Full name", "الاسم الكامل")} htmlFor="e-name"><Input id="e-name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></FieldShell>
            <FieldShell label={tx("E-mail", "البريد")}><Input value={editing.email} disabled dir="ltr" /></FieldShell>
            <FieldShell label={tx("Role", "الدور")} htmlFor="e-role" help={editing.id === meId ? tx("You can't change your own role.", "لا يمكنك تغيير دورك.") : undefined}>
              <Select id="e-role" value={editing.roleId} disabled={editing.id === meId || (editing.roleKey === "super_admin" && !meIsSuper)} onChange={(e) => setEditing({ ...editing, roleId: e.target.value })}>
                {(editing.roleKey === "super_admin" ? roles : assignable).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Select>
            </FieldShell>
            <div className="flex items-center justify-between rounded-md border border-line px-3.5 py-3">
              <span className="text-sm text-ink">{tx("Account active", "الحساب نشط")}</span>
              <Switch checked={editing.isActive} disabled={editing.id === meId} onCheckedChange={(v) => setEditing({ ...editing, isActive: v })} />
            </div>
          </div>
        )}
      </Drawer>

      <Modal open={!!secret} onOpenChange={(o) => !o && setSecret(null)} title={tx("Temporary password", "كلمة المرور المؤقتة")} description={tx("Share it securely with the user. It won't be shown again; they should change it after signing in.", "شاركها مع المستخدم بطريقة آمنة. لن تُعرض مرة أخرى، ويجب تغييرها بعد تسجيل الدخول.")} size="sm" footer={<Button variant="primary" onClick={() => setSecret(null)}>{tx("Done", "تم")}</Button>}>
        {secret && (
          <div className="space-y-2">
            <p className="text-sm text-muted" dir="ltr">{secret.email}</p>
            <div className="flex gap-2">
              <code className="flex-1 rounded-md border border-line bg-surface px-3 py-2.5 font-mono text-base select-all" dir="ltr">{secret.password}</code>
              <Button onClick={async () => { await navigator.clipboard.writeText(secret.password); setCopied(true); setTimeout(() => setCopied(false), 1500); }} aria-label={tx("Copy", "نسخ")}>{copied ? <Check className="size-4" /> : <Copy className="size-4" />}</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={tx("Delete this user?", "حذف هذا المستخدم؟")}
        description={tx("Their activity remains in the audit log.", "يبقى نشاطه محفوظاً في سجل التدقيق.")}
        onConfirm={async () => {
          if (!deleting) return;
          const r = await deleteUser(deleting.id);
          if (r.ok) { toast.success(tx("User deleted", "تم حذف المستخدم")); router.refresh(); } else toast.error(actionErrorText(r.error, tx));
        }}
      />
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Laptop, LogOut, ShieldCheck } from "lucide-react";
import { useAdminI18n } from "@/components/admin/i18n";
import { actionErrorText } from "@/components/admin/fields/env";
import { Badge, Button, Card, FieldShell, Input, Select } from "@/components/admin/ui";
import { formatDate, relativeTime } from "@/lib/format";
import { passwordErrorText } from "../users/users-manager";
import { changePassword, revokeSession, revokeTrustedDevice, updateProfile } from "./actions";

type Device = { id: string; current: boolean; label: string; ip: string; lastUsedAt: string; expiresAt: string };

type Sess = { id: string; current: boolean; userAgent: string; ip: string; lastSeenAt: string; createdAt: string };

function describeAgent(ua: string) {
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "";
  return `${browser}${os ? ` · ${os}` : ""}`;
}

export function AccountForms({ profile, sessions, devices }: { profile: { name: string; preferredLocale: "ar" | "en" }; sessions: Sess[]; devices: Device[] }) {
  const { tx, locale } = useAdminI18n();
  const router = useRouter();
  const [p, setP] = useState(profile);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h2 className="mb-4 font-semibold text-ink">{tx("Profile", "الملف الشخصي")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell label={tx("Name", "الاسم")} htmlFor="acc-name"><Input id="acc-name" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></FieldShell>
          <FieldShell label={tx("Dashboard & e-mail language", "لغة لوحة التحكم والبريد")} htmlFor="acc-lang">
            <Select id="acc-lang" value={p.preferredLocale} onChange={(e) => setP({ ...p, preferredLocale: e.target.value as "ar" | "en" })}>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </Select>
          </FieldShell>
        </div>
        <Button variant="primary" className="mt-4" loading={busy === "profile"} onClick={async () => {
          setBusy("profile");
          const r = await updateProfile(p);
          setBusy(null);
          if (!r.ok) return toast.error(actionErrorText(r.error, tx));
          toast.success(tx("Profile saved", "تم حفظ الملف الشخصي"));
          router.refresh();
        }}>{tx("Save profile", "حفظ الملف الشخصي")}</Button>
      </Card>

      <Card className="p-5">
        <h2 className="mb-1 font-semibold text-ink">{tx("Change password", "تغيير كلمة المرور")}</h2>
        <p className="mb-4 text-sm text-muted">{tx("At least 10 characters, mixing upper/lowercase, numbers or symbols. Other devices will be signed out.", "10 أحرف على الأقل تمزج بين الأحرف الكبيرة والصغيرة والأرقام أو الرموز. سيتم تسجيل الخروج من الأجهزة الأخرى.")}</p>
        <form className="grid gap-4 sm:max-w-md" onSubmit={async (e) => {
          e.preventDefault();
          setBusy("pw");
          const r = await changePassword(pw);
          setBusy(null);
          if (!r.ok) {
            setPwErrors(r.fieldErrors ?? {});
            return r.error === "invalid" ? undefined : toast.error(actionErrorText(r.error, tx));
          }
          setPwErrors({});
          setPw({ current: "", next: "", confirm: "" });
          toast.success(tx("Password changed", "تم تغيير كلمة المرور"));
          router.refresh();
        }}>
          <FieldShell label={tx("Current password", "كلمة المرور الحالية")} htmlFor="pw-cur" error={passwordErrorText(pwErrors.current, tx)}><Input id="pw-cur" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></FieldShell>
          <FieldShell label={tx("New password", "كلمة المرور الجديدة")} htmlFor="pw-new" error={passwordErrorText(pwErrors.next, tx)}><Input id="pw-new" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></FieldShell>
          <FieldShell label={tx("Confirm new password", "تأكيد كلمة المرور الجديدة")} htmlFor="pw-conf" error={passwordErrorText(pwErrors.confirm, tx)}><Input id="pw-conf" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></FieldShell>
          <div><Button type="submit" variant="primary" loading={busy === "pw"} disabled={!pw.current || !pw.next}>{tx("Change password", "تغيير كلمة المرور")}</Button></div>
        </form>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 font-semibold text-ink">{tx("Active sessions", "الجلسات النشطة")}</h2>
        <ul className="divide-y divide-line">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-3">
              <Laptop className="size-5 text-muted" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium text-ink">{describeAgent(s.userAgent)} {s.current && <Badge tone="success">{tx("This device", "هذا الجهاز")}</Badge>}</p>
                <p className="text-xs text-muted"><span dir="ltr">{s.ip}</span> · {tx("active", "نشطة")} {relativeTime(s.lastSeenAt, locale)}</p>
              </div>
              {!s.current && <Button size="sm" onClick={async () => { const r = await revokeSession(s.id); if (r.ok) router.refresh(); }}><LogOut className="size-3.5" />{tx("Sign out", "تسجيل الخروج")}</Button>}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5">
        <h2 className="mb-1 font-semibold text-ink">{tx("Trusted browsers", "المتصفحات الموثوقة")}</h2>
        <p className="mb-4 text-sm text-muted">{tx("Browsers that completed e-mail verification and can skip it until they expire. Remove any you don't recognise.", "متصفحات أكملت التحقق بالبريد ويمكنها تخطيه حتى انتهاء صلاحيتها. أزل أي متصفح لا تعرفه.")}</p>
        {devices.length === 0 ? (
          <p className="text-sm text-muted">{tx("No trusted browsers.", "لا توجد متصفحات موثوقة.")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {devices.map((d) => (
              <li key={d.id} className="flex items-center gap-3 py-3">
                <ShieldCheck className="size-5 text-muted" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium text-ink">{d.label || tx("Browser", "متصفح")} {d.current && <Badge tone="success">{tx("This browser", "هذا المتصفح")}</Badge>}</p>
                  <p className="text-xs text-muted"><span dir="ltr">{d.ip}</span> · {tx("used", "استُخدم")} {relativeTime(d.lastUsedAt, locale)} · {tx("until", "حتى")} {formatDate(d.expiresAt, locale)}</p>
                </div>
                <Button size="sm" onClick={async () => { const r = await revokeTrustedDevice(d.id); if (r.ok) router.refresh(); }}>{tx("Remove", "إزالة")}</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

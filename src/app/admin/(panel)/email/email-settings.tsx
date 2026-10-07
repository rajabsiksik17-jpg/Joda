"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { CheckCircle2, CircleDashed, KeyRound, Mail, PlugZap, Save, Send, ShieldCheck, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { useAdminI18n } from "@/components/admin/i18n";
import { actionErrorText } from "@/components/admin/fields/env";
import { Badge, Button, Card, FieldShell, Input, Select, Switch } from "@/components/admin/ui";
import { saveImap, saveSmtp, sendTestEmail, setEmailEnabled, testImapConnection, testSmtpConnection, type EmailView } from "./actions";

function StatusCard({ icon, title, state, tone, detail }: { icon: React.ReactNode; title: string; state: string; tone: "ok" | "warn" | "off" | "bad"; detail?: string }) {
  const tones = { ok: "border-emerald-200 bg-emerald-50/60", warn: "border-amber-200 bg-amber-50/60", off: "border-line bg-white", bad: "border-red-200 bg-red-50/60" };
  const dot = { ok: "bg-emerald-500", warn: "bg-amber-500", off: "bg-mist", bad: "bg-red-500" };
  return (
    <div className={cn("rounded-lg border p-4", tones[tone])}>
      <div className="flex items-center gap-2 text-sm text-muted">{icon}{title}</div>
      <p className="mt-2 flex items-center gap-2 font-semibold text-ink"><span className={cn("size-2 rounded-full", dot[tone])} aria-hidden />{state}</p>
      {detail && <p className="mt-1 text-xs text-muted">{detail}</p>}
    </div>
  );
}

function EmailStatusPanel({ view }: { view: EmailView }) {
  const { tx, locale } = useAdminI18n();
  const [busy, setBusy] = useState(false);
  const s = view.status;
  const smtpState = {
    not_configured: [tx("Not configured", "غير مُعد"), "bad"],
    unverified: [tx("Configured — not verified", "مُعد — لم يتم التحقق"), "warn"],
    disabled: [tx("Disabled", "معطّل"), "off"],
    active: [tx("Connected", "متصل"), "ok"],
  }[s.state] as [string, "ok" | "warn" | "off" | "bad"];
  const imapState = { not_configured: [tx("Not configured", "غير مُعد"), "off"], unverified: [tx("Configured — not verified", "مُعد — لم يتم التحقق"), "warn"], connected: [tx("Connected", "متصل"), "ok"] }[s.imap] as [string, "ok" | "warn" | "off" | "bad"];
  const otpActive = s.state === "active" && view.otpMode !== "off";
  const otpDetail = otpActive
    ? view.otpMode === "every_login" ? tx("A code is required at every sign-in.", "يُطلب رمز عند كل تسجيل دخول.") : tx("A code is required on new or unrecognised devices.", "يُطلب رمز على الأجهزة الجديدة أو غير المعروفة.")
    : s.state !== "active" ? tx("Sign-in uses the password only until e-mail is configured, tested and enabled.", "يعتمد الدخول على كلمة المرور فقط حتى يتم إعداد البريد واختباره وتفعيله.") : tx("Turned off in Security settings.", "معطّل من إعدادات الأمان.");
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatusCard icon={<Send className="size-4 rtl:-scale-x-100" />} title="SMTP" state={smtpState[0]} tone={smtpState[1]} detail={s.smtpVerifiedAt ? `${tx("Verified", "تم التحقق")} ${formatDateTime(s.smtpVerifiedAt, locale)}${s.source === "env" ? tx(" · environment", " · متغيرات البيئة") : ""}` : s.state === "unverified" ? tx("Save, then run “Test connection” or “Send test”.", "احفظ ثم شغّل «اختبار الاتصال» أو «إرسال اختبار».") : undefined} />
        <StatusCard icon={<Mail className="size-4" />} title="IMAP" state={imapState[0]} tone={imapState[1]} detail={s.imapVerifiedAt ? `${tx("Verified", "تم التحقق")} ${formatDateTime(s.imapVerifiedAt, locale)}` : undefined} />
        <StatusCard icon={<ShieldCheck className="size-4" />} title={tx("E-mail sign-in verification", "التحقق بالبريد عند الدخول")} state={otpActive ? tx("Active", "مفعّل") : tx("Inactive", "غير مفعّل")} tone={otpActive ? "ok" : "warn"} detail={otpDetail} />
      </div>
      {s.state !== "not_configured" && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 text-sm">
          <CircleDashed className="size-4 text-muted" aria-hidden />
          <span className="flex-1 text-ink">{s.enabled ? tx("Outgoing e-mail is enabled.", "البريد الصادر مفعّل.") : tx("Outgoing e-mail is switched off — no notifications or sign-in codes are sent.", "البريد الصادر معطّل — لا تُرسل إشعارات أو رموز دخول.")}</span>
          <Link href="/admin/settings?tab=security" className="text-tech-600 hover:underline">{tx("Sign-in policy", "سياسة الدخول")}</Link>
          <Button size="sm" loading={busy} onClick={async () => { setBusy(true); const r = await setEmailEnabled(!s.enabled); setBusy(false); if (r.ok) location.reload(); else toast.error(actionErrorText(r.error, tx)); }}>
            {s.enabled ? tx("Disable e-mail", "تعطيل البريد") : tx("Enable e-mail", "تفعيل البريد")}
          </Button>
        </div>
      )}
    </div>
  );
}

type Result = { ok: boolean; text: string; detail?: string } | null;

function useEmailError() {
  const { tx } = useAdminI18n();
  return (code: string) =>
    ({
      not_configured: tx("Enter the server host first.", "أدخل عنوان الخادم أولاً."),
      auth_failed: tx("Authentication failed — check the username and password (some providers need an app password).", "فشل التحقق — تحقق من اسم المستخدم وكلمة المرور (بعض المزودين يتطلبون كلمة مرور للتطبيقات)."),
      connection_failed: tx("Could not connect — check the host and port, and that the server allows connections from this server.", "تعذّر الاتصال — تحقق من الخادم والمنفذ وأن الخادم يسمح بالاتصال."),
      tls_failed: tx("Secure connection failed — try SSL on port 465 or STARTTLS on port 587.", "فشل الاتصال الآمن — جرّب SSL على المنفذ 465 أو STARTTLS على المنفذ 587."),
      timeout: tx("The server did not respond in time.", "لم يستجب الخادم في الوقت المحدد."),
      rejected: tx("The server rejected the message (check the sender address).", "رفض الخادم الرسالة (تحقق من عنوان المرسل)."),
      rate_limited: tx("Too many tests. Please wait a few minutes.", "اختبارات كثيرة. يرجى الانتظار بضع دقائق."),
    })[code] ?? actionErrorText(code, tx);
}

function ResultBox({ result }: { result: Result }) {
  if (!result) return null;
  return (
    <div role="status" className={`mt-4 flex items-start gap-2.5 rounded-md border p-3 text-sm ${result.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"}`}>
      {result.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <XCircle className="mt-0.5 size-4 shrink-0" />}
      <div>
        <p>{result.text}</p>
        {result.detail && <p className="mt-1 font-mono text-xs opacity-80" dir="ltr">{result.detail}</p>}
      </div>
    </div>
  );
}

function PasswordField({ id, label, hasPassword, value, onChange }: { id: string; label: string; hasPassword: boolean; value: string; onChange: (v: string) => void }) {
  const { tx } = useAdminI18n();
  const cleared = value === "__clear__";
  return (
    <FieldShell label={label} htmlFor={id} help={hasPassword && !value ? tx("A password is stored. Leave empty to keep it.", "توجد كلمة مرور محفوظة. اتركها فارغة للإبقاء عليها.") : undefined}>
      <div className="flex gap-2">
        <Input id={id} type="password" autoComplete="new-password" value={cleared ? "" : value} placeholder={hasPassword ? "••••••••••" : ""} onChange={(e) => onChange(e.target.value)} disabled={cleared} dir="ltr" />
        {hasPassword && (
          <Button type="button" size="sm" variant="ghost" className="h-10" onClick={() => onChange(cleared ? "" : "__clear__")}>{cleared ? tx("Undo", "تراجع") : tx("Remove", "إزالة")}</Button>
        )}
      </div>
    </FieldShell>
  );
}

export function EmailSettings({ view, userEmail }: { view: EmailView; userEmail: string }) {
  const { tx } = useAdminI18n();
  const emailError = useEmailError();
  const [smtp, setSmtp] = useState({ ...view.smtp, password: "" });
  const [imap, setImap] = useState({ ...view.imap, password: "" });
  const [testTo, setTestTo] = useState(userEmail);
  const [busy, setBusy] = useState<string | null>(null);
  const [smtpResult, setSmtpResult] = useState<Result>(null);
  const [imapResult, setImapResult] = useState<Result>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const run = async <T,>(key: string, fn: () => Promise<{ ok: boolean; error?: string; fieldErrors?: Record<string, string>; data?: T }>) => {
    setBusy(key);
    try {
      return await fn();
    } finally {
      setBusy(null);
    }
  };
  const smtpPayload = { host: smtp.host, port: smtp.port, security: smtp.security, user: smtp.user, password: smtp.password, fromName: smtp.fromName, fromEmail: smtp.fromEmail, replyTo: smtp.replyTo };
  const imapPayload = { host: imap.host, port: imap.port, secure: imap.secure, user: imap.user, password: imap.password };

  return (
    <div className="space-y-8">
      <EmailStatusPanel view={view} />
      {view.envFallback && <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-tech-700">{tx("SMTP is currently configured through environment variables. Settings saved here take priority.", "تم إعداد SMTP حالياً عبر متغيرات البيئة. الإعدادات المحفوظة هنا لها الأولوية.")}</div>}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="font-semibold text-ink">{tx("Outgoing mail (SMTP)", "البريد الصادر (SMTP)")}</h2>
            <p className="text-sm text-muted">{tx("Required for sign-in codes in production.", "مطلوب لرموز تسجيل الدخول في بيئة الإنتاج.")}</p>
          </div>
          {view.smtp.host ? <Badge tone="success">{tx("Configured", "مُعد")}</Badge> : <Badge tone="danger">{tx("Not configured", "غير مُعد")}</Badge>}
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <FieldShell label={tx("SMTP host", "خادم SMTP")} htmlFor="smtp-host" error={errors.host && tx("Invalid host", "خادم غير صالح")}><Input id="smtp-host" value={smtp.host} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} placeholder="smtp.example.com" dir="ltr" /></FieldShell>
          <div className="grid grid-cols-2 gap-3">
            <FieldShell label={tx("Port", "المنفذ")} htmlFor="smtp-port"><Input id="smtp-port" type="number" value={smtp.port} onChange={(e) => setSmtp({ ...smtp, port: Number(e.target.value) })} dir="ltr" /></FieldShell>
            <FieldShell label={tx("Security", "الأمان")} htmlFor="smtp-sec">
              <Select id="smtp-sec" value={smtp.security} onChange={(e) => setSmtp({ ...smtp, security: e.target.value as typeof smtp.security, port: e.target.value === "ssl" ? 465 : e.target.value === "starttls" ? 587 : smtp.port })}>
                <option value="starttls">STARTTLS</option>
                <option value="ssl">SSL/TLS</option>
                <option value="none">{tx("None", "بدون")}</option>
              </Select>
            </FieldShell>
          </div>
          <FieldShell label={tx("Username", "اسم المستخدم")} htmlFor="smtp-user"><Input id="smtp-user" autoComplete="off" value={smtp.user} onChange={(e) => setSmtp({ ...smtp, user: e.target.value })} dir="ltr" /></FieldShell>
          <PasswordField id="smtp-pass" label={tx("Password", "كلمة المرور")} hasPassword={view.smtp.hasPassword} value={smtp.password} onChange={(password) => setSmtp({ ...smtp, password })} />
          <FieldShell label={tx("Sender name", "اسم المرسل")} htmlFor="smtp-from-name"><Input id="smtp-from-name" value={smtp.fromName} onChange={(e) => setSmtp({ ...smtp, fromName: e.target.value })} placeholder="Quality Experts" /></FieldShell>
          <FieldShell label={tx("Sender e-mail", "بريد المرسل")} htmlFor="smtp-from" error={errors.fromEmail && tx("Invalid e-mail", "بريد غير صالح")}><Input id="smtp-from" type="email" value={smtp.fromEmail} onChange={(e) => setSmtp({ ...smtp, fromEmail: e.target.value })} placeholder="info@qc-jo.com" dir="ltr" /></FieldShell>
          <FieldShell label={tx("Reply-to (optional)", "الرد إلى (اختياري)")} htmlFor="smtp-reply" error={errors.replyTo && tx("Invalid e-mail", "بريد غير صالح")}><Input id="smtp-reply" type="email" value={smtp.replyTo} onChange={(e) => setSmtp({ ...smtp, replyTo: e.target.value })} dir="ltr" /></FieldShell>
        </div>
        <div className="flex flex-wrap items-end gap-2 border-t border-line bg-surface/50 px-5 py-4">
          <Button
            variant="primary"
            loading={busy === "smtp-save"}
            onClick={async () => {
              const r = await run("smtp-save", () => saveSmtp(smtpPayload));
              if (!r.ok) {
                setErrors(r.fieldErrors ?? {});
                return toast.error(actionErrorText(r.error!, tx));
              }
              setErrors({});
              toast.success(tx("SMTP settings saved", "تم حفظ إعدادات SMTP"));
              location.reload();
            }}
          >
            <Save className="size-4" />{tx("Save", "حفظ")}
          </Button>
          <Button loading={busy === "smtp-test"} onClick={async () => {
            const r = await run<{ detail?: string }>("smtp-test", () => testSmtpConnection(smtpPayload));
            const savedNote = r.ok && r.data?.detail === "verified" ? tx(" The saved configuration is now verified.", " تم التحقق من الإعدادات المحفوظة.") : r.ok ? tx(" Save the settings and test again to activate them.", " احفظ الإعدادات واختبرها مجدداً لتفعيلها.") : "";
            setSmtpResult(r.ok ? { ok: true, text: tx("Connection and authentication succeeded.", "نجح الاتصال والتحقق.") + savedNote } : { ok: false, text: emailError(r.error!), detail: r.fieldErrors?.detail });
            if (r.ok && r.data?.detail === "verified") setTimeout(() => location.reload(), 1200);
          }}>
            <PlugZap className="size-4" />{tx("Test connection", "اختبار الاتصال")}
          </Button>
          <div className="ms-auto flex w-full gap-2 sm:w-auto">
            <Input value={testTo} onChange={(e) => setTestTo(e.target.value)} type="email" className="sm:w-60" dir="ltr" aria-label={tx("Send test to", "إرسال الاختبار إلى")} />
            <Button loading={busy === "smtp-send"} onClick={async () => {
              const r = await run<{ detail?: string }>("smtp-send", () => sendTestEmail(smtpPayload, testTo));
              setSmtpResult(r.ok ? { ok: true, text: tx(`Test e-mail sent to ${testTo}.`, `تم إرسال رسالة اختبار إلى ${testTo}.`) + (r.data?.detail === "verified" ? tx(" The saved configuration is now verified.", " تم التحقق من الإعدادات المحفوظة.") : "") } : { ok: false, text: emailError(r.error!), detail: r.fieldErrors?.detail });
              if (r.ok && r.data?.detail === "verified") setTimeout(() => location.reload(), 1200);
            }}>
              <Send className="size-4 rtl:-scale-x-100" />{tx("Send test", "إرسال اختبار")}
            </Button>
          </div>
        </div>
        <div className="px-5 pb-5"><ResultBox result={smtpResult} /></div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="font-semibold text-ink">{tx("Incoming mail (IMAP) — optional", "البريد الوارد (IMAP) — اختياري")}</h2>
            <p className="text-sm text-muted">{tx("Store the mailbox connection used by the team and verify it works.", "احفظ اتصال صندوق البريد المستخدم من الفريق وتحقق من عمله.")}</p>
          </div>
          {view.imap.host ? <Badge tone="success">{tx("Configured", "مُعد")}</Badge> : <Badge>{tx("Not configured", "غير مُعد")}</Badge>}
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <FieldShell label={tx("IMAP host", "خادم IMAP")} htmlFor="imap-host"><Input id="imap-host" value={imap.host} onChange={(e) => setImap({ ...imap, host: e.target.value })} placeholder="imap.example.com" dir="ltr" /></FieldShell>
          <div className="grid grid-cols-2 items-end gap-3">
            <FieldShell label={tx("Port", "المنفذ")} htmlFor="imap-port"><Input id="imap-port" type="number" value={imap.port} onChange={(e) => setImap({ ...imap, port: Number(e.target.value) })} dir="ltr" /></FieldShell>
            <label className="flex h-10 items-center gap-2 text-sm text-ink"><Switch checked={imap.secure} onCheckedChange={(v) => setImap({ ...imap, secure: v, port: v ? 993 : 143 })} />SSL/TLS</label>
          </div>
          <FieldShell label={tx("Username", "اسم المستخدم")} htmlFor="imap-user"><Input id="imap-user" autoComplete="off" value={imap.user} onChange={(e) => setImap({ ...imap, user: e.target.value })} dir="ltr" /></FieldShell>
          <PasswordField id="imap-pass" label={tx("Password", "كلمة المرور")} hasPassword={view.imap.hasPassword} value={imap.password} onChange={(password) => setImap({ ...imap, password })} />
        </div>
        <div className="flex flex-wrap gap-2 border-t border-line bg-surface/50 px-5 py-4">
          <Button variant="primary" loading={busy === "imap-save"} onClick={async () => {
            const r = await run("imap-save", () => saveImap(imapPayload));
            if (!r.ok) return toast.error(actionErrorText(r.error!, tx));
            toast.success(tx("IMAP settings saved", "تم حفظ إعدادات IMAP"));
            location.reload();
          }}>
            <Save className="size-4" />{tx("Save", "حفظ")}
          </Button>
          <Button loading={busy === "imap-test"} onClick={async () => {
            const r = await run<{ messages: number }>("imap-test", () => testImapConnection(imapPayload));
            setImapResult(r.ok ? { ok: true, text: tx(`Connected. The inbox contains ${r.data?.messages ?? 0} message(s).`, `تم الاتصال. يحتوي صندوق الوارد على ${r.data?.messages ?? 0} رسالة.`) } : { ok: false, text: emailError(r.error!), detail: r.fieldErrors?.detail });
          }}>
            <KeyRound className="size-4" />{tx("Test connection", "اختبار الاتصال")}
          </Button>
        </div>
        <div className="px-5 pb-5"><ResultBox result={imapResult} /></div>
      </Card>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/admin/ui";
import { useAdminI18n } from "@/components/admin/i18n";
import { cn } from "@/lib/cn";
import { resendOtpAction, verifyOtpAction, type AuthState } from "../actions";
import { authErrorMessage } from "../auth-messages";

const LENGTH = 6;

export function VerifyForm({ email, initialCooldown, minutes, trustDays }: { email: string; initialCooldown: number; minutes: number; trustDays: number | null }) {
  const { tx } = useAdminI18n();
  const [state, action, pending] = useActionState<AuthState, FormData>(verifyOtpAction, null);
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [cooldown, setCooldown] = useState(initialCooldown);
  const [resendState, setResendState] = useState<AuthState>(null);
  const [resending, startResend] = useTransition();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // After a wrong code: clear the boxes (adjusting state during render) and refocus the first one.
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state?.error) setDigits(Array(LENGTH).fill(""));
  }
  useEffect(() => {
    if (state?.error) inputs.current[0]?.focus();
  }, [state]);

  const setAt = (i: number, value: string) => {
    const clean = value.replace(/\D/g, "");
    if (clean.length > 1) {
      // Paste or autofill of the whole code
      const next = clean.slice(0, LENGTH).split("");
      const filled = Array(LENGTH).fill("").map((_, k) => next[k] ?? "");
      setDigits(filled);
      inputs.current[Math.min(next.length, LENGTH - 1)]?.focus();
      if (next.length === LENGTH) setTimeout(() => formRef.current?.requestSubmit(), 0);
      return;
    }
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < LENGTH - 1) inputs.current[i + 1]?.focus();
    if (clean && next.every(Boolean)) setTimeout(() => formRef.current?.requestSubmit(), 0);
  };

  const error = authErrorMessage(state?.error ?? resendState?.error, tx, state?.error ? state : resendState ?? undefined);
  const terminal = ["expired", "not_found", "too_many_attempts", "too_many_resends"].includes(state?.error ?? resendState?.error ?? "");

  return (
    <div>
      <span className="grid size-12 place-items-center rounded-full bg-sky-50 text-tech-600"><ShieldCheck className="size-6" aria-hidden /></span>
      <h1 className="mt-5 text-2xl font-bold text-ink">{tx("Check your email", "تحقق من بريدك الإلكتروني")}</h1>
      <p className="mt-2 text-sm text-muted">
        {tx(`Enter the 6-digit code sent to `, "أدخل الرمز المكوّن من 6 أرقام المرسل إلى ")}
        <span className="font-semibold text-ink" dir="ltr">{email}</span>
        {tx(`. It expires in ${minutes} minutes.`, `. تنتهي صلاحيته خلال ${minutes} دقائق.`)}
      </p>

      {error && (
        <div role="alert" className="mt-6 flex gap-2.5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{error} {terminal && <Link href="/admin/login" className="font-semibold underline">{tx("Sign in again", "سجّل الدخول مجدداً")}</Link>}</span>
        </div>
      )}
      {resendState?.info === "resent" && !error && (
        <div role="status" className="mt-6 flex gap-2.5 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          {tx("A new code has been sent.", "تم إرسال رمز جديد.")}
        </div>
      )}

      <form ref={formRef} action={action} className="mt-6">
        <input type="hidden" name="code" value={digits.join("")} />
        <fieldset className="flex justify-between gap-2" dir="ltr" disabled={pending || terminal}>
          <legend className="sr-only">{tx("Verification code", "رمز التحقق")}</legend>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              value={d}
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
              }}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={i === 0 ? LENGTH : 1}
              aria-label={tx(`Digit ${i + 1}`, `الرقم ${i + 1}`)}
              autoFocus={i === 0}
              className={cn("h-14 w-full min-w-0 rounded-md border border-line-strong text-center font-mono text-2xl font-semibold text-ink focus:border-tech focus:ring-2 focus:ring-tech/20 focus:outline-none", d && "border-tech/60 bg-sky-50/50")}
            />
          ))}
        </fieldset>
        {trustDays !== null && (
          <label className="mt-5 flex items-start gap-2.5 text-sm text-ink">
            <input type="checkbox" name="trust" defaultChecked className="mt-0.5 size-4 accent-tech" />
            <span>
              {tx(`Trust this browser for ${trustDays} days`, `الوثوق بهذا المتصفح لمدة ${trustDays} يوماً`)}
              <span className="block text-xs text-muted">{tx("You won't be asked for a code here unless something looks unusual. Don't use on shared computers.", "لن يُطلب منك رمز هنا ما لم يبدُ شيء غير اعتيادي. لا تستخدمه على أجهزة مشتركة.")}</span>
            </span>
          </label>
        )}
        <Button type="submit" variant="primary" loading={pending} disabled={digits.some((d) => !d) || terminal} className="mt-6 h-11 w-full">
          {tx("Verify and sign in", "تحقق وسجّل الدخول")}
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        <Link href="/admin/login" className="text-muted hover:text-ink">{tx("Use another account", "استخدام حساب آخر")}</Link>
        <button
          type="button"
          disabled={cooldown > 0 || resending || terminal}
          onClick={() =>
            startResend(async () => {
              const r = await resendOtpAction();
              setResendState(r);
              setCooldown(r?.retryAfter ?? 60);
            })
          }
          className="font-semibold text-tech-600 hover:text-tech-700 disabled:cursor-not-allowed disabled:text-muted"
        >
          {cooldown > 0 ? tx(`Resend code in ${cooldown}s`, `إعادة الإرسال بعد ${cooldown} ث`) : tx("Resend code", "إعادة إرسال الرمز")}
        </button>
      </div>
    </div>
  );
}

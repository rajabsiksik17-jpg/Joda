"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button, inputCls } from "@/components/admin/ui";
import { useAdminI18n } from "@/components/admin/i18n";
import { cn } from "@/lib/cn";
import { loginAction, type AuthState } from "../actions";
import { authErrorMessage } from "../auth-messages";

export function LoginForm() {
  const { tx } = useAdminI18n();
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, null);
  const [show, setShow] = useState(false);
  const message = authErrorMessage(state?.error, tx, state ?? undefined);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">{tx("Sign in", "تسجيل الدخول")}</h1>
      <p className="mt-2 text-sm text-muted">{tx("Use your administrator account. A verification code will be e-mailed to you.", "استخدم حساب المسؤول الخاص بك. سيتم إرسال رمز تحقق إلى بريدك الإلكتروني.")}</p>
      {message && (
        <div role="alert" className="mt-6 flex gap-2.5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {message}
        </div>
      )}
      <form action={action} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink">{tx("Email", "البريد الإلكتروني")}</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input id="email" name="email" type="email" required autoComplete="username" dir="ltr" maxLength={200} className={cn(inputCls, "h-11 ps-9 rtl:text-right")} autoFocus />
          </div>
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink">{tx("Password", "كلمة المرور")}</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input id="password" name="password" type={show ? "text" : "password"} required autoComplete="current-password" maxLength={200} className={cn(inputCls, "h-11 ps-9 pe-10")} />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute top-1/2 end-2 grid size-8 -translate-y-1/2 place-items-center rounded text-muted hover:text-ink" aria-label={show ? tx("Hide password", "إخفاء كلمة المرور") : tx("Show password", "إظهار كلمة المرور")}>
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" variant="primary" loading={pending} className="h-11 w-full">
          {tx("Continue", "متابعة")}
        </Button>
      </form>
    </div>
  );
}

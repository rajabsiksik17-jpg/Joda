"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, Building2, CheckCircle2, Layers, LoaderCircle, Mail, PenLine, Phone, User } from "lucide-react";
import { submitContact, type ContactState } from "@/app/[locale]/contact-action";
import { validateContact, type ContactErrorKey } from "@/lib/contact-rules";
import type { Locale } from "@/lib/i18n/config";
import type { SiteDictionary } from "@/lib/i18n/site-dictionary";
import { cn } from "@/lib/cn";

type Props = { locale: Locale; token: string; services: string[]; defaultService?: string; labels: SiteDictionary["form"]; privacyHref: string | null };

const FIELDS = ["name", "email", "phone", "company", "service", "subject", "message", "consent"] as const;

export function ContactForm({ locale, token, services, defaultService = "", labels, privacyHref }: Props) {
  const [state, action, pending] = useActionState<ContactState, FormData>(submitContact, { status: "idle" });
  const [clientErrors, setClientErrors] = useState<Partial<Record<string, ContactErrorKey>>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const [formKey, setFormKey] = useState(0);
  const [dismissed, setDismissed] = useState<ContactState | null>(null);

  const serverErrors = state.status === "error" ? state.fieldErrors ?? {} : {};
  const errors = { ...serverErrors, ...clientErrors };

  useEffect(() => {
    if (state.status === "success" || (state.status === "error" && state.code !== "invalid")) statusRef.current?.focus();
    if (state.status === "error" && state.code === "invalid") {
      const first = FIELDS.find((f) => state.fieldErrors?.[f]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    }
  }, [state]);

  // Client-side pre-validation for instant feedback; the server validates again.
  const validate = (e: React.FormEvent<HTMLFormElement>) => {
    const fd = new FormData(e.currentTarget);
    const s = (k: string) => String(fd.get(k) ?? "");
    const errs = validateContact({ name: s("name"), email: s("email"), phone: s("phone"), company: s("company"), service: s("service"), subject: s("subject"), message: s("message"), consent: fd.get("consent") === "on" });
    if (Object.keys(errs).length === 0) {
      setClientErrors({});
      return;
    }
    e.preventDefault();
    setClientErrors(errs);
    const first = FIELDS.find((f) => errs[f]);
    if (first) e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  const clearError = (name: string) => {
    if (clientErrors[name]) setClientErrors(({ [name]: _removed, ...rest }) => rest);
  };

  if (state.status === "success" && state !== dismissed) {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="flex flex-col items-start border border-tech/30 bg-sky-50 p-8 outline-none sm:p-10">
        <CheckCircle2 className="size-10 text-tech-600" aria-hidden />
        <h3 className="heading mt-5 text-2xl text-ink">{labels.successTitle}</h3>
        <p className="mt-2 text-body">{labels.successText}</p>
        <button type="button" className="btn btn-outline mt-8" onClick={() => { setDismissed(state); setFormKey((k) => k + 1); }}>{labels.sendAnother}</button>
      </div>
    );
  }

  const field = (name: string) => ({
    name,
    id: `cf-${name}`,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `cf-${name}-error` : undefined,
    onChange: () => clearError(name),
    className: "field",
  });
  const err = (name: string) =>
    errors[name] ? (
      <p id={`cf-${name}-error`} className="mt-1.5 flex items-center gap-1.5 text-sm text-red-700">
        <AlertCircle className="size-3.5" aria-hidden />
        {labels[errors[name] as ContactErrorKey]}
      </p>
    ) : null;
  const label = (name: string, text: string, required = false) => (
    <label htmlFor={`cf-${name}`} className="mb-2 block text-[0.9rem] font-semibold text-ink">
      {text}
      {required && <span className="text-tech-600" aria-hidden> *</span>}
    </label>
  );

  return (
    <form key={formKey} ref={formRef} action={action} onSubmit={validate} noValidate className="grid gap-x-5 gap-y-5 sm:grid-cols-2 sm:gap-y-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="token" value={token} />
      {/* Honeypot — hidden from people and assistive technology. Clipped in place (an off-screen
          offset would create horizontal scrolling in right-to-left layouts). */}
      <div className="pointer-events-none absolute start-0 top-0 h-px w-px overflow-hidden opacity-0 [clip:rect(0,0,0,0)]" aria-hidden="true">
        <label htmlFor="cf-website">Website</label>
        <input id="cf-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state.status === "error" && state.code !== "invalid" && (
        <div ref={statusRef} tabIndex={-1} role="alert" className="flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-red-800 outline-none sm:col-span-2">
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
          {state.code === "rate_limited" ? labels.errorRateLimit : labels.errorGeneric}
        </div>
      )}

      <div>
        {label("name", labels.name, true)}
        <div className="field-wrap"><User className="field-icon" aria-hidden /><input {...field("name")} type="text" autoComplete="name" required maxLength={120} /></div>
        {err("name")}
      </div>
      <div>
        {label("email", labels.email, true)}
        <div className="field-wrap"><Mail className="field-icon" aria-hidden /><input {...field("email")} type="email" autoComplete="email" required maxLength={200} dir="ltr" className="field rtl:text-right" /></div>
        {err("email")}
      </div>
      <div>
        {label("phone", labels.phone)}
        <div className="field-wrap"><Phone className="field-icon" aria-hidden /><input {...field("phone")} type="tel" inputMode="tel" autoComplete="tel" maxLength={40} dir="ltr" className="field rtl:text-right" /></div>
        {err("phone")}
      </div>
      <div>
        {label("company", labels.company)}
        <div className="field-wrap"><Building2 className="field-icon" aria-hidden /><input {...field("company")} type="text" autoComplete="organization" maxLength={160} /></div>
        {err("company")}
      </div>
      {services.length > 0 && (
        <div className="sm:col-span-2">
          {label("service", labels.service)}
          <div className="field-wrap"><Layers className="field-icon" aria-hidden /><select {...field("service")} defaultValue={defaultService}>
            <option value="">{labels.servicePlaceholder}</option>
            {services.map((s) => <option key={s} value={s}>{s}</option>)}
          </select></div>
          {err("service")}
        </div>
      )}
      <div className="sm:col-span-2">
        {label("subject", labels.subject)}
        <div className="field-wrap"><PenLine className="field-icon" aria-hidden /><input {...field("subject")} type="text" maxLength={200} /></div>
        {err("subject")}
      </div>
      <div className="sm:col-span-2">
        {label("message", labels.message, true)}
        <textarea {...field("message")} required rows={6} maxLength={5000} />
        {err("message")}
      </div>
      <div className="sm:col-span-2">
        <label className="flex items-start gap-3 text-sm leading-relaxed text-body">
          <input name="consent" type="checkbox" required aria-invalid={errors.consent ? true : undefined} aria-describedby={errors.consent ? "cf-consent-error" : undefined} onChange={() => clearError("consent")} className="mt-1 size-4 shrink-0 accent-tech" />
          <span>
            {labels.consent}{" "}
            {privacyHref ? <Link href={privacyHref} className="font-semibold text-tech-700 underline underline-offset-2" target="_blank">{labels.privacyPolicy}</Link> : labels.privacyPolicy}.
          </span>
        </label>
        {err("consent")}
      </div>
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-primary w-full disabled:cursor-wait disabled:opacity-80 sm:w-auto sm:min-w-56">
          {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
          {pending ? labels.sending : labels.submit}
          {!pending && <ArrowRight className="btn-arrow size-4" aria-hidden />}
        </button>
      </div>
    </form>
  );
}

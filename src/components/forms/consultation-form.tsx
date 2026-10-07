"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, LoaderCircle, Mail, MessageCircle, PhoneCall } from "lucide-react";
import { parsePhoneNumberFromString } from "libphonenumber-js/min";
import { submitConsultation, type ConsultationState } from "@/app/[locale]/consultation-action";
import { validateConsultation, type ConsultationErrorKey } from "@/lib/consultation/rules";
import type { CountryOption } from "@/lib/consultation/countries";
import type { Locale } from "@/lib/i18n/config";
import type { SiteDictionary } from "@/lib/i18n/site-dictionary";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { Combobox, type ComboOption } from "./combobox";

/** SVG flag (emoji flags do not render on Windows). Loaded lazily, one small file per country. */
function Flag({ code }: { code: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/flags/${code.toLowerCase()}.svg`} alt="" width={20} height={15} loading="lazy" decoding="async" className="h-[15px] w-5 shrink-0 rounded-[2px] object-cover shadow-[0_0_0_1px_rgb(0_0_0/0.08)]" />;
}

export type ConsultService = { id: string; title: string; category: string; icon: string };

type Props = {
  locale: Locale;
  token: string;
  labels: SiteDictionary["consult"];
  formLabels: SiteDictionary["form"];
  countries: { preferred: CountryOption[]; all: CountryOption[] };
  initialCountry: string;
  /** True when the server already knows the country from edge geo headers */
  geoKnown: boolean;
  services: ConsultService[];
  defaultServiceId: string;
  allowWhatsApp: boolean;
  privacyHref: string | null;
  sourcePage: string;
};

const noopSubscribe = () => () => {};
const TZ_COUNTRY: Record<string, string> = {
  "Asia/Amman": "JO", "Asia/Riyadh": "SA", "Asia/Dubai": "AE", "Asia/Kuwait": "KW", "Asia/Qatar": "QA", "Asia/Bahrain": "BH", "Asia/Muscat": "OM",
  "Asia/Gaza": "PS", "Asia/Hebron": "PS", "Africa/Cairo": "EG", "Asia/Baghdad": "IQ", "Asia/Beirut": "LB", "Asia/Damascus": "SY", "Africa/Khartoum": "SD",
  "Asia/Aden": "YE", "Africa/Tripoli": "LY", "Africa/Tunis": "TN", "Africa/Algiers": "DZ", "Africa/Casablanca": "MA", "Europe/Istanbul": "TR",
  "Europe/London": "GB", "Europe/Paris": "FR", "Europe/Berlin": "DE", "America/New_York": "US", "America/Chicago": "US", "America/Los_Angeles": "US", "America/Toronto": "CA",
};
function countryFromTimeZone() {
  try {
    return TZ_COUNTRY[Intl.DateTimeFormat().resolvedOptions().timeZone] ?? null;
  } catch {
    return null;
  }
}

const ORDER = ["name", "company", "email", "phoneNumber", "country", "serviceId", "preferredContact", "message", "consent"] as const;

export function ConsultationForm({ locale, token, labels, formLabels, countries, initialCountry, geoKnown, services, defaultServiceId, allowWhatsApp, privacyHref, sourcePage }: Props) {
  const [state, action, pending] = useActionState<ConsultationState, FormData>(submitConsultation, { status: "idle" });
  const [clientErrors, setClientErrors] = useState<Partial<Record<string, ConsultationErrorKey>>>({});
  // Without geo headers, the browser time zone is a privacy-friendly hint (no location permission needed).
  const tzCountry = useSyncExternalStore(noopSubscribe, () => (geoKnown ? null : countryFromTimeZone()), () => null);
  const detected = tzCountry && countries.all.some((c) => c.code === tzCountry) ? tzCountry : initialCountry;
  const [pickedPhoneCountry, setPhoneCountry] = useState<string | null>(null);
  const [pickedCountry, setCountry] = useState<string | null>(null);
  const phoneCountry = pickedPhoneCountry ?? detected;
  const country = pickedCountry ?? phoneCountry;
  const [serviceId, setServiceId] = useState(defaultServiceId);
  const [method, setMethod] = useState("email");
  const [formKey, setFormKey] = useState(0);
  const [dismissed, setDismissed] = useState<ConsultationState | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const serverErrors = state.status === "error" ? state.fieldErrors ?? {} : {};
  const errors: Partial<Record<string, ConsultationErrorKey>> = { ...serverErrors, ...clientErrors };

  useEffect(() => {
    if (state.status === "success" || (state.status === "error" && state.code !== "invalid")) statusRef.current?.focus();
    if (state.status === "error" && state.code === "invalid") focusFirst(state.fieldErrors ?? {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const focusFirst = (errs: Partial<Record<string, unknown>>) => {
    const first = ORDER.find((f) => errs[f]);
    if (first) formRef.current?.querySelector<HTMLElement>(`#cq-${first}`)?.focus();
  };

  const clearError = (name: string) => {
    if (clientErrors[name]) setClientErrors(({ [name]: _removed, ...rest }) => rest);
  };

  const pickPhoneCountry = (code: string) => {
    setPhoneCountry(code);
    clearError("phoneNumber");
  };

  // Typing an international number (+44…) switches the calling code automatically.
  const onPhoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    if (!v.startsWith("+") && !v.startsWith("00")) return;
    const parsed = parsePhoneNumberFromString(v.replace(/^00/, "+"));
    if (parsed?.country && parsed.country !== phoneCountry) pickPhoneCountry(parsed.country);
  };

  const validate = (e: React.FormEvent<HTMLFormElement>) => {
    const fd = new FormData(e.currentTarget);
    const s = (k: string) => String(fd.get(k) ?? "");
    const errs = validateConsultation({
      name: s("name"), company: s("company"), email: s("email"), phoneCountry, phoneNumber: s("phoneNumber"), country,
      serviceId, preferredContact: method, message: s("message"), consent: fd.get("consent") === "on",
    });
    if (Object.keys(errs).length === 0) {
      setClientErrors({});
      return;
    }
    e.preventDefault();
    setClientErrors(errs);
    focusFirst(errs);
  };

  if (state.status === "success" && state !== dismissed) {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="flex animate-fade-up flex-col items-start border border-tech/30 bg-sky-50 p-8 outline-none sm:p-12">
        <span className="grid size-14 place-items-center rounded-full bg-tech-600 text-white"><CheckCircle2 className="size-7" aria-hidden /></span>
        <h3 className="heading mt-6 text-2xl text-ink">{labels.successTitle}</h3>
        <p className="mt-2 max-w-lg text-body">{labels.successText}</p>
        <button type="button" className="btn btn-outline mt-8" onClick={() => { setDismissed(state); setFormKey((k) => k + 1); }}>{labels.sendAnother}</button>
      </div>
    );
  }

  const errText = (k: ConsultationErrorKey) => (k === "invalidCountry" ? labels.invalidCountry : formLabels[k]);
  const err = (name: string) =>
    errors[name] ? (
      <p id={`cq-${name}-error`} className="mt-1.5 flex items-center gap-1.5 text-sm text-red-700">
        <AlertCircle className="size-3.5 shrink-0" aria-hidden />
        {errText(errors[name]!)}
      </p>
    ) : null;
  const inputCls = (name: string) =>
    cn(
      "w-full border bg-white px-4 text-ink transition-colors placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-tech/25",
      errors[name] ? "border-red-600 focus:border-red-600" : "border-line-strong focus:border-tech",
    );
  const a11y = (name: string) => ({ id: `cq-${name}`, "aria-invalid": errors[name] ? true : undefined, "aria-describedby": errors[name] ? `cq-${name}-error` : undefined });
  const label = (name: string, text: string, required = false, htmlFor = `cq-${name}`) => (
    <label htmlFor={htmlFor} className="mb-2 flex items-baseline gap-1 text-sm font-semibold text-ink">
      {text}
      {required ? <span className="text-tech-600" aria-hidden>*</span> : <span className="text-xs font-normal text-muted">({labels.optional})</span>}
    </label>
  );

  const countryOptions = (withDial: boolean): ComboOption[] => [
    ...countries.preferred.map((c) => ({ value: c.code, label: c.name, hint: withDial ? c.dial : undefined, group: labels.suggested, leading: <Flag code={c.code} />, keywords: `${c.code} ${c.dial}` })),
    ...countries.all.map((c) => ({ value: c.code, label: c.name, hint: withDial ? c.dial : undefined, group: countries.preferred.length ? labels.allCountries : undefined, leading: <Flag code={c.code} />, keywords: `${c.code} ${c.dial}` })),
  ];
  const dialOptions = countryOptions(true);
  const serviceOptions: ComboOption[] = [
    { value: "", label: labels.general, leading: <span className="grid size-7 place-items-center rounded-sm bg-surface text-muted" aria-hidden>?</span> },
    ...services.map((s) => ({ value: s.id, label: s.title, group: s.category || undefined, leading: <span className="grid size-7 shrink-0 place-items-center rounded-sm bg-sky-50 text-tech-600" aria-hidden><Icon name={s.icon} className="size-4" /></span> })),
  ];
  const phoneMeta = [...countries.preferred, ...countries.all].find((c) => c.code === phoneCountry);

  const methods = [
    { value: "email", label: labels.viaEmail, icon: Mail },
    { value: "phone", label: labels.viaPhone, icon: PhoneCall },
    ...(allowWhatsApp ? [{ value: "whatsapp", label: labels.viaWhatsApp, icon: MessageCircle }] : []),
  ];

  return (
    <form key={formKey} ref={formRef} action={action} onSubmit={validate} noValidate className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="sourcePage" value={sourcePage} />
      <input type="hidden" name="phoneCountry" value={phoneCountry} />
      <input type="hidden" name="preferredContact" value={method} />
      <div className="pointer-events-none absolute start-0 top-0 h-px w-px overflow-hidden opacity-0 [clip:rect(0,0,0,0)]" aria-hidden="true">
        <label htmlFor="cq-website">Website</label>
        <input id="cq-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state.status === "error" && state.code !== "invalid" && (
        <div ref={statusRef} tabIndex={-1} role="alert" className="flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-red-800 outline-none sm:col-span-2">
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
          {state.code === "rate_limited" ? formLabels.errorRateLimit : formLabels.errorGeneric}
        </div>
      )}

      <div>
        {label("name", labels.name, true)}
        <input {...a11y("name")} name="name" type="text" autoComplete="name" required maxLength={120} onChange={() => clearError("name")} className={cn(inputCls("name"), "h-12")} />
        {err("name")}
      </div>
      <div>
        {label("company", labels.company)}
        <input {...a11y("company")} name="company" type="text" autoComplete="organization" maxLength={160} onChange={() => clearError("company")} className={cn(inputCls("company"), "h-12")} />
        {err("company")}
      </div>
      <div>
        {label("email", labels.email, true)}
        <input {...a11y("email")} name="email" type="email" autoComplete="email" required maxLength={200} dir="ltr" onChange={() => clearError("email")} className={cn(inputCls("email"), "h-12 rtl:text-right")} />
        {err("email")}
      </div>
      <div>
        {label("phoneNumber", labels.phone, true)}
        {/* Calling code + number always read left-to-right, also in Arabic. */}
        <div className="flex" dir="ltr">
          <div className="w-[8.25rem] shrink-0">
            <Combobox
              id="cq-phoneCountry"
              label={labels.countryCode}
              options={dialOptions}
              value={phoneCountry}
              onChange={pickPhoneCountry}
              placeholder="+"
              searchPlaceholder={labels.search}
              noResults={labels.noResults}
              invalid={errors.phoneNumber === "invalidCountry"}
              className="gap-2 border-e-0 px-2.5"
              panelClassName="w-[min(20rem,calc(100vw-2rem))] right-auto"
              panelDir={locale === "ar" ? "rtl" : "ltr"}
              renderValue={() => (
                <>
                  {phoneMeta && <Flag code={phoneMeta.code} />}
                  <span className="text-sm font-medium">{phoneMeta?.dial}</span>
                </>
              )}
            />
          </div>
          <input
            {...a11y("phoneNumber")}
            aria-describedby={errors.phoneNumber ? "cq-phoneNumber-error" : "cq-phone-hint"}
            name="phoneNumber"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            required
            maxLength={30}
            onChange={() => clearError("phoneNumber")}
            onBlur={onPhoneBlur}
            className={cn(inputCls("phoneNumber"), "h-12 min-w-0 flex-1")}
          />
        </div>
        {err("phoneNumber") ?? <p id="cq-phone-hint" className="mt-1.5 text-xs text-muted">{labels.phoneHint}</p>}
      </div>
      <div>
        {label("country", labels.country, false, "cq-country")}
        <Combobox
          id="cq-country"
          name="country"
          options={countryOptions(false)}
          value={country}
          onChange={(v) => { setCountry(v); clearError("country"); }}
          placeholder={labels.countryPlaceholder}
          searchPlaceholder={labels.search}
          noResults={labels.noResults}
          invalid={!!errors.country}
          describedBy={errors.country ? "cq-country-error" : undefined}
        />
        {err("country")}
      </div>
      <div>
        {label("serviceId", labels.interest, false, "cq-serviceId")}
        <Combobox
          id="cq-serviceId"
          name="serviceId"
          options={serviceOptions}
          value={serviceId}
          onChange={setServiceId}
          placeholder={labels.interestPlaceholder}
          searchPlaceholder={labels.search}
          noResults={labels.noResults}
        />
      </div>

      <fieldset className="sm:col-span-2">
        <legend className="mb-3 text-sm font-semibold text-ink">{labels.preferred}</legend>
        <div className={cn("grid gap-3", methods.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2")} role="radiogroup">
          {methods.map((m) => {
            const on = method === m.value;
            return (
              <label key={m.value} className={cn("group relative flex cursor-pointer items-center gap-3 border px-4 py-3.5 transition-all duration-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-tech/40", on ? "border-navy bg-navy text-white" : "border-line-strong bg-white text-ink hover:border-ink/40")}>
                <input type="radio" name="preferredContactChoice" value={m.value} checked={on} onChange={() => setMethod(m.value)} className="sr-only" id={m.value === "email" ? "cq-preferredContact" : undefined} />
                <span className={cn("grid size-9 place-items-center rounded-full transition-colors", on ? "bg-tech-600 text-white" : "bg-sky-50 text-tech-600")}><m.icon className="size-4" aria-hidden /></span>
                <span className="text-sm font-semibold">{m.label}</span>
              </label>
            );
          })}
        </div>
        {err("preferredContact")}
      </fieldset>

      <div className="sm:col-span-2">
        {label("message", labels.message, true)}
        <textarea {...a11y("message")} aria-describedby={errors.message ? "cq-message-error" : "cq-message-hint"} name="message" required rows={5} maxLength={5000} onChange={() => clearError("message")} className={cn(inputCls("message"), "resize-y py-3")} />
        {err("message") ?? <p id="cq-message-hint" className="mt-1.5 text-xs text-muted">{labels.messageHint}</p>}
      </div>
      <div className="sm:col-span-2">
        <label className="flex items-start gap-3 text-sm leading-relaxed text-body">
          <input id="cq-consent" name="consent" type="checkbox" required aria-invalid={errors.consent ? true : undefined} aria-describedby={errors.consent ? "cq-consent-error" : undefined} onChange={() => clearError("consent")} className="mt-1 size-4 shrink-0 accent-tech" />
          <span>
            {formLabels.consent}{" "}
            {privacyHref ? <Link href={privacyHref} className="font-semibold text-tech-700 underline underline-offset-2" target="_blank">{formLabels.privacyPolicy}</Link> : formLabels.privacyPolicy}.
          </span>
        </label>
        {err("consent")}
      </div>
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-primary w-full disabled:cursor-wait disabled:opacity-80 sm:w-auto sm:min-w-64">
          {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
          {pending ? labels.sending : labels.submit}
          {!pending && <ArrowRight className="btn-arrow size-4" aria-hidden />}
        </button>
      </div>
    </form>
  );
}

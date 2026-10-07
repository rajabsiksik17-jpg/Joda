"use client";

import Script from "next/script";
import { useEffect, useState, useSyncExternalStore } from "react";

const CONSENT_COOKIE = "qe_consent";
const EVENT = "qe:open-consent";
const CHANGE = "qe:consent-changed";
type Choice = "granted" | "denied" | null;

function subscribe(cb: () => void) {
  window.addEventListener(CHANGE, cb);
  return () => window.removeEventListener(CHANGE, cb);
}

function readChoice(): Choice {
  const m = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=(granted|denied)`));
  return (m?.[1] as Choice) ?? null;
}

function writeChoice(choice: "granted" | "denied") {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${choice}; Path=/; Max-Age=${60 * 60 * 24 * 182}; SameSite=Lax${secure}`;
}

type Props = {
  provider: "ga4" | "plausible";
  ga4Id: string;
  plausibleDomain: string;
  labels: { title: string; text: string; accept: string; decline: string; policyLabel: string; policyHref: string };
};

/**
 * Analytics are loaded only after explicit consent. Without a configured provider this component
 * is not rendered at all, so no banner is shown and nothing is tracked.
 */
export function ConsentManager({ provider, ga4Id, plausibleDomain, labels }: Props) {
  // "pending" on the server and during hydration, then the stored cookie value.
  const choice = useSyncExternalStore<Choice | "pending">(subscribe, readChoice, () => "pending");
  const [reopened, setReopened] = useState(false);
  useEffect(() => {
    const onOpen = () => setReopened(true);
    window.addEventListener(EVENT, onOpen);
    return () => window.removeEventListener(EVENT, onOpen);
  }, []);
  const open = choice === null || (reopened && choice !== "pending");

  const decide = (c: "granted" | "denied") => {
    const revoked = choice === "granted" && c === "denied";
    writeChoice(c);
    setReopened(false);
    window.dispatchEvent(new Event(CHANGE));
    // Unloading an analytics script requires a reload once consent is withdrawn.
    if (revoked) location.reload();
  };

  return (
    <>
      {choice === "granted" && provider === "ga4" && ga4Id && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(ga4Id)},{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {choice === "granted" && provider === "plausible" && plausibleDomain && (
        <Script src="https://plausible.io/js/script.js" data-domain={plausibleDomain} strategy="afterInteractive" />
      )}
      {open && (
        <div role="dialog" aria-modal="false" aria-labelledby="consent-title" className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-xl animate-fade-up border border-line bg-white p-5 shadow-lift sm:inset-x-auto sm:bottom-6 sm:end-6 sm:p-6">
          <p id="consent-title" className="heading text-lg text-ink">{labels.title}</p>
          <p className="mt-2 text-sm leading-relaxed text-body">
            {labels.text}{" "}
            <a href={labels.policyHref} className="text-tech-700 underline underline-offset-2">{labels.policyLabel}</a>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary !min-h-10 flex-1" onClick={() => decide("granted")}>{labels.accept}</button>
            <button type="button" className="btn btn-outline !min-h-10 flex-1" onClick={() => decide("denied")}>{labels.decline}</button>
          </div>
        </div>
      )}
    </>
  );
}

export function CookieSettingsButton({ label }: { label: string }) {
  return (
    <button type="button" className="hover:text-white" onClick={() => window.dispatchEvent(new Event(EVENT))}>
      {label}
    </button>
  );
}

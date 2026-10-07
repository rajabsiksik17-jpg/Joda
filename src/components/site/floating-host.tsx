import type { Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/i18n/localized";
import { getSiteDictionary } from "@/lib/i18n/site-dictionary";
import { getPublishedPage } from "@/lib/content/pages";
import { getSiteChrome } from "@/lib/content/site";
import { channelHref } from "@/lib/links";
import { SOCIAL_PLATFORMS } from "@/lib/social-platforms";
import { getSetting } from "@/lib/settings";
import { FloatingContact, FloatingWhatsApp, type FloatingAction } from "./floating-actions";

/** Floating contact speed-dial + WhatsApp button, driven by the “Floating buttons” settings. */
export async function FloatingHost({ locale }: { locale: Locale }) {
  const [floating, chrome, consultationPage] = await Promise.all([getSetting("floating"), getSiteChrome(), getPublishedPage("consultation")]);
  const dict = getSiteDictionary(locale);

  const actions: FloatingAction[] = [];
  if (floating.contactEnabled) {
    if (floating.contactShowConsultation && consultationPage) actions.push({ id: "consultation", kind: "consultation", label: dict.consult.submit, href: `/${locale}/consultation` });
    const phone = chrome.channels.find((c) => c.type === "PHONE" && c.isPrimary) ?? chrome.channels.find((c) => c.type === "PHONE");
    if (floating.contactShowPhone && phone) actions.push({ id: phone.id, kind: "phone", label: dict.phone, href: channelHref(phone.type, phone.value, phone.href) ?? "#" });
    const email = chrome.channels.find((c) => c.type === "EMAIL" && c.isPrimary) ?? chrome.channels.find((c) => c.type === "EMAIL");
    if (floating.contactShowEmail && email) actions.push({ id: email.id, kind: "email", label: dict.email, href: channelHref(email.type, email.value, email.href) ?? "#" });
    if (floating.contactShowSocial) {
      for (const s of chrome.socials) {
        // WhatsApp has its own button when that one is enabled.
        if (s.platform === "whatsapp" && floating.whatsappEnabled) continue;
        actions.push({ id: s.id, kind: "social", platform: s.platform, label: s.label || SOCIAL_PLATFORMS.find((p) => p.value === s.platform)?.label || s.platform, href: s.url, external: true });
      }
    }
  }

  const waDigits = floating.whatsappNumber.replace(/\D/g, "");
  const waText = tr(floating.whatsappMessage, locale);
  const waHref = floating.whatsappEnabled && waDigits.length >= 8 ? `https://wa.me/${waDigits}${waText ? `?text=${encodeURIComponent(waText)}` : ""}` : null;
  const contactSide = floating.whatsappSide === "start" ? "end" : "start";

  return (
    <>
      {actions.length > 0 && (
        <FloatingContact actions={actions} side={contactSide} show={{ mobile: floating.contactMobile, desktop: floating.contactDesktop }} labels={{ open: dict.contactOptions, close: dict.close }} />
      )}
      {waHref && <FloatingWhatsApp href={waHref} side={floating.whatsappSide} show={{ mobile: floating.whatsappMobile, desktop: floating.whatsappDesktop }} label={dict.contactWhatsApp} />}
    </>
  );
}

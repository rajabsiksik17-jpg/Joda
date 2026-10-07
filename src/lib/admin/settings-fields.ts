import type { Permission } from "../auth/permissions";
import { bi, type Bi, type Field } from "../sections/fields";
import type { SettingKey } from "../settings-schema";

const opt = (value: string, en: string, ar: string) => ({ value, label: bi(en, ar) });

export type SettingsGroup = { key: Exclude<SettingKey, "email" | "google">; title: Bi; description: Bi; permission: Permission; fields: Field[] };

export const SETTINGS_GROUPS: Record<Exclude<SettingKey, "email" | "google">, SettingsGroup> = {
  general: {
    key: "general",
    title: bi("General", "عام"),
    description: bi("Company name and tagline used across the website and in search results.", "اسم الشركة والشعار اللفظي المستخدمان في الموقع ونتائج البحث."),
    permission: "settings.edit",
    fields: [
      { type: "text", name: "siteName", label: bi("Website name", "اسم الموقع"), required: true, max: 120 },
      { type: "text", name: "legalName", label: bi("Legal company name", "الاسم القانوني للشركة"), max: 160 },
      { type: "text", name: "tagline", label: bi("Tagline", "الشعار اللفظي"), max: 200 },
      { type: "select", name: "defaultLocale", label: bi("Default language for new visitors", "اللغة الافتراضية للزوار الجدد"), options: [opt("ar", "Arabic", "العربية"), opt("en", "English", "الإنجليزية")] },
    ],
  },
  brand: {
    key: "brand",
    title: bi("Brand assets", "أصول الهوية"),
    description: bi("Upload official logo variants only — logos are never recoloured or altered. Leave empty to use the official files shipped with the site.", "ارفع النسخ الرسمية للشعار فقط — لا يتم تعديل الشعار أو تغيير ألوانه. اتركها فارغة لاستخدام الملفات الرسمية المرفقة بالموقع."),
    permission: "settings.edit",
    fields: [
      { type: "media", name: "logoColorId", label: bi("Full-colour logo (light backgrounds)", "الشعار الملون (للخلفيات الفاتحة)"), accept: "image" },
      { type: "media", name: "logoWhiteId", label: bi("White logo (dark backgrounds)", "الشعار الأبيض (للخلفيات الداكنة)"), accept: "image" },
      { type: "media", name: "iconId", label: bi("Icon only (network globe)", "الأيقونة فقط (الكرة الشبكية)"), accept: "image" },
      { type: "media", name: "faviconId", label: bi("Favicon (square PNG, 512×512)", "أيقونة المتصفح (PNG مربعة 512×512)"), accept: "image" },
      { type: "media", name: "ogImageId", label: bi("Default social sharing image (1200×630)", "صورة المشاركة الافتراضية (1200×630)"), accept: "image" },
    ],
  },
  header: {
    key: "header",
    title: bi("Header", "الرأس"),
    description: bi("The call-to-action button in the main navigation.", "زر الدعوة في التنقل الرئيسي."),
    permission: "settings.edit",
    fields: [
      { type: "boolean", name: "showCta", label: bi("Show header button", "إظهار زر الرأس") },
      { type: "text", name: "ctaLabel", label: bi("Button label", "نص الزر"), max: 60 },
      { type: "text", name: "ctaHref", label: bi("Button link", "رابط الزر"), localized: false, format: "href", max: 500 },
    ],
  },
  footer: {
    key: "footer",
    title: bi("Footer", "التذييل"),
    description: bi("Footer text. The optional call-to-action strip appears above the footer when it has a title.", "نصوص التذييل. يظهر شريط الدعوة الاختياري أعلى التذييل عند إضافة عنوان له."),
    permission: "settings.edit",
    fields: [
      { type: "textarea", name: "about", label: bi("About text", "نبذة"), max: 600, rows: 3 },
      { type: "text", name: "signature", label: bi("Signature line (after the copyright)", "سطر التوقيع (بعد حقوق النشر)"), max: 200 },
      { type: "text", name: "ctaTitle", label: bi("CTA strip title (optional)", "عنوان شريط الدعوة (اختياري)"), max: 160 },
      { type: "text", name: "ctaLabel", label: bi("CTA button label", "نص زر الدعوة"), max: 60 },
      { type: "text", name: "ctaHref", label: bi("CTA button link", "رابط زر الدعوة"), localized: false, format: "href", max: 500 },
    ],
  },
  contact: {
    key: "contact",
    title: bi("Location, map & notifications", "الموقع والخريطة والإشعارات"),
    description: bi("Address, working hours, the map and who is notified of new enquiries.", "العنوان وساعات العمل والخريطة ومن يتلقى إشعارات الاستفسارات الجديدة."),
    permission: "contact.edit",
    fields: [
      { type: "text", name: "address", label: bi("Address", "العنوان"), max: 300 },
      { type: "textarea", name: "workingHours", label: bi("Working hours (optional)", "ساعات العمل (اختياري)"), max: 300, rows: 2 },
      { type: "boolean", name: "mapEnabled", label: bi("Show map", "إظهار الخريطة") },
      { type: "text", name: "mapQuery", label: bi("Map search (address or place name)", "البحث في الخريطة (عنوان أو اسم مكان)"), localized: false, max: 300, help: bi("Used when coordinates are empty.", "يُستخدم عند عدم إدخال الإحداثيات.") },
      { type: "number", name: "mapLat", label: bi("Latitude (optional)", "خط العرض (اختياري)"), min: -90, max: 90, step: 0.000001, width: "half" },
      { type: "number", name: "mapLng", label: bi("Longitude (optional)", "خط الطول (اختياري)"), min: -180, max: 180, step: 0.000001, width: "half" },
      { type: "number", name: "mapZoom", label: bi("Zoom (1–21)", "التكبير (1–21)"), min: 1, max: 21, width: "half" },
      { type: "text", name: "mapUrl", label: bi("“Open in Google Maps” link (optional)", "رابط «افتح في خرائط Google» (اختياري)"), localized: false, format: "url", max: 1000 },
      { type: "tags", name: "notifyEmails", label: bi("Notify these e-mails of new enquiries", "إشعار هذه العناوين بالاستفسارات الجديدة"), max: 10 },
      { type: "boolean", name: "autoReply", label: bi("Send an automatic confirmation to the visitor", "إرسال تأكيد تلقائي للزائر") },
    ],
  },
  consultation: {
    key: "consultation",
    title: bi("Consultation requests", "طلبات الاستشارة"),
    description: bi("Who is notified of new requests and how the request form behaves.", "من يتلقى إشعارات الطلبات الجديدة وكيف يعمل نموذج الطلب."),
    permission: "contact.edit",
    fields: [
      { type: "tags", name: "notifyEmails", label: bi("Notify these e-mails (empty = contact recipients)", "إشعار هذه العناوين (فارغ = مستلمو رسائل التواصل)"), max: 10 },
      { type: "boolean", name: "autoReply", label: bi("Send an automatic confirmation to the requester", "إرسال تأكيد تلقائي لصاحب الطلب") },
      { type: "text", name: "defaultCountry", label: bi("Default country code when the visitor's country is unknown (e.g. JO)", "رمز الدولة الافتراضي عند تعذّر معرفة دولة الزائر (مثل JO)"), localized: false, max: 2, width: "half" },
      { type: "tags", name: "preferredCountries", label: bi("Countries listed first (ISO codes, e.g. JO, SA, AE)", "الدول التي تظهر أولاً (رموز ISO مثل JO و SA و AE)"), max: 20 },
      { type: "boolean", name: "allowWhatsApp", label: bi("Offer WhatsApp as a preferred contact method", "إتاحة واتساب كوسيلة تواصل مفضلة") },
    ],
  },
  floating: {
    key: "floating",
    title: bi("Floating buttons", "الأزرار العائمة"),
    description: bi("The expandable contact button and the WhatsApp button shown on every page. Only configured channels appear.", "زر التواصل القابل للتوسيع وزر واتساب الظاهران في جميع الصفحات. تظهر القنوات المضافة فقط."),
    permission: "contact.edit",
    fields: [
      { type: "boolean", name: "contactEnabled", label: bi("Show the contact button", "إظهار زر التواصل") },
      { type: "boolean", name: "contactShowPhone", label: bi("Include phone", "تضمين الهاتف"), width: "half" },
      { type: "boolean", name: "contactShowEmail", label: bi("Include e-mail", "تضمين البريد"), width: "half" },
      { type: "boolean", name: "contactShowSocial", label: bi("Include social profiles", "تضمين حسابات التواصل الاجتماعي"), width: "half" },
      { type: "boolean", name: "contactShowConsultation", label: bi("Include “Request a consultation”", "تضمين «اطلب استشارة»"), width: "half" },
      { type: "boolean", name: "contactMobile", label: bi("Show on mobile", "إظهار على الجوال"), width: "half" },
      { type: "boolean", name: "contactDesktop", label: bi("Show on desktop", "إظهار على سطح المكتب"), width: "half" },
      { type: "boolean", name: "whatsappEnabled", label: bi("Show the WhatsApp button", "إظهار زر واتساب") },
      { type: "text", name: "whatsappNumber", label: bi("WhatsApp number in international format (e.g. +962 7X XXX XXXX)", "رقم واتساب بالصيغة الدولية (مثل ‎+962 7X XXX XXXX)"), localized: false, max: 24 },
      { type: "textarea", name: "whatsappMessage", label: bi("Pre-filled message (optional)", "رسالة معبأة مسبقاً (اختياري)"), max: 300, rows: 2 },
      { type: "select", name: "whatsappSide", label: bi("WhatsApp button side (the contact button uses the other side)", "جهة زر واتساب (يستخدم زر التواصل الجهة الأخرى)"), options: [opt("start", "Start (right in Arabic, left in English)", "البداية (يمين بالعربية ويسار بالإنجليزية)"), opt("end", "End (left in Arabic, right in English)", "النهاية (يسار بالعربية ويمين بالإنجليزية)")] },
      { type: "boolean", name: "whatsappMobile", label: bi("Show on mobile", "إظهار على الجوال"), width: "half" },
      { type: "boolean", name: "whatsappDesktop", label: bi("Show on desktop", "إظهار على سطح المكتب"), width: "half" },
    ],
  },
  seo: {
    key: "seo",
    title: bi("Search engines", "محركات البحث"),
    description: bi("Defaults for titles and descriptions, and search console verification.", "الإعدادات الافتراضية للعناوين والأوصاف والتحقق من أدوات مشرفي المواقع."),
    permission: "seo.edit",
    fields: [
      { type: "text", name: "titleTemplate", label: bi("Title template (%s is replaced by the page title)", "قالب العنوان (يُستبدل ‎%s بعنوان الصفحة)"), max: 120 },
      { type: "textarea", name: "defaultDescription", label: bi("Default meta description", "وصف الميتا الافتراضي"), max: 320, rows: 3 },
      { type: "boolean", name: "allowIndexing", label: bi("Allow search engines to index the website", "السماح لمحركات البحث بأرشفة الموقع") },
      { type: "text", name: "twitterHandle", label: bi("X (Twitter) handle", "حساب X"), localized: false, max: 50, width: "half" },
      { type: "text", name: "googleVerification", label: bi("Google Search Console verification code", "رمز التحقق من Google Search Console"), localized: false, max: 200 },
      { type: "text", name: "bingVerification", label: bi("Bing Webmaster verification code", "رمز التحقق من Bing Webmaster"), localized: false, max: 200 },
    ],
  },
  analytics: {
    key: "analytics",
    title: bi("Analytics", "التحليلات"),
    description: bi("Optional. When enabled, visitors are asked for consent before any analytics script loads.", "اختياري. عند التفعيل، يُطلب من الزوار الموافقة قبل تحميل أي نص تحليلي."),
    permission: "settings.edit",
    fields: [
      { type: "select", name: "provider", label: bi("Provider", "المزوّد"), options: [opt("none", "None (no tracking)", "بدون (لا تتبع)"), opt("ga4", "Google Analytics 4", "Google Analytics 4"), opt("plausible", "Plausible", "Plausible")] },
      { type: "text", name: "ga4MeasurementId", label: bi("GA4 measurement ID (G-XXXXXXX)", "معرّف القياس GA4 ‏(G-XXXXXXX)"), localized: false, max: 30, width: "half" },
      { type: "text", name: "plausibleDomain", label: bi("Plausible domain", "نطاق Plausible"), localized: false, max: 200, width: "half" },
    ],
  },
  maintenance: {
    key: "maintenance",
    title: bi("Maintenance mode", "وضع الصيانة"),
    description: bi("Visitors see a maintenance screen; signed-in staff still see the website.", "يرى الزوار شاشة صيانة؛ بينما يرى الموظفون المسجلون الموقع كالمعتاد."),
    permission: "settings.edit",
    fields: [
      { type: "boolean", name: "enabled", label: bi("Enable maintenance mode", "تفعيل وضع الصيانة") },
      { type: "textarea", name: "message", label: bi("Message", "الرسالة"), max: 500, rows: 2 },
    ],
  },
  security: {
    key: "security",
    title: bi("Security", "الأمان"),
    description: bi("Sign-in protection for the CMS. E-mail verification codes are only used once outgoing e-mail is configured, tested and enabled (Email page).", "حماية تسجيل الدخول إلى نظام الإدارة. لا تُستخدم رموز التحقق بالبريد إلا بعد إعداد البريد الصادر واختباره وتفعيله (صفحة البريد)."),
    permission: "users.manage",
    fields: [
      { type: "select", name: "otpMode", label: bi("E-mail verification at sign-in", "التحقق بالبريد عند تسجيل الدخول"), options: [opt("new_device", "New or unrecognised devices (recommended)", "الأجهزة الجديدة أو غير المعروفة (موصى به)"), opt("every_login", "Every sign-in", "كل تسجيل دخول"), opt("off", "Off (password only)", "معطّل (كلمة المرور فقط)")] },
      { type: "number", name: "trustedDeviceDays", label: bi("Remember trusted browsers for (days)", "تذكّر المتصفحات الموثوقة لمدة (أيام)"), min: 1, max: 180, width: "half" },
      { type: "number", name: "otpTtlMinutes", label: bi("Verification code lifetime (minutes)", "صلاحية رمز التحقق (دقائق)"), min: 2, max: 30, width: "half" },
      { type: "number", name: "otpMaxAttempts", label: bi("Attempts per code", "المحاولات لكل رمز"), min: 3, max: 10, width: "half" },
      { type: "number", name: "otpResendCooldownSeconds", label: bi("Resend cooldown (seconds)", "فترة انتظار إعادة الإرسال (ثوانٍ)"), min: 30, max: 600, width: "half" },
      { type: "number", name: "sessionHours", label: bi("Session length (hours)", "مدة الجلسة (ساعات)"), min: 1, max: 168, width: "half" },
      { type: "number", name: "maxFailedLogins", label: bi("Failed sign-ins before lockout", "محاولات الدخول الفاشلة قبل القفل"), min: 3, max: 20, width: "half" },
      { type: "number", name: "lockoutMinutes", label: bi("Lockout duration (minutes)", "مدة القفل (دقائق)"), min: 5, max: 1440, width: "half" },
    ],
  },
};

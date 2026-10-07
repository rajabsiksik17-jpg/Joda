import "server-only";
import type { Locale } from "../i18n/config";

const NAVY = "#071f3f";
const BLUE = "#168fc1";

function esc(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Table-based, inline-styled layout for broad e-mail client support. */
function layout(locale: Locale, title: string, body: string) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const align = locale === "ar" ? "right" : "left";
  const font = locale === "ar" ? "Tahoma, 'Segoe UI', Arial, sans-serif" : "'Segoe UI', Helvetica, Arial, sans-serif";
  return `<!doctype html><html lang="${locale}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title></head>
<body style="margin:0;background:#f2f5f8;font-family:${font};color:#1f2a37">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f5f8;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:6px;overflow:hidden">
<tr><td style="background:${NAVY};padding:22px 28px" align="${align}"><img src="${siteUrl()}/brand/logo-white.png" width="168" alt="Quality Consulting &amp; Training" style="display:block;border:0;height:auto"></td></tr>
<tr><td style="height:4px;background:${BLUE}"></td></tr>
<tr><td dir="${dir}" style="padding:32px 28px;text-align:${align};font-size:15px;line-height:1.7">${body}</td></tr>
<tr><td dir="${dir}" style="padding:18px 28px;background:#f7f9fb;color:#6b7785;font-size:12px;text-align:${align}">${locale === "ar" ? "خبراء الجودة للاستشارات والتدريب — عمّان، الأردن" : "Quality Consulting &amp; Training — Amman, Jordan"}</td></tr>
</table></td></tr></table></body></html>`;
}

export function otpEmail(locale: Locale, code: string, minutes: number, name: string) {
  const ar = locale === "ar";
  const subject = ar ? `رمز التحقق: ${code}` : `Your verification code: ${code}`;
  const greeting = ar ? `مرحباً ${esc(name)}،` : `Hello ${esc(name)},`;
  const intro = ar ? "استخدم الرمز التالي لإكمال تسجيل الدخول إلى لوحة التحكم:" : "Use the following code to finish signing in to the admin dashboard:";
  const expiry = ar ? `ينتهي هذا الرمز خلال ${minutes} دقائق ويمكن استخدامه مرة واحدة فقط.` : `This code expires in ${minutes} minutes and can only be used once.`;
  const warn = ar ? "إذا لم تحاول تسجيل الدخول، تجاهل هذه الرسالة وغيّر كلمة المرور فوراً." : "If you did not try to sign in, ignore this e-mail and change your password immediately.";
  const html = layout(locale, subject, `<p style="margin:0 0 12px">${greeting}</p><p style="margin:0 0 20px">${intro}</p>
<p style="margin:0 0 20px;text-align:center"><span style="display:inline-block;font-family:Consolas,monospace;font-size:32px;letter-spacing:10px;font-weight:700;color:${NAVY};background:#eef6fb;border:1px solid #d3e8f3;border-radius:6px;padding:14px 22px" dir="ltr">${code}</span></p>
<p style="margin:0 0 8px;color:#475467">${expiry}</p><p style="margin:0;color:#8a94a3;font-size:13px">${warn}</p>`);
  const text = `${greeting}\n\n${intro}\n\n${code}\n\n${expiry}\n${warn}`;
  return { subject, html, text };
}

export type ContactPayload = { name: string; email: string; phone?: string | null; company?: string | null; subject?: string | null; service?: string | null; message: string; locale: string };

export function contactNotificationEmail(m: ContactPayload, adminUrl: string) {
  const rows: [string, string | null | undefined][] = [
    ["Name / الاسم", m.name],
    ["Email / البريد", m.email],
    ["Phone / الهاتف", m.phone],
    ["Company / الشركة", m.company],
    ["Service / الخدمة", m.service],
    ["Subject / الموضوع", m.subject],
    ["Language / اللغة", m.locale],
  ];
  const table = rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:6px 0;color:#6b7785;width:150px;vertical-align:top">${k}</td><td style="padding:6px 0;font-weight:600">${esc(String(v))}</td></tr>`)
    .join("");
  const subject = `New enquiry — ${m.subject || m.name}`;
  const html = layout("en", subject, `<h1 style="margin:0 0 16px;font-size:20px;color:${NAVY}">New website enquiry</h1>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${table}</table>
<div style="margin:20px 0;padding:16px;background:#f7f9fb;border-radius:6px;white-space:pre-wrap" dir="auto">${esc(m.message)}</div>
<a href="${adminUrl}" style="display:inline-block;background:${BLUE};color:#fff;text-decoration:none;padding:10px 18px;border-radius:4px;font-weight:600">Open in dashboard</a>`);
  const text = `New website enquiry\n\n${rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${m.message}\n\n${adminUrl}`;
  return { subject, html, text };
}

export function contactAutoReplyEmail(locale: Locale, name: string) {
  const ar = locale === "ar";
  const subject = ar ? "استلمنا رسالتك — خبراء الجودة" : "We received your message — Quality Experts";
  const body = ar
    ? `<p style="margin:0 0 12px">مرحباً ${esc(name)}،</p><p style="margin:0 0 12px">شكراً لتواصلك مع خبراء الجودة للاستشارات والتدريب. استلمنا رسالتك وسيتواصل معك أحد خبرائنا في أقرب وقت.</p><p style="margin:0">مع أطيب التحيات،<br>فريق خبراء الجودة</p>`
    : `<p style="margin:0 0 12px">Hello ${esc(name)},</p><p style="margin:0 0 12px">Thank you for contacting Quality Consulting &amp; Training. We have received your message and one of our experts will be in touch shortly.</p><p style="margin:0">Kind regards,<br>The Quality Experts team</p>`;
  const text = ar
    ? `مرحباً ${name}،\n\nشكراً لتواصلك مع خبراء الجودة للاستشارات والتدريب. استلمنا رسالتك وسيتواصل معك أحد خبرائنا في أقرب وقت.`
    : `Hello ${name},\n\nThank you for contacting Quality Consulting & Training. We have received your message and one of our experts will be in touch shortly.`;
  return { subject, html: layout(locale, subject, body), text };
}

export function testEmail(locale: Locale) {
  const ar = locale === "ar";
  const subject = ar ? "رسالة اختبار — إعدادات البريد" : "Test e-mail — mail settings";
  const msg = ar ? "تم إرسال هذه الرسالة من لوحة التحكم للتأكد من صحة إعدادات SMTP. الإعدادات تعمل بشكل صحيح." : "This message was sent from the admin dashboard to confirm your SMTP settings. Everything is working.";
  return { subject, html: layout(locale, subject, `<p style="margin:0">${msg}</p>`), text: msg };
}

export type ConsultationPayload = { name: string; company: string | null; email: string; phoneE164: string; country: string | null; service: string | null; preferredContact: string; message: string; locale: string; sourcePage: string | null };

export function consultationNotificationEmail(m: ConsultationPayload, adminUrl: string) {
  const rows: [string, string | null | undefined][] = [
    ["Name / الاسم", m.name],
    ["Organization / المؤسسة", m.company],
    ["Email / البريد", m.email],
    ["Phone / الهاتف", m.phoneE164],
    ["Country / الدولة", m.country],
    ["Area of interest / مجال الاهتمام", m.service],
    ["Preferred contact / وسيلة التواصل", m.preferredContact],
    ["Language / اللغة", m.locale],
    ["Source page / صفحة المصدر", m.sourcePage],
  ];
  const table = rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:6px 0;color:#6b7785;width:170px;vertical-align:top">${k}</td><td style="padding:6px 0;font-weight:600">${esc(String(v))}</td></tr>`)
    .join("");
  const subject = `New consultation request — ${m.service || m.name}`;
  const html = layout("en", subject, `<h1 style="margin:0 0 16px;font-size:20px;color:${NAVY}">New consultation request</h1>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${table}</table>
<div style="margin:20px 0;padding:16px;background:#f7f9fb;border-radius:6px;white-space:pre-wrap" dir="auto">${esc(m.message)}</div>
<a href="${adminUrl}" style="display:inline-block;background:${BLUE};color:#fff;text-decoration:none;padding:10px 18px;border-radius:4px;font-weight:600">Open in dashboard</a>`);
  const text = `New consultation request\n\n${rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${m.message}\n\n${adminUrl}`;
  return { subject, html, text };
}

export function consultationAutoReplyEmail(locale: Locale, name: string, service: string | null) {
  const ar = locale === "ar";
  const subject = ar ? "استلمنا طلب الاستشارة — خبراء الجودة" : "Your consultation request — Quality Experts";
  const about = service ? (ar ? ` بخصوص «${esc(service)}»` : ` regarding “${esc(service)}”`) : "";
  const body = ar
    ? `<p style="margin:0 0 12px">مرحباً ${esc(name)}،</p><p style="margin:0 0 12px">شكراً لاهتمامك بخبراء الجودة للاستشارات والتدريب. استلمنا طلب الاستشارة${about}، وسيتواصل معك أحد خبرائنا عبر وسيلة التواصل التي اخترتها.</p><p style="margin:0">مع أطيب التحيات،<br>فريق خبراء الجودة</p>`
    : `<p style="margin:0 0 12px">Hello ${esc(name)},</p><p style="margin:0 0 12px">Thank you for your interest in Quality Consulting &amp; Training. We have received your consultation request${about}, and one of our experts will contact you using your preferred method.</p><p style="margin:0">Kind regards,<br>The Quality Experts team</p>`;
  const plainAbout = service ? (ar ? ` بخصوص «${service}»` : ` regarding “${service}”`) : "";
  const text = ar
    ? `مرحباً ${name}،\n\nشكراً لاهتمامك بخبراء الجودة للاستشارات والتدريب. استلمنا طلب الاستشارة${plainAbout}، وسيتواصل معك أحد خبرائنا عبر وسيلة التواصل التي اخترتها.`
    : `Hello ${name},\n\nThank you for your interest in Quality Consulting & Training. We have received your consultation request${plainAbout}, and one of our experts will contact you using your preferred method.`;
  return { subject, html: layout(locale, subject, body), text };
}

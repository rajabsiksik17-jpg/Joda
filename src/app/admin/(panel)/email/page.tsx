import type { Metadata } from "next";
import { requirePage } from "@/lib/auth/session";
import { getAdminLocale, makeTx } from "@/lib/i18n/admin-locale";
import { PageHeader } from "@/components/admin/ui";
import { getEmailView } from "./actions";
import { EmailSettings } from "./email-settings";

export const metadata: Metadata = { title: "Email" };

export default async function EmailPage() {
  const user = await requirePage("email.manage");
  const tx = makeTx(await getAdminLocale());
  const view = await getEmailView();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={tx("Email (SMTP & IMAP)", "البريد الإلكتروني (SMTP و IMAP)")} description={tx("Outgoing mail delivers sign-in codes, enquiry notifications and visitor confirmations. Passwords are encrypted and never shown again.", "يُستخدم البريد الصادر لإرسال رموز الدخول وإشعارات الاستفسارات وتأكيدات الزوار. كلمات المرور مشفرة ولا تُعرض مجدداً.")} />
      <EmailSettings view={view} userEmail={user.email} />
    </div>
  );
}

"use client";

import { createContext, useContext } from "react";
import type { ReferenceCollection } from "@/lib/sections/fields";

export type RefOption = { value: string; label: string };
export type LinkSuggestion = { label: string; href: string };

type FieldEnv = {
  refs: Partial<Record<ReferenceCollection, RefOption[]>>;
  links: LinkSuggestion[];
};

const Ctx = createContext<FieldEnv>({ refs: {}, links: [] });

/** Supplies reference options (services, team…) and internal link suggestions to field inputs. */
export function FieldEnvProvider({ value, children }: { value: FieldEnv; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFieldEnv() {
  return useContext(Ctx);
}

export function errorText(code: string | undefined, tx: (en: string, ar: string) => string) {
  if (!code) return null;
  const map: Record<string, [string, string]> = {
    required: ["This field is required.", "هذا الحقل مطلوب."],
    invalid_url: ["Enter a full URL starting with https://", "أدخل رابطاً كاملاً يبدأ بـ https://"],
    invalid_email: ["Enter a valid e-mail address.", "أدخل بريداً إلكترونياً صحيحاً."],
    invalid_slug: ["Use lowercase English letters, numbers and hyphens only.", "استخدم أحرفاً إنجليزية صغيرة وأرقاماً وشرطات فقط."],
    invalid_href: ["Use a path like /about, a full https:// URL, mailto: or tel:", "استخدم مساراً مثل /about أو رابطاً كاملاً أو mailto: أو tel:"],
    invalid_link: ["Use a path like /about, a full https:// URL, mailto: or tel:", "استخدم مساراً مثل /about أو رابطاً كاملاً أو mailto: أو tel:"],
    invalid_phone: ["Enter a valid phone number.", "أدخل رقم هاتف صحيحاً."],
    invalid_date: ["Enter a valid date.", "أدخل تاريخاً صحيحاً."],
    invalid_anchor: ["Use letters, numbers and hyphens only.", "استخدم أحرفاً وأرقاماً وشرطات فقط."],
    reserved_slug: ["This address is reserved by the system.", "هذا العنوان محجوز للنظام."],
    duplicate: ["This value is already used.", "هذه القيمة مستخدمة مسبقاً."],
  };
  const m = map[code];
  if (m) return tx(m[0], m[1]);
  if (code.startsWith("Too big") || code.includes("too_big") || code.includes("at most")) return tx("Too long.", "طويل جداً.");
  return tx("Invalid value.", "قيمة غير صالحة.");
}

/** Maps server action error codes to user-facing messages. */
export function actionErrorText(code: string, tx: (en: string, ar: string) => string) {
  const map: Record<string, [string, string]> = {
    unauthenticated: ["Your session has expired. Please sign in again.", "انتهت جلستك. يرجى تسجيل الدخول مجدداً."],
    forbidden: ["You don't have permission to do this.", "ليست لديك صلاحية للقيام بذلك."],
    invalid: ["Please fix the highlighted fields.", "يرجى تصحيح الحقول المحددة."],
    duplicate: ["That address (slug) is already in use.", "هذا العنوان مستخدم مسبقاً."],
    not_found: ["This item no longer exists.", "هذا العنصر لم يعد موجوداً."],
    in_use: ["This item is still in use and cannot be removed.", "هذا العنصر مستخدم ولا يمكن حذفه."],
    reserved_slug: ["This address is reserved by the system.", "هذا العنوان محجوز للنظام."],
    last_super_admin: ["At least one active Super Admin is required.", "يجب وجود مدير عام نشط واحد على الأقل."],
    self: ["You can't do this to your own account.", "لا يمكنك تنفيذ ذلك على حسابك."],
    server: ["Something went wrong. Please try again.", "حدث خطأ ما. يرجى المحاولة مرة أخرى."],
    google_not_configured: ["Add the Google API credentials first.", "أضف بيانات اعتماد Google API أولاً."],
    google_not_connected: ["Connect a Google account first.", "اربط حساب Google أولاً."],
    google_auth: ["Google rejected the credentials or the connection expired. Reconnect the account.", "رفض Google بيانات الاعتماد أو انتهت صلاحية الربط. أعد ربط الحساب."],
    google_permission: ["The connected Google account has no access to this property, or the API is not enabled in Google Cloud.", "حساب Google المرتبط لا يملك صلاحية على هذه الخاصية، أو أن الواجهة البرمجية غير مفعّلة في Google Cloud."],
    google_not_found: ["The selected property was not found.", "لم يتم العثور على الخاصية المحددة."],
    google_quota: ["Google's request limit was reached. Try again later.", "تم بلوغ حد الطلبات لدى Google. حاول لاحقاً."],
    google_network: ["Could not reach Google. Check the server's internet connection.", "تعذّر الوصول إلى Google. تحقق من اتصال الخادم بالإنترنت."],
    google_api: ["Google returned an error. Check the details and try again.", "أعاد Google خطأ. راجع التفاصيل وحاول مجدداً."],
  };
  const m = map[code] ?? map.server;
  return tx(m[0], m[1]);
}

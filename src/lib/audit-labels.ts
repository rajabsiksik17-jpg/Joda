/** Human-readable labels for audit actions (falls back to the raw action key). */
const LABELS: Record<string, [string, string]> = {
  "auth.login_success": ["Signed in", "تسجيل دخول"],
  "auth.login_failed": ["Failed sign-in", "محاولة دخول فاشلة"],
  "auth.login_locked": ["Sign-in blocked (locked)", "منع الدخول (حساب مقفل)"],
  "auth.login_rate_limited": ["Sign-in rate limited", "تقييد محاولات الدخول"],
  "auth.account_locked": ["Account locked", "قفل الحساب"],
  "auth.otp_requested": ["Verification code sent", "إرسال رمز التحقق"],
  "auth.otp_resent": ["Verification code resent", "إعادة إرسال رمز التحقق"],
  "auth.otp_failed": ["Verification failed", "فشل التحقق"],
  "auth.otp_send_failed": ["Verification e-mail failed", "فشل إرسال بريد التحقق"],
  "auth.logout": ["Signed out", "تسجيل خروج"],
  "page.create": ["Page created", "إنشاء صفحة"],
  "page.update": ["Page saved", "حفظ صفحة"],
  "page.publish": ["Page published", "نشر صفحة"],
  "page.unpublish": ["Page unpublished", "إلغاء نشر صفحة"],
  "page.delete": ["Page deleted", "حذف صفحة"],
  "page.restore_revision": ["Page revision restored", "استعادة نسخة صفحة"],
  "page.duplicate": ["Page duplicated", "نسخ صفحة"],
  "service.create": ["Service created", "إنشاء خدمة"],
  "service.update": ["Service updated", "تحديث خدمة"],
  "service.delete": ["Service deleted", "حذف خدمة"],
  "post.create": ["Insight created", "إنشاء مقال"],
  "post.update": ["Insight updated", "تحديث مقال"],
  "post.delete": ["Insight deleted", "حذف مقال"],
  "media.upload": ["Media uploaded", "رفع وسائط"],
  "media.update": ["Media updated", "تحديث وسائط"],
  "media.replace": ["Media file replaced", "استبدال ملف وسائط"],
  "media.delete": ["Media deleted", "حذف وسائط"],
  "collection.create": ["Item created", "إنشاء عنصر"],
  "collection.update": ["Item updated", "تحديث عنصر"],
  "collection.delete": ["Item deleted", "حذف عنصر"],
  "collection.reorder": ["Items reordered", "إعادة ترتيب"],
  "navigation.update": ["Navigation updated", "تحديث القوائم"],
  "settings.update": ["Settings changed", "تغيير الإعدادات"],
  "email.update": ["E-mail settings changed", "تغيير إعدادات البريد"],
  "email.test": ["E-mail test", "اختبار البريد"],
  "message.update": ["Message updated", "تحديث رسالة"],
  "message.delete": ["Message deleted", "حذف رسالة"],
  "message.export": ["Messages exported", "تصدير الرسائل"],
  "consultation.update": ["Consultation request updated", "تحديث طلب استشارة"],
  "consultation.delete": ["Consultation request deleted", "حذف طلب استشارة"],
  "consultation.export": ["Consultation requests exported", "تصدير طلبات الاستشارة"],
  "user.create": ["User created", "إنشاء مستخدم"],
  "user.update": ["User updated", "تحديث مستخدم"],
  "user.reset_password": ["Password reset", "إعادة تعيين كلمة المرور"],
  "user.revoke_sessions": ["Sessions revoked", "إلغاء الجلسات"],
  "user.delete": ["User deleted", "حذف مستخدم"],
  "account.password_change": ["Password changed", "تغيير كلمة المرور"],
  "account.update": ["Profile updated", "تحديث الملف الشخصي"],
  "role.create": ["Role created", "إنشاء دور"],
  "role.update": ["Role updated", "تحديث دور"],
  "role.delete": ["Role deleted", "حذف دور"],
  "template.create": ["Section template saved", "حفظ قالب قسم"],
  "template.delete": ["Section template deleted", "حذف قالب قسم"],
};

export function auditLabel(action: string, locale: "ar" | "en") {
  const l = LABELS[action];
  return l ? (locale === "ar" ? l[1] : l[0]) : action;
}

export function auditTone(action: string): "danger" | "warning" | "success" | "neutral" | "info" {
  if (/failed|locked|rate_limited|delete/.test(action)) return action.includes("delete") ? "warning" : "danger";
  if (/login_success|publish$|create/.test(action)) return "success";
  if (action.startsWith("auth.")) return "info";
  return "neutral";
}

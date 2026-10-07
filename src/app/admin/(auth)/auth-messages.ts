export function authErrorMessage(code: string | undefined, tx: (en: string, ar: string) => string, extra?: { retryAfter?: number; remaining?: number }) {
  const minutes = extra?.retryAfter ? Math.max(1, Math.ceil(extra.retryAfter / 60)) : null;
  switch (code) {
    case "invalid_input":
      return tx("Enter a valid email and password.", "أدخل بريداً إلكترونياً وكلمة مرور صحيحين.");
    case "invalid_credentials":
      return tx("Incorrect email or password.", "البريد الإلكتروني أو كلمة المرور غير صحيحة.");
    case "rate_limited":
      return tx(`Too many attempts. Try again in ${minutes ?? 15} minute(s).`, `محاولات كثيرة. حاول مجدداً بعد ${minutes ?? 15} دقيقة.`);
    case "locked":
      return tx(`This account is temporarily locked. Try again in ${minutes} minute(s).`, `تم قفل الحساب مؤقتاً. حاول مجدداً بعد ${minutes} دقيقة.`);
    case "otp_send_failed":
      return tx("We couldn't send the verification code. Check the e-mail settings or contact an administrator.", "تعذّر إرسال رمز التحقق. تحقق من إعدادات البريد أو تواصل مع المسؤول.");
    case "invalid":
      return extra?.remaining !== undefined
        ? tx(`Incorrect code. ${extra.remaining} attempt(s) left.`, `الرمز غير صحيح. تبقّى ${extra.remaining} محاولة.`)
        : tx("Incorrect code.", "الرمز غير صحيح.");
    case "expired":
    case "not_found":
      return tx("This code has expired. Please sign in again.", "انتهت صلاحية الرمز. يرجى تسجيل الدخول مجدداً.");
    case "too_many_attempts":
      return tx("Too many incorrect codes. Please sign in again.", "عدد كبير من المحاولات الخاطئة. يرجى تسجيل الدخول مجدداً.");
    case "cooldown":
      return tx(`Please wait ${extra?.retryAfter}s before requesting a new code.`, `يرجى الانتظار ${extra?.retryAfter} ثانية قبل طلب رمز جديد.`);
    case "too_many_resends":
      return tx("Too many codes requested. Please sign in again.", "تم طلب رموز كثيرة. يرجى تسجيل الدخول مجدداً.");
    default:
      return code ? tx("Something went wrong. Please try again.", "حدث خطأ ما. يرجى المحاولة مرة أخرى.") : "";
  }
}

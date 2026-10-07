import Link from "next/link";
import { getAdminLocale, makeTx } from "@/lib/i18n/admin-locale";

export default async function AdminNotFound() {
  const tx = makeTx(await getAdminLocale());
  return (
    <div className="grid min-h-[60svh] place-items-center px-4 text-center">
      <div>
        <p className="font-mono text-5xl font-bold text-tech-600" dir="ltr">404</p>
        <h1 className="mt-3 text-xl font-bold text-ink">{tx("Not found", "غير موجود")}</h1>
        <p className="mt-2 text-sm text-muted">{tx("This item doesn't exist or was deleted.", "هذا العنصر غير موجود أو تم حذفه.")}</p>
        <Link href="/admin" className="mt-6 inline-flex h-10 items-center rounded-md bg-tech-600 px-4 text-sm font-medium text-white hover:bg-tech-700">{tx("Back to dashboard", "العودة إلى لوحة التحكم")}</Link>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { useAdminI18n } from "@/components/admin/i18n";
import { Button } from "@/components/admin/ui";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { tx } = useAdminI18n();
  useEffect(() => console.error(error), [error]);
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-red-50 text-red-600"><AlertTriangle className="size-6" /></span>
      <h1 className="mt-5 text-xl font-bold text-ink">{tx("This screen couldn't load", "تعذّر تحميل هذه الشاشة")}</h1>
      <p className="mt-2 text-sm text-muted">{tx("An unexpected error occurred. Your data has not been changed.", "حدث خطأ غير متوقع. لم يتم تغيير بياناتك.")}</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-muted" dir="ltr">Ref: {error.digest}</p>}
      <Button variant="primary" className="mt-6" onClick={reset}>{tx("Try again", "إعادة المحاولة")}</Button>
    </div>
  );
}

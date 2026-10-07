"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { useAdminI18n } from "@/components/admin/i18n";
import { actionErrorText } from "@/components/admin/fields/env";
import { Button } from "@/components/admin/ui";
import { refreshGoogleData } from "../integrations/actions";

/** Clears the cached Google reports and reloads them. */
export function RefreshButton() {
  const { tx } = useAdminI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      loading={pending}
      onClick={() =>
        start(async () => {
          const r = await refreshGoogleData();
          if (!r.ok) {
            toast.error(actionErrorText(r.error, tx));
            return;
          }
          router.refresh();
        })
      }
    >
      {!pending && <RefreshCw className="size-4" />}
      {tx("Refresh", "تحديث")}
    </Button>
  );
}

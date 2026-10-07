"use client";

import { useRouter } from "next/navigation";
import { EntityEditor } from "@/components/admin/entity-editor";
import { useAdminI18n } from "@/components/admin/i18n";
import { Badge } from "@/components/admin/ui";
import type { LinkSuggestion, RefOption } from "@/components/admin/fields/env";
import { SERVICE_MAIN_FIELDS, SERVICE_SEO_FIELDS, SERVICE_SIDE_FIELDS } from "@/lib/admin/entity-fields";
import type { FieldValues } from "@/lib/sections/fields";
import { deleteService, saveService } from "../actions";

export function ServiceEditorClient({ id, title, initial, env, published, slug }: { id: string | null; title: string; initial: FieldValues; env: { refs: Record<string, RefOption[]>; links: LinkSuggestion[] }; published?: boolean; slug?: string }) {
  const router = useRouter();
  const { tx, locale } = useAdminI18n();
  return (
    <EntityEditor
      backHref="/admin/services"
      backLabel={tx("Back to services", "العودة إلى الخدمات")}
      title={title}
      badge={id ? (published ? <Badge tone="success">{tx("Published", "منشورة")}</Badge> : <Badge>{tx("Draft", "مسودة")}</Badge>) : null}
      viewHref={id && published ? `/${locale}/services/${slug}` : null}
      mainFields={SERVICE_MAIN_FIELDS}
      sideFields={SERVICE_SIDE_FIELDS}
      seoFields={SERVICE_SEO_FIELDS}
      initial={initial}
      env={env}
      onSave={(values) => saveService(id, values)}
      onSaved={(newId) => (id ? router.refresh() : router.replace(`/admin/services/${newId}`))}
      onDelete={id ? () => deleteService(id) : undefined}
      onDeleted={() => router.push("/admin/services")}
    />
  );
}

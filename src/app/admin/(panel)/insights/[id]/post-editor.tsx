"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { EntityEditor } from "@/components/admin/entity-editor";
import { useAdminI18n } from "@/components/admin/i18n";
import { Badge } from "@/components/admin/ui";
import type { LinkSuggestion, RefOption } from "@/components/admin/fields/env";
import { POST_MAIN_FIELDS, POST_SEO_FIELDS, POST_SIDE_FIELDS } from "@/lib/admin/entity-fields";
import type { Field, FieldValues } from "@/lib/sections/fields";
import { deletePost, savePost } from "../actions";

export function PostEditorClient({ id, title, initial, env, status, viewHref, canPublish }: { id: string | null; title: string; initial: FieldValues; env: { refs: Record<string, RefOption[]>; links: LinkSuggestion[] }; status?: "live" | "scheduled" | "draft"; viewHref?: string | null; canPublish: boolean }) {
  const router = useRouter();
  const { tx } = useAdminI18n();
  // Without the publish permission the status selector only offers "Draft".
  const sideFields = useMemo<Field[]>(
    () => (canPublish ? POST_SIDE_FIELDS : POST_SIDE_FIELDS.map((f) => (f.type === "select" && f.name === "status" ? { ...f, options: f.options.filter((o) => o.value === "DRAFT") } : f))),
    [canPublish],
  );
  return (
    <EntityEditor
      backHref="/admin/insights"
      backLabel={tx("Back to insights", "العودة إلى المقالات")}
      title={title}
      badge={status === "live" ? <Badge tone="success">{tx("Published", "منشور")}</Badge> : status === "scheduled" ? <Badge tone="info">{tx("Scheduled", "مجدول")}</Badge> : id ? <Badge>{tx("Draft", "مسودة")}</Badge> : null}
      viewHref={viewHref}
      mainFields={POST_MAIN_FIELDS}
      sideFields={sideFields}
      seoFields={POST_SEO_FIELDS}
      initial={initial}
      env={env}
      readOnly={!canPublish && initial.status === "PUBLISHED"}
      onSave={(values) => savePost(id, values)}
      onSaved={(newId) => (id ? router.refresh() : router.replace(`/admin/insights/${newId}`))}
      onDelete={id ? () => deletePost(id) : undefined}
      onDeleted={() => router.push("/admin/insights")}
    />
  );
}

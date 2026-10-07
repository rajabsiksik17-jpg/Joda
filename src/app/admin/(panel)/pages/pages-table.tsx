"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink, FilePlus2, FileText, Home, MoreHorizontal, Pencil, Scale, Trash2 } from "lucide-react";
import { useAdminI18n } from "@/components/admin/i18n";
import { actionErrorText, errorText } from "@/components/admin/fields/env";
import { LocalizedInput } from "@/components/admin/fields/localized-input";
import { Badge, Button, ConfirmDialog, FieldShell, Input, Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, Modal, SearchInput, Select } from "@/components/admin/ui";
import { relativeTime } from "@/lib/format";
import { createPage, deletePage, duplicatePage } from "./actions";

type Row = { id: string; slug: string; kind: string; title: string; status: string; changed: boolean; sections: number; updatedAt: string };

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

export function StatusBadge({ status, changed }: { status: string; changed: boolean }) {
  const { tx } = useAdminI18n();
  if (status === "PUBLISHED") return changed ? <Badge tone="warning">{tx("Published · unpublished changes", "منشورة · تغييرات غير منشورة")}</Badge> : <Badge tone="success">{tx("Published", "منشورة")}</Badge>;
  return <Badge>{tx("Draft", "مسودة")}</Badge>;
}

export function PagesTable({ pages, can, openNew }: { pages: Row[]; can: { edit: boolean; publish: boolean; del: boolean }; openNew: boolean }) {
  const { tx, locale } = useAdminI18n();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(openNew);
  const [form, setForm] = useState({ title: { ar: "", en: "" }, slug: "", kind: "STANDARD", slugTouched: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<Row | null>(null);


  const filtered = pages.filter((p) => !q || `${p.title} ${p.slug}`.toLowerCase().includes(q.toLowerCase()));

  const submit = async () => {
    setBusy(true);
    const r = await createPage({ title: form.title, slug: form.slug, kind: form.kind });
    setBusy(false);
    if (!r.ok) {
      setErrors(r.fieldErrors ?? {});
      toast.error(actionErrorText(r.error, tx));
      return;
    }
    router.push(`/admin/pages/${r.data!.id}`);
  };

  const KindIcon = (k: string) => (k === "HOME" ? Home : k === "LEGAL" ? Scale : FileText);

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput value={q} onChange={setQ} className="flex-1 sm:max-w-sm" />
        {can.edit && <Button variant="primary" className="sm:ms-auto" onClick={() => setCreating(true)}><FilePlus2 className="size-4" />{tx("New page", "صفحة جديدة")}</Button>}
      </div>
      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <table className="w-full text-sm">
          <thead className="hidden bg-surface/70 text-start text-xs text-muted md:table-header-group">
            <tr>
              <th className="px-4 py-3 text-start font-semibold">{tx("Page", "الصفحة")}</th>
              <th className="px-4 py-3 text-start font-semibold">{tx("Status", "الحالة")}</th>
              <th className="px-4 py-3 text-start font-semibold">{tx("Updated", "آخر تحديث")}</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((p) => {
              const Icon = KindIcon(p.kind);
              const path = p.slug === "home" ? "" : `/${p.slug}`;
              return (
                <tr key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 md:table-row md:p-0">
                  <td className="min-w-0 flex-1 md:px-4 md:py-3">
                    <Link href={`/admin/pages/${p.id}`} className="group flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-sky-50 text-tech-600"><Icon className="size-4" /></span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-ink group-hover:text-tech-600">{p.title}</span>
                        <span className="block truncate text-xs text-muted" dir="ltr">/{locale}{path} · {p.sections} {tx("sections", "أقسام")}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="md:px-4 md:py-3"><StatusBadge status={p.status} changed={p.changed} /></td>
                  <td className="text-xs text-muted md:px-4 md:py-3">{relativeTime(p.updatedAt, locale)}</td>
                  <td className="md:px-2 md:py-3">
                    <Menu>
                      <MenuTrigger className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface hover:text-ink" aria-label={tx("Actions", "الإجراءات")}><MoreHorizontal className="size-4" /></MenuTrigger>
                      <MenuContent>
                        <MenuItem onSelect={() => router.push(`/admin/pages/${p.id}`)}><Pencil className="size-4" />{tx("Edit", "تحرير")}</MenuItem>
                        {p.status === "PUBLISHED" && <MenuItem onSelect={() => window.open(`/${locale}${path}`, "_blank")}><ExternalLink className="size-4" />{tx("View live", "عرض المنشور")}</MenuItem>}
                        {can.edit && (
                          <MenuItem onSelect={async () => { const r = await duplicatePage(p.id); if (r.ok) router.push(`/admin/pages/${r.data!.id}`); else toast.error(actionErrorText(r.error, tx)); }}>
                            <Copy className="size-4" />{tx("Duplicate", "نسخ")}
                          </MenuItem>
                        )}
                        {can.del && p.kind !== "HOME" && (
                          <>
                            <MenuSeparator />
                            <MenuItem danger onSelect={() => setDeleting(p)}><Trash2 className="size-4" />{tx("Delete", "حذف")}</MenuItem>
                          </>
                        )}
                      </MenuContent>
                    </Menu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        open={creating}
        onOpenChange={setCreating}
        title={tx("New page", "صفحة جديدة")}
        description={tx("The page starts as a private draft with a header section.", "تبدأ الصفحة كمسودة خاصة مع قسم رأس الصفحة.")}
        footer={<><Button onClick={() => setCreating(false)}>{tx("Cancel", "إلغاء")}</Button><Button variant="primary" loading={busy} onClick={submit}>{tx("Create page", "إنشاء الصفحة")}</Button></>}
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <FieldShell label={tx("Title", "العنوان")} required error={errorText(errors.title, tx)}>
            <LocalizedInput id="np-title" value={form.title} onChange={(title) => setForm({ ...form, title: { ar: title.ar ?? "", en: title.en ?? "" }, slug: form.slugTouched ? form.slug : slugify(title.en ?? "") })} max={160} />
          </FieldShell>
          <FieldShell label={tx("Address (URL)", "العنوان (الرابط)")} htmlFor="np-slug" required error={errorText(errors.slug, tx)} help={tx("Lowercase English letters, numbers and hyphens. Nested paths with / are allowed.", "أحرف إنجليزية صغيرة وأرقام وشرطات. يمكن استخدام / للمسارات المتداخلة.")}>
            <div className="flex items-center" dir="ltr">
              <span className="flex h-10 items-center rounded-s-md border border-e-0 border-line-strong bg-surface px-3 text-sm text-muted">/{locale}/</span>
              <Input id="np-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value, slugTouched: true })} className="rounded-s-none" />
            </div>
          </FieldShell>
          <FieldShell label={tx("Page type", "نوع الصفحة")} htmlFor="np-kind">
            <Select id="np-kind" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              <option value="STANDARD">{tx("Standard page", "صفحة عادية")}</option>
              <option value="LEGAL">{tx("Legal / policy page", "صفحة قانونية / سياسة")}</option>
            </Select>
          </FieldShell>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={tx("Delete this page?", "حذف هذه الصفحة؟")}
        description={tx("The page will be removed from the website and its menus. Links to it will stop working.", "ستُزال الصفحة من الموقع والقوائم. ستتوقف الروابط المؤدية إليها عن العمل.")}
        onConfirm={async () => {
          if (!deleting) return;
          const r = await deletePage(deleting.id);
          if (r.ok) {
            toast.success(tx("Page deleted", "تم حذف الصفحة"));
            router.refresh();
          } else toast.error(actionErrorText(r.error, tx));
        }}
      />
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Archive, CalendarCheck, CheckCheck, Clock, Download, Mail, MessageCircle, Phone, PhoneCall, RotateCcw, Trash2 } from "lucide-react";
import { useAdminI18n } from "@/components/admin/i18n";
import { actionErrorText } from "@/components/admin/fields/env";
import { Badge, Button, ConfirmDialog, Drawer, EmptyState, SearchInput, Select, Textarea } from "@/components/admin/ui";
import { formatDateTime, relativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { deleteConsultations, saveConsultationNotes, setConsultationStatus } from "./actions";

type Status = "PENDING" | "CONTACTED" | "COMPLETED" | "ARCHIVED";
type Row = {
  id: string; name: string; company: string | null; email: string; phoneE164: string; phoneNumber: string; phoneCountry: string; country: string | null; countryLabel: string;
  serviceTitle: string | null; preferredContact: string; message: string; locale: string; sourcePage: string | null; status: string; notes: string | null; consent: boolean;
  createdAt: string; contactedAt: string | null; completedAt: string | null;
};
type Filters = { status: string; q: string; service: string; country: string };

const TONE: Record<string, "warning" | "info" | "success" | "neutral"> = { PENDING: "warning", CONTACTED: "info", COMPLETED: "success", ARCHIVED: "neutral" };

export function ConsultationsInbox({ rows, opened, total, page, pages, filters, counts, services, countries, canManage }: {
  rows: Row[]; opened: Row | null; total: number; page: number; pages: number; filters: Filters; counts: Record<Status, number>;
  services: { id: string; title: string }[]; countries: { code: string; label: string; count: number }[]; canManage: boolean;
}) {
  const { tx, locale } = useAdminI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState(rows);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Row | null>(opened);
  const [notes, setNotes] = useState(opened?.notes ?? "");
  const [search, setSearch] = useState(filters.q);
  const [confirm, setConfirm] = useState<string[] | null>(null);

  const statusLabel: Record<string, string> = { PENDING: tx("Pending", "قيد الانتظار"), CONTACTED: tx("Contacted", "تم التواصل"), COMPLETED: tx("Completed", "مكتمل"), ARCHIVED: tx("Archived", "مؤرشف") };
  const methodLabel: Record<string, string> = { email: tx("E-mail", "البريد"), phone: tx("Phone call", "اتصال هاتفي"), whatsapp: "WhatsApp" };
  const MethodIcon = (m: string) => (m === "phone" ? PhoneCall : m === "whatsapp" ? MessageCircle : Mail);

  const href = (params: Partial<Record<keyof Filters | "page", string | number | undefined>>) => {
    const sp = new URLSearchParams();
    const merged = { ...filters, page: undefined as number | string | undefined, ...params };
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, String(v));
    return `${pathname}?${sp.toString()}`;
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== filters.q) router.replace(href({ q: search, page: undefined }));
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openRow = (r: Row | null) => {
    setOpen(r);
    setNotes(r?.notes ?? "");
  };

  const apply = async (list: string[], s: Status) => {
    const r = await setConsultationStatus(list, s);
    if (!r.ok) return toast.error(actionErrorText(r.error, tx));
    const leaves = (s === "ARCHIVED" && filters.status !== "ARCHIVED") || (filters.status && filters.status !== s);
    setItems((prev) => (leaves ? prev.filter((m) => !list.includes(m.id)) : prev.map((m) => (list.includes(m.id) ? { ...m, status: s } : m))));
    setSelected(new Set());
    if (open && list.includes(open.id)) setOpen(s === "ARCHIVED" ? null : { ...open, status: s });
    toast.success(tx("Status updated", "تم تحديث الحالة"));
    router.refresh();
  };

  const tabs: [string, string, number][] = [
    ["", tx("Active", "النشطة"), counts.PENDING + counts.CONTACTED + counts.COMPLETED],
    ["PENDING", statusLabel.PENDING, counts.PENDING],
    ["CONTACTED", statusLabel.CONTACTED, counts.CONTACTED],
    ["COMPLETED", statusLabel.COMPLETED, counts.COMPLETED],
    ["ARCHIVED", statusLabel.ARCHIVED, counts.ARCHIVED],
  ];
  const allSelected = items.length > 0 && items.every((m) => selected.has(m.id));
  const exportHref = `/api/admin/consultations/export?${new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString()}`;
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const waLink = (r: Row) => `https://wa.me/${r.phoneE164.replace(/\D/g, "")}`;

  return (
    <>
      <div className="mb-4 flex flex-col gap-3">
        <nav className="flex gap-1 overflow-x-auto" aria-label={tx("Filter by status", "التصفية حسب الحالة")}>
          {tabs.map(([s, label, n]) => (
            <Link key={s || "all"} href={href({ status: s || undefined, page: undefined })} className={cn("shrink-0 rounded-md px-3 py-1.5 text-sm font-medium", filters.status === s ? "bg-navy text-white" : "text-ink hover:bg-white")}>
              {label} <span className="opacity-60" dir="ltr">{n}</span>
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchInput value={search} onChange={setSearch} className="flex-1" placeholder={tx("Search name, e-mail, phone, company…", "ابحث بالاسم أو البريد أو الهاتف أو الشركة…")} />
          <Select value={filters.service} onChange={(e) => router.replace(href({ service: e.target.value || undefined, page: undefined }))} className="sm:w-56" aria-label={tx("Service", "الخدمة")}>
            <option value="">{tx("All services", "جميع الخدمات")}</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </Select>
          {countries.length > 0 && (
            <Select value={filters.country} onChange={(e) => router.replace(href({ country: e.target.value || undefined, page: undefined }))} className="sm:w-48" aria-label={tx("Country", "الدولة")}>
              <option value="">{tx("All countries", "جميع الدول")}</option>
              {countries.map((c) => <option key={c.code} value={c.code}>{c.label} ({c.count})</option>)}
            </Select>
          )}
          <a href={exportHref} download><Button className="w-full"><Download className="size-4" />{tx("Export CSV", "تصدير CSV")}</Button></a>
        </div>
      </div>

      {selected.size > 0 && canManage && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-tech/30 bg-sky-50 px-3 py-2 text-sm">
          <span className="font-semibold text-ink">{selected.size} {tx("selected", "محدد")}</span>
          <Button size="sm" onClick={() => apply([...selected], "CONTACTED")}><PhoneCall className="size-3.5" />{statusLabel.CONTACTED}</Button>
          <Button size="sm" onClick={() => apply([...selected], "COMPLETED")}><CheckCheck className="size-3.5" />{statusLabel.COMPLETED}</Button>
          <Button size="sm" onClick={() => apply([...selected], "ARCHIVED")}><Archive className="size-3.5" />{tx("Archive", "أرشفة")}</Button>
          <Button size="sm" variant="danger" onClick={() => setConfirm([...selected])}><Trash2 className="size-3.5" />{tx("Delete", "حذف")}</Button>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="size-5" />}
          title={filters.q || filters.service || filters.country ? tx("No requests match these filters", "لا توجد طلبات مطابقة") : tx("No consultation requests here", "لا توجد طلبات استشارة هنا")}
          text={tx("Requests from the “Request a consultation” page appear here and are e-mailed to the recipients set in Contact details.", "تظهر هنا الطلبات من صفحة «اطلب استشارة» وتُرسل إلى المستلمين المحددين في بيانات التواصل.")}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-white">
          <div className="flex items-center gap-3 border-b border-line bg-surface/60 px-4 py-2 text-xs text-muted">
            {canManage && <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(items.map((m) => m.id)))} aria-label={tx("Select all", "تحديد الكل")} className="size-4 accent-tech" />}
            <span>{total} {tx("requests", "طلب")}</span>
          </div>
          <ul className="divide-y divide-line">
            {items.map((m) => {
              const MIcon = MethodIcon(m.preferredContact);
              return (
                <li key={m.id} className={cn("flex items-start gap-3 px-4 py-3", m.status === "PENDING" && "bg-amber-50/30")}>
                  {canManage && <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggle(m.id)} aria-label={tx("Select", "تحديد")} className="mt-1 size-4 accent-tech" />}
                  <button type="button" onClick={() => openRow(m)} className="min-w-0 flex-1 text-start">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="truncate text-sm font-semibold text-ink">{m.name}</span>
                      {m.company && <span className="truncate text-xs text-muted">· {m.company}</span>}
                      <Badge tone={TONE[m.status]}>{statusLabel[m.status]}</Badge>
                      <span className="ms-auto shrink-0 text-xs text-muted">{relativeTime(m.createdAt, locale)}</span>
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span className="font-medium text-ink/80">{m.serviceTitle || tx("General enquiry", "استفسار عام")}</span>
                      {m.countryLabel && <span>{m.countryLabel}</span>}
                      <span className="inline-flex items-center gap-1"><MIcon className="size-3" aria-hidden />{methodLabel[m.preferredContact] ?? m.preferredContact}</span>
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted" dir="auto">{m.message}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? <Link href={href({ page: page - 1 })}><Button size="sm">{tx("Previous", "السابق")}</Button></Link> : <span />}
          <span className="text-muted" dir="ltr">{page} / {pages}</span>
          {page < pages ? <Link href={href({ page: page + 1 })}><Button size="sm">{tx("Next", "التالي")}</Button></Link> : <span />}
        </div>
      )}

      <Drawer
        open={!!open}
        onOpenChange={(o) => {
          if (!o) {
            setOpen(null);
            if (opened) router.replace(href({}));
          }
        }}
        title={open?.name ?? ""}
        description={open ? `${formatDateTime(open.createdAt, locale)} · ${open.serviceTitle || tx("General enquiry", "استفسار عام")}` : undefined}
        footer={
          open && canManage && (
            <>
              <Button variant="ghost" className="me-auto text-red-600 hover:bg-red-50" onClick={() => setConfirm([open.id])}><Trash2 className="size-4" />{tx("Delete", "حذف")}</Button>
              {open.status === "ARCHIVED" ? (
                <Button onClick={() => apply([open.id], "PENDING")}><RotateCcw className="size-4" />{tx("Restore", "استعادة")}</Button>
              ) : (
                <Button onClick={() => apply([open.id], "ARCHIVED")}><Archive className="size-4" />{tx("Archive", "أرشفة")}</Button>
              )}
              <a href={`mailto:${open.email}`}><Button variant="primary"><Mail className="size-4" />{tx("Reply by e-mail", "الرد بالبريد")}</Button></a>
            </>
          )
        }
      >
        {open && (
          <div className="space-y-6">
            {canManage && (
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">{tx("Status", "الحالة")}</p>
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={tx("Status", "الحالة")}>
                  {(["PENDING", "CONTACTED", "COMPLETED"] as const).map((s) => {
                    const Ico = s === "PENDING" ? Clock : s === "CONTACTED" ? PhoneCall : CheckCheck;
                    return (
                      <button key={s} type="button" role="radio" aria-checked={open.status === s} onClick={() => open.status !== s && apply([open.id], s)} className={cn("flex items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-sm font-medium transition-colors", open.status === s ? "border-navy bg-navy text-white" : "border-line text-ink hover:border-ink/40")}>
                        <Ico className="size-3.5" aria-hidden />
                        {statusLabel[s]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <dl className="grid gap-x-6 gap-y-3 rounded-lg border border-line bg-surface/40 p-4 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-muted">{tx("E-mail", "البريد")}</dt><dd><a className="font-semibold break-all text-tech-600" href={`mailto:${open.email}`} dir="ltr">{open.email}</a></dd></div>
              <div>
                <dt className="text-xs text-muted">{tx("Phone", "الهاتف")}</dt>
                <dd className="flex flex-wrap items-center gap-2">
                  <a className="inline-flex items-center gap-1.5 font-semibold text-tech-600" href={`tel:${open.phoneE164}`} dir="ltr"><Phone className="size-3.5" />{open.phoneE164}</a>
                  <a className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700" href={waLink(open)} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-3" />WhatsApp</a>
                </dd>
              </div>
              {open.company && <div><dt className="text-xs text-muted">{tx("Organization", "المؤسسة")}</dt><dd className="font-semibold text-ink">{open.company}</dd></div>}
              {open.countryLabel && <div><dt className="text-xs text-muted">{tx("Country", "الدولة")}</dt><dd className="font-semibold text-ink">{open.countryLabel}</dd></div>}
              <div><dt className="text-xs text-muted">{tx("Area of interest", "مجال الاهتمام")}</dt><dd className="font-semibold text-ink">{open.serviceTitle || tx("General enquiry", "استفسار عام")}</dd></div>
              <div><dt className="text-xs text-muted">{tx("Preferred contact", "وسيلة التواصل المفضلة")}</dt><dd className="font-semibold text-ink">{methodLabel[open.preferredContact] ?? open.preferredContact}</dd></div>
              <div><dt className="text-xs text-muted">{tx("Language", "اللغة")}</dt><dd><Badge>{open.locale.toUpperCase()}</Badge></dd></div>
              {open.sourcePage && <div><dt className="text-xs text-muted">{tx("Submitted from", "أُرسل من")}</dt><dd className="font-mono text-xs text-ink" dir="ltr">/{open.locale}{open.sourcePage === "/" ? "" : open.sourcePage}</dd></div>}
              {open.contactedAt && <div><dt className="text-xs text-muted">{tx("Contacted", "تم التواصل")}</dt><dd className="text-ink">{formatDateTime(open.contactedAt, locale)}</dd></div>}
              {open.completedAt && <div><dt className="text-xs text-muted">{tx("Completed", "اكتمل")}</dt><dd className="text-ink">{formatDateTime(open.completedAt, locale)}</dd></div>}
            </dl>
            <div>
              <p className="mb-2 text-sm font-semibold text-ink">{tx("Message", "الرسالة")}</p>
              <div className="rounded-lg border border-line bg-white p-4 text-[0.95rem] leading-relaxed whitespace-pre-wrap text-ink" dir="auto">{open.message}</div>
            </div>
            <div>
              <label htmlFor="cr-notes" className="mb-2 block text-sm font-semibold text-ink">{tx("Internal notes", "ملاحظات داخلية")}</label>
              <Textarea id="cr-notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={4000} readOnly={!canManage} placeholder={tx("Visible to staff only", "مرئية للموظفين فقط")} />
              {canManage && (
                <Button
                  size="sm"
                  className="mt-2"
                  disabled={notes === (open.notes ?? "")}
                  onClick={async () => {
                    const r = await saveConsultationNotes(open.id, notes);
                    if (!r.ok) return toast.error(actionErrorText(r.error, tx));
                    toast.success(tx("Notes saved", "تم حفظ الملاحظات"));
                    setOpen({ ...open, notes });
                    setItems((p) => p.map((m) => (m.id === open.id ? { ...m, notes } : m)));
                  }}
                >
                  {tx("Save notes", "حفظ الملاحظات")}
                </Button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm && confirm.length > 1 ? tx(`Delete ${confirm.length} requests?`, `حذف ${confirm.length} طلبات؟`) : tx("Delete this request?", "حذف هذا الطلب؟")}
        description={tx("Requests are deleted permanently. Archive them instead to keep a record.", "تُحذف الطلبات نهائياً. يمكنك أرشفتها بدلاً من ذلك للاحتفاظ بسجل.")}
        onConfirm={async () => {
          if (!confirm) return;
          const r = await deleteConsultations(confirm);
          if (!r.ok) {
            toast.error(actionErrorText(r.error, tx));
            return;
          }
          setItems((prev) => prev.filter((m) => !confirm.includes(m.id)));
          setSelected(new Set());
          if (open && confirm.includes(open.id)) setOpen(null);
          toast.success(tx("Deleted", "تم الحذف"));
          router.refresh();
        }}
      />
    </>
  );
}

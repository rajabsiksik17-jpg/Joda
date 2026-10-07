"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Archive, Download, Inbox, Mail, MailOpen, Phone, Reply, Trash2 } from "lucide-react";
import { useAdminI18n } from "@/components/admin/i18n";
import { actionErrorText } from "@/components/admin/fields/env";
import { Badge, Button, ConfirmDialog, Drawer, EmptyState, SearchInput, Textarea } from "@/components/admin/ui";
import { formatDateTime, relativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { deleteMessages, saveMessageNotes, setMessagesStatus } from "./actions";

type Msg = { id: string; name: string; email: string; phone: string | null; company: string | null; subject: string | null; service: string | null; message: string; locale: string; consent: boolean; status: string; readAt: string | null; notes: string | null; ip: string | null; createdAt: string };

export function MessagesInbox({ rows, opened, total, page, pages, status, q, counts, canManage }: { rows: Msg[]; opened: Msg | null; total: number; page: number; pages: number; status: string; q: string; counts: Record<"NEW" | "READ" | "ARCHIVED", number>; canManage: boolean }) {
  const { tx, locale } = useAdminI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState(rows);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Msg | null>(opened);
  const [search, setSearch] = useState(q);
  const [notes, setNotes] = useState(opened?.notes ?? "");
  const openMessage = (m: Msg | null) => {
    setOpen(m);
    setNotes(m?.notes ?? "");
  };
  const [confirm, setConfirm] = useState<string[] | null>(null);

  const href = (params: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    const merged = { status, q, page: undefined as number | undefined, ...params };
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, String(v));
    return `${pathname}?${sp.toString()}`;
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== q) router.replace(href({ q: search, page: undefined }));
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Opening a new message marks it as read.
  useEffect(() => {
    if (!open) return;
    if (open.status === "NEW") {
      setMessagesStatus([open.id], "READ").then((r) => {
        if (r.ok) {
          setItems((prev) => prev.map((m) => (m.id === open.id ? { ...m, status: "READ" } : m)));
          router.refresh();
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open?.id]);

  const apply = async (list: string[], s: "NEW" | "READ" | "ARCHIVED") => {
    const r = await setMessagesStatus(list, s);
    if (!r.ok) return toast.error(actionErrorText(r.error, tx));
    setItems((prev) => (s === "ARCHIVED" && status !== "ARCHIVED" ? prev.filter((m) => !list.includes(m.id)) : prev.map((m) => (list.includes(m.id) ? { ...m, status: s } : m))));
    setSelected(new Set());
    if (open && list.includes(open.id)) setOpen(s === "ARCHIVED" ? null : { ...open, status: s });
    toast.success(s === "ARCHIVED" ? tx("Archived", "تمت الأرشفة") : s === "READ" ? tx("Marked as read", "تم التعليم كمقروء") : tx("Marked as unread", "تم التعليم كغير مقروء"));
    router.refresh();
  };

  const tabs: [string, string, number | null][] = [["", tx("Inbox", "الوارد"), counts.NEW + counts.READ], ["NEW", tx("Unread", "غير مقروءة"), counts.NEW], ["READ", tx("Read", "مقروءة"), counts.READ], ["ARCHIVED", tx("Archived", "مؤرشفة"), counts.ARCHIVED]];
  const allSelected = items.length > 0 && items.every((m) => selected.has(m.id));
  const exportHref = `/api/admin/messages/export?${new URLSearchParams({ ...(status ? { status } : {}), ...(q ? { q } : {}) }).toString()}`;

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <nav className="flex gap-1 overflow-x-auto" aria-label={tx("Filter", "تصفية")}>
          {tabs.map(([s, label, n]) => (
            <Link key={s || "all"} href={href({ status: s || undefined, page: undefined })} className={cn("shrink-0 rounded-md px-3 py-1.5 text-sm font-medium", status === s ? "bg-navy text-white" : "text-ink hover:bg-white")}>
              {label} {n !== null && <span className="opacity-60" dir="ltr">{n}</span>}
            </Link>
          ))}
        </nav>
        <div className="flex gap-2 lg:ms-auto">
          <SearchInput value={search} onChange={setSearch} className="flex-1 lg:w-72" placeholder={tx("Search name, e-mail, company…", "ابحث بالاسم أو البريد أو الشركة…")} />
          <a href={exportHref} download><Button><Download className="size-4" /><span className="hidden sm:inline">{tx("Export CSV", "تصدير CSV")}</span></Button></a>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-tech/30 bg-sky-50 px-3 py-2 text-sm">
          <span className="font-semibold text-ink">{selected.size} {tx("selected", "محدد")}</span>
          <Button size="sm" onClick={() => apply([...selected], "READ")}><MailOpen className="size-3.5" />{tx("Mark read", "تعليم كمقروء")}</Button>
          <Button size="sm" onClick={() => apply([...selected], "NEW")}><Mail className="size-3.5" />{tx("Mark unread", "تعليم كغير مقروء")}</Button>
          {canManage && <Button size="sm" onClick={() => apply([...selected], "ARCHIVED")}><Archive className="size-3.5" />{tx("Archive", "أرشفة")}</Button>}
          {canManage && <Button size="sm" variant="danger" onClick={() => setConfirm([...selected])}><Trash2 className="size-3.5" />{tx("Delete", "حذف")}</Button>}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState icon={<Inbox className="size-5" />} title={q ? tx("No messages match your search", "لا توجد رسائل مطابقة") : tx("No messages here", "لا توجد رسائل هنا")} text={tx("Enquiries from the contact form appear here and are e-mailed to the notification addresses in Contact details.", "تظهر هنا استفسارات نموذج التواصل وتُرسل إلى عناوين الإشعار في بيانات التواصل.")} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-white">
          <div className="flex items-center gap-3 border-b border-line bg-surface/60 px-4 py-2 text-xs text-muted">
            <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(items.map((m) => m.id)))} aria-label={tx("Select all", "تحديد الكل")} className="size-4 accent-tech" />
            <span>{total} {tx("messages", "رسالة")}</span>
          </div>
          <ul className="divide-y divide-line">
            {items.map((m) => (
              <li key={m.id} className={cn("flex items-start gap-3 px-4 py-3", m.status === "NEW" && "bg-sky-50/40")}>
                <input type="checkbox" checked={selected.has(m.id)} onChange={() => setSelected((s) => { const n = new Set(s); if (n.has(m.id)) n.delete(m.id); else n.add(m.id); return n; })} aria-label={tx("Select", "تحديد")} className="mt-1 size-4 accent-tech" />
                <button type="button" onClick={() => openMessage(m)} className="min-w-0 flex-1 text-start">
                  <span className="flex items-center gap-2">
                    {m.status === "NEW" && <span className="size-2 shrink-0 rounded-full bg-tech-600" aria-label={tx("Unread", "غير مقروءة")} />}
                    <span className={cn("truncate text-sm", m.status === "NEW" ? "font-bold text-ink" : "font-medium text-ink")}>{m.name}</span>
                    {m.company && <span className="truncate text-xs text-muted">· {m.company}</span>}
                    <span className="ms-auto shrink-0 text-xs text-muted">{relativeTime(m.createdAt, locale)}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-ink/80">{m.subject || m.service || tx("(no subject)", "(بدون موضوع)")}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted" dir="auto">{m.message}</span>
                </button>
              </li>
            ))}
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
        onOpenChange={(o) => { if (!o) { setOpen(null); if (opened) router.replace(href({})); } }}
        title={open?.subject || open?.name || ""}
        description={open ? formatDateTime(open.createdAt, locale) : undefined}
        footer={
          open && (
            <>
              {canManage && <Button variant="ghost" className="me-auto text-red-600 hover:bg-red-50" onClick={() => setConfirm([open.id])}><Trash2 className="size-4" />{tx("Delete", "حذف")}</Button>}
              <Button onClick={() => apply([open.id], open.status === "NEW" ? "READ" : "NEW")}>{open.status === "NEW" ? <MailOpen className="size-4" /> : <Mail className="size-4" />}{open.status === "NEW" ? tx("Mark read", "تعليم كمقروء") : tx("Mark unread", "تعليم كغير مقروء")}</Button>
              {canManage && open.status !== "ARCHIVED" && <Button onClick={() => apply([open.id], "ARCHIVED")}><Archive className="size-4" />{tx("Archive", "أرشفة")}</Button>}
              <a href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject || ""}`)}`}><Button variant="primary"><Reply className="size-4" />{tx("Reply by e-mail", "الرد بالبريد")}</Button></a>
            </>
          )
        }
      >
        {open && (
          <div className="space-y-6">
            <dl className="grid gap-x-6 gap-y-3 rounded-lg border border-line bg-surface/40 p-4 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-muted">{tx("Name", "الاسم")}</dt><dd className="font-semibold text-ink">{open.name}</dd></div>
              <div><dt className="text-xs text-muted">{tx("E-mail", "البريد")}</dt><dd><a className="font-semibold text-tech-600" href={`mailto:${open.email}`} dir="ltr">{open.email}</a></dd></div>
              {open.phone && <div><dt className="text-xs text-muted">{tx("Phone", "الهاتف")}</dt><dd><a className="inline-flex items-center gap-1.5 font-semibold text-tech-600" href={`tel:${open.phone.replace(/[^\d+]/g, "")}`} dir="ltr"><Phone className="size-3.5" />{open.phone}</a></dd></div>}
              {open.company && <div><dt className="text-xs text-muted">{tx("Organization", "المؤسسة")}</dt><dd className="font-semibold text-ink">{open.company}</dd></div>}
              {open.service && <div><dt className="text-xs text-muted">{tx("Service", "الخدمة")}</dt><dd className="font-semibold text-ink">{open.service}</dd></div>}
              <div><dt className="text-xs text-muted">{tx("Language", "اللغة")}</dt><dd><Badge>{open.locale.toUpperCase()}</Badge></dd></div>
              <div><dt className="text-xs text-muted">{tx("Consent", "الموافقة")}</dt><dd className="text-ink">{open.consent ? tx("Given", "تمت") : tx("Not given", "لم تتم")}</dd></div>
            </dl>
            <div>
              <p className="mb-2 text-sm font-semibold text-ink">{tx("Message", "الرسالة")}</p>
              <div className="rounded-lg border border-line bg-white p-4 text-[0.95rem] leading-relaxed whitespace-pre-wrap text-ink" dir="auto">{open.message}</div>
            </div>
            <div>
              <label htmlFor="msg-notes" className="mb-2 block text-sm font-semibold text-ink">{tx("Internal notes", "ملاحظات داخلية")}</label>
              <Textarea id="msg-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={4000} placeholder={tx("Visible to staff only", "مرئية للموظفين فقط")} />
              <Button size="sm" className="mt-2" disabled={notes === (open.notes ?? "")} onClick={async () => { const r = await saveMessageNotes(open.id, notes); if (r.ok) { toast.success(tx("Notes saved", "تم حفظ الملاحظات")); setOpen({ ...open, notes }); setItems((p) => p.map((m) => (m.id === open.id ? { ...m, notes } : m))); } else toast.error(actionErrorText(r.error, tx)); }}>
                {tx("Save notes", "حفظ الملاحظات")}
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm && confirm.length > 1 ? tx(`Delete ${confirm.length} messages?`, `حذف ${confirm.length} رسائل؟`) : tx("Delete this message?", "حذف هذه الرسالة؟")}
        description={tx("Messages are deleted permanently.", "تُحذف الرسائل نهائياً.")}
        onConfirm={async () => {
          if (!confirm) return;
          const r = await deleteMessages(confirm);
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

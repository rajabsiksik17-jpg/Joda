import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requirePage } from "@/lib/auth/session";
import { getAdminLocale, makeTx } from "@/lib/i18n/admin-locale";
import { auditLabel, auditTone } from "@/lib/audit-labels";
import { formatDateTime } from "@/lib/format";
import { Badge, PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Audit log" };

const PAGE_SIZE = 50;
const AREAS = ["auth", "page", "service", "post", "media", "collection", "navigation", "settings", "email", "message", "user", "role", "account", "template"];

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ area?: string; user?: string; from?: string; to?: string; page?: string }> }) {
  await requirePage("audit.view");
  const locale = await getAdminLocale();
  const tx = makeTx(locale);
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const from = sp.from && !Number.isNaN(Date.parse(sp.from)) ? new Date(sp.from) : undefined;
  const to = sp.to && !Number.isNaN(Date.parse(sp.to)) ? new Date(new Date(sp.to).getTime() + 86_400_000) : undefined;
  const where: Prisma.AuditLogWhereInput = {
    ...(sp.area && AREAS.includes(sp.area) ? { action: { startsWith: `${sp.area}.` } } : {}),
    ...(sp.user ? { userId: sp.user } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}),
  };
  const [total, rows, users] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { user: { select: { name: true } } } }),
    db.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => `?${new URLSearchParams({ ...(sp.area ? { area: sp.area } : {}), ...(sp.user ? { user: sp.user } : {}), ...(sp.from ? { from: sp.from } : {}), ...(sp.to ? { to: sp.to } : {}), page: String(p) }).toString()}`;
  const field = "h-10 rounded-md border border-line-strong bg-white px-3 text-sm";

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={tx("Audit log", "سجل التدقيق")} description={tx("A tamper-evident record of sign-ins and administrative changes.", "سجل لعمليات الدخول والتغييرات الإدارية.")} />
      <form className="mb-4 flex flex-wrap items-end gap-2" action="/admin/audit">
        <label className="text-xs text-muted">{tx("Area", "المجال")}<select name="area" defaultValue={sp.area ?? ""} className={`${field} mt-1 block`}><option value="">{tx("All", "الكل")}</option>{AREAS.map((a) => <option key={a} value={a}>{a}</option>)}</select></label>
        <label className="text-xs text-muted">{tx("User", "المستخدم")}<select name="user" defaultValue={sp.user ?? ""} className={`${field} mt-1 block`}><option value="">{tx("All", "الكل")}</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
        <label className="text-xs text-muted">{tx("From", "من")}<input type="date" name="from" defaultValue={sp.from} className={`${field} mt-1 block`} /></label>
        <label className="text-xs text-muted">{tx("To", "إلى")}<input type="date" name="to" defaultValue={sp.to} className={`${field} mt-1 block`} /></label>
        <button type="submit" className="h-10 rounded-md bg-navy px-4 text-sm font-medium text-white">{tx("Filter", "تصفية")}</button>
        <Link href="/admin/audit" className="h-10 px-2 text-sm leading-10 text-muted hover:text-ink">{tx("Reset", "إعادة تعيين")}</Link>
      </form>
      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full min-w-[46rem] text-sm">
          <thead className="bg-surface/70 text-xs text-muted">
            <tr>
              <th className="px-4 py-2.5 text-start font-semibold">{tx("When", "الوقت")}</th>
              <th className="px-4 py-2.5 text-start font-semibold">{tx("Action", "الإجراء")}</th>
              <th className="px-4 py-2.5 text-start font-semibold">{tx("By", "بواسطة")}</th>
              <th className="px-4 py-2.5 text-start font-semibold">{tx("Details", "التفاصيل")}</th>
              <th className="px-4 py-2.5 text-start font-semibold">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id} className="align-top">
                <td className="px-4 py-2.5 whitespace-nowrap text-muted">{formatDateTime(r.createdAt, locale)}</td>
                <td className="px-4 py-2.5"><Badge tone={auditTone(r.action)}>{auditLabel(r.action, locale)}</Badge></td>
                <td className="px-4 py-2.5 text-ink">{r.user?.name ?? r.actorEmail ?? "—"}</td>
                <td className="max-w-md px-4 py-2.5">
                  {(r.entityType || r.metadata) && (
                    <details>
                      <summary className="cursor-pointer text-xs text-tech-600">{r.entityType ?? tx("details", "تفاصيل")}{r.entityId ? ` · ${r.entityId.slice(0, 10)}…` : ""}</summary>
                      <pre className="mt-1 max-h-48 overflow-auto rounded bg-surface p-2 text-[0.7rem] whitespace-pre-wrap text-ink" dir="ltr">{JSON.stringify(r.metadata, null, 2)}</pre>
                    </details>
                  )}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted" dir="ltr">{r.ip ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        {page > 1 ? <Link className="rounded-md border border-line-strong bg-white px-3 py-1.5" href={qs(page - 1)}>{tx("Previous", "السابق")}</Link> : <span />}
        <span className="text-muted" dir="ltr">{total} · {page}/{pages}</span>
        {page < pages ? <Link className="rounded-md border border-line-strong bg-white px-3 py-1.5" href={qs(page + 1)}>{tx("Next", "التالي")}</Link> : <span />}
      </div>
    </div>
  );
}

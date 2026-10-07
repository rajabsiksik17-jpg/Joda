import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requirePage } from "@/lib/auth/session";
import { getAdminLocale, makeTx } from "@/lib/i18n/admin-locale";
import { tr, type L } from "@/lib/i18n/localized";
import { consultationWhere } from "@/lib/admin/consultations-query";
import { PageHeader } from "@/components/admin/ui";
import { ConsultationsInbox } from "./inbox";

export const metadata: Metadata = { title: "Consultation requests" };

const PAGE_SIZE = 25;

type SP = { status?: string; q?: string; service?: string; country?: string; page?: string; open?: string };

export default async function ConsultationsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requirePage("consultations.view");
  const locale = await getAdminLocale();
  const tx = makeTx(locale);
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = consultationWhere(sp);
  const [total, rows, counts, opened, services, countries] = await Promise.all([
    db.consultationRequest.count({ where }),
    db.consultationRequest.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.consultationRequest.groupBy({ by: ["status"], _count: true }),
    sp.open ? db.consultationRequest.findUnique({ where: { id: sp.open.slice(0, 64) } }) : Promise.resolve(null),
    db.service.findMany({ where: { deletedAt: null }, orderBy: { order: "asc" }, select: { id: true, title: true } }),
    db.consultationRequest.groupBy({ by: ["country"], _count: true, where: { country: { not: null } } }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const names = new Intl.DisplayNames([locale], { type: "region" });
  const countryName = (code: string | null) => {
    if (!code) return "";
    try {
      return names.of(code) ?? code;
    } catch {
      return code;
    }
  };
  const serialize = (m: (typeof rows)[number]) => ({
    id: m.id, name: m.name, company: m.company, email: m.email, phoneE164: m.phoneE164, phoneNumber: m.phoneNumber, phoneCountry: m.phoneCountry,
    country: m.country, countryLabel: m.country ? `${countryName(m.country)} (${m.country})` : "", serviceTitle: m.serviceTitle, preferredContact: m.preferredContact,
    message: m.message, locale: m.locale, sourcePage: m.sourcePage, status: m.status, notes: m.notes, consent: m.consent,
    createdAt: m.createdAt.toISOString(), contactedAt: m.contactedAt?.toISOString() ?? null, completedAt: m.completedAt?.toISOString() ?? null,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={tx("Consultation requests", "طلبات الاستشارة")} description={tx("Requests submitted through the consultation form. Track each one from pending to completed.", "الطلبات المرسلة عبر نموذج طلب الاستشارة. تابع كل طلب من الانتظار حتى الإنجاز.")} />
      <ConsultationsInbox
        key={JSON.stringify(sp)}
        rows={rows.map(serialize)}
        opened={opened ? serialize(opened) : null}
        total={total}
        page={page}
        pages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        filters={{ status: sp.status ?? "", q: sp.q ?? "", service: sp.service ?? "", country: sp.country ?? "" }}
        counts={{ PENDING: count("PENDING"), CONTACTED: count("CONTACTED"), COMPLETED: count("COMPLETED"), ARCHIVED: count("ARCHIVED") }}
        services={services.map((s) => ({ id: s.id, title: tr(s.title as L, locale, true) }))}
        countries={countries.filter((c) => c.country).map((c) => ({ code: c.country!, label: `${countryName(c.country)} (${c.country})`, count: c._count })).sort((a, b) => b.count - a.count)}
        canManage={user.permissions.has("consultations.manage")}
      />
    </div>
  );
}

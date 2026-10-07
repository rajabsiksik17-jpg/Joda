import { db } from "@/lib/db";
import { apiAuthorize } from "@/lib/api-guard";
import { audit } from "@/lib/audit";
import { consultationWhere } from "@/lib/admin/consultations-query";

export const dynamic = "force-dynamic";

function csvCell(v: unknown) {
  let s = v === null || v === undefined ? "" : v instanceof Date ? v.toISOString() : String(v);
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** CSV export of consultation requests (UTF-8 with BOM so Excel shows Arabic correctly). */
export async function GET(request: Request) {
  const user = await apiAuthorize(request, ["consultations.view"]);
  if (user instanceof Response) return user;
  const url = new URL(request.url);
  const p = (k: string) => url.searchParams.get(k) ?? undefined;
  const filter = { status: p("status"), q: p("q"), service: p("service"), country: p("country") };
  const rows = await db.consultationRequest.findMany({ where: consultationWhere(filter), orderBy: { createdAt: "desc" }, take: 10_000 });
  const header = ["Date", "Status", "Name", "Organization", "Email", "Phone (E.164)", "Country", "Area of interest", "Preferred contact", "Message", "Language", "Source page", "Contacted at", "Completed at", "Notes"];
  const lines = [
    header.map(csvCell).join(","),
    ...rows.map((r) => [r.createdAt, r.status, r.name, r.company, r.email, r.phoneE164, r.country, r.serviceTitle, r.preferredContact, r.message, r.locale, r.sourcePage, r.contactedAt, r.completedAt, r.notes].map(csvCell).join(",")),
  ];
  await audit({ action: "consultation.export", userId: user.id, actorEmail: user.email, metadata: { count: rows.length, ...filter } });
  return new Response(`﻿${lines.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="consultations-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

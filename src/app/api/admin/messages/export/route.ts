import { db } from "@/lib/db";
import { apiAuthorize } from "@/lib/api-guard";
import { audit } from "@/lib/audit";
import { messageWhere } from "@/lib/admin/messages-query";

export const dynamic = "force-dynamic";

function csvCell(v: unknown) {
  let s = v === null || v === undefined ? "" : v instanceof Date ? v.toISOString() : String(v);
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** CSV export of contact messages (UTF-8 with BOM so Excel shows Arabic correctly). */
export async function GET(request: Request) {
  const user = await apiAuthorize(request, ["messages.view"]);
  if (user instanceof Response) return user;
  const url = new URL(request.url);
  const filter = { status: url.searchParams.get("status") ?? undefined, q: url.searchParams.get("q") ?? undefined };
  const rows = await db.contactMessage.findMany({ where: messageWhere(filter), orderBy: { createdAt: "desc" }, take: 10_000 });
  const header = ["Date", "Status", "Name", "Email", "Phone", "Company", "Service", "Subject", "Message", "Language", "Notes"];
  const lines = [header.map(csvCell).join(","), ...rows.map((r) => [r.createdAt, r.status, r.name, r.email, r.phone, r.company, r.service, r.subject, r.message, r.locale, r.notes].map(csvCell).join(","))];
  await audit({ action: "message.export", userId: user.id, actorEmail: user.email, metadata: { count: rows.length, ...filter } });
  return new Response(`﻿${lines.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="messages-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

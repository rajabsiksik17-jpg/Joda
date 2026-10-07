import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requirePage } from "@/lib/auth/session";
import { getAdminLocale, makeTx } from "@/lib/i18n/admin-locale";
import { messageWhere } from "@/lib/admin/messages-query";
import { PageHeader } from "@/components/admin/ui";
import { MessagesInbox } from "./inbox";

export const metadata: Metadata = { title: "Messages" };

const PAGE_SIZE = 25;

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string; open?: string }> }) {
  const user = await requirePage("messages.view");
  const tx = makeTx(await getAdminLocale());
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = messageWhere(sp);
  const [total, rows, counts, opened] = await Promise.all([
    db.contactMessage.count({ where }),
    db.contactMessage.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.contactMessage.groupBy({ by: ["status"], _count: true }),
    sp.open ? db.contactMessage.findUnique({ where: { id: sp.open } }) : Promise.resolve(null),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const serialize = (m: (typeof rows)[number]) => ({ ...m, createdAt: m.createdAt.toISOString(), readAt: m.readAt?.toISOString() ?? null, updatedAt: m.updatedAt.toISOString() });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={tx("Messages", "الرسائل")} description={tx("Enquiries submitted through the website contact form.", "الاستفسارات المرسلة عبر نموذج التواصل في الموقع.")} />
      <MessagesInbox
        key={JSON.stringify(sp)}
        rows={rows.map(serialize)}
        opened={opened ? serialize(opened) : null}
        total={total}
        page={page}
        pages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        status={sp.status ?? ""}
        q={sp.q ?? ""}
        counts={{ NEW: count("NEW"), READ: count("READ"), ARCHIVED: count("ARCHIVED") }}
        canManage={user.permissions.has("messages.manage")}
      />
    </div>
  );
}

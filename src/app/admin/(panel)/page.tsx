import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, AlertTriangle, ArrowUpRight, FilePlus2, FileText, ImageUp, Inbox, Layers, Mail, Newspaper, PenLine, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requirePage } from "@/lib/auth/session";
import { getAdminLocale, makeTx } from "@/lib/i18n/admin-locale";
import { tr } from "@/lib/i18n/localized";
import { auditLabel, auditTone } from "@/lib/audit-labels";
import { relativeTime } from "@/lib/format";
import { getEmailStatus } from "@/lib/email/status";
import { readSetting } from "@/lib/settings";
import { Badge, Card } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requirePage("dashboard.view");
  const locale = await getAdminLocale();
  const tx = makeTx(locale);
  const can = (p: Parameters<typeof user.permissions.has>[0]) => user.permissions.has(p);
  const { denied } = await searchParams;

  const [pagesPublished, pagesDraft, pagesChanged, services, postsPublished, postsDraft, unread, mediaCount, userCount, recentMessages, activity, smtp, maintenance, home, pendingConsultations] = await Promise.all([
    db.page.count({ where: { deletedAt: null, status: "PUBLISHED" } }),
    db.page.count({ where: { deletedAt: null, status: "DRAFT" } }),
    db.page.findMany({ where: { deletedAt: null, status: "PUBLISHED", hasUnpublishedChanges: true }, select: { id: true, title: true }, take: 5 }),
    db.service.count({ where: { deletedAt: null, status: "PUBLISHED" } }),
    db.blogPost.count({ where: { deletedAt: null, status: "PUBLISHED" } }),
    db.blogPost.count({ where: { deletedAt: null, status: "DRAFT" } }),
    can("messages.view") ? db.contactMessage.count({ where: { status: "NEW" } }) : Promise.resolve(0),
    db.media.count(),
    can("users.manage") ? db.user.count() : Promise.resolve(0),
    can("messages.view") ? db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 5 }) : Promise.resolve([]),
    can("audit.view") ? db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: { select: { name: true } } } }) : Promise.resolve([]),
    getEmailStatus(),
    readSetting("maintenance"),
    db.page.findUnique({ where: { slug: "home" }, select: { id: true } }),
    can("consultations.view") ? db.consultationRequest.count({ where: { status: "PENDING" } }) : Promise.resolve(0),
  ]);

  const stats = [
    { label: tx("Published pages", "الصفحات المنشورة"), value: pagesPublished, sub: tx(`${pagesDraft} draft`, `${pagesDraft} مسودة`), icon: FileText, href: "/admin/pages", show: can("pages.view") },
    { label: tx("Services", "الخدمات"), value: services, sub: tx("published", "منشورة"), icon: Layers, href: "/admin/services", show: can("services.edit") },
    { label: tx("Insights", "المقالات"), value: postsPublished, sub: tx(`${postsDraft} draft`, `${postsDraft} مسودة`), icon: Newspaper, href: "/admin/insights", show: can("blog.edit") },
    { label: tx("Pending consultations", "استشارات بانتظار المتابعة"), value: pendingConsultations, sub: tx("awaiting contact", "بانتظار التواصل"), icon: CalendarCheck, href: "/admin/consultations?status=PENDING", show: can("consultations.view"), highlight: pendingConsultations > 0 },
    { label: tx("Unread messages", "رسائل غير مقروءة"), value: unread, sub: tx("in inbox", "في البريد الوارد"), icon: Inbox, href: "/admin/messages?status=NEW", show: can("messages.view"), highlight: unread > 0 },
    { label: tx("Media files", "ملفات الوسائط"), value: mediaCount, sub: tx("in library", "في المكتبة"), icon: ImageUp, href: "/admin/media", show: can("media.manage") },
    { label: tx("Users", "المستخدمون"), value: userCount, sub: tx("accounts", "حساب"), icon: Users, href: "/admin/users", show: can("users.manage") },
  ].filter((s) => s.show);

  const alerts: { text: string; href: string; tone: "danger" | "warning" }[] = [];
  if (smtp.state !== "active" && can("email.manage")) {
    const msg = {
      not_configured: tx("E-mail is not configured: enquiry notifications are not sent and sign-in uses the password only.", "البريد غير مُعد: لا تُرسل إشعارات الاستفسارات ويعتمد الدخول على كلمة المرور فقط."),
      unverified: tx("E-mail is configured but not verified yet — run a test on the Email page to activate notifications and sign-in verification.", "البريد مُعد ولم يتم التحقق منه بعد — شغّل اختباراً من صفحة البريد لتفعيل الإشعارات والتحقق عند الدخول."),
      disabled: tx("Outgoing e-mail is disabled.", "البريد الصادر معطّل."),
    }[smtp.state as "not_configured" | "unverified" | "disabled"];
    alerts.push({ text: msg, href: "/admin/email", tone: smtp.state === "not_configured" ? "danger" : "warning" });
  }
  if (maintenance.enabled && can("settings.edit")) alerts.push({ text: tx("Maintenance mode is ON — visitors see the maintenance screen.", "وضع الصيانة مفعّل — يرى الزوار شاشة الصيانة."), href: "/admin/settings?tab=maintenance", tone: "warning" });
  for (const p of pagesChanged) alerts.push({ text: tx(`"${tr(p.title, "en", true)}" has unpublished changes.`, `«${tr(p.title, "ar", true)}» تحتوي على تغييرات غير منشورة.`), href: `/admin/pages/${p.id}`, tone: "warning" });

  const quick = [
    { label: tx("Edit homepage", "تحرير الصفحة الرئيسية"), href: home ? `/admin/pages/${home.id}` : "/admin/pages", icon: PenLine, show: can("pages.edit") },
    { label: tx("New page", "صفحة جديدة"), href: "/admin/pages?new=1", icon: FilePlus2, show: can("pages.edit") },
    { label: tx("Write an insight", "كتابة مقال"), href: "/admin/insights/new", icon: Newspaper, show: can("blog.edit") },
    { label: tx("Upload media", "رفع وسائط"), href: "/admin/media", icon: ImageUp, show: can("media.manage") },
  ].filter((q) => q.show);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <p className="text-sm text-muted">{tx("Welcome back,", "مرحباً بعودتك،")}</p>
        <h1 className="text-2xl font-bold text-ink">{user.name}</h1>
      </div>

      {denied && (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {tx("You don't have permission to open that section.", "ليست لديك صلاحية لفتح ذلك القسم.")}
        </div>
      )}

      {alerts.length > 0 && (
        <ul className="mb-8 space-y-2">
          {alerts.map((a, i) => (
            <li key={i}>
              <Link href={a.href} className={`flex items-start gap-3 rounded-lg border p-3.5 text-sm transition-colors ${a.tone === "danger" ? "border-red-200 bg-red-50 text-red-900 hover:bg-red-100/70" : "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100/70"}`}>
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span className="flex-1">{a.text}</span>
                <ArrowUpRight className="size-4 shrink-0 opacity-60 rtl:-scale-x-100" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group">
            <Card className={`flex items-center gap-4 p-5 transition-shadow group-hover:shadow-soft ${s.highlight ? "border-tech/40 bg-sky-50/40" : ""}`}>
              <span className={`grid size-12 place-items-center rounded-lg ${s.highlight ? "bg-tech-600 text-white" : "bg-sky-50 text-tech-600"}`}><s.icon className="size-5" aria-hidden /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted">{s.label}</p>
                <p className="text-2xl font-bold text-ink" dir="ltr">{s.value}</p>
              </div>
              <span className="text-xs text-muted">{s.sub}</span>
            </Card>
          </Link>
        ))}
      </div>

      {quick.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {quick.map((q) => (
            <Link key={q.href} href={q.href} className="inline-flex items-center gap-2 rounded-md border border-line-strong bg-white px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-tech hover:text-tech-600">
              <q.icon className="size-4" aria-hidden />
              {q.label}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {can("messages.view") && (
          <Card>
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-semibold text-ink">{tx("Latest messages", "أحدث الرسائل")}</h2>
              <Link href="/admin/messages" className="text-sm font-medium text-tech-600 hover:text-tech-700">{tx("View all", "عرض الكل")}</Link>
            </div>
            {recentMessages.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-5 py-12 text-center text-sm text-muted">
                <Mail className="size-6 text-mist" aria-hidden />
                {tx("No messages yet. Enquiries from the contact form will appear here.", "لا توجد رسائل بعد. ستظهر هنا استفسارات نموذج التواصل.")}
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {recentMessages.map((m) => (
                  <li key={m.id}>
                    <Link href={`/admin/messages?open=${m.id}`} className="flex items-start gap-3 px-5 py-3.5 hover:bg-surface/60">
                      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${m.status === "NEW" ? "bg-tech-600" : "bg-transparent"}`} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm ${m.status === "NEW" ? "font-semibold text-ink" : "text-ink"}`}>{m.subject || m.message.slice(0, 60)}</span>
                        <span className="block truncate text-xs text-muted">{m.name} · {m.email}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted">{relativeTime(m.createdAt, locale)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
        {can("audit.view") && (
          <Card>
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-semibold text-ink">{tx("Recent activity", "النشاط الأخير")}</h2>
              <Link href="/admin/audit" className="text-sm font-medium text-tech-600 hover:text-tech-700">{tx("Audit log", "سجل التدقيق")}</Link>
            </div>
            <ul className="divide-y divide-line">
              {activity.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <Badge tone={auditTone(a.action)}>{auditLabel(a.action, locale)}</Badge>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">{a.user?.name ?? a.actorEmail ?? tx("System", "النظام")}</span>
                  <span className="shrink-0 text-xs text-muted">{relativeTime(a.createdAt, locale)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}

import type { Permission } from "@/lib/auth/permissions";

export type AdminNavItem = { href: string; en: string; ar: string; icon: string; permission?: Permission; badgeKey?: "unread" | "consultations" };
export type AdminNavGroup = { en: string; ar: string; items: AdminNavItem[] };

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    en: "Overview",
    ar: "نظرة عامة",
    items: [
      { href: "/admin", en: "Dashboard", ar: "لوحة التحكم", icon: "LayoutDashboard", permission: "dashboard.view" },
      { href: "/admin/analytics", en: "Analytics", ar: "التحليلات", icon: "BarChart3", permission: "analytics.view" },
    ],
  },
  {
    en: "Content",
    ar: "المحتوى",
    items: [
      { href: "/admin/pages", en: "Pages", ar: "الصفحات", icon: "FileText", permission: "pages.view" },
      { href: "/admin/services", en: "Services", ar: "الخدمات", icon: "Layers", permission: "services.edit" },
      { href: "/admin/insights", en: "Insights", ar: "المقالات", icon: "Newspaper", permission: "blog.edit" },
      { href: "/admin/media", en: "Media library", ar: "مكتبة الوسائط", icon: "Images", permission: "media.manage" },
    ],
  },
  {
    en: "Company",
    ar: "الشركة",
    items: [
      { href: "/admin/collections/team", en: "Team & leadership", ar: "الفريق والقيادة", icon: "Users", permission: "collections.edit" },
      { href: "/admin/collections/partners", en: "Partners", ar: "الشركاء", icon: "Handshake", permission: "collections.edit" },
      { href: "/admin/collections/clients", en: "Clients", ar: "العملاء", icon: "Building2", permission: "collections.edit" },
      { href: "/admin/collections/testimonials", en: "Testimonials", ar: "آراء العملاء", icon: "Quote", permission: "collections.edit" },
      { href: "/admin/collections/faqs", en: "FAQs", ar: "الأسئلة الشائعة", icon: "CircleHelp", permission: "collections.edit" },
      { href: "/admin/collections/stats", en: "Statistics", ar: "الإحصاءات", icon: "ChartColumn", permission: "collections.edit" },
    ],
  },
  {
    en: "Website",
    ar: "الموقع",
    items: [
      { href: "/admin/navigation", en: "Navigation", ar: "القوائم", icon: "Menu", permission: "navigation.edit" },
      { href: "/admin/contact", en: "Contact details", ar: "بيانات التواصل", icon: "Phone", permission: "contact.edit" },
      { href: "/admin/seo", en: "SEO", ar: "تحسين محركات البحث", icon: "Search", permission: "seo.edit" },
      { href: "/admin/integrations", en: "Integrations", ar: "التكاملات", icon: "Plug", permission: "settings.edit" },
      { href: "/admin/settings", en: "Settings", ar: "الإعدادات", icon: "Settings", permission: "settings.edit" },
    ],
  },
  {
    en: "Inbox",
    ar: "البريد الوارد",
    items: [
      { href: "/admin/consultations", en: "Consultation requests", ar: "طلبات الاستشارة", icon: "CalendarCheck", permission: "consultations.view", badgeKey: "consultations" },
      { href: "/admin/messages", en: "Messages", ar: "الرسائل", icon: "Inbox", permission: "messages.view", badgeKey: "unread" },
    ],
  },
  {
    en: "System",
    ar: "النظام",
    items: [
      { href: "/admin/users", en: "Users", ar: "المستخدمون", icon: "UserCog", permission: "users.manage" },
      { href: "/admin/roles", en: "Roles & permissions", ar: "الأدوار والصلاحيات", icon: "ShieldCheck", permission: "roles.manage" },
      { href: "/admin/email", en: "Email (SMTP/IMAP)", ar: "البريد (SMTP/IMAP)", icon: "Mail", permission: "email.manage" },
      { href: "/admin/audit", en: "Audit log", ar: "سجل التدقيق", icon: "History", permission: "audit.view" },
    ],
  },
];

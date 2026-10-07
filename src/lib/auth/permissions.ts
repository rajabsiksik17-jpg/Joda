/**
 * Permission catalogue. Roles store a list of these keys; checks happen server-side in every
 * server action, route handler and admin page.
 */
export const PERMISSIONS = {
  "dashboard.view": { group: "general", en: "View dashboard", ar: "عرض لوحة التحكم" },

  "pages.view": { group: "content", en: "View pages", ar: "عرض الصفحات" },
  "pages.edit": { group: "content", en: "Create & edit pages", ar: "إنشاء وتعديل الصفحات" },
  "pages.publish": { group: "content", en: "Publish pages", ar: "نشر الصفحات" },
  "pages.delete": { group: "content", en: "Delete pages", ar: "حذف الصفحات" },

  "services.edit": { group: "content", en: "Manage services", ar: "إدارة الخدمات" },
  "blog.edit": { group: "content", en: "Write insights", ar: "كتابة المقالات" },
  "blog.publish": { group: "content", en: "Publish insights", ar: "نشر المقالات" },
  "collections.edit": { group: "content", en: "Manage team, partners, clients, FAQs, stats", ar: "إدارة الفريق والشركاء والعملاء والأسئلة والإحصاءات" },
  "media.manage": { group: "content", en: "Manage media library", ar: "إدارة مكتبة الوسائط" },

  "navigation.edit": { group: "site", en: "Manage navigation", ar: "إدارة القوائم" },
  "contact.edit": { group: "site", en: "Manage contact details", ar: "إدارة بيانات التواصل" },
  "seo.edit": { group: "site", en: "Manage SEO", ar: "إدارة تحسين محركات البحث" },
  "settings.edit": { group: "site", en: "Manage site settings", ar: "إدارة إعدادات الموقع" },

  "messages.view": { group: "inbox", en: "Read contact messages", ar: "قراءة رسائل التواصل" },
  "messages.manage": { group: "inbox", en: "Archive & delete messages", ar: "أرشفة وحذف الرسائل" },
  "consultations.view": { group: "inbox", en: "View consultation requests", ar: "عرض طلبات الاستشارة" },
  "consultations.manage": { group: "inbox", en: "Update, archive & delete consultation requests", ar: "تحديث طلبات الاستشارة وأرشفتها وحذفها" },

  "email.manage": { group: "system", en: "Configure email (SMTP/IMAP)", ar: "إعداد البريد الإلكتروني" },
  "users.manage": { group: "system", en: "Manage users", ar: "إدارة المستخدمين" },
  "roles.manage": { group: "system", en: "Manage roles & permissions", ar: "إدارة الأدوار والصلاحيات" },
  "audit.view": { group: "system", en: "View audit log", ar: "عرض سجل التدقيق" },
} as const;

export type Permission = keyof typeof PERMISSIONS;
export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

export const PERMISSION_GROUPS = {
  general: { en: "General", ar: "عام" },
  content: { en: "Content", ar: "المحتوى" },
  site: { en: "Site", ar: "الموقع" },
  inbox: { en: "Inbox", ar: "البريد الوارد" },
  system: { en: "System", ar: "النظام" },
} as const;

export function isPermission(value: string): value is Permission {
  return value in PERMISSIONS;
}

export const SUPER_ADMIN_ROLE = "super_admin";

/** Default roles created by the seed. Super Admin always has every permission. */
export const DEFAULT_ROLES: { key: string; name: { ar: string; en: string }; description: { ar: string; en: string }; permissions: Permission[] }[] = [
  {
    key: SUPER_ADMIN_ROLE,
    name: { ar: "مدير عام", en: "Super Admin" },
    description: { ar: "صلاحيات كاملة على النظام", en: "Full access to everything" },
    permissions: ALL_PERMISSIONS,
  },
  {
    key: "admin",
    name: { ar: "مدير", en: "Admin" },
    description: { ar: "إدارة المحتوى والإعدادات دون إدارة الأدوار", en: "Content and settings, without role management" },
    permissions: ALL_PERMISSIONS.filter((p) => p !== "roles.manage"),
  },
  {
    key: "editor",
    name: { ar: "محرر", en: "Editor" },
    description: { ar: "إنشاء المحتوى ونشره", en: "Creates and publishes content" },
    permissions: [
      "dashboard.view", "pages.view", "pages.edit", "pages.publish", "services.edit", "blog.edit", "blog.publish",
      "collections.edit", "media.manage", "navigation.edit", "seo.edit", "messages.view", "consultations.view",
    ],
  },
  {
    key: "content_manager",
    name: { ar: "مدير محتوى", en: "Content Manager" },
    description: { ar: "إعداد المحتوى كمسودات دون نشر", en: "Prepares content as drafts without publishing" },
    permissions: ["dashboard.view", "pages.view", "pages.edit", "blog.edit", "collections.edit", "media.manage"],
  },
];

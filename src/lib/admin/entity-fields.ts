import { bi, type Field } from "../sections/fields";

const opt = (value: string, en: string, ar: string) => ({ value, label: bi(en, ar) });

const seoFields: Field[] = [
  { type: "text", name: "seoTitle", label: bi("Meta title (50–60 characters; defaults to the title)", "عنوان الميتا (50–60 حرفاً؛ افتراضياً العنوان)"), max: 120 },
  { type: "textarea", name: "seoDescription", label: bi("Meta description (120–160 characters)", "وصف الميتا (120–160 حرفاً)"), max: 320, rows: 3 },
  { type: "text", name: "ogTitle", label: bi("Social sharing title (optional)", "عنوان المشاركة الاجتماعية (اختياري)"), max: 120 },
  { type: "textarea", name: "ogDescription", label: bi("Social sharing description (optional)", "وصف المشاركة الاجتماعية (اختياري)"), max: 320, rows: 2 },
  { type: "media", name: "ogImageId", label: bi("Social sharing image (1200×630)", "صورة المشاركة الاجتماعية (1200×630)"), accept: "image" },
  { type: "boolean", name: "noindex", label: bi("Hide from search engines (noindex)", "إخفاء عن محركات البحث (noindex)") },
];

export const SERVICE_MAIN_FIELDS: Field[] = [
  { type: "text", name: "title", label: bi("Service name", "اسم الخدمة"), required: true, max: 120 },
  { type: "textarea", name: "summary", label: bi("One-line summary (cards, menus, search results)", "ملخص بسطر واحد (البطاقات والقوائم ونتائج البحث)"), max: 300, rows: 2 },
  { type: "textarea", name: "description", label: bi("Introduction", "المقدمة"), max: 3000, rows: 5 },
  { type: "textarea", name: "whyItMatters", label: bi("Why it matters", "لماذا تهم هذه الخدمة"), max: 2000, rows: 4 },
  {
    type: "list",
    name: "outcomes",
    label: bi("What it delivers (outcome cards)", "ما تحققه (بطاقات النتائج)"),
    itemTitle: "title",
    max: 6,
    addLabel: bi("Add outcome", "إضافة نتيجة"),
    fields: [
      { type: "icon", name: "icon", label: bi("Icon", "الأيقونة") },
      { type: "text", name: "title", label: bi("Title", "العنوان"), max: 120 },
      { type: "textarea", name: "text", label: bi("Text", "النص"), max: 400, rows: 2 },
    ],
  },
  {
    type: "list",
    name: "capabilities",
    label: bi("Capability groups", "مجموعات القدرات"),
    itemTitle: "title",
    max: 8,
    addLabel: bi("Add group", "إضافة مجموعة"),
    fields: [
      { type: "text", name: "title", label: bi("Group title", "عنوان المجموعة"), max: 120 },
      { type: "textarea", name: "text", label: bi("Group introduction (optional)", "مقدمة المجموعة (اختياري)"), max: 1500, rows: 3 },
      { type: "list", name: "items", label: bi("Capabilities", "القدرات"), itemTitle: "text", max: 40, addLabel: bi("Add capability", "إضافة قدرة"), fields: [{ type: "text", name: "text", label: bi("Capability", "القدرة"), max: 240 }] },
    ],
  },
  {
    type: "list",
    name: "steps",
    label: bi("Methodology steps (optional)", "خطوات المنهجية (اختياري)"),
    itemTitle: "title",
    max: 10,
    addLabel: bi("Add step", "إضافة خطوة"),
    fields: [
      { type: "text", name: "title", label: bi("Step", "الخطوة"), max: 120 },
      { type: "textarea", name: "text", label: bi("Description", "الوصف"), max: 600, rows: 2 },
    ],
  },
  { type: "text", name: "ctaLabel", label: bi("Call-to-action label (optional)", "نص زر الدعوة (اختياري)"), max: 60 },
];

export const SERVICE_SIDE_FIELDS: Field[] = [
  { type: "select", name: "status", label: bi("Status", "الحالة"), options: [opt("PUBLISHED", "Published", "منشورة"), opt("DRAFT", "Draft (hidden)", "مسودة (مخفية)")] },
  { type: "text", name: "slug", label: bi("URL identifier", "معرّف الرابط"), localized: false, format: "slug", required: true, max: 80 },
  { type: "icon", name: "icon", label: bi("Icon", "الأيقونة") },
  { type: "reference", name: "categoryId", label: bi("Category", "الفئة"), collection: "serviceCategories" },
  {
    type: "select",
    name: "visual",
    label: bi("Hero illustration", "الرسم التوضيحي للواجهة"),
    options: [
      opt("auto", "Automatic", "تلقائي"), opt("governance", "Governance framework", "إطار الحوكمة"), opt("ai", "Neural network", "شبكة عصبية"), opt("digital", "Digital transformation", "التحول الرقمي"),
      opt("efficiency", "Efficiency chart", "مخطط الكفاءة"), opt("strategy", "Strategy map", "خريطة استراتيجية"), opt("it", "Technology stack", "طبقات التقنية"), opt("finance", "Financial performance", "الأداء المالي"),
      opt("people", "Organisation chart", "الهيكل التنظيمي"), opt("capacity", "Capability steps", "درجات القدرات"), opt("iso", "Standards seal", "ختم المعايير"),
    ],
  },
  {
    type: "select",
    name: "capabilityLayout",
    label: bi("Capabilities layout", "تخطيط عرض القدرات"),
    options: [opt("grid", "Numbered grid", "شبكة مرقمة"), opt("tabs", "Tabs by group", "تبويبات حسب المجموعة"), opt("matrix", "Group columns", "أعمدة المجموعات"), opt("timeline", "Timeline", "خط زمني"), opt("standards", "Standards wall", "جدار المعايير")],
  },
  { type: "boolean", name: "featured", label: bi("Featured", "مميزة") },
  { type: "media", name: "imageId", label: bi("Image (optional)", "صورة (اختياري)"), accept: "image" },
  { type: "reference", name: "relatedIds", label: bi("Related services", "خدمات ذات صلة"), collection: "services", multiple: true },
];

export const SERVICE_SEO_FIELDS = seoFields;

export const POST_MAIN_FIELDS: Field[] = [
  { type: "text", name: "title", label: bi("Title (leave a language empty to publish in one language only)", "العنوان (اترك لغة فارغة للنشر بلغة واحدة فقط)"), required: true, max: 200 },
  { type: "textarea", name: "excerpt", label: bi("Excerpt", "المقتطف"), max: 500, rows: 3 },
  { type: "richtext", name: "content", label: bi("Article", "المقال") },
];

export const POST_SIDE_FIELDS: Field[] = [
  { type: "select", name: "status", label: bi("Status", "الحالة"), options: [opt("DRAFT", "Draft", "مسودة"), opt("PUBLISHED", "Published / scheduled", "منشور / مجدول")] },
  { type: "datetime", name: "publishedAt", label: bi("Publication date (a future date schedules the article)", "تاريخ النشر (التاريخ المستقبلي يجدول المقال)") },
  { type: "text", name: "slug", label: bi("URL identifier", "معرّف الرابط"), localized: false, format: "slug", required: true, max: 120 },
  { type: "media", name: "coverId", label: bi("Cover image", "صورة الغلاف"), accept: "image" },
  { type: "reference", name: "categoryId", label: bi("Category", "التصنيف"), collection: "blogCategories" },
  { type: "tags", name: "tags", label: bi("Tags", "الوسوم") },
  { type: "reference", name: "relatedServiceIds", label: bi("Related services (linked from the article and the service page)", "الخدمات ذات الصلة (تُربط من المقال ومن صفحة الخدمة)"), collection: "services", multiple: true },
  { type: "text", name: "authorName", label: bi("Author (optional)", "الكاتب (اختياري)"), localized: false, max: 120 },
  { type: "boolean", name: "featured", label: bi("Featured", "مميز") },
];

export const POST_SEO_FIELDS = seoFields;

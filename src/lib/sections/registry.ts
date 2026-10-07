import { z } from "zod";
import { bi, buildSchema, emptyValues, type Bi, type Field, type FieldValues } from "./fields";

export type SectionCategory = "hero" | "content" | "company" | "collections" | "conversion" | "media" | "layout";

export type SectionDefinition = {
  type: string;
  label: Bi;
  description: Bi;
  category: SectionCategory;
  /** lucide icon name for the admin picker */
  icon: string;
  fields: Field[];
  defaults?: FieldValues;
};

export const SECTION_CATEGORIES: Record<SectionCategory, Bi> = {
  hero: bi("Hero & headers", "الواجهات والعناوين"),
  content: bi("Content", "المحتوى"),
  company: bi("Company", "الشركة"),
  collections: bi("Dynamic collections", "المجموعات الديناميكية"),
  conversion: bi("Conversion", "التحويل والتواصل"),
  media: bi("Media", "الوسائط"),
  layout: bi("Layout", "التخطيط"),
};

// ── Reusable field fragments ──
const eyebrow: Field = { type: "text", name: "eyebrow", label: bi("Eyebrow (small label above title)", "عنوان تمهيدي صغير"), max: 80, width: "half" };
const title: Field = { type: "textarea", name: "title", label: bi("Title", "العنوان"), max: 240, rows: 2 };
const intro: Field = { type: "textarea", name: "text", label: bi("Introduction", "النص التمهيدي"), max: 1200, rows: 3 };
const cta = (name = "cta", label = bi("Button", "زر")): Field => ({ type: "link", name, label });
const opt = (value: string, en: string, ar: string) => ({ value, label: bi(en, ar) });

export const SECTIONS: SectionDefinition[] = [
  // ───────── Hero & headers ─────────
  {
    type: "hero",
    label: bi("Hero", "الواجهة الرئيسية"),
    description: bi("Opening statement with brand visual, image or video background.", "عبارة افتتاحية مع رسم الهوية أو صورة أو فيديو."),
    category: "hero",
    icon: "PanelTop",
    fields: [
      { type: "select", name: "variant", label: bi("Style", "النمط"), options: [opt("network", "Brand network visual", "رسم الشبكة (الهوية)"), opt("image", "Split with image", "مقسوم مع صورة"), opt("video", "Video background", "خلفية فيديو"), opt("minimal", "Minimal", "بسيط")] },
      eyebrow,
      { type: "textarea", name: "title", label: bi("Headline", "العنوان الرئيسي"), max: 200, rows: 2, required: true },
      { type: "text", name: "titleAccent", label: bi("Headline accent (shown in blue)", "تكملة العنوان (باللون الأزرق)"), max: 120 },
      { type: "textarea", name: "text", label: bi("Supporting text", "النص المساند"), max: 600, rows: 3 },
      cta("primaryCta", bi("Primary button", "الزر الرئيسي")),
      cta("secondaryCta", bi("Secondary button", "الزر الثانوي")),
      { type: "media", name: "image", label: bi("Image (split style)", "الصورة (للنمط المقسوم)"), accept: "image" },
      { type: "media", name: "video", label: bi("Video file (video style)", "ملف الفيديو (لنمط الفيديو)"), accept: "video" },
      { type: "boolean", name: "showStats", label: bi("Show key statistics", "إظهار الإحصاءات الرئيسية") },
    ],
    defaults: { variant: "network", showStats: true },
  },
  {
    type: "pageHeader",
    label: bi("Page header", "رأس الصفحة"),
    description: bi("Title band for inner pages with breadcrumbs.", "شريط عنوان للصفحات الداخلية مع مسار التنقل."),
    category: "hero",
    icon: "Type",
    fields: [
      eyebrow,
      { type: "textarea", name: "title", label: bi("Title", "العنوان"), max: 200, rows: 2, required: true },
      intro,
      { type: "boolean", name: "showBreadcrumbs", label: bi("Show breadcrumbs", "إظهار مسار التنقل") },
      { type: "media", name: "image", label: bi("Background image (optional)", "صورة خلفية (اختياري)"), accept: "image" },
    ],
    defaults: { showBreadcrumbs: true },
  },

  // ───────── Content ─────────
  {
    type: "textMedia",
    label: bi("Text & media", "نص ووسائط"),
    description: bi("Editorial split: text with an image or brand visual.", "تخطيط تحريري: نص بجانب صورة أو رسم الهوية."),
    category: "content",
    icon: "Columns2",
    fields: [
      eyebrow,
      title,
      { type: "richtext", name: "body", label: bi("Body", "النص") },
      { type: "list", name: "bullets", label: bi("Key points", "نقاط رئيسية"), itemTitle: "text", max: 12, fields: [{ type: "text", name: "text", label: bi("Point", "النقطة"), max: 200 }] },
      { type: "select", name: "visual", label: bi("Visual", "العنصر المرئي"), options: [opt("image", "Image", "صورة"), opt("network", "Brand network motif", "رسم الشبكة"), opt("squares", "Digital squares motif", "المربعات الرقمية"), opt("none", "None (text only)", "بدون")] },
      { type: "media", name: "image", label: bi("Image", "الصورة"), accept: "image" },
      { type: "select", name: "imagePosition", label: bi("Visual position", "موضع العنصر المرئي"), options: [opt("end", "After text", "بعد النص"), opt("start", "Before text", "قبل النص")] },
      cta(),
      { type: "boolean", name: "showSocial", label: bi("Show the company's social profiles (small icons)", "إظهار حسابات الشركة على التواصل الاجتماعي (أيقونات صغيرة)") },
    ],
    defaults: { visual: "network", imagePosition: "end", showSocial: false },
  },
  {
    type: "richText",
    label: bi("Rich text", "نص منسق"),
    description: bi("Long-form formatted content (policies, articles).", "محتوى طويل منسق (سياسات، مقالات)."),
    category: "content",
    icon: "FileText",
    fields: [
      { type: "text", name: "title", label: bi("Title (optional)", "العنوان (اختياري)"), max: 200 },
      { type: "richtext", name: "body", label: bi("Content", "المحتوى"), required: true },
      { type: "select", name: "width", label: bi("Width", "العرض"), options: [opt("narrow", "Reading width", "عرض القراءة"), opt("wide", "Wide", "عريض")] },
    ],
  },
  {
    type: "statement",
    label: bi("Statement / vision", "عبارة / رؤية"),
    description: bi("A large editorial statement — vision, mission or quote.", "عبارة تحريرية كبيرة — رؤية أو رسالة أو اقتباس."),
    category: "content",
    icon: "Quote",
    fields: [
      eyebrow,
      { type: "textarea", name: "text", label: bi("Statement", "العبارة"), max: 600, rows: 3, required: true },
      { type: "text", name: "attribution", label: bi("Attribution (optional)", "المصدر (اختياري)"), max: 160 },
      { type: "boolean", name: "showMotif", label: bi("Show brand globe motif", "إظهار رسم الكرة الشبكية") },
    ],
    defaults: { showMotif: true },
  },
  {
    type: "cards",
    label: bi("Feature cards", "بطاقات المزايا"),
    description: bi("Grid of icon cards — capabilities, values, reasons.", "شبكة بطاقات بأيقونات — قدرات، قيم، أسباب."),
    category: "content",
    icon: "LayoutTemplate",
    fields: [
      eyebrow,
      title,
      intro,
      { type: "select", name: "columns", label: bi("Columns", "الأعمدة"), options: [opt("3", "3", "3"), opt("2", "2", "2"), opt("4", "4", "4")] },
      { type: "select", name: "style", label: bi("Card style", "نمط البطاقات"), options: [opt("outline", "Outline", "إطار"), opt("numbered", "Numbered", "مرقّمة"), opt("filled", "Filled", "مملوءة")] },
      {
        type: "list", name: "items", label: bi("Cards", "البطاقات"), itemTitle: "title", max: 24,
        fields: [
          { type: "icon", name: "icon", label: bi("Icon", "الأيقونة") },
          { type: "text", name: "title", label: bi("Title", "العنوان"), max: 120 },
          { type: "textarea", name: "text", label: bi("Text", "النص"), max: 500, rows: 3 },
          { type: "link", name: "link", label: bi("Link (optional)", "رابط (اختياري)") },
        ],
      },
    ],
    defaults: { columns: "3", style: "outline" },
  },
  {
    type: "process",
    label: bi("Process / timeline", "المنهجية / الخط الزمني"),
    description: bi("Numbered methodology steps or a timeline.", "خطوات منهجية مرقمة أو خط زمني."),
    category: "content",
    icon: "Route",
    fields: [
      eyebrow,
      title,
      intro,
      { type: "select", name: "layout", label: bi("Layout", "التخطيط"), options: [opt("steps", "Horizontal steps", "خطوات أفقية"), opt("timeline", "Vertical timeline", "خط زمني عمودي")] },
      {
        type: "list", name: "steps", label: bi("Steps", "الخطوات"), itemTitle: "title", max: 12,
        fields: [
          { type: "text", name: "marker", label: bi("Marker (optional, e.g. a year)", "علامة (اختياري، مثل سنة)"), localized: false, max: 20 },
          { type: "text", name: "title", label: bi("Title", "العنوان"), max: 120 },
          { type: "textarea", name: "text", label: bi("Description", "الوصف"), max: 500, rows: 2 },
        ],
      },
    ],
    defaults: { layout: "steps" },
  },
  {
    type: "faq",
    label: bi("FAQ", "الأسئلة الشائعة"),
    description: bi("Accordion of questions from the FAQ library or written inline.", "أسئلة من مكتبة الأسئلة أو مكتوبة هنا."),
    category: "content",
    icon: "CircleHelp",
    fields: [
      eyebrow,
      title,
      intro,
      { type: "select", name: "source", label: bi("Source", "المصدر"), options: [opt("library", "FAQ library", "مكتبة الأسئلة"), opt("inline", "Written here", "مكتوبة هنا")] },
      { type: "text", name: "group", label: bi("Library group filter (optional)", "تصفية حسب المجموعة (اختياري)"), localized: false, max: 60 },
      {
        type: "list", name: "items", label: bi("Questions", "الأسئلة"), itemTitle: "question", max: 40,
        fields: [
          { type: "text", name: "question", label: bi("Question", "السؤال"), max: 300 },
          { type: "textarea", name: "answer", label: bi("Answer", "الإجابة"), max: 3000, rows: 4 },
        ],
      },
    ],
    defaults: { source: "library" },
  },

  // ───────── Company ─────────
  {
    type: "stats",
    label: bi("Key statistics", "الإحصاءات الرئيسية"),
    description: bi("Animated figures from the Statistics collection, with markets served.", "أرقام متحركة من مجموعة الإحصاءات مع الأسواق التي نخدمها."),
    category: "company",
    icon: "ChartColumn",
    fields: [
      eyebrow,
      title,
      intro,
      { type: "select", name: "layout", label: bi("Layout", "التخطيط"), options: [opt("band", "Band", "شريط"), opt("cards", "Cards", "بطاقات")] },
      { type: "list", name: "markets", label: bi("Markets served (optional)", "الأسواق التي نخدمها (اختياري)"), itemTitle: "name", max: 20, fields: [{ type: "text", name: "name", label: bi("Market", "السوق"), max: 80 }] },
    ],
    defaults: { layout: "band" },
  },
  {
    type: "leaderMessage",
    label: bi("Leadership message", "كلمة القيادة"),
    description: bi("Portrait and message from a leader (e.g. CEO).", "صورة وكلمة من أحد القادة (مثل الرئيس التنفيذي)."),
    category: "company",
    icon: "Quote",
    fields: [
      eyebrow,
      { type: "text", name: "title", label: bi("Title", "العنوان"), max: 160 },
      {
        type: "select",
        name: "mode",
        label: bi("Display", "طريقة العرض"),
        options: [
          opt("single", "One leader (selected or featured)", "قائد واحد (المحدد أو المميز)"),
          opt("rotating", "Rotate between all leadership messages", "التنقل بين كلمات القيادة جميعها"),
          opt("grid", "All leadership messages side by side", "كلمات القيادة جنباً إلى جنب"),
        ],
      },
      { type: "reference", name: "memberId", label: bi("Team member (single mode — empty uses the featured leader)", "عضو الفريق (العرض الفردي — فارغ يستخدم القائد المميز)"), collection: "teamMembers" },
      { type: "textarea", name: "message", label: bi("Message override for single mode (leave empty to use the member's message)", "نص بديل للعرض الفردي (اتركه فارغاً لاستخدام كلمة العضو)"), max: 3000, rows: 6 },
    ],
    defaults: { mode: "single" },
  },
  {
    type: "team",
    label: bi("Team", "الفريق"),
    description: bi("Team members from the Team collection.", "أعضاء الفريق من مجموعة الفريق."),
    category: "company",
    icon: "Users",
    fields: [
      eyebrow,
      title,
      intro,
      { type: "select", name: "filter", label: bi("Show", "العرض"), options: [opt("all", "Everyone", "الجميع"), opt("leadership", "Leadership only", "القيادة فقط"), opt("team", "Team without leadership", "الفريق دون القيادة")] },
      { type: "select", name: "layout", label: bi("Layout", "التخطيط"), options: [opt("grid", "Profile cards", "بطاقات"), opt("spotlight", "First person highlighted", "إبراز الشخص الأول")] },
    ],
    defaults: { filter: "all", layout: "grid" },
  },
  {
    type: "partners",
    label: bi("Partners", "الشركاء"),
    description: bi("Strategic partners with logos and description.", "الشركاء الاستراتيجيون مع الشعارات والوصف."),
    category: "company",
    icon: "Handshake",
    fields: [eyebrow, title, intro, { type: "boolean", name: "onlyStrategic", label: bi("Strategic partners only", "الشركاء الاستراتيجيون فقط") }],
  },

  // ───────── Collections ─────────
  {
    type: "services",
    label: bi("Services", "الخدمات"),
    description: bi("Services from the Services collection — interactive showcase or grid.", "الخدمات من مجموعة الخدمات — عرض تفاعلي أو شبكة."),
    category: "collections",
    icon: "Layers",
    fields: [
      eyebrow,
      title,
      intro,
      { type: "select", name: "layout", label: bi("Layout", "التخطيط"), options: [opt("showcase", "Interactive showcase", "عرض تفاعلي"), opt("grid", "Grouped grid", "شبكة مجمعة"), opt("compact", "Compact list", "قائمة مختصرة")] },
      { type: "reference", name: "categoryId", label: bi("Only this category (optional)", "هذه الفئة فقط (اختياري)"), collection: "serviceCategories" },
      { type: "boolean", name: "onlyFeatured", label: bi("Featured services only", "الخدمات المميزة فقط") },
      cta(),
    ],
    defaults: { layout: "showcase" },
  },
  {
    type: "clients",
    label: bi("Clients", "العملاء"),
    description: bi("Clients grouped by market, as logos or names.", "العملاء مجمّعون حسب السوق، بالشعارات أو الأسماء."),
    category: "collections",
    icon: "Building",
    fields: [eyebrow, title, intro, { type: "select", name: "layout", label: bi("Layout", "التخطيط"), options: [opt("tabs", "Tabs by market", "تبويبات حسب السوق"), opt("wall", "Single wall", "جدار واحد")] }],
    defaults: { layout: "tabs" },
  },
  {
    type: "testimonials",
    label: bi("Testimonials", "آراء العملاء"),
    description: bi("Client testimonials (hidden automatically when none exist).", "آراء العملاء (تُخفى تلقائياً عند عدم وجودها)."),
    category: "collections",
    icon: "MessageCircle",
    fields: [eyebrow, title],
  },
  {
    type: "latestPosts",
    label: bi("Latest insights", "أحدث المقالات"),
    description: bi("Most recent articles (hidden automatically when none are published).", "أحدث المقالات (تُخفى تلقائياً عند عدم وجود مقالات منشورة)."),
    category: "collections",
    icon: "Newspaper",
    fields: [
      eyebrow,
      title,
      intro,
      { type: "select", name: "layout", label: bi("Layout", "التخطيط"), options: [opt("slider", "Slider", "شريط متحرك"), opt("grid", "Grid", "شبكة")] },
      { type: "number", name: "limit", label: bi("Number of articles", "عدد المقالات"), min: 1, max: 12 },
      cta(),
    ],
    defaults: { limit: 6, layout: "slider" },
  },
  {
    type: "postListing",
    label: bi("Insights listing", "قائمة المقالات"),
    description: bi("Full article listing with search, categories and pagination.", "قائمة المقالات الكاملة مع البحث والتصنيفات والصفحات."),
    category: "collections",
    icon: "Newspaper",
    fields: [
      { type: "number", name: "pageSize", label: bi("Articles per page", "عدد المقالات في الصفحة"), min: 3, max: 30 },
      { type: "boolean", name: "showSearch", label: bi("Show search", "إظهار البحث") },
      { type: "boolean", name: "showCategories", label: bi("Show category filter", "إظهار تصفية التصنيفات") },
    ],
    defaults: { pageSize: 9, showSearch: true, showCategories: true },
  },

  // ───────── Conversion ─────────
  {
    type: "cta",
    label: bi("Call to action", "دعوة لاتخاذ إجراء"),
    description: bi("Prominent band inviting visitors to get in touch.", "شريط بارز يدعو الزوار للتواصل."),
    category: "conversion",
    icon: "Megaphone",
    fields: [
      { type: "select", name: "variant", label: bi("Style", "النمط"), options: [opt("navy", "Navy band", "شريط كحلي"), opt("light", "Light panel", "لوحة فاتحة")] },
      eyebrow,
      { type: "textarea", name: "title", label: bi("Title", "العنوان"), max: 200, rows: 2, required: true },
      intro,
      cta("primaryCta", bi("Primary button", "الزر الرئيسي")),
      cta("secondaryCta", bi("Secondary button", "الزر الثانوي")),
    ],
    defaults: { variant: "navy" },
  },
  {
    type: "contact",
    label: bi("Contact", "التواصل"),
    description: bi("Contact form, contact channels and map.", "نموذج التواصل وقنوات الاتصال والخريطة."),
    category: "conversion",
    icon: "Mail",
    fields: [
      eyebrow,
      title,
      intro,
      { type: "boolean", name: "showForm", label: bi("Show contact form", "إظهار نموذج التواصل") },
      { type: "boolean", name: "showChannels", label: bi("Show contact details", "إظهار بيانات التواصل") },
      { type: "boolean", name: "showMap", label: bi("Show map", "إظهار الخريطة") },
    ],
    defaults: { showForm: true, showChannels: true, showMap: true },
  },
  {
    type: "consultation",
    label: bi("Consultation request form", "نموذج طلب استشارة"),
    description: bi("Premium request form with country/phone picker and service selection. Requests appear under Consultation requests.", "نموذج طلب متقدم مع اختيار الدولة ورمز الهاتف والخدمة. تظهر الطلبات في قسم طلبات الاستشارة."),
    category: "conversion",
    icon: "CalendarCheck",
    fields: [
      eyebrow,
      title,
      intro,
      { type: "text", name: "asideTitle", label: bi("Side panel title", "عنوان اللوحة الجانبية"), max: 120 },
      {
        type: "list",
        name: "steps",
        label: bi("What happens next (side panel)", "ماذا يحدث بعد ذلك (اللوحة الجانبية)"),
        itemTitle: "title",
        max: 6,
        addLabel: bi("Add step", "إضافة خطوة"),
        fields: [
          { type: "text", name: "title", label: bi("Step", "الخطوة"), max: 120 },
          { type: "textarea", name: "text", label: bi("Description", "الوصف"), max: 300, rows: 2 },
        ],
      },
      { type: "boolean", name: "showChannels", label: bi("Show direct contact details in the side panel", "إظهار بيانات التواصل المباشر في اللوحة الجانبية") },
    ],
    defaults: { showChannels: true },
  },
  {
    type: "contactCards",
    label: bi("Contact channels", "قنوات التواصل"),
    description: bi("Large cards for phone, e-mail, WhatsApp, address and hours, with social profiles and a call to action.", "بطاقات كبيرة للهاتف والبريد وواتساب والعنوان وساعات العمل، مع حسابات التواصل ودعوة لاتخاذ إجراء."),
    category: "conversion",
    icon: "Contact",
    fields: [
      eyebrow,
      title,
      intro,
      { type: "boolean", name: "showHours", label: bi("Show working hours", "إظهار ساعات العمل"), width: "half" },
      { type: "boolean", name: "showSocial", label: bi("Show social profiles", "إظهار حسابات التواصل الاجتماعي"), width: "half" },
      { type: "text", name: "socialTitle", label: bi("Social block title (optional)", "عنوان كتلة التواصل الاجتماعي (اختياري)"), max: 120 },
      { type: "text", name: "ctaTitle", label: bi("Call-to-action title (optional)", "عنوان الدعوة (اختياري)"), max: 160 },
      { type: "textarea", name: "ctaText", label: bi("Call-to-action text", "نص الدعوة"), max: 400, rows: 2 },
      cta(),
    ],
    defaults: { showHours: true, showSocial: true },
  },
  {
    type: "map",
    label: bi("Map", "الخريطة"),
    description: bi("Location map from Contact settings.", "خريطة الموقع من إعدادات التواصل."),
    category: "conversion",
    icon: "Map",
    fields: [eyebrow, { type: "text", name: "title", label: bi("Title", "العنوان"), max: 160 }],
  },

  // ───────── Media ─────────
  {
    type: "video",
    label: bi("Video", "فيديو"),
    description: bi("Uploaded video or privacy-friendly YouTube/Vimeo embed.", "فيديو مرفوع أو تضمين يوتيوب/فيميو يحترم الخصوصية."),
    category: "media",
    icon: "Play",
    fields: [
      eyebrow,
      title,
      intro,
      { type: "select", name: "source", label: bi("Source", "المصدر"), options: [opt("upload", "Uploaded file", "ملف مرفوع"), opt("youtube", "YouTube", "يوتيوب"), opt("vimeo", "Vimeo", "فيميو")] },
      { type: "media", name: "video", label: bi("Video file", "ملف الفيديو"), accept: "video" },
      { type: "text", name: "url", label: bi("YouTube / Vimeo URL", "رابط يوتيوب / فيميو"), localized: false, max: 500 },
      { type: "media", name: "poster", label: bi("Cover image", "صورة الغلاف"), accept: "image" },
    ],
    defaults: { source: "upload" },
  },
  {
    type: "gallery",
    label: bi("Gallery", "معرض الصور"),
    description: bi("Grid of images with captions.", "شبكة صور مع تعليقات."),
    category: "media",
    icon: "Images",
    fields: [
      eyebrow,
      title,
      { type: "list", name: "images", label: bi("Images", "الصور"), max: 40, fields: [{ type: "media", name: "image", label: bi("Image", "الصورة"), accept: "image" }, { type: "text", name: "caption", label: bi("Caption", "التعليق"), max: 200 }] },
    ],
  },
  {
    type: "logoCloud",
    label: bi("Logo cloud", "مجموعة شعارات"),
    description: bi("A row of logos (accreditations, memberships…).", "صف من الشعارات (اعتمادات، عضويات...)."),
    category: "media",
    icon: "Award",
    fields: [
      eyebrow,
      title,
      {
        type: "list", name: "logos", label: bi("Logos", "الشعارات"), itemTitle: "name", max: 40,
        fields: [
          { type: "media", name: "image", label: bi("Logo", "الشعار"), accept: "image" },
          { type: "text", name: "name", label: bi("Name", "الاسم"), max: 120 },
          { type: "text", name: "url", label: bi("Link (optional)", "رابط (اختياري)"), localized: false, max: 500 },
        ],
      },
    ],
  },

  // ───────── Layout ─────────
  {
    type: "spacer",
    label: bi("Spacer / divider", "مسافة / فاصل"),
    description: bi("Vertical breathing room, optionally with a line.", "مسافة عمودية مع خط اختياري."),
    category: "layout",
    icon: "Minus",
    fields: [
      { type: "select", name: "size", label: bi("Size", "الحجم"), options: [opt("md", "Medium", "متوسط"), opt("sm", "Small", "صغير"), opt("lg", "Large", "كبير")] },
      { type: "boolean", name: "line", label: bi("Show divider line", "إظهار خط فاصل") },
    ],
    defaults: { size: "md", line: true },
  },
];

export const SECTION_MAP: Record<string, SectionDefinition> = Object.fromEntries(SECTIONS.map((s) => [s.type, s]));

/** Presentation settings shared by every section. */
export const SECTION_SETTINGS_FIELDS: Field[] = [
  { type: "select", name: "theme", label: bi("Background", "الخلفية"), options: [opt("default", "Default", "افتراضي"), opt("light", "White", "أبيض"), opt("muted", "Soft grey", "رمادي ناعم"), opt("navy", "Navy", "كحلي")] },
  { type: "select", name: "spacing", label: bi("Vertical spacing", "المسافات العمودية"), options: [opt("normal", "Normal", "عادي"), opt("compact", "Compact", "مضغوط"), opt("spacious", "Spacious", "واسع")] },
  { type: "text", name: "anchor", label: bi("Anchor id (for #links)", "معرّف الرابط الداخلي (#)"), localized: false, max: 40 },
  { type: "select", name: "hideOn", label: bi("Hide on", "إخفاء على"), options: [opt("none", "Never hide", "لا تُخفِ"), opt("mobile", "Mobile", "الجوال"), opt("desktop", "Desktop", "سطح المكتب")] },
];

export const sectionSettingsSchema = buildSchema(SECTION_SETTINGS_FIELDS).extend({
  anchor: z.string().trim().max(40).regex(/^[a-z0-9-]*$/i, "invalid_anchor").default(""),
});
export type SectionSettings = { theme: "default" | "light" | "muted" | "navy"; spacing: "normal" | "compact" | "spacious"; anchor: string; hideOn: "none" | "mobile" | "desktop" };

const schemaCache = new Map<string, z.ZodType>();
export function sectionSchema(type: string) {
  const def = SECTION_MAP[type];
  if (!def) return null;
  if (!schemaCache.has(type)) schemaCache.set(type, buildSchema(def.fields));
  return schemaCache.get(type)!;
}

export function defaultSectionData(type: string): FieldValues {
  const def = SECTION_MAP[type];
  if (!def) return {};
  return { ...emptyValues(def.fields), ...(def.defaults ?? {}) };
}

export function defaultSectionSettings(): SectionSettings {
  return { theme: "default", spacing: "normal", anchor: "", hideOn: "none" };
}

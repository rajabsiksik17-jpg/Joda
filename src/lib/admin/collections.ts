import type { Permission } from "../auth/permissions";
import { SOCIAL_PLATFORMS } from "../social-platforms";
import { bi, type Bi, type Field } from "../sections/fields";

export type CollectionKey =
  | "team" | "partners" | "clients" | "clientGroups" | "testimonials" | "faqs" | "stats" | "serviceCategories" | "blogCategories" | "contactChannels" | "socialLinks";

export type CollectionConfig = {
  key: CollectionKey;
  title: Bi;
  singular: Bi;
  description: Bi;
  permission: Permission;
  fields: Field[];
  /** Field shown as the row title */
  titleField: string;
  subtitleField?: string;
  imageField?: string;
  hasVisible: boolean;
  /** Default values for new items */
  defaults?: Record<string, unknown>;
  emptyText: Bi;
};

const opt = (value: string, en: string, ar: string) => ({ value, label: bi(en, ar) });

export const COLLECTIONS: Record<CollectionKey, CollectionConfig> = {
  team: {
    key: "team",
    title: bi("Team & leadership", "الفريق والقيادة"),
    singular: bi("team member", "عضو الفريق"),
    description: bi("People shown in the Team page, profiles and leadership messages. Inactive members are hidden from the website.", "الأشخاص الذين يظهرون في صفحة الفريق والملفات الشخصية وكلمة القيادة. الأعضاء غير النشطين مخفيون عن الموقع."),
    permission: "collections.edit",
    titleField: "name",
    subtitleField: "position",
    imageField: "photoId",
    hasVisible: true,
    emptyText: bi("Add leaders and consultants to feature them on the website.", "أضف القادة والمستشارين لعرضهم على الموقع."),
    fields: [
      { type: "text", name: "name", label: bi("Full name", "الاسم الكامل"), required: true, max: 120 },
      { type: "text", name: "position", label: bi("Position", "المنصب"), required: true, max: 120 },
      { type: "text", name: "department", label: bi("Department (optional)", "القسم (اختياري)"), max: 120 },
      { type: "media", name: "photoId", label: bi("Portrait (transparent PNG works best)", "الصورة الشخصية (يفضّل PNG بخلفية شفافة)"), accept: "image" },
      { type: "boolean", name: "isLeadership", label: bi("Leadership / spokesperson", "من القيادة / متحدث رسمي"), width: "half" },
      { type: "boolean", name: "featured", label: bi("Featured (shown first in leadership messages)", "مميز (يظهر أولاً في كلمة القيادة)"), width: "half" },
      { type: "textarea", name: "message", label: bi("Leadership message (separate paragraphs with a blank line)", "كلمة القيادة (افصل الفقرات بسطر فارغ)"), max: 4000, rows: 7 },
      { type: "textarea", name: "bio", label: bi("Short biography (cards)", "نبذة مختصرة (البطاقات)"), max: 600, rows: 3 },
      { type: "textarea", name: "fullBio", label: bi("Full biography (profile window — separate paragraphs with a blank line)", "السيرة الكاملة (نافذة الملف الشخصي — افصل الفقرات بسطر فارغ)"), max: 6000, rows: 8 },
      { type: "list", name: "expertise", label: bi("Areas of expertise", "مجالات الخبرة"), itemTitle: "text", max: 12, addLabel: bi("Add area", "إضافة مجال"), fields: [{ type: "text", name: "text", label: bi("Area", "المجال"), max: 100 }] },
      { type: "text", name: "linkedinUrl", label: bi("LinkedIn URL", "رابط لينكدإن"), localized: false, format: "url", max: 300, width: "half" },
      { type: "text", name: "email", label: bi("Public e-mail", "البريد العام"), localized: false, format: "email", max: 200, width: "half" },
      { type: "text", name: "phone", label: bi("Public phone (optional)", "الهاتف العام (اختياري)"), localized: false, max: 40, width: "half" },
      {
        type: "list",
        name: "socials",
        label: bi("Other profiles", "حسابات أخرى"),
        itemTitle: "platform",
        max: 8,
        addLabel: bi("Add profile", "إضافة حساب"),
        fields: [
          { type: "select", name: "platform", label: bi("Platform", "المنصة"), options: SOCIAL_PLATFORMS.map((p) => ({ value: p.value, label: bi(p.label, p.label) })), width: "half" },
          { type: "text", name: "url", label: bi("Profile URL", "رابط الحساب"), localized: false, format: "url", required: true, max: 300, width: "half" },
        ],
      },
    ],
  },
  partners: {
    key: "partners",
    title: bi("Partners", "الشركاء"),
    singular: bi("partner", "شريك"),
    description: bi("Strategic partners and alliances.", "الشركاء والتحالفات الاستراتيجية."),
    permission: "collections.edit",
    titleField: "name",
    imageField: "logoId",
    hasVisible: true,
    emptyText: bi("Add partners with their official logos.", "أضف الشركاء مع شعاراتهم الرسمية."),
    fields: [
      { type: "text", name: "name", label: bi("Name", "الاسم"), required: true, max: 160 },
      { type: "textarea", name: "description", label: bi("Description", "الوصف"), max: 1500, rows: 3 },
      { type: "media", name: "logoId", label: bi("Logo", "الشعار"), accept: "image" },
      { type: "select", name: "logoTone", label: bi("Logo background", "خلفية الشعار"), options: [opt("light", "White", "أبيض"), opt("muted", "Grey (for white logos)", "رمادي (للشعارات البيضاء)"), opt("dark", "Navy", "كحلي")], width: "half" },
      { type: "text", name: "url", label: bi("Website", "الموقع الإلكتروني"), localized: false, format: "url", max: 300, width: "half" },
      { type: "boolean", name: "isStrategic", label: bi("Strategic partner (featured)", "شريك استراتيجي (مميز)") },
    ],
    defaults: { logoTone: "light" },
  },
  clients: {
    key: "clients",
    title: bi("Clients", "العملاء"),
    singular: bi("client", "عميل"),
    description: bi("Client organizations grouped by market. Logos are optional — names are shown when no logo is uploaded.", "المؤسسات العميلة مجمّعة حسب السوق. الشعارات اختيارية — تُعرض الأسماء عند عدم رفع شعار."),
    permission: "collections.edit",
    titleField: "name",
    subtitleField: "groupId",
    imageField: "logoId",
    hasVisible: true,
    emptyText: bi("Add the organizations you work with.", "أضف المؤسسات التي تعمل معها."),
    fields: [
      { type: "text", name: "name", label: bi("Name (brand names may stay in English only)", "الاسم (يمكن إبقاء أسماء العلامات بالإنجليزية فقط)"), required: true, max: 160 },
      { type: "reference", name: "groupId", label: bi("Market", "السوق"), collection: "clientGroups", width: "half" },
      { type: "text", name: "url", label: bi("Website (optional)", "الموقع (اختياري)"), localized: false, format: "url", max: 300, width: "half" },
      { type: "media", name: "logoId", label: bi("Logo", "الشعار"), accept: "image" },
      { type: "boolean", name: "featured", label: bi("Featured", "مميز") },
    ],
  },
  clientGroups: {
    key: "clientGroups",
    title: bi("Markets", "الأسواق"),
    singular: bi("market", "سوق"),
    description: bi("Groups used to organize clients (e.g. Jordan, the Gulf).", "مجموعات لتنظيم العملاء (مثل الأردن والخليج)."),
    permission: "collections.edit",
    titleField: "name",
    hasVisible: false,
    emptyText: bi("Create markets to group clients.", "أنشئ أسواقاً لتجميع العملاء."),
    fields: [{ type: "text", name: "name", label: bi("Name", "الاسم"), required: true, max: 120 }],
  },
  testimonials: {
    key: "testimonials",
    title: bi("Testimonials", "آراء العملاء"),
    singular: bi("testimonial", "رأي"),
    description: bi("Only publish testimonials you have permission to use.", "انشر فقط الآراء التي لديك إذن باستخدامها."),
    permission: "collections.edit",
    titleField: "author",
    subtitleField: "company",
    imageField: "photoId",
    hasVisible: true,
    emptyText: bi("No testimonials yet. The Testimonials section stays hidden until you add one.", "لا توجد آراء بعد. يبقى قسم آراء العملاء مخفياً حتى تضيف رأياً."),
    fields: [
      { type: "textarea", name: "quote", label: bi("Quote", "الاقتباس"), required: true, max: 1500, rows: 4 },
      { type: "text", name: "author", label: bi("Name", "الاسم"), required: true, max: 120 },
      { type: "text", name: "position", label: bi("Position", "المنصب"), max: 120 },
      { type: "text", name: "company", label: bi("Organization", "المؤسسة"), max: 160 },
      { type: "media", name: "photoId", label: bi("Photo", "الصورة"), accept: "image" },
    ],
  },
  faqs: {
    key: "faqs",
    title: bi("FAQs", "الأسئلة الشائعة"),
    singular: bi("question", "سؤال"),
    description: bi("Questions shown by FAQ sections and on related service pages.", "الأسئلة التي تظهر في أقسام الأسئلة الشائعة وصفحات الخدمات المرتبطة."),
    permission: "collections.edit",
    titleField: "question",
    subtitleField: "group",
    hasVisible: true,
    emptyText: bi("Add frequently asked questions. Link a question to a service to show it on that service page.", "أضف الأسئلة الشائعة. اربط السؤال بخدمة لعرضه في صفحتها."),
    fields: [
      { type: "text", name: "question", label: bi("Question", "السؤال"), required: true, max: 300 },
      { type: "textarea", name: "answer", label: bi("Answer", "الإجابة"), required: true, max: 4000, rows: 5 },
      { type: "text", name: "group", label: bi("Group (optional)", "المجموعة (اختياري)"), localized: false, max: 60, width: "half" },
      { type: "reference", name: "serviceId", label: bi("Related service", "الخدمة المرتبطة"), collection: "services", width: "half" },
    ],
  },
  stats: {
    key: "stats",
    title: bi("Statistics", "الإحصاءات"),
    singular: bi("statistic", "إحصائية"),
    description: bi("Key figures shown in the hero and statistics sections. Only publish verified numbers.", "الأرقام الرئيسية في الواجهة وأقسام الإحصاءات. انشر الأرقام الموثقة فقط."),
    permission: "collections.edit",
    titleField: "value",
    subtitleField: "label",
    hasVisible: true,
    emptyText: bi("Add verified company figures.", "أضف أرقام الشركة الموثقة."),
    fields: [
      { type: "text", name: "value", label: bi("Value (e.g. 10 or +100)", "القيمة (مثل 10 أو ‎+100)"), localized: false, required: true, max: 20, width: "half" },
      { type: "text", name: "label", label: bi("Label", "الوصف"), required: true, max: 80 },
      { type: "icon", name: "icon", label: bi("Icon", "الأيقونة") },
    ],
  },
  serviceCategories: {
    key: "serviceCategories",
    title: bi("Service categories", "فئات الخدمات"),
    singular: bi("category", "فئة"),
    description: bi("Practice areas used to group services in menus and listings.", "مجالات الممارسة لتجميع الخدمات في القوائم والصفحات."),
    permission: "services.edit",
    titleField: "name",
    subtitleField: "slug",
    hasVisible: false,
    emptyText: bi("Create categories to group services.", "أنشئ فئات لتجميع الخدمات."),
    fields: [
      { type: "text", name: "name", label: bi("Name", "الاسم"), required: true, max: 120 },
      { type: "text", name: "slug", label: bi("Identifier (English, lowercase)", "المعرّف (إنجليزي، أحرف صغيرة)"), localized: false, format: "slug", required: true, max: 80, width: "half" },
      { type: "textarea", name: "description", label: bi("Description", "الوصف"), max: 800, rows: 3 },
    ],
  },
  blogCategories: {
    key: "blogCategories",
    title: bi("Insight categories", "تصنيفات المقالات"),
    singular: bi("category", "تصنيف"),
    description: bi("Topics used to filter insights.", "الموضوعات المستخدمة لتصفية المقالات."),
    permission: "blog.edit",
    titleField: "name",
    subtitleField: "slug",
    hasVisible: false,
    emptyText: bi("Create categories to organize insights.", "أنشئ تصنيفات لتنظيم المقالات."),
    fields: [
      { type: "text", name: "name", label: bi("Name", "الاسم"), required: true, max: 120 },
      { type: "text", name: "slug", label: bi("URL identifier (English, lowercase)", "معرّف الرابط (إنجليزي، أحرف صغيرة)"), localized: false, format: "slug", required: true, max: 80, width: "half" },
      { type: "textarea", name: "description", label: bi("Description", "الوصف"), max: 800, rows: 3 },
    ],
  },
  contactChannels: {
    key: "contactChannels",
    title: bi("Contact channels", "قنوات التواصل"),
    singular: bi("contact channel", "قناة تواصل"),
    description: bi("Phone numbers, e-mails, WhatsApp and other channels shown on the website.", "أرقام الهواتف والبريد وواتساب وغيرها من القنوات المعروضة على الموقع."),
    permission: "contact.edit",
    titleField: "value",
    subtitleField: "type",
    hasVisible: true,
    emptyText: bi("Add phone numbers, e-mails or WhatsApp.", "أضف أرقام الهواتف أو البريد أو واتساب."),
    fields: [
      { type: "select", name: "type", label: bi("Type", "النوع"), options: [opt("PHONE", "Phone", "هاتف"), opt("EMAIL", "E-mail", "بريد إلكتروني"), opt("WHATSAPP", "WhatsApp", "واتساب"), opt("FAX", "Fax", "فاكس"), opt("OTHER", "Other", "أخرى")], width: "half" },
      { type: "text", name: "value", label: bi("Value (as displayed)", "القيمة (كما تُعرض)"), localized: false, required: true, max: 200, width: "half" },
      { type: "text", name: "label", label: bi("Label (optional)", "التسمية (اختياري)"), max: 80 },
      { type: "text", name: "href", label: bi("Custom link (optional — generated automatically)", "رابط مخصص (اختياري — يُنشأ تلقائياً)"), localized: false, format: "href", max: 300 },
      { type: "boolean", name: "isPrimary", label: bi("Primary (shown in the mobile menu)", "أساسي (يظهر في قائمة الجوال)") },
      { type: "boolean", name: "showInFooter", label: bi("Show in footer", "إظهار في التذييل") },
    ],
    defaults: { type: "PHONE", showInFooter: true },
  },
  socialLinks: {
    key: "socialLinks",
    title: bi("Social media", "وسائل التواصل الاجتماعي"),
    singular: bi("social link", "حساب تواصل"),
    description: bi("Only configured platforms are shown on the website.", "تظهر على الموقع المنصات المضافة فقط."),
    permission: "contact.edit",
    titleField: "platform",
    subtitleField: "url",
    hasVisible: true,
    emptyText: bi("No social accounts yet. Add the company's official profiles.", "لا توجد حسابات بعد. أضف الحسابات الرسمية للشركة."),
    fields: [
      { type: "select", name: "platform", label: bi("Platform", "المنصة"), options: SOCIAL_PLATFORMS.map((p) => ({ value: p.value, label: bi(p.label, p.label) })), width: "half" },
      { type: "text", name: "url", label: bi("Profile URL", "رابط الحساب"), localized: false, format: "url", required: true, max: 300, width: "half" },
      { type: "text", name: "label", label: bi("Accessible label (optional)", "تسمية الوصول (اختياري)"), localized: false, max: 80 },
    ],
    defaults: { platform: "linkedin" },
  },
};

export function isCollectionKey(v: string): v is CollectionKey {
  return v in COLLECTIONS;
}

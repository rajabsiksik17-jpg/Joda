/**
 * Initial content for the Quality Experts website.
 * Source of truth: the official company profile (2026) and visual identity guide.
 * Everything here is editable afterwards in the CMS.
 */
type L = { ar: string; en: string };
const l = (en: string, ar: string): L => ({ en, ar });

export const COMPANY = {
  siteName: l("Quality Consulting & Training", "خبراء الجودة للاستشارات والتدريب"),
  legalName: l("Quality Experts for Consulting & Training", "خبراء الجودة للاستشارات والتدريب"),
  tagline: l("Elevating businesses to new heights", "ننقل أعمالك إلى آفاق جديدة"),
  about: l(
    "Quality Consultants is a leading name in Management Consulting in the Kingdom and the Gulf region, dedicated to elevating your business to new heights. Alongside our extensive expertise in governance and management consulting, we place special focus on digital transformation and the adoption of artificial intelligence solutions — helping businesses operate more efficiently and make smarter decisions. We specialize in delivering superior, tailored services that address today's business challenges and guide your organization toward a more competitive, sustainable digital future.",
    "شركة خبراء الجودة اسم رائد في مجال الاستشارات الإدارية في المملكة والخليج العربي، كرست خبراتها لتنقل أعمالك إلى آفاق جديدة. وإلى جانب خبراتنا الواسعة في الحوكمة والاستشارات الإدارية، نولي اهتماماً خاصاً بمواكبة التحول الرقمي وتوظيف حلول الذكاء الاصطناعي لتمكين الشركات من العمل بكفاءة أعلى واتخاذ قرارات أذكى. نتخصص في تقديم خدمات متفوقة مصممة خصيصاً لمواجهة التحديات التي تواجه تطوير أعمالك اليوم، وقيادتها نحو مستقبل رقمي أكثر تنافسية واستدامة.",
  ),
  expertise: l(
    "With a proven track record across Jordan, the Gulf, Palestine, and Sudan, we bring solid expertise in governance and management consulting, alongside growing capabilities in digital transformation and AI. Our commitment to quality has made us a trusted partner for businesses seeking excellence and growth.",
    "بفضل سجلنا الحافل في تقديم الخدمات الاستشارية في الأردن ودول الخليج وفلسطين والسودان، نملك خبرة راسخة في الحوكمة والاستشارات الإدارية، إلى جانب خبرة متنامية في التحول الرقمي والذكاء الاصطناعي. التزامنا بالجودة جعلنا شريكاً موثوقاً للشركات الساعية للتميز والتطور.",
  ),
  vision: l(
    "To become the trusted partner of choice for businesses seeking sustainable growth in a rapidly evolving marketplace.",
    "أن نصبح الشريك الموثوق به والمفضل للشركات التي تسعى إلى النمو المستدام في سوق سريع التطور.",
  ),
  servicesIntro: l(
    "A focused set of high-impact services designed to strengthen governance and accelerate innovation.",
    "مجموعة مركّزة من الخدمات عالية الأثر، مصممة لتعزيز الحوكمة وتسريع الابتكار.",
  ),
};

export const CEO = {
  name: l("Eng. Nael Saadeh", "م. نائل سعادة"),
  position: l("Chief Executive Officer", "الرئيس التنفيذي"),
  message: l(
    "Building on a proven track record, Quality Experts for Business Development has evolved into a dynamic management consulting firm — embracing digital transformation and AI to drive client growth. This evolution reflects our unwavering commitment to client satisfaction.\n\nWe deliver faster, more agile responses by adopting the latest concepts and technologies, as your trusted partner toward a smarter, more efficient future.",
    "اعتماداً على سجلنا الحافل بالإنجازات، تطورت «خبراء الجودة لتطوير الأعمال» إلى شركة استشارات إدارية ديناميكية تواكب التحول الرقمي وتوظف حلول الذكاء الاصطناعي لتعزيز نمو عملائها. إن هذا التحول النوعي يجسد التزامنا الراسخ بوضع رضا العملاء في مقدمة أولوياتنا.\n\nنلتزم بتقديم استجابة أسرع وأكثر مرونة من خلال تبني أحدث المفاهيم والتقنيات، لنكون شريككم المفضل في رحلة قيادة أعمالكم نحو مستقبل أكثر ذكاءً وكفاءة.",
  ),
};

export const PARTNERS = [
  {
    name: l("DMC Arabia Consulting", "دي إم سي العربية"),
    description: l(
      "Proudly collaborating with our strategic partner, DMC Arabia Consulting, for seamless and successful business solutions, driven by our combined expertise.",
      "نتعاون بكل فخر مع حليفنا الاستراتيجي شركة دي إم سي العربية، من أجل تقديم حلول أعمال سلسة وناجحة، غنية بتنوع خبراتنا.",
    ),
    logo: "partner-dmc-arabia.png",
    logoTone: "light",
    isStrategic: true,
  },
  { name: l("Kastana", "كاستانا"), description: null, logo: "partner-kastana.png", logoTone: "muted", isStrategic: false },
];

export const STATS = [
  { value: "4", label: l("Countries served", "دول نخدمها") },
  { value: "10", label: l("Core services", "خدمات رئيسية") },
  { value: "+100", label: l("Corporate clients", "عميل مؤسسي") },
];

export const MARKETS = [l("Jordan", "الأردن"), l("The Gulf", "الخليج العربي"), l("Palestine", "فلسطين"), l("Sudan", "السودان")];

export const CLIENT_GROUPS = [
  {
    name: l("Jordan", "الأردن"),
    clients: ["Nuqul Group", "Arab Foam Factories", "Civil Service Bureau", "Arab Potash", "Arcomex", "Alwadi", "Al Bayrouty", "National Gas", "Integrated Medical", "Amman Foods", "Hello", "LCI Cure", "National Dairy & Food", "Union Metal Constructions", "Metalco", "Specialized Medical Supplies"],
  },
  {
    name: l("The Gulf", "الخليج العربي"),
    clients: ["UCIC", "Amco", "Haif Company", "Bank Aljazira", "STS", "Gulf Industrial Group", "Tetra Pak", "Al Mutlaq Group", "Savola", "Al Redwan Medical", "SBS Steel Building Systems", "Almabani"],
  },
  {
    name: l("Palestine", "فلسطين"),
    clients: ["Sinokrot Holding", "Coca-Cola", "Vegetable Oil Industries", "National Aluminium Products", "Pharmacare", "BPC", "Paltel", "Ministry of National Economy"],
  },
];

export const SERVICE_CATEGORIES = [
  { slug: "governance-strategy", name: l("Governance & Strategy", "الحوكمة والاستراتيجية") },
  { slug: "digital-ai", name: l("Digital & AI", "التحول الرقمي والذكاء الاصطناعي") },
  { slug: "finance-efficiency", name: l("Finance & Efficiency", "المالية وكفاءة الإنفاق") },
  { slug: "people-capability", name: l("People & Capability", "رأس المال البشري والقدرات") },
  { slug: "quality-excellence", name: l("Quality & Excellence", "الجودة والتميز المؤسسي") },
];

export const CONTACT = {
  address: l("Amman - Hashemite Kingdom of Jordan", "عمّان - المملكة الأردنية الهاشمية"),
  channels: [
    { type: "PHONE", value: "+962 7 9823 6864", label: l("Mobile", "الجوال"), isPrimary: true, visible: true },
    { type: "PHONE", value: "+962 7 8735 0675", label: l("Mobile", "الجوال"), isPrimary: false, visible: true },
    { type: "EMAIL", value: "info@qc-jo.com", label: l("General enquiries", "الاستفسارات العامة"), isPrimary: true, visible: true },
    // Listed on the previous website but not in the 2026 profile — kept hidden until confirmed.
    { type: "PHONE", value: "+962 6 401 7031", label: l("Office", "المكتب"), isPrimary: false, visible: false },
  ] as const,
};

// ─────────────── Legal (factual description of what this website does) ───────────────

export const PRIVACY_HTML = l(
  `<p>This notice explains how Quality Consulting &amp; Training ("Quality Experts", "we") handles personal information collected through this website.</p>
<h2>Information we collect</h2>
<p>When you submit the contact form we collect the details you provide: your name, e-mail address, and — if you choose to add them — your phone number, organization, area of interest, subject and message. We also record the date, the language of the page, and technical information (IP address and browser identification) used to protect the form against abuse.</p>
<h2>How we use it</h2>
<ul><li>To respond to your enquiry and communicate with you about it.</li><li>To protect this website against spam and misuse.</li></ul>
<p>We do not sell your information or use it for automated decision-making.</p>
<h2>Who can access it</h2>
<p>Messages are stored in our website's administration system and are accessible only to authorized staff. E-mail notifications are delivered through our e-mail service provider.</p>
<h2>Retention</h2>
<p>We keep enquiries only as long as needed to handle them and maintain our business records; authorized staff can permanently delete them at any time.</p>
<h2>Cookies</h2>
<p>Please see our <a href="/en/cookie-policy">cookie policy</a>.</p>
<h2>Your rights</h2>
<p>You may ask us to access, correct or delete the personal information we hold about you by writing to <a href="mailto:info@qc-jo.com">info@qc-jo.com</a>.</p>`,
  `<p>يوضح هذا الإشعار كيفية تعامل شركة خبراء الجودة للاستشارات والتدريب («خبراء الجودة»، «نحن») مع البيانات الشخصية التي يتم جمعها عبر هذا الموقع.</p>
<h2>البيانات التي نجمعها</h2>
<p>عند إرسال نموذج التواصل نجمع البيانات التي تقدمها: اسمك وبريدك الإلكتروني، وإن اخترت إضافتها: رقم هاتفك ومؤسستك ومجال اهتمامك وموضوع الرسالة ونصها. كما نسجل تاريخ الإرسال ولغة الصفحة ومعلومات تقنية (عنوان IP وتعريف المتصفح) نستخدمها لحماية النموذج من إساءة الاستخدام.</p>
<h2>كيف نستخدمها</h2>
<ul><li>للرد على استفسارك والتواصل معك بشأنه.</li><li>لحماية الموقع من الرسائل المزعجة وإساءة الاستخدام.</li></ul>
<p>لا نبيع بياناتك ولا نستخدمها في اتخاذ قرارات آلية.</p>
<h2>من يمكنه الاطلاع عليها</h2>
<p>تُحفظ الرسائل في نظام إدارة الموقع ولا يطّلع عليها إلا الموظفون المخوّلون. ويتم إرسال إشعارات البريد الإلكتروني عبر مزود خدمة البريد لدينا.</p>
<h2>مدة الاحتفاظ</h2>
<p>نحتفظ بالاستفسارات طوال المدة اللازمة لمعالجتها وحفظ سجلات أعمالنا، ويمكن للموظفين المخوّلين حذفها نهائياً في أي وقت.</p>
<h2>ملفات تعريف الارتباط</h2>
<p>يرجى الاطلاع على <a href="/ar/cookie-policy">سياسة ملفات تعريف الارتباط</a>.</p>
<h2>حقوقك</h2>
<p>يمكنك طلب الاطلاع على بياناتك الشخصية لدينا أو تصحيحها أو حذفها بمراسلتنا على <a href="mailto:info@qc-jo.com">info@qc-jo.com</a>.</p>`,
);

export const COOKIE_HTML = l(
  `<p>This website uses a small number of cookies.</p>
<h2>Essential cookies</h2>
<table><thead><tr><th>Cookie</th><th>Purpose</th><th>Duration</th></tr></thead><tbody>
<tr><td>qe_locale</td><td>Remembers your language (Arabic or English).</td><td>1 year</td></tr>
<tr><td>qe_consent</td><td>Remembers your cookie choice.</td><td>6 months</td></tr>
</tbody></table>
<p>Staff who sign in to the administration area also receive security cookies required for signing in.</p>
<h2>Analytics cookies</h2>
<p>If website analytics are enabled, analytics cookies are only set after you choose “Accept analytics” in the cookie banner. You can change your choice at any time using the “Cookie settings” link in the footer.</p>
<h2>Maps and videos</h2>
<p>Embedded Google Maps or videos load only when you choose to display them; those services may then set their own cookies.</p>`,
  `<p>يستخدم هذا الموقع عدداً محدوداً من ملفات تعريف الارتباط.</p>
<h2>ملفات تعريف الارتباط الأساسية</h2>
<table><thead><tr><th>الملف</th><th>الغرض</th><th>المدة</th></tr></thead><tbody>
<tr><td>qe_locale</td><td>تذكّر لغتك المفضلة (العربية أو الإنجليزية).</td><td>سنة واحدة</td></tr>
<tr><td>qe_consent</td><td>تذكّر اختيارك بشأن ملفات تعريف الارتباط.</td><td>6 أشهر</td></tr>
</tbody></table>
<p>يحصل الموظفون الذين يسجلون الدخول إلى منطقة الإدارة على ملفات تعريف ارتباط أمنية لازمة لتسجيل الدخول.</p>
<h2>ملفات تعريف الارتباط التحليلية</h2>
<p>في حال تفعيل تحليلات الموقع، لا يتم إنشاء ملفات تعريف الارتباط التحليلية إلا بعد اختيارك «قبول التحليلات» في شريط ملفات تعريف الارتباط. ويمكنك تغيير اختيارك في أي وقت عبر رابط «إعدادات ملفات تعريف الارتباط» في أسفل الصفحة.</p>
<h2>الخرائط ومقاطع الفيديو</h2>
<p>لا يتم تحميل خرائط Google أو مقاطع الفيديو المضمّنة إلا عند اختيارك عرضها، وقد تقوم تلك الخدمات حينها بإنشاء ملفات تعريف ارتباط خاصة بها.</p>`,
);

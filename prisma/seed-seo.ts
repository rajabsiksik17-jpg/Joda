/**
 * Search metadata for the official services and core pages. Written from each service's own content
 * (no claims beyond the company profile). Titles stay short because the site name is appended by the
 * title template; descriptions aim for 120–160 characters.
 */
type L = { ar: string; en: string };
const l = (en: string, ar: string): L => ({ en, ar });

export type SeedSeo = { title: L; description: L; ogTitle?: L; ogDescription?: L };

export const SERVICE_SEO: Record<string, SeedSeo> = {
  governance: {
    title: l("Corporate Governance Consulting in Jordan & the Gulf", "استشارات الحوكمة المؤسسية في الأردن والخليج"),
    description: l(
      "Governance frameworks, board and committee charters, authority matrices, risk and internal-control policies, and listed-company compliance.",
      "أطر حوكمة ومواثيق مجالس الإدارة واللجان ومصفوفات الصلاحيات وسياسات المخاطر والرقابة الداخلية والامتثال لمتطلبات الشركات المدرجة.",
    ),
    ogTitle: l("Governance that makes decisions transparent and accountable", "حوكمة تجعل القرارات شفافة وخاضعة للمساءلة"),
  },
  "artificial-intelligence": {
    title: l("AI Consulting: Readiness, Strategy & AI Platforms", "استشارات الذكاء الاصطناعي: الجاهزية والاستراتيجية والمنصات"),
    description: l(
      "From digital readiness assessment and AI opportunity mapping to an implementation strategy and ready-to-use AI-powered GRC and HR platforms.",
      "من تقييم الجاهزية الرقمية وتحديد فرص الذكاء الاصطناعي إلى استراتيجية التطبيق ومنصات جاهزة للحوكمة والمخاطر والامتثال والموارد البشرية.",
    ),
    ogTitle: l("Put artificial intelligence to work in your operations", "وظّف الذكاء الاصطناعي في عمليات مؤسستك"),
  },
  "digital-transformation": {
    title: l("Digital Transformation Consulting & Roadmaps", "استشارات التحول الرقمي وخارطة الطريق الرقمية"),
    description: l(
      "An end-to-end digital transformation journey: systems evaluation, a digital roadmap, process automation and a better customer experience.",
      "رحلة تحول رقمي شاملة: تقييم الأنظمة، وبناء خارطة طريق رقمية، وأتمتة العمليات، وتحسين تجربة العملاء.",
    ),
  },
  "spending-efficiency": {
    title: l("Spending Efficiency & Cost Optimisation Consulting", "استشارات كفاءة الإنفاق وترشيد التكاليف"),
    description: l(
      "Spend analysis, value-based prioritisation, workforce and procurement cost reviews, and spending KPIs — reducing waste without lowering service quality.",
      "تحليل الإنفاق وترتيب أولوياته وفق القيمة ومراجعة تكاليف القوى العاملة والمشتريات ومؤشرات الإنفاق — لتقليل الهدر دون المساس بجودة الخدمات.",
    ),
  },
  "business-strategy": {
    title: l("Business Strategy & Growth Consulting", "استشارات الأعمال والاستراتيجية والنمو"),
    description: l(
      "Strategy formulation, business and operating models, initiative roadmaps, feasibility studies and Balanced Scorecard KPIs that turn vision into measurable results.",
      "صياغة الاستراتيجية ونماذج الأعمال والتشغيل وخارطة المبادرات ودراسات الجدوى ومؤشرات بطاقة الأداء المتوازن لتحويل الرؤية إلى نتائج قابلة للقياس.",
    ),
  },
  "it-consulting": {
    title: l("IT Consulting, IT Governance & Cybersecurity", "استشارات تكنولوجيا المعلومات وحوكمتها والأمن السيبراني"),
    description: l(
      "Digital maturity assessments (COBIT, ITIL), IT roadmaps, ISO/IEC 20000 and 27001 frameworks, cybersecurity compliance and business-continuity planning.",
      "تقييم النضج الرقمي (COBIT و ITIL) وخارطة طريق التقنية وأطر ISO/IEC 20000 و 27001 والامتثال للأمن السيبراني وتخطيط استمرارية الأعمال.",
    ),
  },
  "financial-consulting": {
    title: l("Financial Consulting & Financial Analysis", "الاستشارات المالية والتحليل المالي"),
    description: l(
      "Financial performance assessment, budgeting, financial modelling, cash-flow management, feasibility studies and restructuring that support sound decisions.",
      "تقييم الأداء المالي وإعداد الميزانيات والنمذجة المالية وإدارة التدفق النقدي ودراسات الجدوى وإعادة الهيكلة المالية لدعم القرار السليم.",
    ),
  },
  "human-capital": {
    title: l("Human Capital & Organisational Development", "استشارات رأس المال البشري والتطوير المؤسسي"),
    description: l(
      "Human capital strategy, organisational and job design, competency matrices, job grading, compensation, workforce planning and performance management.",
      "استراتيجية رأس المال البشري والتصميم التنظيمي والوظيفي ومصفوفات الكفاءات وتصنيف الوظائف والتعويضات وتخطيط القوى العاملة وإدارة الأداء.",
    ),
  },
  "capacity-building": {
    title: l("Capacity Building & Professional Training", "بناء القدرات والتدريب المهني"),
    description: l(
      "Training needs analysis, leadership development, change management, governance, risk and internal-control training, and post-training evaluation.",
      "تقييم الاحتياجات التدريبية وتطوير القيادات وإدارة التغيير والتدريب على الحوكمة والمخاطر والرقابة الداخلية وتقييم ما بعد التدريب.",
    ),
  },
  "iso-consulting": {
    title: l("ISO Certification Consulting & EFQM Excellence", "استشارات شهادات الأيزو والتميز المؤسسي EFQM"),
    description: l(
      "Implementing ISO 9001, 27001, 22301, 45001, 14001 and other management systems for certification readiness, plus EFQM and excellence-award preparation.",
      "تطبيق أنظمة الإدارة ISO 9001 و 27001 و 22301 و 45001 و 14001 وغيرها للجاهزية للشهادات، إلى جانب نموذج EFQM والاستعداد لجوائز التميز.",
    ),
  },
};

export const PAGE_SEO: Record<string, SeedSeo> = {
  home: {
    title: l("Quality Experts | Management Consulting in Jordan & the Gulf", "خبراء الجودة | استشارات إدارية في الأردن والخليج العربي"),
    description: l(
      "Governance, strategy, digital transformation and AI consulting for institutions in Jordan, the Gulf, Palestine and Sudan — plus ISO, finance and human capital.",
      "استشارات الحوكمة والاستراتيجية والتحول الرقمي والذكاء الاصطناعي للمؤسسات في الأردن والخليج وفلسطين والسودان، إلى جانب الأيزو والمالية ورأس المال البشري.",
    ),
  },
  about: {
    title: l("About Quality Experts — Management Consulting", "من نحن — خبراء الجودة للاستشارات والتدريب"),
    description: l(
      "A management consulting firm combining governance expertise with digital transformation and AI, serving institutions across Jordan, the Gulf, Palestine and Sudan.",
      "شركة استشارات إدارية تجمع خبرة الحوكمة مع التحول الرقمي والذكاء الاصطناعي، وتخدم المؤسسات في الأردن والخليج وفلسطين والسودان.",
    ),
  },
  team: {
    title: l("Leadership & Team", "القيادة والفريق"),
    description: l("Meet the leadership and consultants of Quality Consulting & Training, and the values that guide every engagement.", "تعرّف على قيادة خبراء الجودة للاستشارات والتدريب ومستشاريها والقيم التي تقود كل مشروع."),
  },
  services: {
    title: l("Consulting Services: Governance, AI, Strategy & ISO", "الخدمات الاستشارية: الحوكمة والذكاء الاصطناعي والاستراتيجية والأيزو"),
    description: l(
      "Ten core consulting services: governance, AI, digital transformation, spending efficiency, strategy, IT, financial consulting, human capital, capacity building and ISO.",
      "عشر خدمات استشارية رئيسية: الحوكمة والذكاء الاصطناعي والتحول الرقمي وكفاءة الإنفاق والاستراتيجية وتقنية المعلومات والمالية ورأس المال البشري وبناء القدرات والأيزو.",
    ),
  },
  consultation: {
    title: l("Request a Consultation", "اطلب استشارة"),
    description: l("Tell us about your organization and the area you are interested in — a Quality Experts consultant will contact you by your preferred method.", "حدثنا عن مؤسستك والمجال الذي يهمك، وسيتواصل معك أحد مستشاري خبراء الجودة عبر الوسيلة التي تفضلها."),
  },
  contact: {
    title: l("Contact Quality Experts in Amman, Jordan", "تواصل مع خبراء الجودة في عمّان، الأردن"),
    description: l("Phone, e-mail and location of Quality Consulting & Training in Amman, Jordan — or send us a message and our consultants will get back to you.", "أرقام الهاتف والبريد الإلكتروني وموقع خبراء الجودة للاستشارات والتدريب في عمّان — أو أرسل رسالتك وسيعود إليك مستشارونا."),
  },
  insights: {
    title: l("Insights on Governance, Strategy, Digital & AI", "مقالات في الحوكمة والاستراتيجية والتحول الرقمي والذكاء الاصطناعي"),
    description: l("Practical perspectives from Quality Experts consultants on governance, AI, spending efficiency, ISO management systems and organizational performance.", "رؤى عملية من مستشاري خبراء الجودة في الحوكمة والذكاء الاصطناعي وكفاءة الإنفاق وأنظمة إدارة الأيزو والأداء المؤسسي."),
  },
  clients: {
    title: l("Clients & Partners", "العملاء والشركاء"),
    description: l("Organizations across Jordan, the Gulf and Palestine that work with Quality Experts, and our strategic partners.", "مؤسسات في الأردن والخليج العربي وفلسطين تعمل مع خبراء الجودة، وشركاؤنا الاستراتيجيون."),
  },
};

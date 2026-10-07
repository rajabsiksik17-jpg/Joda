/**
 * Service content, restructured from the official company profile (2026).
 * Every capability item is the profile's own wording; groupings, journeys, "why it matters" and
 * outcomes only organise and explain that official content — no new claims, figures or clients.
 */
type L = { ar: string; en: string };
const l = (en: string, ar: string): L => ({ en, ar });
const items = (pairs: [string, string][]) => pairs.map(([en, ar]) => l(en, ar));

type Group = { title: L; text?: L; items: L[] };
type Step = { title: L; text: L };
type Outcome = { icon: string; title: L; text: L };

export type SeedService = {
  slug: string;
  icon: string;
  category: string;
  featured?: boolean;
  visual: string;
  capabilityLayout: "grid" | "tabs" | "matrix" | "timeline" | "standards";
  title: L;
  summary: L;
  description: L;
  whyItMatters: L;
  outcomes: Outcome[];
  capabilities: Group[];
  steps: Step[];
  related: string[];
};

export const SERVICES: SeedService[] = [
  // ─────────────────────────────── 01 Governance ───────────────────────────────
  {
    slug: "governance",
    icon: "landmark",
    category: "governance-strategy",
    featured: true,
    visual: "governance",
    capabilityLayout: "tabs",
    title: l("Governance", "الحوكمة الرشيدة"),
    summary: l("Effective governance frameworks that strengthen transparency, accountability and regulatory compliance.", "أطر حوكمة فعالة تعزز الشفافية والمساءلة والالتزام بالمعايير التنظيمية."),
    description: l(
      "We contribute to enhancing transparency and accountability by designing effective governance frameworks that meet institutions' needs, while ensuring compliance with regulatory standards and achieving sustainable administrative discipline.",
      "نساهم في تعزيز الشفافية والمساءلة من خلال تصميم أطر حوكمة فعالة تلبي احتياجات المؤسسات، مع الحرص على الالتزام بالمعايير التنظيمية وتحقيق استدامة الانضباط الإداري.",
    ),
    whyItMatters: l(
      "Governance defines how decisions are made, who is accountable for them and how compliance is assured. A framework designed around the institution's real needs — from board and committee charters to authority matrices, risk assessment and internal-control policies — turns good intentions into transparent, accountable and disciplined management.",
      "تحدد الحوكمة كيف تُتخذ القرارات ومن يتحمل مسؤوليتها وكيف يُضمن الامتثال. والإطار المصمم وفق الاحتياجات الفعلية للمؤسسة — من مواثيق مجالس الإدارة واللجان إلى مصفوفات الصلاحيات وتقييم المخاطر وسياسات الرقابة الداخلية — يحوّل النوايا الحسنة إلى إدارة شفافة وخاضعة للمساءلة ومنضبطة.",
    ),
    outcomes: [
      { icon: "scale", title: l("Transparency & accountability", "الشفافية والمساءلة"), text: l("Clear charters, roles and authorities that make decisions traceable.", "مواثيق وأدوار وصلاحيات واضحة تجعل القرارات قابلة للتتبع.") },
      { icon: "shield-check", title: l("Regulatory compliance", "الالتزام بالمعايير التنظيمية"), text: l("Frameworks aligned with regulatory standards, including requirements for listed companies.", "أطر متوافقة مع المعايير التنظيمية، بما فيها متطلبات الحوكمة للشركات المدرجة.") },
      { icon: "clipboard-check", title: l("Sustainable administrative discipline", "استدامة الانضباط الإداري"), text: l("Policies, controls and management offices that keep the institution on course.", "سياسات وضوابط ومكاتب إدارة تُبقي المؤسسة على المسار الصحيح.") },
    ],
    capabilities: [
      {
        title: l("Assessment & readiness", "التقييم والجاهزية"),
        items: items([
          ["Governance Maturity Assessment", "تقييم نضج الحوكمة"],
          ["Capital Market Readiness Assessment", "تقييم جاهزية السوق المالية"],
          ["Compliance with Governance Requirements for Listed Companies", "الامتثال لمتطلبات الحوكمة للشركات المدرجة"],
        ]),
      },
      {
        title: l("Governance frameworks", "أطر الحوكمة"),
        items: items([
          ["Preparation of Corporate Governance Manuals", "إعداد أدلة الحوكمة للشركات"],
          ["Development of Board and Committee Charters and Policies", "تطوير مواثيق وسياسات مجالس الإدارة واللجان"],
          ["Preparation of Family Governance Constitutions for Family Businesses", "إعداد دساتير الحوكمة للأسر والشركات العائلية"],
          ["Authority Matrix Design", "تصميم مصفوفة الصلاحيات"],
        ]),
      },
      {
        title: l("Risk, compliance & control", "المخاطر والامتثال والرقابة"),
        items: items([
          ["Corporate Risk Assessment", "تقييم المخاطر المؤسسية"],
          ["Development of Compliance and Internal Control Policies", "تطوير سياسات الامتثال والرقابة الداخلية"],
        ]),
      },
      {
        title: l("Management offices", "مكاتب الإدارة"),
        items: items([
          ["Establishment of a Strategy Management Office (SMO)", "تأسيس مكتب إدارة الاستراتيجية (SMO)"],
          ["Establishment of a Project Management Office (PMO)", "تأسيس مكتب إدارة المشاريع (PMO)"],
          ["Establishment of a Vision Realization Office", "تأسيس مكتب تحقيق الرؤية"],
          ["Establishment of an Operations Management Office", "تأسيس مكتب إدارة العمليات"],
          ["Establishment of a Data Management Office", "تأسيس مكتب إدارة البيانات"],
        ]),
      },
    ],
    steps: [
      { title: l("Assess", "التقييم"), text: l("Governance maturity and capital-market readiness.", "نضج الحوكمة والجاهزية للسوق المالية.") },
      { title: l("Design", "التصميم"), text: l("Manuals, charters, constitutions and the authority matrix.", "الأدلة والمواثيق والدساتير ومصفوفة الصلاحيات.") },
      { title: l("Control", "الرقابة"), text: l("Risk assessment, compliance and internal-control policies.", "تقييم المخاطر وسياسات الامتثال والرقابة الداخلية.") },
      { title: l("Institutionalise", "المأسسة"), text: l("Strategy, project, vision, operations and data management offices.", "مكاتب إدارة الاستراتيجية والمشاريع والرؤية والعمليات والبيانات.") },
    ],
    related: ["business-strategy", "iso-consulting", "financial-consulting"],
  },

  // ─────────────────────────────── 02 Artificial Intelligence ───────────────────────────────
  {
    slug: "artificial-intelligence",
    icon: "brain-circuit",
    category: "digital-ai",
    featured: true,
    visual: "ai",
    capabilityLayout: "grid",
    title: l("Artificial Intelligence", "الذكاء الاصطناعي"),
    summary: l("Integrating AI into operations — from readiness assessment to ready-to-use AI-powered platforms.", "دمج الذكاء الاصطناعي في العمليات — من تقييم الجاهزية إلى منصات ذكاء اصطناعي جاهزة."),
    description: l(
      "We provide specialized consulting to integrate AI solutions into business operations — assessing digital readiness, identifying high-impact AI opportunities, and building a practical implementation strategy that keeps your business competitive. Beyond strategy, we also equip you with ready-to-use AI-powered platforms — including GRC and HR systems — to put that strategy into action.",
      "نقدم استشارات متخصصة لدمج حلول الذكاء الاصطناعي ضمن العمليات المؤسسية، بدءاً من تحليل الجاهزية الرقمية للشركة، مروراً بتحديد الفرص المناسبة لاستخدام الذكاء الاصطناعي في تحسين الإنتاجية واتخاذ القرار، وصولاً إلى بناء استراتيجية تطبيق عملية تواكب أحدث التقنيات. ولا نكتفي بالاستشارة؛ بل نزوّدكم بمنصات ذكاء اصطناعي جاهزة، منها أنظمة الحوكمة والمخاطر والامتثال (GRC) ومنصات الموارد البشرية (HR)، لتفعيل هذه الاستراتيجية على أرض الواقع.",
    ),
    whyItMatters: l(
      "AI creates value only when it is matched to real business needs and an organisation ready to use it. That is why the work starts with digital readiness, moves to the opportunities with the greatest impact on productivity and decision-making, and ends with a practical strategy — put into action through ready-to-use platforms rather than left on paper.",
      "لا يحقق الذكاء الاصطناعي قيمة إلا عندما يرتبط باحتياجات عمل حقيقية ومؤسسة جاهزة لاستخدامه. لذلك يبدأ العمل بالجاهزية الرقمية، ثم ينتقل إلى الفرص الأعلى أثراً في الإنتاجية واتخاذ القرار، وينتهي باستراتيجية عملية تُفعَّل عبر منصات جاهزة بدلاً من أن تبقى حبراً على ورق.",
    ),
    outcomes: [
      { icon: "lightbulb", title: l("Smarter decisions", "قرارات أذكى"), text: l("AI applied where it improves decision-making.", "توظيف الذكاء الاصطناعي حيث يحسّن اتخاذ القرار.") },
      { icon: "gauge", title: l("Higher productivity", "إنتاجية أعلى"), text: l("Opportunities selected for their impact on productivity.", "فرص مختارة لأثرها في تحسين الإنتاجية.") },
      { icon: "trending-up", title: l("Competitive edge", "قدرة تنافسية"), text: l("A practical strategy that keeps pace with the latest technologies.", "استراتيجية عملية تواكب أحدث التقنيات.") },
      { icon: "rocket", title: l("Strategy in action", "استراتيجية مُفعّلة"), text: l("Ready-to-use AI platforms for GRC and HR.", "منصات ذكاء اصطناعي جاهزة للحوكمة والمخاطر والامتثال والموارد البشرية.") },
    ],
    capabilities: [
      {
        title: l("What we deliver", "ما نقدمه"),
        items: items([
          ["Digital readiness analysis", "تحليل الجاهزية الرقمية للشركة"],
          ["Identifying AI opportunities to improve productivity and decision-making", "تحديد الفرص المناسبة لاستخدام الذكاء الاصطناعي في تحسين الإنتاجية واتخاذ القرار"],
          ["A practical AI implementation strategy", "بناء استراتيجية تطبيق عملية تواكب أحدث التقنيات"],
          ["AI-powered governance, risk & compliance (GRC) platform", "منصة ذكاء اصطناعي لأنظمة الحوكمة والمخاطر والامتثال (GRC)"],
          ["AI-powered human resources (HR) platform", "منصة ذكاء اصطناعي للموارد البشرية (HR)"],
        ]),
      },
    ],
    steps: [
      { title: l("Readiness Assessment", "تقييم الجاهزية الرقمية"), text: l("Analyzing your organization's digital readiness.", "تحليل الجاهزية الرقمية للشركة.") },
      { title: l("Opportunity Mapping", "تحديد فرص التطبيق"), text: l("Identifying high-impact opportunities to use AI in productivity and decision-making.", "تحديد الفرص المناسبة لاستخدام الذكاء الاصطناعي في تحسين الإنتاجية واتخاذ القرار.") },
      { title: l("Implementation Strategy", "استراتيجية التطبيق"), text: l("Building a practical implementation strategy that keeps your business competitive.", "بناء استراتيجية تطبيق عملية تواكب أحدث التقنيات.") },
      { title: l("AI-Powered Tools", "منصات GRC والموارد البشرية"), text: l("Ready-to-use AI-powered platforms, including GRC and HR systems, to put strategy into action.", "منصات ذكاء اصطناعي جاهزة، منها أنظمة الحوكمة والمخاطر والامتثال (GRC) ومنصات الموارد البشرية (HR).") },
    ],
    related: ["digital-transformation", "it-consulting", "governance"],
  },

  // ─────────────────────────────── 03 Digital Transformation ───────────────────────────────
  {
    slug: "digital-transformation",
    icon: "workflow",
    category: "digital-ai",
    featured: true,
    visual: "digital",
    capabilityLayout: "timeline",
    title: l("Digital Transformation", "التحول الرقمي"),
    summary: l("An end-to-end transformation journey: systems evaluation, digital roadmap, automation and customer experience.", "رحلة تحول رقمي شاملة: تقييم الأنظمة، خارطة طريق رقمية، الأتمتة وتجربة العملاء."),
    description: l(
      "We guide organizations through a complete digital transformation journey — evaluating current systems, designing an integrated digital roadmap covering automation and internal system development, and enhancing customer experience for a more efficient, agile, and sustainable future.",
      "نرافق الشركات في رحلة التحول الرقمي الشامل، من خلال تقييم الأنظمة والعمليات الحالية، وتصميم خارطة طريق رقمية متكاملة تشمل الأتمتة وتطوير الأنظمة الداخلية وتحسين تجربة العملاء، بما يضمن الانتقال السلس نحو بيئة عمل رقمية أكثر كفاءة ومرونة واستدامة.",
    ),
    whyItMatters: l(
      "Digital transformation is a journey, not a software purchase. Understanding today's systems and processes first makes it possible to plan one integrated roadmap — automation, internal systems and customer experience moving together — so the move to a digital way of working is smooth rather than disruptive.",
      "التحول الرقمي رحلة وليس شراءً لبرمجيات. ففهم الأنظمة والعمليات الحالية أولاً يتيح تخطيط خارطة طريق واحدة متكاملة — تتقدم فيها الأتمتة والأنظمة الداخلية وتجربة العملاء معاً — ليكون الانتقال إلى بيئة العمل الرقمية سلساً لا مربكاً.",
    ),
    outcomes: [
      { icon: "gauge", title: l("Efficiency", "الكفاءة"), text: l("Processes that run with less manual effort.", "عمليات تعمل بجهد يدوي أقل.") },
      { icon: "route", title: l("Agility", "المرونة"), text: l("A digital environment that adapts as needs change.", "بيئة رقمية تتكيف مع تغير الاحتياجات.") },
      { icon: "layers", title: l("Sustainability", "الاستدامة"), text: l("An integrated roadmap instead of disconnected projects.", "خارطة طريق متكاملة بدلاً من مشاريع متفرقة.") },
      { icon: "users", title: l("Better customer experience", "تجربة عملاء أفضل"), text: l("Customer experience improved as part of the journey.", "تحسين تجربة العملاء جزء من رحلة التحول.") },
    ],
    capabilities: [
      {
        title: l("The transformation journey", "رحلة التحول"),
        items: items([
          ["Evaluation of current systems and processes", "تقييم الأنظمة والعمليات الحالية"],
          ["Design of an integrated digital roadmap", "تصميم خارطة طريق رقمية متكاملة"],
          ["Automation", "الأتمتة"],
          ["Internal systems development", "تطوير الأنظمة الداخلية"],
          ["Customer experience enhancement", "تحسين تجربة العملاء"],
        ]),
      },
    ],
    steps: [
      { title: l("Systems Evaluation", "تقييم الأنظمة الحالية"), text: l("Evaluating current systems and processes.", "تقييم الأنظمة والعمليات الحالية.") },
      { title: l("Digital Roadmap", "خارطة الطريق الرقمية"), text: l("Designing an integrated digital roadmap covering automation and internal system development.", "تصميم خارطة طريق رقمية متكاملة تشمل الأتمتة وتطوير الأنظمة الداخلية.") },
      { title: l("Automation & CX", "الأتمتة وتجربة العملاء"), text: l("Enhancing customer experience for a more efficient, agile and sustainable future.", "تحسين تجربة العملاء بما يضمن الانتقال السلس نحو بيئة عمل رقمية أكثر كفاءة ومرونة واستدامة.") },
    ],
    related: ["artificial-intelligence", "it-consulting", "business-strategy"],
  },

  // ─────────────────────────────── 04 Spending Efficiency ───────────────────────────────
  {
    slug: "spending-efficiency",
    icon: "piggy-bank",
    category: "finance-efficiency",
    visual: "efficiency",
    capabilityLayout: "grid",
    title: l("Spending Efficiency", "كفاءة الإنفاق"),
    summary: l("Managing financial resources intelligently — improving spending and reducing waste without compromising quality.", "إدارة الموارد المالية بذكاء — تحسين الإنفاق وتقليل الهدر دون التأثير على جودة الخدمات."),
    description: l(
      "We help institutions manage their financial resources intelligently by improving spending and reducing waste. We work to raise operational efficiency without affecting the quality of services.",
      "نساعد المؤسسات على إدارة مواردها المالية بذكاء من خلال تحسين الإنفاق وتقليل الهدر. نعمل على رفع الكفاءة التشغيلية دون التأثير على جودة الخدمات.",
    ),
    whyItMatters: l(
      "Efficiency is not about cutting indiscriminately. Analysing where money actually goes, prioritising spending by the value it creates, and reviewing workforce and procurement costs lets an institution reduce waste while protecting the quality of the services it delivers — and report on it in line with regulatory requirements.",
      "الكفاءة لا تعني التقليص العشوائي. فتحليل أوجه الإنفاق الفعلية، وترتيب أولوياته وفق القيمة التي يحققها، ومراجعة تكاليف القوى العاملة والمشتريات، يمكّن المؤسسة من تقليل الهدر مع الحفاظ على جودة خدماتها — وإعداد التقارير بما يتوافق مع المتطلبات التنظيمية.",
    ),
    outcomes: [
      { icon: "coins", title: l("Less waste", "هدر أقل"), text: l("Spending focused where it creates value.", "إنفاق يتركز حيث يحقق القيمة.") },
      { icon: "gauge", title: l("Operational efficiency", "كفاءة تشغيلية"), text: l("Higher efficiency without affecting service quality.", "رفع الكفاءة دون التأثير على جودة الخدمات.") },
      { icon: "chart-column", title: l("Measured & reported", "قياس وتقارير"), text: l("Spending KPIs and reporting aligned with regulatory requirements.", "مؤشرات أداء للإنفاق وتقارير متوافقة مع المتطلبات التنظيمية.") },
    ],
    capabilities: [
      {
        title: l("What we deliver", "ما نقدمه"),
        items: items([
          ["Spend analysis to identify improvement opportunities", "تحليل الإنفاق لتحديد فرص التحسين"],
          ["Efficiency initiatives and value-based spending prioritization", "مبادرات الكفاءة وتحديد أولويات الإنفاق القائم على القيمة"],
          ["Workforce cost analysis and optimization strategies", "تحليل تكاليف القوى العاملة واستراتيجيات التحسين"],
          ["Procurement review to improve supply efficiency and reduce costs", "مراجعة المشتريات لتحسين كفاءة التوريد وخفض التكاليف"],
          ["Spending KPIs and reporting in line with regulatory requirements", "مؤشرات الأداء الرئيسية للإنفاق وإعداد التقارير بما يتوافق مع المتطلبات التنظيمية"],
        ]),
      },
    ],
    steps: [
      { title: l("Analyse", "التحليل"), text: l("Spend analysis to identify improvement opportunities.", "تحليل الإنفاق لتحديد فرص التحسين.") },
      { title: l("Prioritise", "تحديد الأولويات"), text: l("Efficiency initiatives and value-based prioritization.", "مبادرات الكفاءة والأولويات القائمة على القيمة.") },
      { title: l("Optimise", "التحسين"), text: l("Workforce costs and procurement efficiency.", "تكاليف القوى العاملة وكفاءة المشتريات.") },
      { title: l("Measure", "القياس"), text: l("Spending KPIs and regulatory-aligned reporting.", "مؤشرات الإنفاق والتقارير المتوافقة مع المتطلبات.") },
    ],
    related: ["financial-consulting", "business-strategy", "human-capital"],
  },

  // ─────────────────────────────── 05 Business & Strategy ───────────────────────────────
  {
    slug: "business-strategy",
    icon: "compass",
    category: "governance-strategy",
    featured: true,
    visual: "strategy",
    capabilityLayout: "tabs",
    title: l("Business & Strategy", "الأعمال والاستراتيجية"),
    summary: l("Innovative growth strategies that turn visions into practical, measurable results.", "استراتيجيات نمو مبتكرة تحوّل الرؤى إلى نتائج عملية قابلة للقياس."),
    description: l(
      "We design innovative growth strategies that support institutional development and enhance competitiveness. We help institutions turn their visions into practical, measurable results.",
      "نصمم استراتيجيات نمو مبتكرة تدعم التطور المؤسسي وتعزز القدرة التنافسية. نساعد المؤسسات على تحويل رؤاها إلى نتائج عملية قابلة للقياس.",
    ),
    whyItMatters: l(
      "A strategy only matters once it is executed and measured. The work therefore covers the whole chain: assessing strategy and execution maturity, formulating the strategy, designing the operating model that activates it, and building the scorecards, KPIs and reports that show whether the vision is turning into results.",
      "لا تكتسب الاستراتيجية قيمتها إلا عند تنفيذها وقياسها. لذلك يغطي العمل السلسلة كاملة: تقييم نضج الاستراتيجية والتنفيذ، وصياغة الاستراتيجية، وتصميم نموذج التشغيل الذي يفعّلها، وبناء بطاقات الأداء والمؤشرات والتقارير التي تُظهر تحوّل الرؤية إلى نتائج.",
    ),
    outcomes: [
      { icon: "trending-up", title: l("Competitiveness", "قدرة تنافسية"), text: l("Growth strategies that strengthen the institution's position.", "استراتيجيات نمو تعزز موقع المؤسسة.") },
      { icon: "target", title: l("Measurable results", "نتائج قابلة للقياس"), text: l("Objectives, KPIs and impact reports linked to the vision.", "أهداف ومؤشرات وتقارير أثر مرتبطة بالرؤية.") },
      { icon: "building", title: l("Institutional development", "تطور مؤسسي"), text: l("An operating model and structure aligned with the strategy.", "نموذج تشغيل وهيكل متوائمان مع الاستراتيجية.") },
    ],
    capabilities: [
      {
        title: l("Strategy design", "تصميم الاستراتيجية"),
        items: items([
          ["Strategy and execution maturity assessment", "تقييم نضج الاستراتيجية والتنفيذ"],
          ["Strategy formulation and renewal", "صياغة الاستراتيجية وتجديدها"],
          ["Vision, mission, and values development", "تطوير الرؤية والرسالة والقيم"],
          ["Business model development", "تطوير نموذج الأعمال"],
        ]),
      },
      {
        title: l("Activation & planning", "التفعيل والتخطيط"),
        items: items([
          ["Operating model design to activate strategy", "تصميم نموذج التشغيل لتفعيل الاستراتيجية"],
          ["Operational planning", "التخطيط التشغيلي"],
          ["Strategic initiatives roadmap and prioritization", "خارطة طريق المبادرات الاستراتيجية وتحديد أولوياتها"],
          ["Value chain analysis and improvement", "تحليل سلسلة القيمة وتحسينها"],
          ["Feasibility studies for new or expansion projects", "دراسات الجدوى للمشاريع الجديدة أو التوسعية"],
        ]),
      },
      {
        title: l("Performance & measurement", "الأداء والقياس"),
        items: items([
          ["Balanced Scorecard design and monitoring", "تصميم ومراقبة بطاقة الأداء المتوازن"],
          ["Strategy management guide and reporting framework", "دليل إدارة الاستراتيجية وإطار إعداد التقارير"],
          ["Strategic objectives mapping and KPI alignment", "رسم خرائط الأهداف الاستراتيجية ومواءمة مؤشرات الأداء الرئيسية"],
          ["KPI development and organizational structure alignment", "تطوير مؤشرات الأداء الرئيسية ومواءمة الهيكل التنظيمي"],
          ["Impact measurement reports", "تقارير قياس الأثر"],
        ]),
      },
    ],
    steps: [
      { title: l("Assess", "التقييم"), text: l("Strategy and execution maturity.", "نضج الاستراتيجية والتنفيذ.") },
      { title: l("Formulate", "الصياغة"), text: l("Vision, mission, values, strategy and business model.", "الرؤية والرسالة والقيم والاستراتيجية ونموذج الأعمال.") },
      { title: l("Activate", "التفعيل"), text: l("Operating model, operational plans and initiative roadmap.", "نموذج التشغيل والخطط التشغيلية وخارطة المبادرات.") },
      { title: l("Measure", "القياس"), text: l("Balanced Scorecard, KPIs and impact reports.", "بطاقة الأداء المتوازن والمؤشرات وتقارير الأثر.") },
    ],
    related: ["governance", "spending-efficiency", "digital-transformation"],
  },

  // ─────────────────────────────── 06 IT Consulting ───────────────────────────────
  {
    slug: "it-consulting",
    icon: "server-cog",
    category: "digital-ai",
    visual: "it",
    capabilityLayout: "matrix",
    title: l("IT Consulting", "استشارات تكنولوجيا المعلومات"),
    summary: l("Advanced technical solutions that help institutions adopt the right technology for faster, more effective performance.", "حلول تقنية متقدمة تساعد المؤسسات على تبني التكنولوجيا المناسبة لأداء أسرع وأكثر فعالية."),
    description: l(
      "We provide advanced technical solutions that support digital transformation and increase the efficiency of operational systems. We help institutions adopt the right technology to achieve faster and more effective performance.",
      "نقدم حلولاً تقنية متقدمة تدعم التحول الرقمي وتزيد من كفاءة الأنظمة التشغيلية. نساعد المؤسسات على تبني التكنولوجيا المناسبة لتحقيق أداء أسرع وأكثر فعالية.",
    ),
    whyItMatters: l(
      "Technology delivers when it is planned, governed and secured as one system. Recognised frameworks — COBIT and ITIL for maturity, ISO/IEC 20000 for service management, ISO/IEC 27001 for information security, PMI and Agile for delivery — give that system a proven backbone, while continuity planning and team capability keep it resilient.",
      "تحقق التكنولوجيا أثرها عندما تُخطَّط وتُحكم وتُؤمَّن كمنظومة واحدة. وتمنح الأطر المعتمدة — COBIT و ITIL لتقييم النضج، و ISO/IEC 20000 لإدارة الخدمات، و ISO/IEC 27001 لأمن المعلومات، و PMI و Agile لإدارة المشاريع — هذه المنظومة عموداً فقرياً مجرباً، بينما يحافظ تخطيط الاستمرارية وبناء قدرات الفريق على صمودها.",
    ),
    outcomes: [
      { icon: "gauge", title: l("Faster, more effective performance", "أداء أسرع وأكثر فعالية"), text: l("The right technology adopted for the institution's needs.", "تبني التكنولوجيا المناسبة لاحتياجات المؤسسة.") },
      { icon: "shield-check", title: l("Security & compliance", "الأمن والامتثال"), text: l("Information security frameworks and regulatory compliance.", "أطر أمن المعلومات والامتثال التنظيمي.") },
      { icon: "server-cog", title: l("Resilient operations", "عمليات مرنة وصامدة"), text: l("Business continuity and disaster recovery planning.", "التخطيط لاستمرارية الأعمال والتعافي من الكوارث.") },
    ],
    capabilities: [
      {
        title: l("Assessment & planning", "التقييم والتخطيط"),
        items: items([
          ["Digital infrastructure maturity assessment (COBIT, ITIL)", "تقييم نضج البنية التحتية الرقمية (COBIT، ITIL)"],
          ["Digital transformation planning aligned with strategic objectives", "تخطيط التحول الرقمي بما يتماشى مع الأهداف الاستراتيجية"],
          ["Digital transformation roadmap design", "تصميم خارطة طريق التحول الرقمي"],
          ["Technical feasibility studies for new projects", "دراسات الجدوى الفنية للمشاريع الجديدة"],
        ]),
      },
      {
        title: l("Systems & service management", "الأنظمة وإدارة الخدمات"),
        items: items([
          ["Information systems development to meet business needs", "تطوير نظم المعلومات لتلبية احتياجات العمل"],
          ["IT policies and procedures development", "تطوير سياسات وإجراءات تكنولوجيا المعلومات"],
          ["IT service management implementation (ISO/IEC 20000)", "تنفيذ إدارة خدمات تكنولوجيا المعلومات (ISO/IEC 20000)"],
          ["IT project management (PMI, Agile)", "إدارة مشاريع تكنولوجيا المعلومات (PMI، Agile)"],
          ["Technology KPI design and monitoring", "تصميم ومراقبة مؤشرات الأداء الرئيسية للتكنولوجيا"],
        ]),
      },
      {
        title: l("Security & continuity", "الأمن والاستمرارية"),
        items: items([
          ["Information security frameworks (ISO/IEC 27001)", "أطر أمن المعلومات (ISO/IEC 27001)"],
          ["Cybersecurity and regulatory compliance", "الأمن السيبراني والامتثال التنظيمي"],
          ["Business continuity and disaster recovery planning (BCP and DRP)", "التخطيط لاستمرارية الأعمال والتعافي من الكوارث (BCP و DRP)"],
        ]),
      },
      {
        title: l("People & capability", "الأفراد والقدرات"),
        items: items([["Technical team capacity building and awareness programs", "بناء قدرات الفريق التقني وبرامج التوعية"]]),
      },
    ],
    steps: [
      { title: l("Assess", "التقييم"), text: l("Infrastructure maturity against COBIT and ITIL.", "نضج البنية التحتية وفق COBIT و ITIL.") },
      { title: l("Plan", "التخطيط"), text: l("Transformation plan, roadmap and feasibility.", "خطة التحول وخارطة الطريق ودراسات الجدوى.") },
      { title: l("Implement & govern", "التنفيذ والحوكمة"), text: l("Systems, policies, service management and projects.", "الأنظمة والسياسات وإدارة الخدمات والمشاريع.") },
      { title: l("Secure & sustain", "التأمين والاستدامة"), text: l("Security, continuity, KPIs and team capability.", "الأمن والاستمرارية والمؤشرات وقدرات الفريق.") },
    ],
    related: ["digital-transformation", "artificial-intelligence", "iso-consulting"],
  },

  // ─────────────────────────────── 07 Financial Consulting ───────────────────────────────
  {
    slug: "financial-consulting",
    icon: "chart-line",
    category: "finance-efficiency",
    visual: "finance",
    capabilityLayout: "matrix",
    title: l("Financial Consulting", "الاستشارات المالية"),
    summary: l("Accurate financial analysis that supports decision-making and strengthens financial sustainability.", "تحليلات مالية دقيقة تدعم اتخاذ القرار وتعزز الاستدامة المالية."),
    description: l(
      "We provide accurate financial analyses that support decision-making and enhance the institution's financial sustainability. We focus on improving financial performance and achieving efficient resource use.",
      "نقدم تحليلات مالية دقيقة تدعم اتخاذ القرار وتعزز الاستدامة المالية للمؤسسة. نركز على تحسين الأداء المالي وتحقيق كفاءة استخدام الموارد.",
    ),
    whyItMatters: l(
      "Sound financial decisions rest on accurate analysis and sound structures. Assessing performance, building budgets and models, managing cash flow, and putting governance, compliance and risk mitigation in place gives leaders a reliable basis for decisions — and the KPIs and strategic reporting to follow them through.",
      "تقوم القرارات المالية السليمة على تحليل دقيق وهياكل متينة. فتقييم الأداء، وإعداد الميزانيات والنماذج المالية، وإدارة التدفق النقدي، وترسيخ الحوكمة والامتثال وتخفيف المخاطر، يمنح القيادة أساساً موثوقاً للقرار — ومؤشرات أداء وتقارير استراتيجية لمتابعته.",
    ),
    outcomes: [
      { icon: "lightbulb", title: l("Better decisions", "قرارات أفضل"), text: l("Accurate analyses that support decision-making.", "تحليلات دقيقة تدعم اتخاذ القرار.") },
      { icon: "shield-check", title: l("Financial sustainability", "الاستدامة المالية"), text: l("Structures, policies and risk mitigation.", "هياكل وسياسات وتخفيف للمخاطر.") },
      { icon: "trending-up", title: l("Improved performance", "أداء مالي أفضل"), text: l("Efficient use of resources and financial KPIs.", "كفاءة استخدام الموارد ومؤشرات أداء مالية.") },
    ],
    capabilities: [
      {
        title: l("Analysis & planning", "التحليل والتخطيط"),
        items: items([
          ["Financial performance assessment", "تقييم الأداء المالي"],
          ["Budget preparation", "إعداد الميزانيات"],
          ["Financial modeling and cost analysis", "النمذجة المالية وتحليل التكاليف"],
          ["Cash flow management", "إدارة التدفق النقدي"],
          ["Feasibility studies", "دراسات الجدوى"],
        ]),
      },
      {
        title: l("Structure & governance", "الهيكلة والحوكمة"),
        items: items([
          ["Financial structures and policies", "الهياكل والسياسات المالية"],
          ["Financial restructuring", "إعادة الهيكلة المالية"],
          ["Governance and compliance", "الحوكمة والامتثال"],
          ["Risk mitigation", "تخفيف المخاطر"],
        ]),
      },
      {
        title: l("Performance & capability", "الأداء والقدرات"),
        items: items([
          ["Financial KPIs", "مؤشرات الأداء الرئيسية المالية"],
          ["Strategic reporting", "التقارير الاستراتيجية"],
          ["Financial team training", "تدريب الفريق المالي"],
        ]),
      },
    ],
    steps: [
      { title: l("Assess", "التقييم"), text: l("Financial performance assessment.", "تقييم الأداء المالي.") },
      { title: l("Structure", "الهيكلة"), text: l("Structures, policies, governance and compliance.", "الهياكل والسياسات والحوكمة والامتثال.") },
      { title: l("Plan & model", "التخطيط والنمذجة"), text: l("Budgets, models, cash flow and feasibility.", "الميزانيات والنماذج والتدفق النقدي والجدوى.") },
      { title: l("Measure & report", "القياس والتقارير"), text: l("Financial KPIs and strategic reporting.", "مؤشرات الأداء المالية والتقارير الاستراتيجية.") },
    ],
    related: ["spending-efficiency", "governance", "business-strategy"],
  },

  // ─────────────────────────────── 08 Human Capital ───────────────────────────────
  {
    slug: "human-capital",
    icon: "users",
    category: "people-capability",
    visual: "people",
    capabilityLayout: "tabs",
    title: l("Human Capital", "رأس المال البشري"),
    summary: l("Developing people capabilities through training, development and workforce planning.", "تطوير كفاءات الموارد البشرية من خلال التدريب والتطوير وتخطيط القوى العاملة."),
    description: l(
      "We develop human resource competencies through training, development, and workforce planning. Our goal is to build an effective work environment that supports institutional growth and creativity.",
      "نطور كفاءات الموارد البشرية من خلال التدريب والتطوير وتخطيط القوى العاملة. هدفنا بناء بيئة عمل فعالة تدعم النمو والإبداع المؤسسي.",
    ),
    whyItMatters: l(
      "People systems shape how an institution grows. Connecting the human capital strategy and operating model with the structure, jobs, rewards, talent and performance systems — and anchoring them in clear policies, regulations and a code of conduct — builds an effective work environment instead of a collection of disconnected HR documents.",
      "تشكّل أنظمة الموارد البشرية طريقة نمو المؤسسة. فربط استراتيجية رأس المال البشري ونموذج تشغيله بالهيكل والوظائف والمكافآت وأنظمة المواهب والأداء — وترسيخها في سياسات ولوائح ومدونة سلوك واضحة — يبني بيئة عمل فعالة بدلاً من مجموعة وثائق موارد بشرية متفرقة.",
    ),
    outcomes: [
      { icon: "users", title: l("Effective work environment", "بيئة عمل فعالة"), text: l("Structures, jobs and policies that work together.", "هياكل ووظائف وسياسات تعمل بتكامل.") },
      { icon: "trending-up", title: l("Institutional growth", "نمو مؤسسي"), text: l("Workforce planning and succession for the future.", "تخطيط القوى العاملة والتعاقب الوظيفي للمستقبل.") },
      { icon: "lightbulb", title: l("Creativity", "الإبداع"), text: l("Performance and career systems that develop people.", "أنظمة أداء ومسارات وظيفية تطوّر الأفراد.") },
    ],
    capabilities: [
      {
        title: l("Strategy & operating model", "الاستراتيجية ونموذج التشغيل"),
        items: items([
          ["Human capital maturity assessment", "تقييم نضج رأس المال البشري"],
          ["Human capital strategy development", "تطوير استراتيجية رأس المال البشري"],
          ["Human capital operating model development", "تطوير نموذج تشغيل رأس المال البشري"],
        ]),
      },
      {
        title: l("Organisation & jobs", "التنظيم والوظائف"),
        items: items([
          ["Organizational and job structure design", "تصميم الهيكل التنظيمي والوظيفي"],
          ["Competency matrix development", "تطوير مصفوفة الكفاءات"],
          ["Job description development", "تطوير أوصاف الوظائف"],
          ["Job analysis, evaluation, and classification", "تحليل وتقييم وتصنيف الوظائف"],
          ["Job grading structure", "هيكل تصنيف الوظائف"],
        ]),
      },
      {
        title: l("Rewards", "المكافآت والتعويضات"),
        items: items([
          ["Salary and compensation scale design", "تصميم سلم الرواتب والتعويضات"],
          ["Benefits and rewards framework", "إطار المزايا والمكافآت"],
        ]),
      },
      {
        title: l("Talent & performance", "المواهب والأداء"),
        items: items([
          ["Workforce planning", "تخطيط القوى العاملة"],
          ["Talent acquisition system development", "تطوير نظام استقطاب المواهب"],
          ["Training needs assessment", "تقييم الاحتياجات التدريبية"],
          ["Performance management development", "تطوير إدارة الأداء"],
          ["Career path planning and succession planning guide", "دليل تخطيط المسار الوظيفي والتعاقب الوظيفي"],
        ]),
      },
      {
        title: l("Policies & regulations", "السياسات واللوائح"),
        items: items([
          ["HR policies and procedures development", "تطوير سياسات وإجراءات الموارد البشرية"],
          ["Internal HR regulations", "اللوائح الداخلية للموارد البشرية"],
          ["Employee handbook and forms", "دليل ونماذج الموظفين"],
          ["Code of conduct development", "تطوير مدونة قواعد السلوك"],
        ]),
      },
    ],
    steps: [
      { title: l("Assess", "التقييم"), text: l("Human capital maturity.", "نضج رأس المال البشري.") },
      { title: l("Design", "التصميم"), text: l("Strategy, operating model, structure and jobs.", "الاستراتيجية ونموذج التشغيل والهيكل والوظائف.") },
      { title: l("Develop", "التطوير"), text: l("Rewards, talent, training and performance.", "المكافآت والمواهب والتدريب والأداء.") },
      { title: l("Institutionalise", "المأسسة"), text: l("Policies, regulations, handbook and code of conduct.", "السياسات واللوائح ودليل الموظفين ومدونة السلوك.") },
    ],
    related: ["capacity-building", "business-strategy", "spending-efficiency"],
  },

  // ─────────────────────────────── 09 Capacity Building ───────────────────────────────
  {
    slug: "capacity-building",
    icon: "graduation-cap",
    category: "people-capability",
    visual: "capacity",
    capabilityLayout: "timeline",
    title: l("Capacity Building", "بناء القدرات"),
    summary: l("Empowering individuals and institutions with modern skills for tangible, sustainable results.", "تمكين الأفراد والمؤسسات بالمهارات الحديثة لتحقيق نتائج ملموسة ومستدامة."),
    description: l(
      "We work to empower individuals and institutions with modern skills and knowledge that enhance efficiency and support continuous development. We focus on developing practical capabilities to raise performance and achieve tangible, sustainable results.",
      "نعمل على تمكين الأفراد والمؤسسات بالمهارات والمعارف الحديثة التي تعزز الكفاءة وتدعم التطور المستمر. نركز على تطوير القدرات العملية لرفع الأداء وتحقيق نتائج ملموسة ومستدامة.",
    ),
    whyItMatters: l(
      "Training creates lasting value when it starts from real gaps and ends with measured results. Beginning with training needs and skills-gap analysis, developing leaders and organisational competencies, delivering specialised and skills programmes, and evaluating after training keeps learning practical and continuous.",
      "يحقق التدريب قيمة دائمة عندما ينطلق من فجوات حقيقية وينتهي بنتائج مقاسة. فالبدء بتقييم الاحتياجات التدريبية وتحليل فجوات المهارات، وتطوير القيادات والكفاءات التنظيمية، وتقديم البرامج التخصصية وبرامج المهارات، ثم التقييم بعد التدريب، يجعل التعلم عملياً ومستمراً.",
    ),
    outcomes: [
      { icon: "gauge", title: l("Higher performance", "أداء أعلى"), text: l("Practical capabilities that raise performance.", "قدرات عملية ترفع الأداء.") },
      { icon: "route", title: l("Continuous development", "تطور مستمر"), text: l("Continuous learning and post-training evaluation.", "التعلم المستمر وتقييم ما بعد التدريب.") },
      { icon: "trophy", title: l("Tangible, sustainable results", "نتائج ملموسة ومستدامة"), text: l("Programmes tied to real needs and measured outcomes.", "برامج مرتبطة باحتياجات حقيقية ونتائج مقاسة.") },
    ],
    capabilities: [
      { title: l("Diagnose", "التشخيص"), items: items([["Training needs assessment and skills gap analysis", "تقييم الاحتياجات التدريبية وتحليل فجوات المهارات"]]) },
      {
        title: l("Leaders & organisation", "القيادات والمؤسسة"),
        items: items([
          ["Leadership and executive development", "تطوير القيادات والمديرين التنفيذيين"],
          ["Organizational competency development", "تطوير الكفاءات التنظيمية"],
          ["Change and transformation management programs", "برامج إدارة التغيير والتحول"],
        ]),
      },
      {
        title: l("Specialised programmes", "البرامج التخصصية"),
        items: items([
          ["Governance and compliance training", "تدريب على الحوكمة والامتثال"],
          ["Performance management workshops and KPI alignment", "ورش عمل إدارة الأداء ومواءمة مؤشرات الأداء الرئيسية"],
          ["Internal control and risk management training", "تدريب على الرقابة الداخلية وإدارة المخاطر"],
        ]),
      },
      {
        title: l("Skills", "المهارات"),
        items: items([
          ["Soft skills and communication excellence", "المهارات الشخصية والتميز في التواصل"],
          ["Technical and functional skills development", "تطوير المهارات الفنية والوظيفية"],
        ]),
      },
      { title: l("Sustain", "الاستدامة"), items: items([["Continuous learning and post-training evaluation", "التعلم المستمر وتقييم ما بعد التدريب"]]) },
    ],
    steps: [
      { title: l("Diagnose", "التشخيص"), text: l("Training needs and skills gaps.", "الاحتياجات التدريبية وفجوات المهارات.") },
      { title: l("Develop", "التطوير"), text: l("Leaders, competencies and change programmes.", "القيادات والكفاءات وبرامج التغيير.") },
      { title: l("Deliver", "التنفيذ"), text: l("Specialised, soft and technical skills programmes.", "البرامج التخصصية والمهارات الشخصية والفنية.") },
      { title: l("Evaluate", "التقييم"), text: l("Continuous learning and post-training evaluation.", "التعلم المستمر وتقييم ما بعد التدريب.") },
    ],
    related: ["human-capital", "governance", "iso-consulting"],
  },

  // ─────────────────────────────── 10 ISO Consulting ───────────────────────────────
  {
    slug: "iso-consulting",
    icon: "badge-check",
    category: "quality-excellence",
    visual: "iso",
    capabilityLayout: "standards",
    title: l("ISO Consulting", "استشارات الأيزو والتميز المؤسسي"),
    summary: l("International ISO compliance and institutional excellence — from certification readiness to EFQM.", "المطابقة العالمية لمعايير الأيزو والتميز المؤسسي — من الجاهزية للشهادات إلى نموذج EFQM."),
    description: l(
      "We support institutions in achieving international ISO compliance by implementing world-class management systems across quality, safety, environment, security, and business continuity — ensuring certification readiness and sustained conformity with global standards.",
      "نساعد المؤسسات على تحقيق المطابقة العالمية لمعايير الأيزو من خلال تطبيق أنظمة إدارة عالمية المستوى في الجودة والسلامة والبيئة والأمن واستمرارية الأعمال، بما يضمن الجاهزية للحصول على الشهادات والالتزام المستمر بالمعايير الدولية.",
    ),
    whyItMatters: l(
      "International standards give institutions a proven, recognised way to manage quality, safety, the environment, information security and continuity. Implementing the management system properly — not just preparing documents — is what makes certification achievable and conformity lasting. Institutional excellence models such as EFQM then take performance beyond compliance.",
      "تمنح المعايير الدولية المؤسساتِ طريقة مجرّبة ومعترفاً بها لإدارة الجودة والسلامة والبيئة وأمن المعلومات والاستمرارية. وتطبيق نظام الإدارة تطبيقاً سليماً — لا مجرد إعداد الوثائق — هو ما يجعل الحصول على الشهادة ممكناً والمطابقة مستمرة. ثم تنقل نماذج التميز المؤسسي مثل EFQM الأداء إلى ما هو أبعد من الامتثال.",
    ),
    outcomes: [
      { icon: "badge-check", title: l("Certification readiness", "الجاهزية للشهادات"), text: l("Management systems implemented to international standards.", "أنظمة إدارة مطبقة وفق المعايير الدولية.") },
      { icon: "shield-check", title: l("Sustained conformity", "مطابقة مستمرة"), text: l("Ongoing commitment to global standards.", "التزام مستمر بالمعايير الدولية.") },
      { icon: "trophy", title: l("Institutional excellence", "التميز المؤسسي"), text: l("Processes and performance improved with lasting impact on results.", "عمليات وأداء محسّنان بأثر مستدام على النتائج.") },
    ],
    capabilities: [
      {
        title: l("ISO certifications we support", "شهادات الأيزو التي نقدمها"),
        items: items([
          ["Quality Management System — ISO 9001", "نظام إدارة الجودة — ISO 9001"],
          ["Environmental Management System — ISO 14001", "نظام الإدارة البيئية — ISO 14001"],
          ["Occupational Health & Safety System — ISO 45001", "نظام إدارة السلامة والصحة المهنية — ISO 45001"],
          ["IT Service Management System — ISO 20000", "نظام إدارة خدمات تكنولوجيا المعلومات — ISO 20000"],
          ["Business Continuity Management System — ISO 22301", "نظام إدارة استمرارية الأعمال — ISO 22301"],
          ["Energy Management System — ISO 50001", "نظام إدارة الطاقة — ISO 50001"],
          ["Facility Management System — ISO 41000", "نظام إدارة المرافق — ISO 41000"],
          ["Organizational Governance System — ISO 37000", "نظام حوكمة المنظمات — ISO 37000"],
          ["Innovation Management System — ISO 56001", "نظام إدارة الابتكار — ISO 56001"],
          ["Risk Management — ISO 31000", "إدارة المخاطر — ISO 31000"],
          ["Food Safety Management System — ISO 22000", "نظام إدارة سلامة الغذاء — ISO 22000"],
          ["Information Security Management System — ISO 27001", "نظام إدارة أمن المعلومات — ISO 27001"],
        ]),
      },
      {
        title: l("Institutional excellence consulting", "استشارات التميز المؤسسي"),
        text: l(
          "We help institutions achieve institutional excellence by developing effective strategies, improving processes, and raising institutional performance levels in a way that ensures sustainability and positive impact on results.",
          "نساعد المؤسسات على تحقيق التميز المؤسسي من خلال تطوير استراتيجيات فعّالة، وتحسين العمليات، ورفع مستوى الأداء المؤسسي بما يضمن الاستدامة والتأثير الإيجابي على النتائج.",
        ),
        items: items([
          ["European Foundation for Quality Management Model (EFQM)", "نموذج التميّز الأوروبي (EFQM)"],
          ["King Abdullah Excellence Award — readiness & preparation", "الاستعداد والتحضير لجائزة الملك عبدالله للتميز"],
          ["Institutional performance benchmarking and improvement roadmaps", "قياس الأداء المؤسسي ووضع خطط التحسين"],
          ["Excellence culture development and change management support", "تطوير ثقافة التميز ودعم إدارة التغيير"],
        ]),
      },
    ],
    steps: [
      { title: l("Implement", "التطبيق"), text: l("World-class management systems across quality, safety, environment, security and continuity.", "أنظمة إدارة عالمية المستوى في الجودة والسلامة والبيئة والأمن والاستمرارية.") },
      { title: l("Certify", "الجاهزية للشهادة"), text: l("Readiness for international certification.", "الجاهزية للحصول على الشهادات الدولية.") },
      { title: l("Sustain", "الاستدامة"), text: l("Sustained conformity with global standards.", "الالتزام المستمر بالمعايير الدولية.") },
      { title: l("Excel", "التميز"), text: l("EFQM, excellence awards readiness and performance improvement.", "نموذج EFQM والاستعداد لجوائز التميز وتحسين الأداء.") },
    ],
    related: ["governance", "it-consulting", "capacity-building"],
  },
];

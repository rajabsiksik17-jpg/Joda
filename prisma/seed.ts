/**
 * Seeds roles, settings, the first Super Admin and the official company content.
 *
 *   npm run db:seed              → roles + settings + admin; content only if the database has no pages
 *   npm run db:seed -- --force   → also (re)creates content (deletes existing pages, services, menus…)
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalizeDatabaseUrl } from "../src/lib/database-url";
import { hash } from "@node-rs/argon2";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { DEFAULT_ROLES } from "../src/lib/auth/permissions";
import { processUpload, slugifyFilename } from "../src/lib/media/process";
import { deleteObject, putObject } from "../src/lib/media/storage";
import { buildSnapshot } from "../src/lib/sections/snapshot";
import { defaultSectionData, defaultSectionSettings } from "../src/lib/sections/registry";
import { CEO, CLIENT_GROUPS, COMPANY, CONTACT, COOKIE_HTML, MARKETS, PARTNERS, PRIVACY_HTML, SERVICE_CATEGORIES, STATS } from "./seed-content";
import { SERVICES } from "./seed-services";
import { PAGE_SEO, SERVICE_SEO } from "./seed-seo";
import { ARTICLES, BLOG_CATEGORIES } from "./seed-articles";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL!) }) });
const force = process.argv.includes("--force");
type L = { ar: string; en: string };
const l = (en: string, ar: string): L => ({ en, ar });
const link = (en: string, ar: string, href: string) => ({ label: l(en, ar), href });

async function seedRoles() {
  for (const role of DEFAULT_ROLES) {
    await db.role.upsert({
      where: { key: role.key },
      create: { key: role.key, name: role.name, description: role.description, permissions: role.permissions, isSystem: true },
      // Keep permissions an admin may have customised; only refresh the super admin (always everything).
      update: role.key === "super_admin" ? { permissions: role.permissions } : {},
    });
  }
  // Permissions added after first install: extend existing roles that already handle the inbox.
  const added: [string, string][] = [["messages.view", "consultations.view"], ["messages.manage", "consultations.manage"], ["seo.edit", "analytics.view"], ["settings.edit", "analytics.view"]];
  for (const role of await db.role.findMany({ where: { key: { not: "super_admin" } } })) {
    const perms = new Set(role.permissions);
    for (const [has, grant] of added) if (perms.has(has)) perms.add(grant);
    if (perms.size !== role.permissions.length) await db.role.update({ where: { id: role.id }, data: { permissions: [...perms] } });
  }
}

async function seedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@qc-jo.com").toLowerCase();
  if (await db.user.findUnique({ where: { email } })) return;
  const generated = !process.env.SEED_ADMIN_PASSWORD;
  const password = process.env.SEED_ADMIN_PASSWORD ?? `${randomBytes(9).toString("base64url")}!Q7`;
  const role = await db.role.findUniqueOrThrow({ where: { key: "super_admin" } });
  await db.user.create({
    data: {
      email,
      name: process.env.SEED_ADMIN_NAME ?? "Administrator",
      passwordHash: await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 }),
      roleId: role.id,
    },
  });
  console.log(`\n  Super Admin created: ${email}`);
  if (generated) console.log(`  Temporary password:  ${password}\n  → Sign in at /admin/login and change it immediately (Account → Password).\n`);
}

async function seedSettings() {
  const settings: Record<string, Prisma.InputJsonValue> = {
    general: { siteName: COMPANY.siteName, legalName: COMPANY.legalName, tagline: COMPANY.tagline, defaultLocale: "ar" },
    brand: { logoColorId: null, logoWhiteId: null, iconId: null, faviconId: null, ogImageId: null },
    header: { showCta: true, ctaLabel: l("Request a consultation", "اطلب استشارة"), ctaHref: "/consultation" },
    footer: {
      about: l(
        "A leading name in management consulting in the Kingdom and the Gulf region — combining governance and management consulting with digital transformation and artificial intelligence.",
        "اسم رائد في مجال الاستشارات الإدارية في المملكة والخليج العربي، يجمع بين الحوكمة والاستشارات الإدارية والتحول الرقمي والذكاء الاصطناعي.",
      ),
      // Optional strip above the footer; pages already end with their own call-to-action band.
      ctaTitle: l("", ""),
      ctaLabel: l("Request a consultation", "اطلب استشارة"),
      ctaHref: "/consultation",
      signature: l("Elevating businesses to new heights.", "ننقل أعمالك إلى آفاق جديدة."),
    },
    contact: {
      address: CONTACT.address,
      workingHours: l("", ""),
      mapEnabled: true,
      mapLat: null,
      mapLng: null,
      mapZoom: 12,
      mapQuery: "Amman, Hashemite Kingdom of Jordan",
      mapUrl: "",
      notifyEmails: ["info@qc-jo.com"],
      autoReply: true,
    },
    seo: {
      titleTemplate: l("%s | Quality Experts", "%s | خبراء الجودة"),
      defaultDescription: l(
        "Quality Consulting & Training — management consulting in Jordan and the Gulf: governance, strategy, digital transformation, artificial intelligence, financial consulting, human capital and ISO.",
        "خبراء الجودة للاستشارات والتدريب — استشارات إدارية في الأردن والخليج العربي: الحوكمة، الاستراتيجية، التحول الرقمي، الذكاء الاصطناعي، الاستشارات المالية، رأس المال البشري والأيزو.",
      ),
      allowIndexing: true,
      twitterHandle: "",
      googleVerification: "",
      bingVerification: "",
    },
    analytics: { provider: "none", ga4MeasurementId: "", plausibleDomain: "" },
    maintenance: { enabled: false, message: l("We are updating our website. Please check back shortly.", "نقوم بتحديث موقعنا. يرجى العودة قريباً.") },
    security: { otpTtlMinutes: 5, otpMaxAttempts: 5, otpResendCooldownSeconds: 60, sessionHours: 12, maxFailedLogins: 5, lockoutMinutes: 15, otpMode: "new_device", trustedDeviceDays: 30 },
    consultation: { notifyEmails: [], autoReply: true, defaultCountry: "JO", preferredCountries: ["JO", "SA", "AE", "KW", "QA", "BH", "OM", "PS"], allowWhatsApp: true },
    // No official WhatsApp number is published yet, so that button starts disabled.
    floating: {
      contactEnabled: true, contactShowPhone: true, contactShowEmail: true, contactShowSocial: true, contactShowConsultation: true, contactMobile: true, contactDesktop: true,
      whatsappEnabled: false, whatsappNumber: "", whatsappMessage: l("Hello, I would like to learn more about your consulting services.", "مرحباً، أود معرفة المزيد عن خدماتكم الاستشارية."), whatsappSide: "start", whatsappMobile: true, whatsappDesktop: true,
    },
  };
  for (const [key, value] of Object.entries(settings)) {
    await db.setting.upsert({ where: { key }, create: { key, value }, update: force ? { value } : {} });
  }
}

async function uploadSeedAsset(file: string, alt: L) {
  const buf = await readFile(path.join(__dirname, "seed-assets", file));
  const processed = await processUpload(buf);
  const key = `seed/${slugifyFilename(file)}-${randomBytes(4).toString("hex")}.${processed.ext}`;
  await putObject(key, processed.data);
  return db.media.create({
    data: { key, originalName: file, mimeType: processed.mime, size: processed.data.length, width: processed.width, height: processed.height, alt, folder: "brand" },
  });
}

type SectionSeed = { type: string; data?: Record<string, unknown>; settings?: Record<string, unknown> };

async function createPage(slug: string, kind: "HOME" | "STANDARD" | "LEGAL", title: L, seo: Record<string, unknown>, sections: SectionSeed[], publish = true) {
  const page = await db.page.create({ data: { slug, kind, title, seo: { ...seo, ...(PAGE_SEO[slug] ?? {}) } as Prisma.InputJsonValue, status: "DRAFT" } });
  const created = [];
  for (const [i, s] of sections.entries()) {
    created.push(
      await db.pageSection.create({
        data: {
          pageId: page.id,
          type: s.type,
          order: i,
          data: { ...defaultSectionData(s.type), ...(s.data ?? {}) } as Prisma.InputJsonValue,
          settings: { ...defaultSectionSettings(), ...(s.settings ?? {}) } as Prisma.InputJsonValue,
        },
      }),
    );
  }
  if (publish) {
    const snapshot = buildSnapshot(page, created);
    await db.page.update({ where: { id: page.id }, data: { status: "PUBLISHED", publishedAt: new Date(), publishedSnapshot: snapshot as unknown as Prisma.InputJsonValue, hasUnpublishedChanges: false } });
    await db.pageRevision.create({ data: { pageId: page.id, snapshot: snapshot as unknown as Prisma.InputJsonValue, note: "Initial content" } });
  }
  return page;
}

async function clearContent() {
  await db.blogPost.deleteMany();
  await db.blogCategory.deleteMany();
  const seedMedia = await db.media.findMany({ where: { key: { startsWith: "seed/" } }, select: { id: true, key: true } });
  for (const m of seedMedia) await deleteObject(m.key).catch(() => undefined);
  await db.media.deleteMany({ where: { id: { in: seedMedia.map((m) => m.id) } } });
  await db.menuItem.deleteMany();
  await db.menu.deleteMany();
  await db.page.deleteMany();
  await db.service.deleteMany();
  await db.serviceCategory.deleteMany();
  await db.teamMember.deleteMany();
  await db.partner.deleteMany();
  await db.client.deleteMany();
  await db.clientGroup.deleteMany();
  await db.stat.deleteMany();
  await db.contactChannel.deleteMany();
  await db.socialLink.deleteMany();
}

async function seedContent() {
  if (force) await clearContent();

  // Media from the official profile
  const ceoPhoto = await uploadSeedAsset("ceo-nael-saadeh.png", CEO.name);
  const partnerLogos: Record<string, string> = {};
  for (const p of PARTNERS) partnerLogos[p.logo] = (await uploadSeedAsset(p.logo, p.name)).id;

  // Statistics
  for (const [i, s] of STATS.entries()) await db.stat.create({ data: { value: s.value, label: s.label, order: i } });

  // Leadership
  const ceo = await db.teamMember.create({ data: { name: CEO.name, position: CEO.position, message: CEO.message, photoId: ceoPhoto.id, isLeadership: true, featured: true, order: 0 } });

  // Partners
  for (const [i, p] of PARTNERS.entries()) {
    await db.partner.create({ data: { name: p.name, description: p.description ?? undefined, logoId: partnerLogos[p.logo], logoTone: p.logoTone, isStrategic: p.isStrategic, order: i } });
  }

  // Clients
  for (const [gi, g] of CLIENT_GROUPS.entries()) {
    const group = await db.clientGroup.create({ data: { name: g.name, order: gi } });
    for (const [ci, name] of g.clients.entries()) await db.client.create({ data: { name: { en: name, ar: "" }, groupId: group.id, order: ci } });
  }

  // Contact channels
  for (const [i, c] of CONTACT.channels.entries()) {
    await db.contactChannel.create({ data: { type: c.type, value: c.value, label: c.label, isPrimary: c.isPrimary, visible: c.visible, order: i } });
  }

  // Services
  const categoryIds: Record<string, string> = {};
  for (const [i, c] of SERVICE_CATEGORIES.entries()) categoryIds[c.slug] = (await db.serviceCategory.create({ data: { slug: c.slug, name: c.name, order: i } })).id;
  const serviceIds: Record<string, string> = {};
  for (const [i, s] of SERVICES.entries()) {
    const created = await db.service.create({
      data: {
        slug: s.slug, order: i, icon: s.icon, title: s.title, summary: s.summary, description: s.description,
        capabilities: s.capabilities as Prisma.InputJsonValue, steps: s.steps as Prisma.InputJsonValue,
        whyItMatters: s.whyItMatters, outcomes: s.outcomes as Prisma.InputJsonValue, visual: s.visual, capabilityLayout: s.capabilityLayout,
        featured: !!s.featured, categoryId: categoryIds[s.category], status: "PUBLISHED", publishedAt: new Date(),
        seo: (SERVICE_SEO[s.slug] ?? {}) as Prisma.InputJsonValue,
      },
    });
    serviceIds[s.slug] = created.id;
  }
  for (const s of SERVICES) {
    await db.service.update({ where: { id: serviceIds[s.slug] }, data: { related: { connect: s.related.map((slug) => ({ id: serviceIds[slug] })) } } });
  }

  const markets = MARKETS.map((m) => ({ name: m }));
  const consult = link("Talk to our experts", "تحدث مع خبرائنا", "/contact");
  const requestConsultation = link("Request a consultation", "اطلب استشارة", "/consultation");
  const exploreServices = link("Explore our services", "استكشف خدماتنا", "/services");
  const ctaBand: SectionSeed = {
    type: "cta",
    data: {
      variant: "navy",
      eyebrow: l("Get in touch", "تواصل معنا"),
      title: l("Ready to take your organization further?", "هل أنت مستعد للانتقال بمؤسستك إلى آفاق جديدة؟"),
      text: l("Talk to our experts about governance, strategy, digital transformation and artificial intelligence.", "تحدث مع خبرائنا حول الحوكمة والاستراتيجية والتحول الرقمي والذكاء الاصطناعي."),
      primaryCta: requestConsultation,
      secondaryCta: exploreServices,
    },
  };
  const ceoSection: SectionSeed = { type: "leaderMessage", data: { eyebrow: l("A message from our CEO", "كلمة الرئيس التنفيذي"), mode: "single", memberId: ceo.id }, settings: { anchor: "leadership" } };
  const visionSection: SectionSeed = { type: "statement", data: { eyebrow: l("Our vision", "رؤيتنا"), text: COMPANY.vision, showMotif: true }, settings: { theme: "navy", anchor: "vision" } };
  // Brand values as published in the official visual identity guide.
  const valuesSection: SectionSeed = {
    type: "cards",
    data: {
      eyebrow: l("Our values", "قيمنا"),
      title: l("The principles behind every engagement", "المبادئ التي تقود كل مشروع"),
      columns: "3",
      style: "numbered",
      items: [
        { icon: "shield-check", title: l("Trust", "الثقة"), text: l("Established professionalism in every detail.", "احترافية راسخة في كل تفصيل.") },
        { icon: "brain-circuit", title: l("Artificial intelligence", "الذكاء الاصطناعي"), text: l("Technology-powered consulting solutions.", "حلول استشارية مدعومة بالتقنية.") },
        { icon: "trending-up", title: l("Growth", "النمو"), text: l("Measurable results that keep evolving.", "نتائج قابلة للقياس والتطور.") },
        { icon: "graduation-cap", title: l("Training", "التدريب"), text: l("Building institutional capabilities and competencies.", "بناء قدرات وكفاءات مؤسسية.") },
        { icon: "globe", title: l("Global openness", "الانفتاح العالمي"), text: l("International standards and methodologies.", "معايير ومنهجيات دولية.") },
        { icon: "handshake", title: l("Partnership", "الشراكة"), text: l("Long-term relationships with our clients.", "علاقات طويلة الأمد مع العملاء.") },
      ],
    },
  };
  const teamSection: SectionSeed = {
    type: "team",
    data: { eyebrow: l("Our team", "فريقنا"), title: l("The consultants behind our work", "المستشارون الذين يقفون خلف أعمالنا"), filter: "team", layout: "grid" },
    settings: { theme: "muted", anchor: "team" },
  };
  const partnersSection: SectionSeed = {
    type: "partners",
    data: { eyebrow: l("Our strategic partner", "شريكنا الاستراتيجي"), title: l("Combined expertise for seamless, successful business solutions", "خبرات مشتركة لحلول أعمال سلسة وناجحة") },
    settings: { theme: "muted" },
  };
  const statsSection: SectionSeed = {
    type: "stats",
    data: {
      eyebrow: l("Our expertise", "خبراتنا"),
      title: l("A proven track record across Jordan, the Gulf, Palestine and Sudan", "سجل حافل في الأردن ودول الخليج وفلسطين والسودان"),
      text: COMPANY.expertise,
      layout: "cards",
      markets,
    },
  };

  // Home
  await createPage("home", "HOME", l("Home", "الرئيسية"), {}, [
    {
      type: "hero",
      data: {
        variant: "network",
        eyebrow: l("Management consulting · Jordan & the Gulf", "استشارات إدارية · الأردن والخليج العربي"),
        title: l("Elevating your business", "ننقل أعمالك"),
        titleAccent: l("to new heights.", "إلى آفاق جديدة."),
        text: l(
          "Solid expertise in governance and management consulting, with a special focus on digital transformation and artificial intelligence — helping organizations operate more efficiently and make smarter decisions.",
          "خبرة راسخة في الحوكمة والاستشارات الإدارية، مع اهتمام خاص بالتحول الرقمي وتوظيف حلول الذكاء الاصطناعي لتمكين المؤسسات من العمل بكفاءة أعلى واتخاذ قرارات أذكى.",
        ),
        primaryCta: exploreServices,
        secondaryCta: requestConsultation,
        showStats: true,
      },
    },
    {
      type: "textMedia",
      data: {
        eyebrow: l("About us", "نبذة عنا"),
        title: l("A leading name in management consulting in the Kingdom and the Gulf", "اسم رائد في مجال الاستشارات الإدارية في المملكة والخليج العربي"),
        body: { en: `<p>${COMPANY.about.en}</p>`, ar: `<p>${COMPANY.about.ar}</p>` },
        visual: "squares",
        imagePosition: "start",
        cta: link("More about us", "المزيد عنا", "/about"),
      },
    },
    { type: "services", data: { eyebrow: l("Our services", "خدماتنا"), title: l("Ten core services. One trusted partner.", "عشر خدمات رئيسية، وشريك واحد موثوق."), text: COMPANY.servicesIntro, layout: "showcase", cta: link("View all services", "عرض جميع الخدمات", "/services") }, settings: { theme: "muted" } },
    {
      type: "process",
      data: {
        eyebrow: l("Artificial intelligence", "الذكاء الاصطناعي"),
        title: l("From digital readiness to AI-powered operations", "من الجاهزية الرقمية إلى عمليات مدعومة بالذكاء الاصطناعي"),
        text: l(
          "Beyond strategy, we equip you with ready-to-use AI-powered platforms — including GRC and HR systems — to put that strategy into action.",
          "لا نكتفي بالاستشارة؛ بل نزوّدكم بمنصات ذكاء اصطناعي جاهزة، منها أنظمة الحوكمة والمخاطر والامتثال (GRC) ومنصات الموارد البشرية (HR)، لتفعيل الاستراتيجية على أرض الواقع.",
        ),
        layout: "steps",
        steps: SERVICES.find((s) => s.slug === "artificial-intelligence")!.steps.map((s, i) => ({ marker: String(i + 1).padStart(2, "0"), title: s.title, text: s.text })),
      },
      settings: { theme: "navy" },
    },
    statsSection,
    visionSection,
    ceoSection,
    partnersSection,
    { type: "clients", data: { eyebrow: l("Our clients", "عملاؤنا"), title: l("Trusted by more than 100 organizations", "موضع ثقة أكثر من 100 مؤسسة"), layout: "tabs" } },
    { type: "latestPosts", data: { eyebrow: l("Insights", "المقالات"), title: l("Latest insights", "أحدث المقالات"), layout: "slider", limit: 6, cta: link("All insights", "جميع المقالات", "/insights") }, settings: { theme: "muted" } },
    ctaBand,
  ]);

  // About
  const about = await createPage("about", "STANDARD", l("About us", "من نحن"), { description: l("Quality Consulting & Training: management consulting in Jordan and the Gulf, combining governance expertise with digital transformation and AI.", "خبراء الجودة للاستشارات والتدريب: استشارات إدارية في الأردن والخليج العربي تجمع بين خبرة الحوكمة والتحول الرقمي والذكاء الاصطناعي.") }, [
    { type: "pageHeader", data: { eyebrow: l("About us", "نبذة عنا"), title: l("Elevating businesses to new heights", "ننقل الأعمال إلى آفاق جديدة"), text: COMPANY.servicesIntro, showBreadcrumbs: true } },
    { type: "textMedia", data: { eyebrow: l("Who we are", "من نحن"), title: l("A dynamic management consulting firm", "شركة استشارات إدارية ديناميكية"), body: { en: `<p>${COMPANY.about.en}</p>`, ar: `<p>${COMPANY.about.ar}</p>` }, visual: "network", imagePosition: "end", showSocial: true } },
    visionSection,
    valuesSection,
    { ...statsSection, settings: { theme: "muted" } },
    ceoSection,
    teamSection,
    partnersSection,
    ctaBand,
  ]);

  const teamPage = await createPage("team", "STANDARD", l("Leadership & team", "القيادة والفريق"), { description: l("The leadership and consultants of Quality Consulting & Training.", "قيادة ومستشارو خبراء الجودة للاستشارات والتدريب.") }, [
    { type: "pageHeader", data: { eyebrow: l("Leadership & team", "القيادة والفريق"), title: l("People who turn expertise into impact", "أشخاص يحوّلون الخبرة إلى أثر"), text: COMPANY.expertise, showBreadcrumbs: true } },
    { type: "team", data: { eyebrow: l("Leadership", "القيادة"), title: l("Our leadership", "قيادتنا"), filter: "leadership", layout: "spotlight" }, settings: { anchor: "leadership" } },
    { ...teamSection, settings: { anchor: "team" } },
    valuesSection,
    ctaBand,
  ]);

  const consultationPage = await createPage("consultation", "STANDARD", l("Request a consultation", "اطلب استشارة"), { description: l("Request a consultation from Quality Experts: governance, strategy, digital transformation, AI, finance, human capital and ISO.", "اطلب استشارة من خبراء الجودة: الحوكمة، الاستراتيجية، التحول الرقمي، الذكاء الاصطناعي، المالية، رأس المال البشري والأيزو.") }, [
    {
      type: "pageHeader",
      data: {
        eyebrow: l("Request a consultation", "اطلب استشارة"),
        title: l("Tell us where you want to take your organization", "أخبرنا إلى أين تريد أن تمضي بمؤسستك"),
        text: l("Share a few details about your needs and the area you are interested in — one of our consultants will get back to you.", "شاركنا بعض التفاصيل عن احتياجاتك والمجال الذي يهمك، وسيتواصل معك أحد مستشارينا."),
        showBreadcrumbs: true,
      },
    },
    {
      type: "consultation",
      data: {
        asideTitle: l("What happens next", "ماذا يحدث بعد ذلك"),
        showChannels: true,
        steps: [
          { title: l("Share your needs", "شاركنا احتياجاتك"), text: l("Tell us about your organization and the area you are interested in.", "حدثنا عن مؤسستك والمجال الذي يهمك.") },
          { title: l("We review your request", "نراجع طلبك"), text: l("A consultant reviews your request in light of your goals.", "يراجع أحد المستشارين طلبك في ضوء أهدافك.") },
          { title: l("We get in touch", "نتواصل معك"), text: l("We contact you by your preferred method to agree on the next step.", "نتواصل معك عبر الوسيلة التي تفضلها للاتفاق على الخطوة التالية.") },
        ],
      },
    },
    { ...statsSection, settings: { theme: "muted" } },
  ]);

  const servicesPage = await createPage("services", "STANDARD", l("Services", "الخدمات"), { description: l("Ten core consulting services: governance, AI, digital transformation, spending efficiency, strategy, IT, financial, human capital, capacity building and ISO.", "عشر خدمات استشارية رئيسية: الحوكمة، الذكاء الاصطناعي، التحول الرقمي، كفاءة الإنفاق، الاستراتيجية، تكنولوجيا المعلومات، المالية، رأس المال البشري، بناء القدرات والأيزو.") }, [
    { type: "pageHeader", data: { eyebrow: l("Our services", "خدماتنا"), title: l("Consulting services built for measurable impact", "خدمات استشارية مصممة لأثر قابل للقياس"), text: COMPANY.servicesIntro, showBreadcrumbs: true } },
    { type: "services", data: { layout: "grid" } },
    ctaBand,
  ]);

  const clientsPage = await createPage("clients", "STANDARD", l("Clients & partners", "العملاء والشركاء"), { description: l("Organizations across Jordan, the Gulf and Palestine that trust Quality Experts, and our strategic partners.", "مؤسسات في الأردن والخليج العربي وفلسطين تثق بخبراء الجودة، وشركاؤنا الاستراتيجيون.") }, [
    { type: "pageHeader", data: { eyebrow: l("Clients & partners", "العملاء والشركاء"), title: l("Trusted by more than 100 organizations", "موضع ثقة أكثر من 100 مؤسسة"), text: COMPANY.expertise, showBreadcrumbs: true } },
    { type: "clients", data: { layout: "tabs" } },
    partnersSection,
    ctaBand,
  ]);

  const insights = await createPage("insights", "STANDARD", l("Insights", "المقالات"), { description: l("Insights from Quality Experts on governance, strategy, digital transformation and AI.", "مقالات خبراء الجودة حول الحوكمة والاستراتيجية والتحول الرقمي والذكاء الاصطناعي.") }, [
    {
      type: "pageHeader",
      data: {
        eyebrow: l("Insights", "المقالات"),
        title: l("Perspectives from our consultants", "رؤى من مستشارينا"),
        text: l("Ideas and practical guidance on governance, strategy, digital transformation and artificial intelligence.", "أفكار وإرشادات عملية في الحوكمة والاستراتيجية والتحول الرقمي والذكاء الاصطناعي."),
        showBreadcrumbs: true,
      },
    },
    { type: "postListing", data: { pageSize: 10, showSearch: true, showCategories: true } },
    ctaBand,
  ]);

  const contact = await createPage("contact", "STANDARD", l("Contact us", "تواصل معنا"), { description: l("Contact Quality Consulting & Training in Amman, Jordan.", "تواصل مع خبراء الجودة للاستشارات والتدريب في عمّان، الأردن.") }, [
    { type: "pageHeader", data: { eyebrow: l("Contact us", "تواصل معنا"), title: l("Let's talk about your next step", "لنتحدث عن خطوتك القادمة"), text: l("Whether you need management consulting, governance, digital transformation or international quality systems, our experts are here to help.", "سواء كنت تبحث عن استشارة إدارية أو حوكمة أو تحول رقمي أو تطبيق أنظمة الجودة العالمية، خبراؤنا هنا لمساعدتك."), showBreadcrumbs: true } },
    {
      type: "contactCards",
      data: {
        showHours: true,
        showSocial: true,
        socialTitle: l("Follow our latest news", "تابع آخر أخبارنا"),
        ctaTitle: l("Looking for expert advice on a specific challenge?", "هل تبحث عن مشورة متخصصة في تحدٍّ محدد؟"),
        ctaText: l("Send a structured consultation request and we will route it to the right expert.", "أرسل طلب استشارة منظماً وسنوجهه إلى الخبير المناسب."),
        cta: requestConsultation,
      },
    },
    { type: "contact", data: { eyebrow: l("Send us a message", "أرسل لنا رسالة"), title: l("We'd be glad to hear from you", "يسعدنا تواصلك معنا"), showForm: true, showChannels: false, showMap: true }, settings: { theme: "muted" } },
  ]);

  const privacy = await createPage("privacy-policy", "LEGAL", l("Privacy policy", "سياسة الخصوصية"), {}, [
    { type: "pageHeader", data: { title: l("Privacy policy", "سياسة الخصوصية"), showBreadcrumbs: true } },
    { type: "richText", data: { body: PRIVACY_HTML, width: "narrow" } },
  ]);
  const cookies = await createPage("cookie-policy", "LEGAL", l("Cookie policy", "سياسة ملفات تعريف الارتباط"), {}, [
    { type: "pageHeader", data: { title: l("Cookie policy", "سياسة ملفات تعريف الارتباط"), showBreadcrumbs: true } },
    { type: "richText", data: { body: COOKIE_HTML, width: "narrow" } },
  ]);
  const terms = await createPage("terms", "LEGAL", l("Terms & conditions", "الشروط والأحكام"), {}, [
    { type: "pageHeader", data: { title: l("Terms & conditions", "الشروط والأحكام"), showBreadcrumbs: true } },
    { type: "richText", data: { body: { en: "<p>Terms and conditions to be provided by the company's legal advisor.</p>", ar: "<p>يتم توفير الشروط والأحكام من قبل المستشار القانوني للشركة.</p>" }, width: "narrow" } },
  ], false);

  // Navigation
  const header = await db.menu.create({ data: { key: "header", name: "Header" } });
  const footer = await db.menu.create({ data: { key: "footer", name: "Footer" } });
  const legal = await db.menu.create({ data: { key: "legal", name: "Legal" } });
  const aboutMenu = await db.menuItem.create({ data: { menuId: header.id, label: l("About", "من نحن"), linkType: "PAGE", pageId: about.id, order: 1 } });
  for (const [i, child] of ([
    { label: l("About us", "نبذة عنا"), description: l("Who we are and what drives us", "من نحن وما الذي يحركنا"), linkType: "PAGE", pageId: about.id },
    { label: l("Leadership & team", "القيادة والفريق"), description: l("The people behind our work", "الأشخاص الذين يقفون خلف أعمالنا"), linkType: "PAGE", pageId: teamPage.id },
    { label: l("Vision & values", "الرؤية والقيم"), description: l("Where we are heading and how we work", "إلى أين نمضي وكيف نعمل"), linkType: "INTERNAL", url: "/about#vision" },
  ] as const).entries()) {
    await db.menuItem.create({ data: { menuId: header.id, parentId: aboutMenu.id, order: i, ...child, label: child.label, description: child.description } });
  }
  const items: [string, Prisma.MenuItemUncheckedCreateInput][] = [
    ["header", { menuId: header.id, label: l("Home", "الرئيسية"), linkType: "INTERNAL", url: "/", order: 0 }],
    ["header", { menuId: header.id, label: l("Services", "الخدمات"), linkType: "SERVICES_MENU", url: "/services", order: 2 }],
    ["header", { menuId: header.id, label: l("Clients & partners", "العملاء والشركاء"), linkType: "PAGE", pageId: clientsPage.id, order: 3 }],
    ["header", { menuId: header.id, label: l("Insights", "المقالات"), linkType: "PAGE", pageId: insights.id, order: 4 }],
    ["header", { menuId: header.id, label: l("Contact", "تواصل معنا"), linkType: "PAGE", pageId: contact.id, order: 5 }],
    ["footer", { menuId: footer.id, label: l("About", "من نحن"), linkType: "PAGE", pageId: about.id, order: 0 }],
    ["footer", { menuId: footer.id, label: l("Services", "الخدمات"), linkType: "PAGE", pageId: servicesPage.id, order: 1 }],
    ["footer", { menuId: footer.id, label: l("Clients & partners", "العملاء والشركاء"), linkType: "PAGE", pageId: clientsPage.id, order: 2 }],
    ["footer", { menuId: footer.id, label: l("Insights", "المقالات"), linkType: "PAGE", pageId: insights.id, order: 3 }],
    ["footer", { menuId: footer.id, label: l("Leadership & team", "القيادة والفريق"), linkType: "PAGE", pageId: teamPage.id, order: 4 }],
    ["footer", { menuId: footer.id, label: l("Request a consultation", "اطلب استشارة"), linkType: "PAGE", pageId: consultationPage.id, order: 5 }],
    ["footer", { menuId: footer.id, label: l("Contact", "تواصل معنا"), linkType: "PAGE", pageId: contact.id, order: 6 }],
    ["legal", { menuId: legal.id, label: l("Privacy policy", "سياسة الخصوصية"), linkType: "PAGE", pageId: privacy.id, order: 0 }],
    ["legal", { menuId: legal.id, label: l("Cookie policy", "سياسة ملفات تعريف الارتباط"), linkType: "PAGE", pageId: cookies.id, order: 1 }],
    ["legal", { menuId: legal.id, label: l("Terms & conditions", "الشروط والأحكام"), linkType: "PAGE", pageId: terms.id, order: 2 }],
  ];
  for (const [, data] of items) await db.menuItem.create({ data });
}

/**
 * Additive upgrades for sites that were seeded earlier: fills SEO fields that are still empty and adds
 * the initial articles when there are none. Never overwrites anything an editor has written.
 */
async function upgradeContent() {
  let changed = 0;
  const empty = (v: unknown) => !v || (typeof v === "object" && !Object.values(v as Record<string, string>).some(Boolean));

  for (const s of await db.service.findMany({ where: { deletedAt: null } })) {
    const add = SERVICE_SEO[s.slug];
    if (!add) continue;
    const cur = (s.seo ?? {}) as Record<string, unknown>;
    const next = { ...cur };
    for (const [k, v] of Object.entries(add)) if (empty(cur[k])) next[k] = v;
    if (JSON.stringify(next) !== JSON.stringify(cur)) {
      await db.service.update({ where: { id: s.id }, data: { seo: next as Prisma.InputJsonValue } });
      changed++;
    }
  }

  for (const p of await db.page.findMany({ where: { deletedAt: null } })) {
    const add = PAGE_SEO[p.slug];
    if (!add) continue;
    const merge = (cur: Record<string, unknown>) => {
      const next = { ...cur };
      for (const [k, v] of Object.entries(add)) if (empty(cur[k])) next[k] = v;
      return next;
    };
    const cur = (p.seo ?? {}) as Record<string, unknown>;
    const next = merge(cur);
    const snap = p.publishedSnapshot as { seo?: Record<string, unknown> } | null;
    const nextSnap = snap ? { ...snap, seo: merge(snap.seo ?? {}) } : null;
    if (JSON.stringify(next) !== JSON.stringify(cur) || (snap && JSON.stringify(nextSnap) !== JSON.stringify(snap))) {
      await db.page.update({ where: { id: p.id }, data: { seo: next as Prisma.InputJsonValue, ...(nextSnap ? { publishedSnapshot: nextSnap as Prisma.InputJsonValue } : {}) } });
      changed++;
    }
  }

  if ((await db.blogPost.count()) === 0) {
    await seedArticles();
    changed++;
    console.log(`  ${ARTICLES.length} initial articles added.`);
  }
  return changed;
}

async function seedArticles() {
  const categoryIds: Record<string, string> = {};
  for (const [i, c] of BLOG_CATEGORIES.entries()) {
    const cat = await db.blogCategory.upsert({ where: { slug: c.slug }, create: { slug: c.slug, name: c.name, order: i }, update: {} });
    categoryIds[c.slug] = cat.id;
  }
  const services = await db.service.findMany({ where: { deletedAt: null }, select: { id: true, slug: true } });
  for (const a of ARTICLES) {
    const cover = await uploadSeedAsset(a.cover, a.coverAlt);
    await db.blogPost.create({
      data: {
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        content: a.content,
        coverId: cover.id,
        categoryId: categoryIds[a.category],
        tags: a.tags,
        status: "PUBLISHED",
        publishedAt: new Date(Date.now() - a.daysAgo * 86_400_000),
        featured: !!a.featured,
        seo: { title: a.seo.title, description: a.seo.description } as Prisma.InputJsonValue,
        services: { connect: services.filter((s) => a.services.includes(s.slug)).map((s) => ({ id: s.id })) },
      },
    });
  }
}

async function dropContentCache() {
  // Cached content (unstable_cache) lives on disk; drop it so a running server does not serve the old content.
  for (const dir of [".next/cache/fetch-cache", ".next/dev/cache/fetch-cache"]) await rm(path.join(process.cwd(), dir), { recursive: true, force: true });
}

async function main() {
  await seedRoles();
  await seedSettings();
  await seedAdmin();
  const hasContent = (await db.page.count()) > 0;
  if (!hasContent || force) {
    await seedContent();
    await seedArticles();
    await dropContentCache();
    console.log("  Content seeded from the official company profile.");
  } else {
    const changed = await upgradeContent();
    if (changed) await dropContentCache();
    console.log(changed ? `  Existing content kept; ${changed} item(s) completed (SEO / initial articles).` : "  Content already present — nothing to add.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

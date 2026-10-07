import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "../db";
import type { L } from "../i18n/localized";
import { CONTENT_TAG } from "../settings";

export type CapabilityGroup = { title: L; text?: L; items: L[] };
export type ServiceStep = { title: L; text: L };
export type ServiceOutcome = { icon: string; title: L; text: L };

export type ServiceView = {
  id: string;
  slug: string;
  order: number;
  title: L;
  summary: L | null;
  description: L | null;
  icon: string;
  imageId: string | null;
  capabilities: CapabilityGroup[];
  steps: ServiceStep[];
  ctaLabel: L | null;
  whyItMatters: L | null;
  outcomes: ServiceOutcome[];
  visual: string;
  capabilityLayout: string;
  seo: { title?: L; description?: L; ogTitle?: L; ogDescription?: L; ogImageId?: string | null; noindex?: boolean } | null;
  featured: boolean;
  category: { id: string; slug: string; name: L } | null;
  relatedIds: string[];
  updatedAt: string;
};

const serviceInclude = { category: true, related: { select: { id: true } } } as const;

function toServiceView(s: Awaited<ReturnType<typeof loadServices>>[number]): ServiceView {
  return {
    id: s.id,
    slug: s.slug,
    order: s.order,
    title: s.title as L,
    summary: s.summary as L | null,
    description: s.description as L | null,
    icon: s.icon,
    imageId: s.imageId,
    capabilities: (s.capabilities as CapabilityGroup[]) ?? [],
    steps: (s.steps as ServiceStep[]) ?? [],
    ctaLabel: s.ctaLabel as L | null,
    whyItMatters: s.whyItMatters as L | null,
    outcomes: (s.outcomes as ServiceOutcome[]) ?? [],
    visual: s.visual,
    capabilityLayout: s.capabilityLayout,
    seo: s.seo as ServiceView["seo"],
    featured: s.featured,
    category: s.category ? { id: s.category.id, slug: s.category.slug, name: s.category.name as L } : null,
    relatedIds: s.related.map((r) => r.id),
    updatedAt: s.updatedAt.toISOString(),
  };
}

function loadServices() {
  return db.service.findMany({ where: { status: "PUBLISHED", deletedAt: null }, orderBy: [{ order: "asc" }], include: serviceInclude });
}

export const getServices = unstable_cache(async () => (await loadServices()).map(toServiceView), ["services"], { tags: [CONTENT_TAG] });

export async function getService(slug: string) {
  return (await getServices()).find((s) => s.slug === slug) ?? null;
}

export const getServiceCategories = unstable_cache(
  async () => (await db.serviceCategory.findMany({ orderBy: { order: "asc" } })).map((c) => ({ id: c.id, slug: c.slug, name: c.name as L, description: c.description as L | null })),
  ["service-categories"],
  { tags: [CONTENT_TAG] },
);

export const getStats = unstable_cache(
  async () => (await db.stat.findMany({ where: { visible: true }, orderBy: { order: "asc" } })).map((s) => ({ id: s.id, value: s.value, label: s.label as L })),
  ["stats"],
  { tags: [CONTENT_TAG] },
);

export type TeamView = {
  id: string; name: L; position: L; department: L | null; bio: L | null; fullBio: L | null; message: L | null; expertise: L[];
  photoId: string | null; isLeadership: boolean; featured: boolean; linkedinUrl: string | null; socials: { platform: string; url: string }[]; email: string | null; phone: string | null;
};

export const getTeam = unstable_cache(
  async (): Promise<TeamView[]> =>
    (await db.teamMember.findMany({ where: { visible: true }, orderBy: { order: "asc" } })).map((m) => ({
      id: m.id, name: m.name as L, position: m.position as L, department: m.department as L | null, bio: m.bio as L | null, fullBio: m.fullBio as L | null, message: m.message as L | null,
      // Expertise is edited as a list of { text } rows; tolerate plain strings too.
      expertise: ((m.expertise as unknown[]) ?? []).map((e) => (e && typeof e === "object" && "text" in e ? (e as { text: L }).text : (e as L))).filter(Boolean),
      photoId: m.photoId, isLeadership: m.isLeadership, featured: m.featured, linkedinUrl: m.linkedinUrl,
      socials: ((m.socials as { platform?: string; url?: string }[]) ?? []).filter((x) => x?.url).map((x) => ({ platform: x.platform || "website", url: x.url! })),
      email: m.email, phone: m.phone,
    })),
  ["team"],
  { tags: [CONTENT_TAG] },
);

export const getPartners = unstable_cache(
  async () =>
    (await db.partner.findMany({ where: { visible: true }, orderBy: { order: "asc" } })).map((p) => ({
      id: p.id, name: p.name as L, description: p.description as L | null, logoId: p.logoId, logoTone: p.logoTone, url: p.url, isStrategic: p.isStrategic,
    })),
  ["partners"],
  { tags: [CONTENT_TAG] },
);

export const getClientGroups = unstable_cache(
  async () => {
    const [groups, ungrouped] = await Promise.all([
      db.clientGroup.findMany({ orderBy: { order: "asc" }, include: { clients: { where: { visible: true }, orderBy: { order: "asc" } } } }),
      db.client.findMany({ where: { visible: true, groupId: null }, orderBy: { order: "asc" } }),
    ]);
    const map = (c: (typeof ungrouped)[number]) => ({ id: c.id, name: c.name as L, logoId: c.logoId, url: c.url });
    const result = groups.filter((g) => g.clients.length).map((g) => ({ id: g.id, name: g.name as L, clients: g.clients.map(map) }));
    if (ungrouped.length) result.push({ id: "other", name: { ar: "أخرى", en: "Other" }, clients: ungrouped.map(map) });
    return result;
  },
  ["client-groups"],
  { tags: [CONTENT_TAG] },
);

export const getTestimonials = unstable_cache(
  async () =>
    (await db.testimonial.findMany({ where: { visible: true }, orderBy: { order: "asc" } })).map((t) => ({
      id: t.id, quote: t.quote as L, author: t.author as L, position: t.position as L | null, company: t.company as L | null, photoId: t.photoId,
    })),
  ["testimonials"],
  { tags: [CONTENT_TAG] },
);

export const getFaqs = unstable_cache(
  async (group?: string | null, serviceId?: string | null) =>
    (
      await db.faq.findMany({
        where: { visible: true, ...(group ? { group } : {}), ...(serviceId ? { serviceId } : {}) },
        orderBy: { order: "asc" },
      })
    ).map((f) => ({ id: f.id, question: f.question as L, answer: f.answer as L })),
  ["faqs"],
  { tags: [CONTENT_TAG] },
);

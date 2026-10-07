import "server-only";
import { db } from "../db";
import type { CollectionKey } from "./collections";

/**
 * Minimal typed facade over the Prisma delegates used by the generic collection manager.
 * Field names in collection configs map 1:1 to model columns.
 */
type Delegate = {
  findMany: (args?: object) => Promise<Record<string, unknown>[]>;
  findUnique: (args: object) => Promise<Record<string, unknown> | null>;
  create: (args: object) => Promise<Record<string, unknown>>;
  update: (args: object) => Promise<Record<string, unknown>>;
  delete: (args: object) => Promise<Record<string, unknown>>;
  aggregate: (args: object) => Promise<{ _max: { order: number | null } }>;
};

export function delegateFor(key: CollectionKey): Delegate {
  const map = {
    team: db.teamMember,
    partners: db.partner,
    clients: db.client,
    clientGroups: db.clientGroup,
    testimonials: db.testimonial,
    faqs: db.faq,
    stats: db.stat,
    serviceCategories: db.serviceCategory,
    blogCategories: db.blogCategory,
    contactChannels: db.contactChannel,
    socialLinks: db.socialLink,
  } as const;
  return map[key] as unknown as Delegate;
}

export async function listCollection(key: CollectionKey) {
  const rows = await delegateFor(key).findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  return rows.map((r) => JSON.parse(JSON.stringify(r)) as Record<string, unknown>);
}

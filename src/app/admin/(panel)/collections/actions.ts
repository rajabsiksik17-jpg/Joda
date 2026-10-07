"use server";

import { z } from "zod";
import { audit } from "@/lib/audit";
import { authorize } from "@/lib/auth/session";
import { guarded, invalidateContent, zodFieldErrors, type ActionResult } from "@/lib/actions";
import { COLLECTIONS, isCollectionKey } from "@/lib/admin/collections";
import { delegateFor } from "@/lib/admin/collection-store";
import { buildSchema } from "@/lib/sections/fields";

const idSchema = z.string().min(1).max(64);

export async function saveCollectionItem(key: string, id: string | null, values: unknown): Promise<ActionResult<Record<string, unknown>>> {
  return guarded(async () => {
    if (!isCollectionKey(key)) return { ok: false, error: "not_found" };
    const config = COLLECTIONS[key];
    const user = await authorize(config.permission);
    const parsed = buildSchema(config.fields).safeParse(values);
    if (!parsed.success) return { ok: false, error: "invalid", fieldErrors: zodFieldErrors(parsed.error) };
    const data = { ...parsed.data } as Record<string, unknown>;
    // Optional URL-ish text fields are stored as null when empty.
    for (const f of config.fields) if (f.type === "text" && f.localized === false && !f.required && data[f.name] === "") data[f.name] = null;

    const delegate = delegateFor(key);
    let row: Record<string, unknown>;
    if (id) {
      row = await delegate.update({ where: { id: idSchema.parse(id) }, data });
    } else {
      const max = await delegate.aggregate({ _max: { order: true } });
      row = await delegate.create({ data: { ...data, order: (max._max.order ?? -1) + 1 } });
    }
    await audit({ action: id ? "collection.update" : "collection.create", userId: user.id, actorEmail: user.email, entityType: key, entityId: String(row.id) });
    invalidateContent();
    return { ok: true, data: JSON.parse(JSON.stringify(row)) };
  });
}

export async function deleteCollectionItem(key: string, id: string): Promise<ActionResult> {
  return guarded(async () => {
    if (!isCollectionKey(key)) return { ok: false, error: "not_found" };
    const user = await authorize(COLLECTIONS[key].permission);
    await delegateFor(key).delete({ where: { id: idSchema.parse(id) } });
    await audit({ action: "collection.delete", userId: user.id, actorEmail: user.email, entityType: key, entityId: id });
    invalidateContent();
    return { ok: true };
  });
}

export async function setCollectionVisibility(key: string, id: string, visible: boolean): Promise<ActionResult> {
  return guarded(async () => {
    if (!isCollectionKey(key) || !COLLECTIONS[key].hasVisible) return { ok: false, error: "not_found" };
    const user = await authorize(COLLECTIONS[key].permission);
    await delegateFor(key).update({ where: { id: idSchema.parse(id) }, data: { visible: !!visible } });
    await audit({ action: "collection.update", userId: user.id, actorEmail: user.email, entityType: key, entityId: id, metadata: { visible } });
    invalidateContent();
    return { ok: true };
  });
}

export async function reorderCollection(key: string, ids: string[]): Promise<ActionResult> {
  return guarded(async () => {
    if (!isCollectionKey(key)) return { ok: false, error: "not_found" };
    const user = await authorize(COLLECTIONS[key].permission);
    const list = z.array(idSchema).max(500).parse(ids);
    const delegate = delegateFor(key);
    await Promise.all(list.map((id, order) => delegate.update({ where: { id }, data: { order } })));
    await audit({ action: "collection.reorder", userId: user.id, actorEmail: user.email, entityType: key });
    invalidateContent();
    return { ok: true };
  });
}

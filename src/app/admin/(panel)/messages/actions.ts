"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { authorize } from "@/lib/auth/session";
import { guarded, type ActionResult } from "@/lib/actions";

const ids = z.array(z.string().min(1).max(64)).min(1).max(200);

export async function setMessagesStatus(input: string[], status: "NEW" | "READ" | "ARCHIVED"): Promise<ActionResult> {
  return guarded(async () => {
    const s = z.enum(["NEW", "READ", "ARCHIVED"]).parse(status);
    const user = await authorize(s === "ARCHIVED" ? "messages.manage" : "messages.view");
    const list = ids.parse(input);
    await db.contactMessage.updateMany({ where: { id: { in: list } }, data: { status: s, readAt: s === "NEW" ? null : new Date() } });
    await audit({ action: "message.update", userId: user.id, actorEmail: user.email, entityType: "message", metadata: { ids: list, status: s } });
    return { ok: true };
  });
}

export async function saveMessageNotes(id: string, notes: string): Promise<ActionResult> {
  return guarded(async () => {
    const user = await authorize("messages.view");
    await db.contactMessage.update({ where: { id: z.string().max(64).parse(id) }, data: { notes: z.string().max(4000).parse(notes) } });
    await audit({ action: "message.update", userId: user.id, actorEmail: user.email, entityType: "message", entityId: id, metadata: { notes: true } });
    return { ok: true };
  });
}

export async function deleteMessages(input: string[]): Promise<ActionResult> {
  return guarded(async () => {
    const user = await authorize("messages.manage");
    const list = ids.parse(input);
    await db.contactMessage.deleteMany({ where: { id: { in: list } } });
    await audit({ action: "message.delete", userId: user.id, actorEmail: user.email, entityType: "message", metadata: { ids: list } });
    return { ok: true };
  });
}

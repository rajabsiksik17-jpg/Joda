"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { authorize } from "@/lib/auth/session";
import { guarded, type ActionResult } from "@/lib/actions";

const ids = z.array(z.string().min(1).max(64)).min(1).max(200);
const statusSchema = z.enum(["PENDING", "CONTACTED", "COMPLETED", "ARCHIVED"]);

export async function setConsultationStatus(input: string[], status: "PENDING" | "CONTACTED" | "COMPLETED" | "ARCHIVED"): Promise<ActionResult> {
  return guarded(async () => {
    const s = statusSchema.parse(status);
    const user = await authorize("consultations.manage");
    const list = ids.parse(input);
    const now = new Date();
    await db.consultationRequest.updateMany({
      where: { id: { in: list } },
      data: { status: s, ...(s === "CONTACTED" ? { contactedAt: now } : {}), ...(s === "COMPLETED" ? { completedAt: now } : {}) },
    });
    await audit({ action: "consultation.update", userId: user.id, actorEmail: user.email, entityType: "consultation", metadata: { ids: list, status: s } });
    return { ok: true };
  });
}

export async function saveConsultationNotes(id: string, notes: string): Promise<ActionResult> {
  return guarded(async () => {
    const user = await authorize("consultations.manage");
    await db.consultationRequest.update({ where: { id: z.string().max(64).parse(id) }, data: { notes: z.string().max(4000).parse(notes) } });
    await audit({ action: "consultation.update", userId: user.id, actorEmail: user.email, entityType: "consultation", entityId: id, metadata: { notes: true } });
    return { ok: true };
  });
}

export async function deleteConsultations(input: string[]): Promise<ActionResult> {
  return guarded(async () => {
    const user = await authorize("consultations.manage");
    const list = ids.parse(input);
    await db.consultationRequest.deleteMany({ where: { id: { in: list } } });
    await audit({ action: "consultation.delete", userId: user.id, actorEmail: user.email, entityType: "consultation", metadata: { ids: list } });
    return { ok: true };
  });
}

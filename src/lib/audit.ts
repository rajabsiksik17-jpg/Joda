import "server-only";
import { db } from "./db";
import { getRequestMeta } from "./request";

export type AuditInput = {
  action: string;
  userId?: string | null;
  actorEmail?: string | null;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

/** Writes an audit entry. Failures are logged but never break the user's action. */
export async function audit(input: AuditInput) {
  try {
    const { ip, userAgent } = await getRequestMeta().catch(() => ({ ip: "", userAgent: "" }));
    await db.auditLog.create({
      data: {
        action: input.action,
        userId: input.userId ?? null,
        actorEmail: input.actorEmail ?? null,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: (input.metadata ?? undefined) as object | undefined,
        ip: ip || null,
        userAgent: userAgent || null,
      },
    });
  } catch (error) {
    console.error("[audit] failed to record", input.action, error);
  }
}

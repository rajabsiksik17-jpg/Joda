"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { hashPassword, passwordPolicyError } from "@/lib/auth/password";
import { SUPER_ADMIN_ROLE } from "@/lib/auth/permissions";
import { authorize } from "@/lib/auth/session";
import { guarded, zodFieldErrors, type ActionResult } from "@/lib/actions";

const idSchema = z.string().min(1).max(64);

function tempPassword() {
  // 16 chars, mixed classes — satisfies the password policy.
  return `${randomBytes(9).toString("base64url")}#7a`;
}

async function activeSuperAdmins(excludeId?: string) {
  return db.user.count({ where: { isActive: true, role: { key: SUPER_ADMIN_ROLE }, ...(excludeId ? { id: { not: excludeId } } : {}) } });
}

const createSchema = z.object({
  name: z.string().trim().min(2, "required").max(120),
  email: z.string().trim().toLowerCase().email("invalid_email").max(200),
  roleId: idSchema,
  password: z.string().max(200).default(""),
});

export async function createUser(input: unknown): Promise<ActionResult<{ id: string; tempPassword?: string }>> {
  return guarded(async () => {
    const actor = await authorize("users.manage");
    const parsed = createSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid", fieldErrors: zodFieldErrors(parsed.error) };
    const { name, email, roleId, password } = parsed.data;
    const role = await db.role.findUniqueOrThrow({ where: { id: roleId } });
    // Only a Super Admin may create another Super Admin.
    if (role.key === SUPER_ADMIN_ROLE && actor.role.key !== SUPER_ADMIN_ROLE) return { ok: false, error: "forbidden" };
    if (await db.user.findUnique({ where: { email } })) return { ok: false, error: "invalid", fieldErrors: { email: "duplicate" } };
    let plain = password;
    let generated = false;
    if (plain) {
      const policy = passwordPolicyError(plain);
      if (policy) return { ok: false, error: "invalid", fieldErrors: { password: policy } };
    } else {
      plain = tempPassword();
      generated = true;
    }
    const user = await db.user.create({ data: { name, email, roleId, passwordHash: await hashPassword(plain), passwordChangedAt: new Date() } });
    await audit({ action: "user.create", userId: actor.id, actorEmail: actor.email, entityType: "user", entityId: user.id, metadata: { email, role: role.key } });
    return { ok: true, data: { id: user.id, tempPassword: generated ? plain : undefined } };
  });
}

const updateSchema = z.object({ name: z.string().trim().min(2, "required").max(120), roleId: idSchema, isActive: z.boolean() });

export async function updateUser(id: string, input: unknown): Promise<ActionResult> {
  return guarded(async () => {
    const actor = await authorize("users.manage");
    const parsed = updateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid", fieldErrors: zodFieldErrors(parsed.error) };
    const target = await db.user.findUniqueOrThrow({ where: { id: idSchema.parse(id) }, include: { role: true } });
    const newRole = await db.role.findUniqueOrThrow({ where: { id: parsed.data.roleId } });
    if ((target.role.key === SUPER_ADMIN_ROLE || newRole.key === SUPER_ADMIN_ROLE) && actor.role.key !== SUPER_ADMIN_ROLE) return { ok: false, error: "forbidden" };
    if (target.id === actor.id && (!parsed.data.isActive || newRole.id !== target.roleId)) return { ok: false, error: "self" };
    const losesSuper = target.role.key === SUPER_ADMIN_ROLE && target.isActive && (newRole.key !== SUPER_ADMIN_ROLE || !parsed.data.isActive);
    if (losesSuper && (await activeSuperAdmins(target.id)) === 0) return { ok: false, error: "last_super_admin" };
    await db.user.update({ where: { id }, data: parsed.data });
    if (!parsed.data.isActive) await db.session.deleteMany({ where: { userId: id } });
    await audit({ action: "user.update", userId: actor.id, actorEmail: actor.email, entityType: "user", entityId: id, metadata: { role: newRole.key, isActive: parsed.data.isActive } });
    return { ok: true };
  });
}

export async function resetUserPassword(id: string): Promise<ActionResult<{ tempPassword: string }>> {
  return guarded(async () => {
    const actor = await authorize("users.manage");
    const target = await db.user.findUniqueOrThrow({ where: { id: idSchema.parse(id) }, include: { role: true } });
    if (target.role.key === SUPER_ADMIN_ROLE && actor.role.key !== SUPER_ADMIN_ROLE) return { ok: false, error: "forbidden" };
    const plain = tempPassword();
    await db.user.update({ where: { id }, data: { passwordHash: await hashPassword(plain), passwordChangedAt: new Date(), failedLoginCount: 0, lockedUntil: null } });
    await db.session.deleteMany({ where: { userId: id } });
    await db.trustedDevice.deleteMany({ where: { userId: id } });
    await audit({ action: "user.reset_password", userId: actor.id, actorEmail: actor.email, entityType: "user", entityId: id });
    return { ok: true, data: { tempPassword: plain } };
  });
}

export async function revokeUserSessions(id: string): Promise<ActionResult> {
  return guarded(async () => {
    const actor = await authorize("users.manage");
    await db.session.deleteMany({ where: { userId: idSchema.parse(id), ...(id === actor.id ? { id: { not: actor.sessionId } } : {}) } });
    if (id !== actor.id) await db.trustedDevice.deleteMany({ where: { userId: id } });
    await audit({ action: "user.revoke_sessions", userId: actor.id, actorEmail: actor.email, entityType: "user", entityId: id });
    return { ok: true };
  });
}

export async function unlockUser(id: string): Promise<ActionResult> {
  return guarded(async () => {
    const actor = await authorize("users.manage");
    await db.user.update({ where: { id: idSchema.parse(id) }, data: { lockedUntil: null, failedLoginCount: 0 } });
    await audit({ action: "user.update", userId: actor.id, actorEmail: actor.email, entityType: "user", entityId: id, metadata: { unlocked: true } });
    return { ok: true };
  });
}

export async function deleteUser(id: string): Promise<ActionResult> {
  return guarded(async () => {
    const actor = await authorize("users.manage");
    if (id === actor.id) return { ok: false, error: "self" };
    const target = await db.user.findUniqueOrThrow({ where: { id: idSchema.parse(id) }, include: { role: true } });
    if (target.role.key === SUPER_ADMIN_ROLE && actor.role.key !== SUPER_ADMIN_ROLE) return { ok: false, error: "forbidden" };
    if (target.role.key === SUPER_ADMIN_ROLE && target.isActive && (await activeSuperAdmins(target.id)) === 0) return { ok: false, error: "last_super_admin" };
    await db.user.delete({ where: { id } });
    await audit({ action: "user.delete", userId: actor.id, actorEmail: actor.email, entityType: "user", entityId: id, metadata: { email: target.email } });
    return { ok: true };
  });
}

"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { ALL_PERMISSIONS, SUPER_ADMIN_ROLE, isPermission } from "@/lib/auth/permissions";
import { authorize } from "@/lib/auth/session";
import { guarded, zodFieldErrors, type ActionResult } from "@/lib/actions";
import { zLocalized } from "@/lib/sections/fields";

const roleSchema = z.object({
  name: zLocalized(80, true),
  description: zLocalized(200),
  permissions: z.array(z.string()).max(ALL_PERMISSIONS.length).transform((list) => Array.from(new Set(list.filter(isPermission)))),
});

export async function saveRole(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const user = await authorize("roles.manage");
    const parsed = roleSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid", fieldErrors: zodFieldErrors(parsed.error) };
    if (id) {
      const role = await db.role.findUniqueOrThrow({ where: { id } });
      // Super Admin always keeps every permission.
      const permissions = role.key === SUPER_ADMIN_ROLE ? ALL_PERMISSIONS : parsed.data.permissions;
      await db.role.update({ where: { id }, data: { name: parsed.data.name, description: parsed.data.description, permissions } });
      await audit({ action: "role.update", userId: user.id, actorEmail: user.email, entityType: "role", entityId: id, metadata: { permissions } });
      return { ok: true, data: { id } };
    }
    const base = (parsed.data.name.en || parsed.data.name.ar || "role").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "role";
    let key = base;
    for (let n = 2; await db.role.findUnique({ where: { key } }); n++) key = `${base}_${n}`;
    const role = await db.role.create({ data: { key, name: parsed.data.name, description: parsed.data.description, permissions: parsed.data.permissions } });
    await audit({ action: "role.create", userId: user.id, actorEmail: user.email, entityType: "role", entityId: role.id, metadata: { key } });
    return { ok: true, data: { id: role.id } };
  });
}

export async function deleteRole(id: string): Promise<ActionResult> {
  return guarded(async () => {
    const user = await authorize("roles.manage");
    const role = await db.role.findUniqueOrThrow({ where: { id }, include: { _count: { select: { users: true } } } });
    if (role.isSystem || role._count.users > 0) return { ok: false, error: "in_use" };
    await db.role.delete({ where: { id } });
    await audit({ action: "role.delete", userId: user.id, actorEmail: user.email, entityType: "role", entityId: id, metadata: { key: role.key } });
    return { ok: true };
  });
}

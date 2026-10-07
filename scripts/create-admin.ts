/**
 * Creates a Super Admin, or resets the password of an existing user (recovery tool).
 *
 *   npm run user:create -- --email someone@company.com --name "Full Name"
 *   npm run user:create -- --email someone@company.com --reset
 *
 * A strong temporary password is generated and printed once.
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "@node-rs/argon2";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Pass a valid --email");
  const password = `${randomBytes(9).toString("base64url")}#7a`;
  const passwordHash = await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 });
  const existing = await db.user.findUnique({ where: { email } });

  if (existing) {
    if (!process.argv.includes("--reset")) throw new Error("User exists. Use --reset to issue a new temporary password.");
    await db.user.update({ where: { id: existing.id }, data: { passwordHash, isActive: true, failedLoginCount: 0, lockedUntil: null, passwordChangedAt: new Date() } });
    await db.session.deleteMany({ where: { userId: existing.id } });
    await db.auditLog.create({ data: { action: "user.reset_password", actorEmail: "cli", entityType: "user", entityId: existing.id, metadata: { via: "cli" } } });
    console.log(`\nPassword reset for ${email}`);
  } else {
    const role = await db.role.findUnique({ where: { key: "super_admin" } });
    if (!role) throw new Error("Roles are missing — run `npm run db:seed` first.");
    const user = await db.user.create({ data: { email, name: arg("name") ?? "Administrator", passwordHash, roleId: role.id } });
    await db.auditLog.create({ data: { action: "user.create", actorEmail: "cli", entityType: "user", entityId: user.id, metadata: { via: "cli", role: "super_admin" } } });
    console.log(`\nSuper Admin created: ${email}`);
  }
  console.log(`Temporary password: ${password}\nSign in at /admin/login and change it under My account.\n`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

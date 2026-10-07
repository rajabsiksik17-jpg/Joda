import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { normalizeDatabaseUrl } from "./database-url";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  const adapter = new PrismaPg({ connectionString: normalizeDatabaseUrl(connectionString), max: Number(process.env.DATABASE_POOL_SIZE ?? 10) });
  return new PrismaClient({ adapter, log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

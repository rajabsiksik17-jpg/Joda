import "dotenv/config";
import { defineConfig, env } from "prisma/config";
import { normalizeDatabaseUrl } from "./src/lib/database-url";

// Migrations need a direct/session connection; hosted poolers in transaction mode (e.g. Supabase
// port 6543) are fine for the app but not for migrations. DIRECT_URL is optional locally.
const migrationUrl = process.env.DIRECT_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx --conditions=react-server prisma/seed.ts",
  },
  datasource: {
    url: normalizeDatabaseUrl(migrationUrl || env("DATABASE_URL"), "migrate"),
  },
});

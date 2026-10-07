/**
 * Copies uploaded files from the local upload directory into the database (MediaBlob), for sites
 * that previously used STORAGE_DRIVER="local". Safe to run more than once; existing rows are kept.
 *
 *   npm run media:to-db
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalizeDatabaseUrl } from "../src/lib/database-url";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL!) }) });
const root = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./storage/uploads");

async function main() {
  const media = await db.media.findMany({ select: { key: true } });
  let copied = 0;
  let missing = 0;
  for (const { key } of media) {
    if (await db.mediaBlob.findUnique({ where: { key }, select: { key: true } })) continue;
    try {
      const data = await readFile(path.join(root, key));
      await db.mediaBlob.create({ data: { key, data: new Uint8Array(data), size: data.length } });
      copied++;
    } catch {
      missing++;
      console.warn(`  missing on disk: ${key}`);
    }
  }
  console.log(`  ${copied} file(s) copied into the database, ${missing} missing, ${media.length - copied - missing} already there.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

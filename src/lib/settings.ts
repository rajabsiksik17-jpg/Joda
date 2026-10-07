import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "./db";
import { parseSetting, type SettingKey, type Settings } from "./settings-schema";

export const CONTENT_TAG = "content";

/** Uncached read (admin & security-sensitive code paths). */
export async function readSetting<K extends SettingKey>(key: K): Promise<Settings<K>> {
  const row = await db.setting.findUnique({ where: { key } });
  return parseSetting(key, row?.value);
}

const cachedAll = unstable_cache(
  async () => {
    const rows = await db.setting.findMany();
    return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, unknown>;
  },
  ["settings-all"],
  { tags: [CONTENT_TAG, "settings"] },
);

/** Cached read for public rendering. Never use for secrets (email key is excluded). */
export async function getSetting<K extends Exclude<SettingKey, "email" | "google">>(key: K): Promise<Settings<K>> {
  const all = await cachedAll();
  return parseSetting(key, all[key]);
}

export async function writeSetting<K extends SettingKey>(key: K, value: Settings<K>, userId?: string) {
  await db.setting.upsert({
    where: { key },
    create: { key, value: value as object, updatedById: userId },
    update: { value: value as object, updatedById: userId },
  });
}

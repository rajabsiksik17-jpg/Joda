"use server";

import { audit } from "@/lib/audit";
import { authorize } from "@/lib/auth/session";
import { guarded, invalidateContent, zodFieldErrors, type ActionResult } from "@/lib/actions";
import { SETTINGS_GROUPS } from "@/lib/admin/settings-fields";
import { settingsSchemas, type Settings } from "@/lib/settings-schema";
import { readSetting, writeSetting } from "@/lib/settings";

export async function saveSettings(key: string, input: unknown): Promise<ActionResult> {
  return guarded(async () => {
    if (!(key in SETTINGS_GROUPS)) return { ok: false, error: "not_found" };
    const group = SETTINGS_GROUPS[key as keyof typeof SETTINGS_GROUPS];
    const user = await authorize(group.permission);
    const raw = { ...(input as Record<string, unknown>) };
    // Empty number inputs mean "not set".
    for (const f of group.fields) if (f.type === "number" && (raw[f.name] === undefined || raw[f.name] === "")) raw[f.name] = f.name === "mapLat" || f.name === "mapLng" ? null : undefined;
    // Country codes are case-insensitive for editors.
    if (group.key === "consultation") {
      if (typeof raw.defaultCountry === "string") raw.defaultCountry = raw.defaultCountry.trim().toUpperCase();
      if (Array.isArray(raw.preferredCountries)) raw.preferredCountries = raw.preferredCountries.map((c) => String(c).trim().toUpperCase());
    }
    const parsed = settingsSchemas[group.key].safeParse(raw);
    if (!parsed.success) return { ok: false, error: "invalid", fieldErrors: zodFieldErrors(parsed.error) };
    const before = await readSetting(group.key);
    await writeSetting(group.key, parsed.data as Settings<typeof group.key>, user.id);
    const changed = Object.keys(parsed.data).filter((k) => JSON.stringify((before as Record<string, unknown>)[k]) !== JSON.stringify((parsed.data as Record<string, unknown>)[k]));
    await audit({ action: "settings.update", userId: user.id, actorEmail: user.email, entityType: "setting", entityId: group.key, metadata: { changed } });
    invalidateContent();
    return { ok: true };
  });
}

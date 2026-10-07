import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js/min";

export type CountryOption = { code: string; name: string; dial: string };

export function isCountryCode(code: string): code is CountryCode {
  return (getCountries() as string[]).includes(code);
}

/**
 * Every country with a telephone calling code, localized with Intl.DisplayNames.
 * Computed on the server and passed to the form so names never differ between server and client ICU data.
 */
export function listCountries(locale: string, preferred: string[] = []): { preferred: CountryOption[]; all: CountryOption[] } {
  const names = new Intl.DisplayNames([locale], { type: "region" });
  const collator = new Intl.Collator(locale);
  const all = getCountries()
    .map((code): CountryOption => ({ code, name: names.of(code) ?? code, dial: `+${getCountryCallingCode(code)}` }))
    .sort((a, b) => collator.compare(a.name, b.name));
  const pref = preferred.map((c) => all.find((x) => x.code === c)).filter((x): x is CountryOption => !!x);
  return { preferred: pref, all };
}

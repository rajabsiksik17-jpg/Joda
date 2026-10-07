import type { MetadataRoute } from "next";
import { getSetting } from "@/lib/settings";
import { tr } from "@/lib/i18n/localized";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const general = await getSetting("general");
  return {
    name: tr(general.siteName, "en", true),
    short_name: "Quality Experts",
    start_url: `/${general.defaultLocale}`,
    display: "browser",
    background_color: "#ffffff",
    theme_color: "#071f3f",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}

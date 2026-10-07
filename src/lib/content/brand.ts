import "server-only";
import { getMedia } from "../media";
import { getSetting } from "../settings";

export type BrandAssets = {
  logoColor: { url: string; width: number; height: number };
  logoWhite: { url: string; width: number; height: number };
  icon: { url: string; width: number; height: number };
  favicon: string | null;
};

/** Brand assets from the CMS, falling back to the official files shipped with the site. */
export async function getBrandAssets(): Promise<BrandAssets> {
  const brand = await getSetting("brand");
  const [color, white, icon, favicon] = await Promise.all([getMedia(brand.logoColorId), getMedia(brand.logoWhiteId), getMedia(brand.iconId), getMedia(brand.faviconId)]);
  const dims = (m: Awaited<ReturnType<typeof getMedia>>, w: number, h: number) => (m ? { url: m.url, width: m.width ?? w, height: m.height ?? h } : null);
  return {
    logoColor: dims(color, 1000, 342) ?? { url: "/brand/logo-color.png", width: 1000, height: 342 },
    logoWhite: dims(white, 1000, 342) ?? { url: "/brand/logo-white.png", width: 1000, height: 342 },
    icon: dims(icon, 400, 389) ?? { url: "/brand/icon-color.png", width: 400, height: 389 },
    favicon: favicon?.url ?? null,
  };
}

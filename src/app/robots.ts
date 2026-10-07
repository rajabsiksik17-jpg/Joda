import type { MetadataRoute } from "next";
import { getSetting } from "@/lib/settings";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getSetting("seo");
  if (!seo.allowIndexing) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/ar/preview/", "/en/preview/", "/ar/search", "/en/search"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}

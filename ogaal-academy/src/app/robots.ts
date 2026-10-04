import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

// Crawling is disallowed until NEXT_PUBLIC_SITE_URL is set for the live domain.
export default function robots(): MetadataRoute.Robots {
  const live = !!process.env.NEXT_PUBLIC_SITE_URL;
  return live
    ? { rules: { userAgent: "*", allow: "/" }, sitemap: `${siteUrl}/sitemap.xml` }
    : { rules: { userAgent: "*", disallow: "/" } };
}

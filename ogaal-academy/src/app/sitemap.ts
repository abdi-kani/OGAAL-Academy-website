import type { MetadataRoute } from "next";
import { footerNav as nav } from "@/content/site";
import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return nav.map((n) => ({ url: `${siteUrl}${n.href === "/" ? "" : n.href}`, changeFrequency: "monthly", priority: n.href === "/" ? 1 : 0.7 }));
}

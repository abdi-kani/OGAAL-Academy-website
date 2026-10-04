import type { Metadata } from "next";
import { contact, site } from "@/content/site";

/** Production URL comes from NEXT_PUBLIC_SITE_URL once the domain is live; localhost until then. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const isLive = Boolean(process.env.NEXT_PUBLIC_SITE_URL);

export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: site.name, type: "website", locale: "en_GB" },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** Organisation structured data using confirmed information only. */
export function organizationJsonLd() {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: site.fullName,
    alternateName: site.name,
    slogan: site.tagline,
    logo: `${siteUrl}${site.logo.full.src}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: site.location.city,
      addressCountry: site.location.countryCode,
      ...(contact.streetAddress ? { streetAddress: contact.streetAddress } : {}),
    },
  };
  if (isLive) data.url = siteUrl;
  if (contact.email.confirmed) data.email = contact.email.address;
  if (contact.phone) data.telephone = contact.phone;
  if (contact.social.length) data.sameAs = contact.social.map((s) => s.url);
  return data;
}

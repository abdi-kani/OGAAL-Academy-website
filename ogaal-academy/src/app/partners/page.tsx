import type { Metadata } from "next";
import { closingCta } from "@/content/site";
import { PartnersSection } from "@/components/PartnersSection";
import { ClosingCta } from "@/components/Sections";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Partners & Cooperation",
  description:
    "Institutional cooperation between OGAAL Academy and the Ministry of Internal Security, concerning structured training and assessment for private security personnel.",
  path: "/partners",
});

export default function PartnersPage() {
  return (
    <>
      <PartnersSection headingAs="h1" />
      <ClosingCta {...closingCta} />
    </>
  );
}

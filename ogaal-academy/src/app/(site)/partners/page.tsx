import type { Metadata } from "next";
import { closingCta, partnersSection } from "@/content/site";
import { PageHeader } from "@/components/PageHeader";
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
  const s = partnersSection;
  return (
    <>
      <PageHeader crumb="Partners" eyebrow={s.eyebrow} title={`${s.headingLines[0]} ${s.headingLines[1]}`} intro={<p>{s.intro}</p>} icon="handshake" />
      <PartnersSection withHeading={false} />
      <ClosingCta {...closingCta} />
    </>
  );
}

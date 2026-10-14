import type { Metadata } from "next";
import { closingCta, trainingPage } from "@/content/site";
import { PageHeader } from "@/components/PageHeader";
import { SectionHeading } from "@/components/SectionHeading";
import { ClosingCta, TrainingGridAll } from "@/components/Sections";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Training",
  description:
    "Firearm safety education, responsible ownership, safe storage and transportation, legal and ethical awareness, supervised safety exercises, and assessment — delivered as a two-day programme in Mogadishu.",
  path: "/training",
});

export default function TrainingPage() {
  return (
    <>
      <PageHeader crumb="Training" eyebrow="Training" title={trainingPage.heading} intro={<p>{trainingPage.intro}</p>} icon="bullets" />

      <section id="programmes" aria-labelledby="services-title" className="pattern-icons scroll-mt-24 py-14 lg:py-20">
        <div className="container-x">
          <SectionHeading id="services-title" eyebrow="What we offer" lead={trainingPage.servicesHeading.lead} accent={trainingPage.servicesHeading.accent} intro={trainingPage.servicesIntro} />
          <TrainingGridAll />
        </div>
      </section>

      <ClosingCta {...closingCta} />
    </>
  );
}

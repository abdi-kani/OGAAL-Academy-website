import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { programme, trainingPage } from "@/content/site";
import { DarkHero } from "@/components/DarkHero";
import { LogoMonument } from "@/components/LogoMonument";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { CtaPanel, ProgrammeDays, TrainingGridAll } from "@/components/Sections";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Training",
  description:
    "Firearm safety education, responsible ownership, safe storage and transportation, legal and ethical awareness, supervised safety exercises, and assessment — delivered as a two-day programme in Mogadishu.",
  path: "/training",
});

export default function TrainingPage() {
  const h = trainingPage.hero;
  return (
    <>
      <DarkHero
        id="training-hero-title"
        eyebrow={
          <>
            <span className="h-[3px] w-10 rounded-full bg-blue" aria-hidden="true" />
            {h.eyebrow}
          </>
        }
        headingLines={h.headingLines}
        text={<p>{trainingPage.intro}</p>}
        actions={
          <>
            <a href={h.primary.href} className="btn btn-primary btn-pill">
              {h.primary.label}
              <ArrowRight size={18} aria-hidden="true" />
            </a>
            <Link href={h.secondary.href} className="btn btn-outline btn-pill">
              {h.secondary.label}
            </Link>
          </>
        }
        visual={<LogoMonument props />}
      />

      {/* ---------------- Programmes & services ---------------- */}
      <section id="programmes" aria-labelledby="services-title" className="scroll-mt-24 bg-gradient-to-b from-light to-white py-20 lg:py-28">
        <div className="container-x">
          <Reveal>
            <span className="rule" aria-hidden="true" />
            <h2 id="services-title" className="mt-6 text-[2.4rem] tracking-[-0.04em] sm:text-6xl">
              {trainingPage.servicesHeading.lead} <span className="text-blue">{trainingPage.servicesHeading.accent}</span>
            </h2>
            <p className="mt-4 text-lg sm:text-xl">{trainingPage.servicesIntro}</p>
          </Reveal>
          <TrainingGridAll />
        </div>
      </section>

      {/* ---------------- Two-day programme ---------------- */}
      <section id="programme" aria-labelledby="programme-title" className="scroll-mt-24 pb-20 lg:pb-28">
        <div className="container-x">
          <SectionHeading
            id="programme-title"
            lead={programme.heading.lead}
            accent={programme.heading.accent}
            intro="An educational overview of the two days. Detailed content is covered in class under instructor supervision."
          />
          <ProgrammeDays />
        </div>
      </section>

      <CtaPanel {...trainingPage.cta} />
    </>
  );
}

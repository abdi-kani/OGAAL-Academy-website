import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { aboutPreview, closingCta, hero, introCards, programme, site, training } from "@/content/site";
import { HeroTiles } from "@/components/HeroTiles";
import { Icon } from "@/components/Icon";
import { PartnersSection } from "@/components/PartnersSection";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { ClosingCta, ProgrammeDays, SafetyMarquee, TrainingCard } from "@/components/Sections";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({ title: site.seo.homeTitle, description: site.seo.homeDescription, path: "/" }),
  title: { absolute: site.seo.homeTitle },
};

const previewSlugs = ["safety-education", "storage-transportation", "supervised-exercises", "assessment-certification"];

export default function HomePage() {
  const previewCards = previewSlugs.map((s) => training.find((t) => t.slug === s)!);

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section aria-labelledby="hero-title" className="navy-panel on-dark pattern-icons pattern-icons-dark">
        <div className="container-x grid items-center gap-12 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-20">
          <Reveal>
            <p className="eyebrow">{hero.eyebrow}</p>
            <h1 id="hero-title" className="mt-5 text-[2.6rem] leading-[1.05] sm:text-6xl">
              <span className="block">{hero.headingLines[0]}</span>
              <span className="block text-[#8fb6ff]">{hero.headingLines[1]}</span>
            </h1>
            <p className="mt-6 font-display text-xl font-semibold text-white">{hero.subtitle}</p>
            <p className="mt-3 max-w-lg text-lg">{hero.description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={hero.primary.href} className="group btn btn-primary">
                {hero.primary.label}
                <ArrowRight size={18} aria-hidden="true" className="nudge" />
              </Link>
              <Link href={hero.secondary.href} className="btn btn-outline">
                {hero.secondary.label}
              </Link>
            </div>
          </Reveal>
          <HeroTiles />
        </div>
      </section>

      {/* ---------------- Introduction cards ---------------- */}
      <section aria-label="What we focus on" className="py-12 lg:py-16">
        <div className="container-x">
          <ul className="grid gap-4 md:grid-cols-3" role="list">
            {introCards.map((c, i) => (
              <Reveal as="li" key={c.title} delay={i * 70} className="card card-hover flex items-start gap-4 p-6">
                <span className="icon-tile">
                  <Icon name={c.icon} />
                </span>
                <div>
                  <h2 className="text-lg">{c.title}</h2>
                  <p className="mt-1.5 text-[0.98rem]">{c.text}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <SafetyMarquee />

      {/* ---------------- About preview ---------------- */}
      <section aria-labelledby="about-title" className="pattern-icons py-14 lg:py-20">
        <div className="container-x grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <SectionHeading id="about-title" eyebrow="About us" lead={aboutPreview.heading.lead} accent={aboutPreview.heading.accent} intro={aboutPreview.text} />
          <Reveal delay={100} className="card divide-y divide-line">
            {[
              { icon: "building", label: "Institution", value: "Private professional training institution" },
              { icon: "pin", label: "Location", value: site.location.label },
              { icon: "bullets", label: "Approach", value: "Structured education and supervised safety training" },
            ].map((r) => (
              <div key={r.label} className="group flex items-center gap-4 p-5">
                <span className="icon-tile">
                  <Icon name={r.icon as "building"} />
                </span>
                <div>
                  <p className="eyebrow !text-[0.7rem]">{r.label}</p>
                  <p className="font-display font-bold text-navy">{r.value}</p>
                </div>
              </div>
            ))}
            <div className="p-5">
              <Link href={aboutPreview.cta.href} className="group inline-flex items-center gap-1.5 font-display font-bold text-blue hover:underline">
                {aboutPreview.cta.label}
                <ArrowRight size={16} aria-hidden="true" className="nudge" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Training preview ---------------- */}
      <section aria-labelledby="training-title" className="pattern-icons bg-light py-14 lg:py-20">
        <div className="container-x">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading id="training-title" eyebrow="Training" lead="Training and safety" accent="education." />
            <Reveal>
              <Link href="/training" className="group btn btn-outline shrink-0">
                View All Training
                <ArrowRight size={18} aria-hidden="true" className="nudge" />
              </Link>
            </Reveal>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="list">
            {previewCards.map((t, i) => (
              <TrainingCard key={t.slug} t={t} index={i} />
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------- Two-day programme ---------------- */}
      <section aria-labelledby="programme-title" className="navy-panel on-dark pattern-icons pattern-icons-dark py-14 lg:py-20">
        <div className="container-x">
          <SectionHeading id="programme-title" eyebrow="Programme" lead={programme.heading.lead} accent={programme.heading.accent} />
          <ProgrammeDays />
        </div>
      </section>

      <PartnersSection />

      <ClosingCta {...closingCta} />
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, GraduationCap, MapPin } from "lucide-react";
import {
  aboutPreview,
  admissionsPreview,
  closingCta,
  hero,
  introCards,
  programmePreview,
  site,
} from "@/content/site";
import { HeroArt } from "@/components/HeroArt";
import { TrainingTabs } from "@/components/TrainingTabs";
import { Icon3D } from "@/components/Icon3D";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { ClosingCta, PartnersSection, SafetyMarquee, StepsRow } from "@/components/Sections";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({ title: site.seo.homeTitle, description: site.seo.homeDescription, path: "/" }),
  title: { absolute: site.seo.homeTitle },
};

export default function HomePage() {
  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section aria-labelledby="hero-title" className="sky relative -mt-20 overflow-hidden pt-20 lg:-mt-[5.5rem] lg:pt-[5.5rem]">
        {/* soft architectural arcs, echoing the reference backdrop */}
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full text-white" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
          <path d="M-80 900 C 40 420, 260 200, 560 140" fill="none" stroke="currentColor" strokeWidth="44" opacity="0.7" />
          <path d="M-140 900 C -20 360, 200 120, 520 60" fill="none" stroke="currentColor" strokeWidth="16" opacity="0.6" />
          <path d="M1500 860 C 1200 760, 900 760, 620 860" fill="none" stroke="currentColor" strokeWidth="60" opacity="0.55" />
        </svg>
        <div className="container-x relative grid items-center gap-10 pt-10 pb-16 sm:pt-14 lg:grid-cols-[1.12fr_0.88fr] lg:gap-6 lg:pt-16 lg:pb-32">
          <Reveal>
            <p className="eyebrow">{hero.eyebrow}</p>
            <h1 id="hero-title" className="mt-6 text-[2.6rem] leading-[1.04] tracking-[-0.045em] sm:text-6xl lg:text-[3.45rem] xl:text-[4.05rem]">
              <span className="block">{hero.headingLines[0]}</span>
              <span className="block text-blue lg:whitespace-nowrap">{hero.headingLines[1]}</span>
            </h1>
            <p className="mt-6 font-display text-xl font-semibold text-navy sm:text-2xl">{hero.subtitle}</p>
            <p className="mt-3 max-w-lg text-lg sm:text-xl">{hero.description}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href={hero.primary.href} className="btn btn-primary">
                {hero.primary.label}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href={hero.secondary.href} className="btn btn-outline">
                {hero.secondary.label}
              </Link>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <HeroArt />
          </Reveal>
        </div>
      </section>

      {/* ---------------- Introduction cards ---------------- */}
      <section aria-label="What we focus on" className="relative z-10 lg:-mt-24">
        <div className="container-x pt-2 lg:pt-0">
          <ul className="grid gap-4 md:grid-cols-3 lg:gap-5" role="list">
            {introCards.map((c, i) => (
              <Reveal as="li" key={c.title} delay={i * 90} className="card card-hover flex items-center gap-5 p-6 lg:p-7">
                <Icon3D name={c.icon} />
                <div>
                  <h2 className="text-xl">{c.title}</h2>
                  <p className="mt-1.5 text-[0.98rem]">{c.text}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <SafetyMarquee />

      {/* ---------------- About preview ---------------- */}
      <section aria-labelledby="about-title" className="pt-8 pb-20 lg:pt-12 lg:pb-28">
        <div className="container-x">
          <SectionHeading id="about-title" lead={aboutPreview.heading.lead} accent={aboutPreview.heading.accent} align="center" />
          <div className="mt-14 grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <Reveal>
              <p className="text-lg leading-relaxed sm:text-xl">{aboutPreview.text}</p>
              <Link href={aboutPreview.cta.href} className="btn btn-primary mt-8">
                {aboutPreview.cta.label}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </Reveal>
            <Reveal delay={100} as="ul" className="card divide-y divide-line p-2" >
              {[
                { icon: Building2, label: "Institution", value: "Private professional training institution" },
                { icon: MapPin, label: "Location", value: site.location.label },
                { icon: GraduationCap, label: "Approach", value: "Structured education and supervised safety training" },
              ].map((r) => (
                <li key={r.label} className="flex items-center gap-4 p-5">
                  <span className="icon-tile">
                    <r.icon size={22} aria-hidden="true" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="font-display text-xs font-bold tracking-[0.18em] text-blue uppercase">{r.label}</p>
                    <p className="mt-0.5 font-display font-bold text-navy">{r.value}</p>
                  </div>
                </li>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      <TrainingTabs />

      {/* ---------------- Programme preview ---------------- */}
      <section aria-labelledby="programme-title" className="py-20 lg:py-28">
        <div className="container-x grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <SectionHeading id="programme-title" lead={programmePreview.heading.lead} accent={programmePreview.heading.accent} />
            <Reveal className="mt-8">
              <Link href={programmePreview.cta.href} className="btn btn-primary">
                {programmePreview.cta.label}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </Reveal>
          </div>
          <ol className="grid gap-5 sm:grid-cols-2" role="list">
            {programmePreview.days.map((d, i) => (
              <Reveal as="li" key={d.label} delay={i * 100} className={`relative overflow-hidden rounded-[var(--radius-card)] p-8 ${i === 0 ? "card" : "navy-panel on-dark"}`}>
                <span className={`font-display text-6xl font-extrabold tracking-tight ${i === 0 ? "text-blue/15" : "text-white/15"}`} aria-hidden="true">
                  0{i + 1}
                </span>
                <h3 className={`mt-4 text-2xl ${i === 0 ? "" : "!text-white"}`}>{d.label}</h3>
                <p className={`mt-3 ${i === 0 ? "" : "text-white/80"}`}>{d.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <PartnersSection />

      {/* ---------------- Admissions preview ---------------- */}
      <section aria-labelledby="admissions-title" className="py-20 lg:py-28">
        <div className="container-x">
          <SectionHeading id="admissions-title" lead={admissionsPreview.heading.lead} accent={admissionsPreview.heading.accent} align="center" />
          <StepsRow steps={admissionsPreview.steps.map((text) => ({ text }))} />
          <Reveal className="mt-12 text-center">
            <Link href={admissionsPreview.cta.href} className="btn btn-primary">
              {admissionsPreview.cta.label}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </section>

      <ClosingCta {...closingCta} />
    </>
  );
}

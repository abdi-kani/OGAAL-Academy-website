import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, MoveRight } from "lucide-react";
import { about, photos } from "@/content/site";
import { DarkHero } from "@/components/DarkHero";
import { LogoMonument } from "@/components/LogoMonument";
import { Icon, type IconName } from "@/components/Icon";
import { PhotoPanel } from "@/components/PhotoPanel";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { ValuesGrid } from "@/components/Sections";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About Us",
  description:
    "OGAAL Academy provides professional firearm safety education for eligible individuals, security personnel, and organisations in Mogadishu. Our mission, vision, values, and training approach.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      {/* ---------------- Hero (dark stage) ---------------- */}
      <DarkHero
        id="about-hero-title"
        eyebrow={
          <>
            {about.hero.eyebrow}
            <span className="h-px w-16 bg-white/50" aria-hidden="true" />
          </>
        }
        headingLines={about.hero.headingLines}
        text={<p>{about.hero.text}</p>}
        actions={
          <a href={about.hero.primary.href} className="group btn btn-white btn-pill self-start !text-navy">
            {about.hero.primary.label}
            <ArrowUpRight size={18} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        }
        visual={<LogoMonument />}
        footer={
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 py-6 font-display text-xs font-bold tracking-[0.3em] text-white/75 uppercase sm:text-sm" role="list">
            {about.hero.pillars.map((p, i) => (
              <li key={p} className="flex items-center gap-6">
                {i > 0 && <span className="text-white/40" aria-hidden="true">/</span>}
                {p}
              </li>
            ))}
          </ul>
        }
      />

      {/* ---------------- Mission & vision (split band) ---------------- */}
      <section aria-label="Mission and vision" className="grid md:grid-cols-[1.15fr_1fr]">
        {[
          { n: "01", title: "Our Mission", text: about.mission, dark: true },
          { n: "02", title: "Our Vision", text: about.vision, dark: false },
        ].map((b, i) => (
          <Reveal
            key={b.title}
            delay={i * 100}
            className={`group relative overflow-hidden px-6 py-14 sm:px-12 lg:py-16 ${b.dark ? "on-dark bg-gradient-to-br from-[#0b4ff0] to-[#0636b8]" : "bg-light"}`}
          >
            {b.dark && (
              <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full text-white" viewBox="0 0 600 300" preserveAspectRatio="none">
                <polygon points="380,0 600,0 600,300 240,300" fill="currentColor" opacity="0.05" />
                <polygon points="470,0 600,0 600,300 420,300" fill="currentColor" opacity="0.05" />
              </svg>
            )}
            <span
              aria-hidden="true"
              className={`outline-num pointer-events-none absolute top-6 font-display text-[7rem] leading-none font-extrabold sm:text-[9rem] ${b.dark ? "right-6 text-white/20 lg:right-auto lg:left-4" : "right-6 text-navy/10"}`}
            >
              {b.n}
            </span>
            <div className={`relative max-w-lg ${b.dark ? "lg:ml-[22%]" : "lg:ml-[10%]"}`}>
              <span className={`block h-[3px] w-12 rounded-full ${b.dark ? "bg-white" : "bg-blue"}`} aria-hidden="true" />
              <h2 className={`mt-6 text-3xl sm:text-4xl ${b.dark ? "!text-white" : ""}`}>{b.title}</h2>
              <p className={`mt-4 text-lg leading-relaxed ${b.dark ? "text-white/90" : ""}`}>{b.text}</p>
              <MoveRight size={40} strokeWidth={1.25} aria-hidden="true" className={`arrow-nudge mt-8 ${b.dark ? "text-white" : "text-navy"}`} />
            </div>
          </Reveal>
        ))}
      </section>

      {/* ---------------- Strip ---------------- */}
      <div className="bg-[#050b1c] text-white/75">
        <div className="container-x flex flex-col gap-4 py-6 text-xs tracking-[0.16em] lg:flex-row lg:items-center lg:gap-8">
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 lg:shrink-0 lg:flex-nowrap lg:whitespace-nowrap" role="list">
            {about.strip.map((t, i) => (
              <li key={t} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden="true">•</span>}
                {t}
              </li>
            ))}
          </ul>
          <span aria-hidden="true" className="line-sweep hidden h-px flex-1 bg-white/15 lg:block" />
          <p className="flex items-center gap-4 uppercase lg:shrink-0 lg:whitespace-nowrap">
            <span className="font-display font-extrabold tracking-[0.2em] text-blue">OGAAL</span>
            <span className="h-4 w-px bg-white/30" aria-hidden="true" />
            Firearms Safety &amp; Responsibility Training Academy
          </p>
        </div>
      </div>

      {/* ---------------- Who we are ---------------- */}
      <section id="who-we-are" aria-labelledby="who-title" className="scroll-mt-24 py-20 lg:py-28">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="eyebrow">Who we are</p>
            <h2 id="who-title" className="mt-5 text-3xl sm:text-[2.6rem]">
              {about.whoHeading}
            </h2>
            <div className="mt-6 space-y-5 text-lg leading-relaxed">
              <p>{about.intro[1]}</p>
              <p>{about.intro[0]}</p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <PhotoPanel photo={photos.classroom} className="aspect-[5/4] w-full" />
          </Reveal>
        </div>
      </section>

      {/* ---------------- Core values ---------------- */}
      <section aria-labelledby="values-title" className="navy-panel on-dark py-20 lg:py-28">
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Core Values</p>
            <h2 id="values-title" className="section-title mt-4 text-[2.1rem] !text-white sm:text-5xl">
              What guides our work.
            </h2>
          </Reveal>
          <ValuesGrid />
        </div>
      </section>

      {/* ---------------- Training approach ---------------- */}
      <section id="approach" aria-labelledby="approach-title" className="scroll-mt-24 py-20 lg:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <SectionHeading id="approach-title" lead={about.approach.heading.lead} accent={about.approach.heading.accent} intro={about.approach.intro} />
          <ol className="grid gap-4" role="list">
            {about.approach.items.map((it, i) => (
              <Reveal as="li" key={it.title} delay={i * 60} className="card flex items-start gap-5 p-6">
                <span className="icon-tile">
                  <Icon name={it.icon as IconName} />
                </span>
                <div>
                  <h3 className="text-lg">{it.title}</h3>
                  <p className="mt-1.5">{it.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------- Closing band ---------------- */}
      <section aria-labelledby="band-title" className="navy-panel on-dark relative overflow-hidden">
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full text-white/10" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice">
          <ellipse cx="560" cy="150" rx="380" ry="110" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(-8 560 150)" />
          <ellipse cx="560" cy="150" rx="300" ry="80" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(6 560 150)" />
        </svg>
        <Reveal className="container-x relative flex flex-col gap-8 py-16 lg:flex-row lg:items-center lg:justify-between lg:py-20">
          <div className="max-w-2xl">
            <h2 id="band-title" className="text-3xl !text-white sm:text-5xl">
              {about.band.headingLines.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </h2>
            <p className="mt-5 text-lg text-white/80">{about.band.text}</p>
          </div>
          <Link href={about.band.cta.href} className="btn btn-primary shrink-0 self-start !px-10 lg:self-center">
            {about.band.cta.label}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </Reveal>
      </section>
    </>
  );
}

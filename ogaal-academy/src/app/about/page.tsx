import type { Metadata } from "next";
import { ArrowUpRight, MoveRight } from "lucide-react";
import { about, photos } from "@/content/site";
import { ApproachSection } from "@/components/ApproachSection";
import { DarkHero } from "@/components/DarkHero";
import { LogoMonument } from "@/components/LogoMonument";
import { PhotoPanel } from "@/components/PhotoPanel";
import { Reveal } from "@/components/Reveal";
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

      <ApproachSection />
    </>
  );
}

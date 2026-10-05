import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { about, art, photos } from "@/content/site";
import { AboutHeroArt } from "@/components/AboutHeroArt";
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
  const book = art.icons.book;

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section aria-labelledby="about-hero-title" className="sky relative overflow-hidden">
        <svg aria-hidden="true" className="ripple pointer-events-none absolute top-0 right-0 h-full w-[60%] text-blue/10" viewBox="0 0 600 400" preserveAspectRatio="xMaxYMid slice">
          <circle cx="520" cy="200" r="260" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="520" cy="200" r="190" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="520" cy="200" r="120" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
        <div className="container-x relative grid items-center gap-8 py-14 sm:py-16 lg:grid-cols-[1fr_1fr] lg:gap-6 lg:py-20">
          <Reveal>
            <p className="eyebrow">{about.hero.eyebrow}</p>
            <h1 id="about-hero-title" className="mt-6 text-[2.6rem] leading-[1.04] tracking-[-0.045em] sm:text-6xl lg:text-[3.6rem]">
              {about.hero.headingLines.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </h1>
            <p className="mt-6 max-w-lg text-lg sm:text-xl">{about.hero.text}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href={about.hero.primary.href} className="btn btn-primary">
                {about.hero.primary.label}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a href={about.hero.secondary.href} className="btn btn-outline !border-blue !text-blue hover:!bg-blue hover:!text-white">
                {about.hero.secondary.label}
              </a>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <AboutHeroArt />
          </Reveal>
        </div>
      </section>

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

      {/* ---------------- Mission & vision ---------------- */}
      <section aria-label="Mission and vision" className="pb-20 lg:pb-28">
        <div className="container-x grid gap-6 md:grid-cols-2">
          {[
            { title: "Our Mission", text: about.mission, art: <Image src={book.src} alt="" width={book.width} height={book.height} className="h-auto w-[5.6rem]" sizes="96px" /> },
            { title: "Our Vision", text: about.vision, art: <Icon name="compass" size={64} strokeWidth={1.4} live /> },
          ].map((b, i) => (
            <Reveal key={b.title} delay={i * 100} className="card card-hover flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:p-9">
              <span aria-hidden="true" className="float-a grid h-32 w-32 shrink-0 place-items-center rounded-[1.6rem] bg-gradient-to-br from-white to-blue-100 text-blue shadow-[inset_0_1px_0_#fff,0_18px_32px_-16px_rgb(7_85_233/0.45)] ring-1 ring-white">
                {b.art}
              </span>
              <div>
                <h2 className="text-2xl sm:text-3xl">{b.title}</h2>
                <span className="rule mt-4" aria-hidden="true" />
                <p className="mt-4 text-lg leading-relaxed">{b.text}</p>
              </div>
            </Reveal>
          ))}
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
      <section aria-labelledby="approach-title" className="py-20 lg:py-28">
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

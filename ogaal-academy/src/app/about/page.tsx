import type { Metadata } from "next";
import { Eye, Target } from "lucide-react";
import { about, closingCta, photos } from "@/content/site";
import { Icon, type IconName } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { PhotoPanel } from "@/components/PhotoPanel";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { ClosingCta, ValuesGrid } from "@/components/Sections";
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
      <PageHeader crumb="About Us" eyebrow="About Us" title={about.heading} intro={<p>{about.intro[0]}</p>} icon="book" />

      {/* Introduction */}
      <section aria-label="Introduction" className="py-20 lg:py-28">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="eyebrow">Who we are</p>
            <div className="mt-6 space-y-5 text-lg leading-relaxed sm:text-xl">
              {about.intro.map((p, i) => (
                <p key={i} className={i === 0 ? "font-display font-semibold text-navy" : ""}>
                  {p}
                </p>
              ))}
            </div>
          </Reveal>
          <Reveal delay={100}>
            <PhotoPanel photo={photos.classroom} className="aspect-[5/4] w-full" />
          </Reveal>
        </div>
      </section>

      {/* Mission & vision */}
      <section aria-label="Mission and vision" className="bg-light py-20 lg:py-24">
        <div className="container-x grid gap-6 md:grid-cols-2">
          {[
            { icon: Target, title: "Mission", text: about.mission },
            { icon: Eye, title: "Vision", text: about.vision },
          ].map((b, i) => (
            <Reveal key={b.title} delay={i * 100} className="card p-8 sm:p-10">
              <span className="icon-tile">
                <b.icon size={24} aria-hidden="true" strokeWidth={1.75} />
              </span>
              <h2 className="mt-6 text-2xl sm:text-3xl">{b.title}</h2>
              <p className="mt-4 text-lg leading-relaxed">{b.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Core values */}
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

      {/* Training approach */}
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

      <ClosingCta {...closingCta} />
    </>
  );
}

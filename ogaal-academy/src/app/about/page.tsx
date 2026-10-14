import type { Metadata } from "next";
import { about, closingCta } from "@/content/site";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { ApproachList, ClosingCta, ValuesGrid } from "@/components/Sections";
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
      <PageHeader crumb="About Us" eyebrow="About Us" title={about.heading} intro={<p>{about.intro[0]}</p>} icon="target" />

      {/* Introduction, mission and vision */}
      <section aria-label="Introduction" className="pattern-icons py-14 lg:py-20">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <Reveal>
            <p className="eyebrow">Who we are</p>
            <h2 className="mt-4 text-3xl sm:text-4xl">Safety. Responsibility. Respect.</h2>
            <span className="rule mt-5" aria-hidden="true" />
            <div className="mt-5 space-y-4 text-lg">
              {about.intro.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </Reveal>
          <div className="grid gap-4">
            {[
              { icon: "bullet", title: "Our Mission", text: about.mission },
              { icon: "target", title: "Our Vision", text: about.vision },
            ].map((b, i) => (
              <Reveal key={b.title} delay={i * 80} className="card flex items-start gap-5 p-6 sm:p-7">
                <span className="icon-tile">
                  <Icon name={b.icon as "bullet"} />
                </span>
                <div>
                  <h3 className="text-xl">{b.title}</h3>
                  <p className="mt-2">{b.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Core values */}
      <section aria-labelledby="values-title" className="bg-light py-14 lg:py-20">
        <div className="container-x">
          <SectionHeading id="values-title" eyebrow="Core values" lead="What guides" accent="our work." />
          <ValuesGrid />
        </div>
      </section>

      {/* Training approach */}
      <section id="approach" aria-labelledby="approach-title" className="scroll-mt-24 py-14 lg:py-20">
        <div className="container-x grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <SectionHeading id="approach-title" eyebrow="How we teach" lead={about.approach.heading.lead} accent={about.approach.heading.accent} intro={about.approach.intro} />
          <ApproachList />
        </div>
      </section>

      <ClosingCta {...closingCta} />
    </>
  );
}

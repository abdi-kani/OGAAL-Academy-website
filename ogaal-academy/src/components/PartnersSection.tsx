import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { partnersSection } from "@/content/site";
import { Icon, type IconName } from "./Icon";
import { Reveal } from "./Reveal";

/** Partners and cooperation: one plain card per partner. The status label shows only when `showStatus` is on. */
export function PartnersSection({ withHeading = true }: { withHeading?: boolean }) {
  const s = partnersSection;
  return (
    <section id="partners" aria-labelledby={withHeading ? "partners-title" : undefined} className="pattern-icons scroll-mt-24 bg-light py-14 lg:py-20">
      <div className="container-x">
        {withHeading && (
          <Reveal className="max-w-2xl">
            <p className="eyebrow">{s.eyebrow}</p>
            <h2 id="partners-title" className="mt-4 text-3xl sm:text-4xl">
              {s.headingLines[0]} <span className="accent">{s.headingLines[1]}</span>
            </h2>
            <p className="mt-4 text-lg">{s.intro}</p>
          </Reveal>
        )}
        <ul className={`grid gap-4 ${withHeading ? "mt-10" : ""}`} role="list">
          {s.partners.map((p) => (
            <Reveal as="li" key={p.name} className="card card-hover grid gap-6 p-6 sm:p-8 lg:grid-cols-[auto_1fr] lg:gap-8">
              <span className="icon-tile icon-tile-lg h-20 w-20 rounded-[1.25rem]" aria-hidden="true">
                <Icon name="landmark" size={40} strokeWidth={1.5} />
              </span>
              <div>
                <p className="eyebrow">{p.country}</p>
                <h3 className="mt-2 text-2xl sm:text-3xl">{p.name}</h3>
                <p className="mt-1 font-display font-semibold text-navy">{p.localName}</p>
                <p className="mt-4 max-w-2xl">{p.text}</p>
                {p.showStatus && (
                  <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-navy">
                    <BadgeCheck size={16} aria-hidden="true" className="text-blue" />
                    {p.status === "signed" ? "Signed cooperation agreement" : "Agreement pending signature confirmation"}
                  </p>
                )}
                <ul className="mt-6 flex flex-wrap gap-2" role="list">
                  {p.focus.map((f) => (
                    <li key={f.text} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-navy">
                      <Icon name={f.icon as IconName} size={16} className="text-blue" />
                      {f.text}
                    </li>
                  ))}
                </ul>
                <Link href={p.cta.href} className="mt-6 inline-flex items-center gap-1.5 font-display font-bold text-blue hover:underline">
                  {p.cta.label}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

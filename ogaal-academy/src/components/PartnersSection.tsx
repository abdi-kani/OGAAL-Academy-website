import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Handshake } from "lucide-react";
import { partnersSection, site } from "@/content/site";
import { Icon, type IconName } from "./Icon";
import { Reveal } from "./Reveal";

/**
 * Partners and cooperation: a feature card per partner with a navy visual panel (animated
 * handshake, turning rings, the academy mark) beside the details. The status label shows
 * only when `showStatus` is on.
 */
export function PartnersSection({ withHeading = true }: { withHeading?: boolean }) {
  const s = partnersSection;
  const mark = site.logo.mark;
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

        <ul className={`grid gap-5 ${withHeading ? "mt-10" : ""}`} role="list">
          {s.partners.map((p) => (
            <Reveal as="li" key={p.name} className="card card-hover grid overflow-hidden lg:grid-cols-[0.8fr_1.2fr]">
              {/* visual panel */}
              <div aria-hidden="true" className="navy-panel pattern-icons pattern-icons-dark relative min-h-[18rem] overflow-hidden">
                <svg viewBox="0 0 200 200" className="spin-slow absolute top-1/2 left-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 text-white/25">
                  <circle cx="100" cy="100" r="98" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2 6" />
                  <circle cx="100" cy="2" r="2.4" fill="currentColor" />
                </svg>
                <svg viewBox="0 0 200 200" className="spin-slow-rev absolute top-1/2 left-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 text-white/20">
                  <circle cx="100" cy="100" r="98" fill="none" stroke="currentColor" strokeWidth="0.8" />
                  <circle cx="169.3" cy="30.7" r="2.4" fill="#8fb6ff" />
                </svg>
                <span className="sonar absolute top-1/2 left-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30" />
                <span className="sonar absolute top-1/2 left-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30 [animation-delay:1.6s]" />
                <span className="float-a absolute top-1/2 left-1/2 grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[1.75rem] bg-white text-blue shadow-[0_24px_48px_-20px_rgb(0_0_0/0.7)]">
                  <Handshake size={60} strokeWidth={1.4} />
                </span>
                {/* floating focus badges */}
                <span className="float-b absolute top-6 left-6 grid h-12 w-12 place-items-center rounded-xl bg-white/12 text-white ring-1 ring-white/20 backdrop-blur">
                  <Icon name="pistol" size={24} live />
                </span>
                <span className="float-c absolute top-10 right-6 grid h-12 w-12 place-items-center rounded-xl bg-white/12 text-white ring-1 ring-white/20 backdrop-blur">
                  <Icon name="bulletCheck" size={24} live />
                </span>
                <span className="float-d absolute right-8 bottom-16 grid h-12 w-12 place-items-center rounded-xl bg-white/12 text-white ring-1 ring-white/20 backdrop-blur">
                  <Icon name="target" size={24} live />
                </span>
                {/* academy mark */}
                <span className="absolute bottom-5 left-6 flex items-center gap-2.5 text-white">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-white">
                    <Image src={mark.src} alt="" width={mark.width} height={mark.height} sizes="32px" className="h-7 w-auto" />
                  </span>
                  <span className="leading-none">
                    <span className="block font-display text-base font-extrabold">OGAAL</span>
                    <span className="block text-[0.6rem] font-bold tracking-[0.12em] text-white/70 uppercase">Institutional cooperation</span>
                  </span>
                </span>
              </div>

              {/* details */}
              <div className="p-7 sm:p-10">
                <p className="eyebrow">{p.country}</p>
                <h3 className="mt-3 text-3xl sm:text-4xl">{p.name}</h3>
                <p className="mt-1.5 font-display text-lg font-semibold text-navy">{p.localName}</p>
                <p className="mt-5 max-w-2xl text-lg">{p.text}</p>
                {p.showStatus && (
                  <p className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-navy">
                    <BadgeCheck size={16} aria-hidden="true" className="text-blue" />
                    {p.status === "signed" ? "Signed cooperation agreement" : "Agreement pending signature confirmation"}
                  </p>
                )}
                <ul className="mt-7 grid gap-3 sm:grid-cols-3" role="list">
                  {p.focus.map((f) => (
                    <li key={f.text} className="group flex items-center gap-3 rounded-xl border border-line bg-white p-3 transition-colors hover:border-blue-100">
                      <span className="icon-tile !h-10 !w-10">
                        <Icon name={f.icon as IconName} size={20} />
                      </span>
                      <span className="font-display text-[0.92rem] leading-tight font-bold text-navy">{f.text}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-7 border-t border-line pt-5">
                  <Link href={p.cta.href} className="group btn btn-primary">
                    {p.cta.label}
                    <ArrowRight size={18} aria-hidden="true" className="nudge" />
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </ul>

        {/* shared focus strip */}
        <Reveal className="mt-5 flex flex-col items-center justify-center gap-4 rounded-[var(--radius-card)] border border-blue-100 bg-white px-6 py-5 text-center sm:flex-row sm:gap-5">
          <span className="icon-tile !h-11 !w-11 !rounded-full" aria-hidden="true">
            <Icon name="shield" size={22} />
          </span>
          <p className="text-lg text-navy">
            <strong className="font-display font-bold">Shared focus:</strong> safety education and responsibility.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

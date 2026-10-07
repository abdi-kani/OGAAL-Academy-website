import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Handshake } from "lucide-react";
import { partnersSection, site } from "@/content/site";
import { Icon, type IconName } from "./Icon";
import { Reveal } from "./Reveal";

/**
 * Partners & cooperation: a card per partner with a handshake visual, focus areas and an
 * enquiry link, then a "shared focus" bar. The agreement status is always shown.
 */
export function PartnersSection({ headingAs: H = "h2" }: { headingAs?: "h1" | "h2" }) {
  const s = partnersSection;
  const [lead, last] = s.headingLines;
  const plain = last.replace(s.accent, "");
  const mark = site.logo.mark;

  return (
    <section id="partners" aria-labelledby="partners-title" className="sky scroll-mt-24 py-20 lg:py-24">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <Reveal>
            <p className="eyebrow">{s.eyebrow}</p>
            <H id="partners-title" className="mt-5 text-[2.3rem] leading-[1.05] tracking-[-0.04em] sm:text-6xl">
              <span className="block">{lead}</span>
              <span className="block">
                {plain}
                <span className="text-blue">{s.accent}</span>
              </span>
            </H>
          </Reveal>
          <Reveal delay={80} className="max-w-sm text-lg">
            {s.intro}
            <span className="rule mt-5" aria-hidden="true" />
          </Reveal>
        </div>

        <ul className="mt-12 grid gap-5" role="list">
          {s.partners.map((p) => (
            <Reveal as="li" key={p.name} className="card grid overflow-hidden lg:grid-cols-[0.82fr_1.18fr]">
              {/* handshake over light blocks, academy mark in the corner */}
              <div aria-hidden="true" className="partner-visual relative min-h-[18rem] overflow-hidden">
                <span className="partner-block absolute right-[-6%] bottom-[-4%] h-[32%] w-[56%]" />
                <span className="partner-block partner-block-blue absolute bottom-[-4%] left-[48%] h-[40%] w-[20%]" />
                <span className="breathe absolute top-[12%] left-[18%] h-[55%] w-[64%] rounded-full bg-[radial-gradient(circle,rgb(96_165_250/0.5),transparent_65%)] blur-2xl" />
                <span className="handshake absolute top-[16%] left-1/2 h-[44%] text-white">
                  <Handshake className="h-full w-auto drop-shadow-[0_10px_24px_rgb(59_130_246/0.8)]" strokeWidth={1.1} />
                </span>
                <span className="absolute bottom-[6%] left-[6%] flex flex-col items-center text-center text-white">
                  <Image src={mark.src} alt="" width={mark.width} height={mark.height} sizes="56px" className="h-auto w-14" />
                  <span className="mt-1 font-display text-xl leading-none font-extrabold">OGAAL</span>
                  <span className="mt-1 font-display text-[0.55rem] leading-tight font-bold tracking-[0.04em] uppercase">
                    Firearms Safety &amp;
                    <br />
                    Responsibility Training Academy
                  </span>
                </span>
              </div>

              <div className="p-7 sm:p-10 lg:p-12">
                <p className="font-display text-xs font-bold tracking-[0.28em] text-body uppercase">{p.country}</p>
                <h3 className="mt-4 text-3xl font-extrabold tracking-[-0.03em] sm:text-[2.6rem]">{p.name}</h3>
                <p className="mt-2 font-display text-xl font-medium text-navy">{p.localName}</p>
                <p className="mt-5 max-w-xl text-lg">{p.text}</p>
                {!p.showStatus ? null : p.status === "pending" ? (
                  <p className="mt-5 inline-flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
                    <span className="relative flex h-2 w-2" aria-hidden="true">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-600" />
                    </span>
                    Agreement pending signature confirmation
                  </p>
                ) : (
                  <p className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
                    <BadgeCheck size={16} aria-hidden="true" />
                    Signed cooperation agreement
                  </p>
                )}
                <ul className="mt-8 grid gap-3 sm:grid-cols-3" role="list">
                  {p.focus.map((f) => (
                    <li key={f.text} className="flex items-center gap-3 rounded-xl border border-line bg-white p-3 transition-colors duration-300 hover:border-blue-100">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blue-50 text-blue">
                        <Icon name={f.icon as IconName} size={22} />
                      </span>
                      <span className="font-display text-[0.95rem] leading-tight font-semibold text-navy">{f.text}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 border-t border-line pt-5">
                  <Link href={p.cta.href} className="group/link inline-flex items-center gap-3 font-display text-lg font-bold text-blue">
                    {p.cta.label}
                    <ArrowUpRight size={20} aria-hidden="true" className="transition-transform duration-300 group-hover/link:translate-x-1 group-hover/link:-translate-y-1" />
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-5 flex items-center justify-center gap-5 rounded-[var(--radius-card)] bg-blue-50 px-6 py-6 text-center">
          <ShieldStar className="h-10 w-10 shrink-0 text-blue" />
          <span className="h-8 w-px bg-blue/25" aria-hidden="true" />
          <p className="text-lg text-navy">
            <strong className="font-display font-bold">{s.sharedFocus.lead}</strong> {s.sharedFocus.text}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/** Shield with a star, echoing the academy mark. */
function ShieldStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M12 2.5 4 5.5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10v-6z" />
      <path d="m12 8.2 1.2 2.5 2.7.3-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.3z" fill="currentColor" stroke="none" />
    </svg>
  );
}

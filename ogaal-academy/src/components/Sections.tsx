import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BadgeCheck, CalendarDays, Landmark } from "lucide-react";
import { about, faqs, partnersSection, programme, safetyTopics, training } from "@/content/site";
import { Accordion } from "./Accordion";
import { Icon, type IconName } from "./Icon";
import { Reveal } from "./Reveal";

type Training = (typeof training)[number];

/* ---------------- Training cards ---------------- */
/** 3D artwork used as a card picture where one exists; other cards show their animated icon large. */
const cardArt: Partial<Record<Training["slug"], { src: string; width: number; height: number; className: string }>> = {
  "safety-education": { src: "/images/3d/hero-shield-book.webp", width: 1147, height: 1095, className: "h-[88%] w-auto" },
  "responsible-ownership": { src: "/images/3d/icon-people.webp", width: 408, height: 248, className: "h-auto w-[52%]" },
};

export function TrainingCard({ t, index = 0, withId = false }: { t: Training; index?: number; withId?: boolean }) {
  const art = cardArt[t.slug];
  return (
    <Reveal as="li" id={withId ? t.slug : undefined} delay={(index % 3) * 90} className="h-full scroll-mt-28">
      <div className="card card-hover group flex h-full flex-col p-3">
        <div className="card-visual relative grid aspect-[16/10] place-items-center overflow-hidden rounded-[0.95rem]">
          <svg aria-hidden="true" viewBox="0 0 300 190" className="absolute inset-0 h-full w-full text-blue/10" preserveAspectRatio="xMidYMid slice">
            <circle cx="150" cy="95" r="90" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="150" cy="95" r="60" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          {art ? (
            <Image src={art.src} alt="" width={art.width} height={art.height} sizes="320px" className={`relative transition-transform duration-500 group-hover:scale-105 ${art.className}`} />
          ) : (
            <span aria-hidden="true" className="icon-3d-big relative transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105">
              <Icon name={t.icon as IconName} size={56} strokeWidth={1.6} />
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col px-4 pt-6 pb-4">
          <h3 className="text-xl">{t.title}</h3>
          <p className="mt-3 flex-1">{t.text}</p>
          <Link
            href={`/contact?type=Training&topic=${encodeURIComponent(t.title)}`}
            className="mt-6 inline-flex items-center gap-2 self-start font-display text-[0.95rem] font-bold text-blue"
            aria-label={`Enquire about ${t.title}`}
          >
            Enquire about training
            <ArrowUpRight size={17} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </Reveal>
  );
}

/* ---------------- Rounded navy call-to-action panel ---------------- */
export function CtaPanel({ headingLines, text, cta }: { headingLines: readonly string[]; text: string; cta: { label: string; href: string } }) {
  return (
    <section aria-labelledby="cta-panel-title" className="bg-white pb-20 lg:pb-24">
      <div className="container-x">
        <Reveal className="navy-panel on-dark relative overflow-hidden rounded-[1.5rem] px-7 py-12 sm:px-12 lg:py-14">
          <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full text-blue/40" viewBox="0 0 800 220" preserveAspectRatio="none">
            <path d="M380 220 C 520 120, 640 60, 800 40" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M440 220 C 560 140, 680 90, 800 80" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M500 220 C 600 160, 700 120, 800 120" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 id="cta-panel-title" className="text-3xl !text-white sm:text-5xl">
                {headingLines.map((l, i) => (
                  <span key={l} className="block">
                    {l}
                    {i === headingLines.length - 1 && <span aria-hidden="true" className="blink-square ml-[0.06em] inline-block h-[0.16em] w-[0.16em] bg-blue" />}
                  </span>
                ))}
              </h2>
              <p className="mt-4 text-lg text-white/80 sm:text-xl">{text}</p>
            </div>
            <Link href={cta.href} className="btn btn-primary btn-pill shrink-0 self-start !px-8 lg:self-center">
              {cta.label}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** Full list of seven: six in a grid plus a wide final card so no card sits alone. */
export function TrainingGridAll() {
  const main = training.slice(0, 6);
  const last = training[6];
  return (
    <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="list">
      {main.map((t, i) => (
        <TrainingCard key={t.slug} t={t} index={i} withId />
      ))}
      <Reveal as="li" id={last.slug} className="scroll-mt-28 sm:col-span-2 lg:col-span-3">
        <div className="navy-panel on-dark flex flex-col gap-6 rounded-[var(--radius-card)] p-7 sm:p-9 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-5">
            <span className="icon-tile bg-white/10 text-white">
              <Icon name={last.icon as IconName} />
            </span>
            <div className="max-w-2xl">
              <h3 className="text-xl !text-white sm:text-2xl">{last.title}</h3>
              <p className="mt-2 text-white/80">{last.text}</p>
            </div>
          </div>
          <Link href="/contact?type=Organisational%20Training" className="btn btn-white shrink-0 self-start md:self-center">
            Enquire for Your Team
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </Reveal>
    </ul>
  );
}

/* ---------------- Two-day programme (full) ---------------- */
export function ProgrammeDays() {
  return (
    <>
      <ol className="mt-12 grid gap-5 lg:grid-cols-2" role="list">
        {programme.days.map((d, i) => (
          <Reveal as="li" key={d.label} delay={i * 100} className="card overflow-hidden">
            <div className="flex items-center gap-4 border-b border-line bg-gradient-to-r from-blue-50 to-white px-7 py-5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue font-display text-lg font-extrabold text-white shadow-[var(--shadow-blue)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="font-display text-xs font-bold tracking-[0.2em] text-blue uppercase">{d.label}</p>
                <h3 className="mt-1 text-xl sm:text-2xl">{d.title}</h3>
              </div>
            </div>
            <ul className="grid gap-3 px-7 py-6" role="list">
              {d.items.map((item) => (
                <li key={item.text} className="group/item flex items-center gap-3 text-navy">
                  <span className="icon-tile icon-tile-sm" aria-hidden="true">
                    <Icon name={item.icon as IconName} size={18} />
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </ol>
      <Reveal className="mt-6 flex flex-col gap-5 rounded-[var(--radius-card)] border border-blue-100 bg-blue-50 p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-3 font-semibold text-navy">
          <CalendarDays size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-blue" />
          {programme.feeText}
        </p>
        <Link href={programme.cta.href} className="btn btn-primary shrink-0">
          {programme.cta.label}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </Reveal>
    </>
  );
}

/* ---------------- Numbered steps ---------------- */
export function StepsRow({ steps }: { steps: { title?: string; text: string }[] }) {
  return (
    <ol className="relative mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" role="list">
      <span aria-hidden="true" className="absolute top-[3.1rem] right-[12%] left-[12%] hidden h-px bg-gradient-to-r from-blue/0 via-blue/40 to-blue/0 lg:block" />
      {steps.map((s, i) => (
        <Reveal as="li" key={s.text} delay={i * 90} className="card relative p-7">
          <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-blue font-display text-xl font-extrabold text-white shadow-[var(--shadow-blue)]">
            {i + 1}
          </span>
          {s.title && <h3 className="mt-6 text-lg">{s.title}</h3>}
          <p className={s.title ? "mt-2" : "mt-6 font-display text-lg font-bold text-navy"}>{s.text}</p>
        </Reveal>
      ))}
    </ol>
  );
}

/* ---------------- Values ---------------- */
export function ValuesGrid() {
  return (
    <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5" role="list">
      {about.values.map((v, i) => (
        <Reveal as="li" key={v.title} delay={i * 70} className="rounded-[var(--radius-card)] border border-white/15 bg-white/[0.06] p-6 transition-colors duration-300 hover:border-white/35 hover:bg-white/[0.1]">
          <span className="icon-tile bg-white/10 text-white">
            <Icon name={v.icon as IconName} />
          </span>
          <h3 className="mt-5 text-xl !text-white">{v.title}</h3>
          <p className="mt-2 text-white/80">{v.text}</p>
        </Reveal>
      ))}
    </ul>
  );
}

/* ---------------- Scrolling band of programme topics ---------------- */
export function SafetyMarquee() {
  const row = (copy: number) => (
    <ul className="marquee-row" role="list" aria-hidden={copy > 0 || undefined}>
      {safetyTopics.map((t) => (
        <li key={t.text} className="marquee-pill">
          <span className="icon-tile icon-tile-sm">
            <Icon name={t.icon} size={18} live />
          </span>
          {t.text}
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label="Topics covered in training" className="py-12 lg:py-16">
      <Reveal className="container-x">
        <p className="eyebrow">Covered in training</p>
      </Reveal>
      <div className="marquee mt-6">
        <div className="marquee-track">
          {row(0)}
          {row(1)}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Partners & cooperation ---------------- */
export function PartnersSection() {
  const s = partnersSection;
  const [lead, last] = s.headingLines;
  const plain = last.replace(s.accent, "");
  return (
    <section id="partners" aria-labelledby="partners-title" className="sky scroll-mt-24 py-20 lg:py-28">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <Reveal>
            <p className="eyebrow">{s.eyebrow}</p>
            <h2 id="partners-title" className="mt-5 text-[2.3rem] leading-[1.05] tracking-[-0.04em] sm:text-6xl">
              <span className="block">{lead}</span>
              <span className="block">
                {plain}
                <span className="text-blue">{s.accent}</span>
              </span>
            </h2>
          </Reveal>
          <Reveal delay={80} className="max-w-sm text-lg">
            {s.intro}
          </Reveal>
        </div>

        <ul className="mt-12 grid gap-5" role="list">
          {s.partners.map((p, i) => (
            <Reveal as="li" key={p.name} delay={i * 100} className="card card-hover group grid items-center gap-8 p-7 sm:p-10 lg:grid-cols-[auto_1fr_auto] lg:gap-12">
              <span className="relative grid h-36 w-36 place-items-center sm:h-44 sm:w-44" aria-hidden="true">
                <svg viewBox="0 0 100 100" className="spin-slow absolute inset-0 h-full w-full text-blue/40">
                  <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 3" />
                </svg>
                <span className="grid h-[82%] w-[82%] place-items-center rounded-full bg-blue-50 text-blue transition-colors duration-300 group-hover:bg-blue group-hover:text-white">
                  <Landmark size={56} strokeWidth={1.4} />
                </span>
              </span>
              <div>
                <p className="font-display text-xs font-bold tracking-[0.28em] text-body uppercase">{p.country}</p>
                <h3 className="mt-3 text-3xl font-bold sm:text-4xl">{p.name}</h3>
                <p className="mt-2 font-display text-lg font-semibold text-navy">{p.localName}</p>
                <p className="mt-4 max-w-2xl text-lg">{p.text}</p>
                {p.status === "pending" ? (
                  <p className="mt-6 inline-flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800">
                    <span className="relative flex h-2 w-2" aria-hidden="true">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-600" />
                    </span>
                    Agreement pending signature confirmation
                  </p>
                ) : (
                  <p className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800">
                    <BadgeCheck size={16} aria-hidden="true" />
                    Signed cooperation agreement
                  </p>
                )}
              </div>
              <div className="border-line lg:border-l lg:pl-12">
                <p className="font-display text-5xl font-extrabold tracking-tight text-blue">OGAAL</p>
                <p className="mt-3 font-display text-xs font-bold tracking-[0.2em] text-blue uppercase">
                  Institutional
                  <br />
                  cooperation
                </p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- FAQ list ---------------- */
export function FaqList({ items = faqs }: { items?: { q: string; a: string }[] }) {
  return <Accordion items={items} />;
}

/* ---------------- Closing call to action ---------------- */
export function ClosingCta({ heading, text, cta }: { heading: string; text: string; cta: { label: string; href: string } }) {
  return (
    <section aria-labelledby="closing-title" className="bg-white py-20 lg:py-24">
      <div className="container-x">
        <Reveal className="navy-panel on-dark relative overflow-hidden rounded-[2rem] px-6 py-14 text-center sm:px-12 lg:py-20">
          <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full text-white/10" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice">
            <ellipse cx="400" cy="150" rx="380" ry="110" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(-8 400 150)" />
            <ellipse cx="400" cy="150" rx="300" ry="80" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(6 400 150)" />
          </svg>
          <div className="relative">
            <h2 id="closing-title" className="mx-auto max-w-2xl text-3xl !text-white sm:text-5xl">
              {heading}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/80">{text}</p>
            <Link href={cta.href} className="btn btn-white mt-9">
              {cta.label}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

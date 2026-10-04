import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { about, faqs, programme, safetyTopics, training } from "@/content/site";
import { Accordion } from "./Accordion";
import { Icon, type IconName } from "./Icon";
import { Reveal } from "./Reveal";

type Training = (typeof training)[number];

/* ---------------- Training cards ---------------- */
export function TrainingCard({ t, index = 0, withId = false }: { t: Training; index?: number; withId?: boolean }) {
  return (
    <Reveal as="li" id={withId ? t.slug : undefined} delay={(index % 4) * 70} className="h-full scroll-mt-28">
      <div className="card card-hover group flex h-full flex-col p-7">
        <span className="icon-tile">
          <Icon name={t.icon as IconName} />
        </span>
        <h3 className="mt-6 text-xl">{t.title}</h3>
        <p className="mt-3 flex-1">{t.text}</p>
        <Link
          href={`/contact?type=Training&topic=${encodeURIComponent(t.title)}`}
          className="mt-6 inline-flex items-center gap-2 self-start font-display text-sm font-bold text-blue"
          aria-label={`Enquire about ${t.title}`}
        >
          Enquire
          <ArrowRight size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </Reveal>
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

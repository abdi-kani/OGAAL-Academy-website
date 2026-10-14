import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { about, faqs, programme, safetyTopics, training } from "@/content/site";
import { Accordion } from "./Accordion";
import { Icon, type IconName } from "./Icon";
import { Reveal } from "./Reveal";

type Training = (typeof training)[number];

/* ---------------- Training cards ---------------- */
export function TrainingCard({ t, index = 0, withId = false }: { t: Training; index?: number; withId?: boolean }) {
  return (
    <Reveal as="li" id={withId ? t.slug : undefined} delay={(index % 4) * 60} className="h-full scroll-mt-28">
      <div className="card card-hover flex h-full flex-col p-6">
        <span className="icon-tile icon-tile-lg">
          <Icon name={t.icon as IconName} size={30} />
        </span>
        <h3 className="mt-5 text-xl">{t.title}</h3>
        <p className="mt-2 flex-1">{t.text}</p>
        <Link
          href={`/contact?type=Training&topic=${encodeURIComponent(t.title)}`}
          className="mt-5 inline-flex items-center gap-1.5 self-start font-display text-sm font-bold text-blue hover:underline"
          aria-label={`Enquire about ${t.title}`}
        >
          Enquire
          <ArrowRight size={16} aria-hidden="true" className="nudge" />
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
    <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
      {main.map((t, i) => (
        <TrainingCard key={t.slug} t={t} index={i} withId />
      ))}
      <Reveal as="li" id={last.slug} className="scroll-mt-28 sm:col-span-2 lg:col-span-3">
        <div className="card card-hover flex flex-col gap-5 bg-light p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="icon-tile icon-tile-lg bg-white">
              <Icon name={last.icon as IconName} size={30} />
            </span>
            <div className="max-w-2xl">
              <h3 className="text-xl">{last.title}</h3>
              <p className="mt-1.5">{last.text}</p>
            </div>
          </div>
          <Link href="/contact?type=Organisational%20Training" className="btn btn-primary shrink-0 self-start md:self-center">
            Enquire for Your Team
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </Reveal>
    </ul>
  );
}

/* ---------------- Scrolling band of programme topics ---------------- */
export function SafetyMarquee() {
  const row = (copy: number) => (
    <ul className="marquee-row" role="list" aria-hidden={copy > 0 || undefined}>
      {safetyTopics.map((t) => (
        <li key={t.text} className="marquee-pill">
          <span className="icon-tile !h-9 !w-9 !rounded-full">
            <Icon name={t.icon} size={18} live />
          </span>
          {t.text}
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label="Topics covered in training" className="border-y border-line bg-light py-8">
      <Reveal className="container-x">
        <p className="eyebrow">Covered in training</p>
      </Reveal>
      <div className="marquee mt-4">
        <div className="marquee-track">
          {row(0)}
          {row(1)}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Two-day programme ---------------- */
export function ProgrammeDays() {
  return (
    <>
      <ol className="mt-10 grid gap-4 lg:grid-cols-2" role="list">
        {programme.days.map((d, i) => (
          <Reveal as="li" key={d.label} delay={i * 80} className="card p-6 sm:p-7">
            <div className="flex items-center gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue font-display text-base font-extrabold text-white">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="eyebrow">{d.label}</p>
                <h3 className="mt-0.5 text-xl">{d.title}</h3>
              </div>
            </div>
            <ul className="mt-6 grid gap-3 border-t border-line pt-6" role="list">
              {d.items.map((item) => (
                <li key={item.text} className="group flex items-center gap-3 rounded-lg text-navy">
                  <span className="icon-tile !h-10 !w-10" aria-hidden="true">
                    <Icon name={item.icon as IconName} size={20} />
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </ol>
      <Reveal className="card mt-4 flex flex-col gap-4 bg-light p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold text-navy">{programme.feeText}</p>
        <Link href={programme.cta.href} className="btn btn-primary shrink-0">
          {programme.cta.label}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </Reveal>
    </>
  );
}

/* ---------------- Values ---------------- */
export function ValuesGrid() {
  return (
    <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5" role="list">
      {about.values.map((v, i) => (
        <Reveal as="li" key={v.title} delay={i * 60} className="card card-hover p-6">
          <span className="icon-tile">
            <Icon name={v.icon as IconName} />
          </span>
          <h3 className="mt-5 text-lg">{v.title}</h3>
          <p className="mt-1.5 text-[0.98rem]">{v.text}</p>
        </Reveal>
      ))}
    </ul>
  );
}

/* ---------------- Training approach ---------------- */
export function ApproachList() {
  return (
    <ol className="grid gap-4" role="list">
      {about.approach.items.map((it, i) => (
        <Reveal as="li" key={it.title} delay={i * 50} className="card card-hover flex items-start gap-5 p-6">
          <span className="icon-tile">
            <Icon name={it.icon as IconName} />
          </span>
          <div>
            <p className="eyebrow">Step {i + 1}</p>
            <h3 className="mt-1 text-lg">{it.title}</h3>
            <p className="mt-1.5">{it.text}</p>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}

/* ---------------- FAQ list ---------------- */
export function FaqList({ items = faqs }: { items?: { q: string; a: string }[] }) {
  return <Accordion items={items} />;
}

/* ---------------- Closing call to action ---------------- */
export function ClosingCta({ heading, text, cta }: { heading: string; text: string; cta: { label: string; href: string } }) {
  return (
    <section aria-labelledby="closing-title" className="py-14 lg:py-20">
      <div className="container-x">
        <Reveal className="on-dark relative overflow-hidden rounded-[var(--radius-card)] bg-blue px-7 py-10 sm:px-10 lg:py-12">
          <svg aria-hidden="true" viewBox="0 0 200 200" className="spin-slow absolute top-1/2 -right-16 h-[26rem] w-[26rem] -translate-y-1/2 text-white/15">
            <circle cx="100" cy="100" r="98" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2 5" />
            <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="0.6" />
            <circle cx="100" cy="2" r="2.4" fill="currentColor" />
          </svg>
          <span aria-hidden="true" className="float-b absolute top-6 right-[22%] hidden h-14 w-14 place-items-center rounded-2xl bg-white/15 text-white lg:grid">
            <Icon name="pistol" size={28} live />
          </span>
          <span aria-hidden="true" className="float-c absolute right-[8%] bottom-6 hidden h-12 w-12 place-items-center rounded-2xl bg-white/15 text-white lg:grid">
            <Icon name="bullet" size={24} live />
          </span>
          <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 id="closing-title" className="text-3xl !text-white sm:text-4xl">
                {heading}
              </h2>
              <p className="mt-3 text-lg text-white/85">{text}</p>
            </div>
            <Link href={cta.href} className="group btn btn-white shrink-0 lg:mr-[26%]">
              {cta.label}
              <ArrowRight size={18} aria-hidden="true" className="nudge" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

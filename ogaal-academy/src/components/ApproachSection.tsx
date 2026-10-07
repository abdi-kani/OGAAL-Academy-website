import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { about, site } from "@/content/site";
import { Icon, type IconName } from "./Icon";
import { Reveal } from "./Reveal";

/**
 * "A clear path to responsible learning": a blue feature card with the official shield on a
 * podium, five numbered approach cards with glossy animated icons, and a navy call-to-action bar.
 */
export function ApproachSection() {
  const a = about.approach;
  const mark = site.logo.mark;
  const [f1, f2, f3] = a.feature;

  return (
    <section id="approach" aria-labelledby="approach-title" className="sky scroll-mt-24 overflow-hidden pt-20 lg:pt-28">
      <div className="container-x">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="font-display text-sm font-semibold tracking-[0.4em] text-body uppercase">{a.eyebrow}</p>
          <h2 id="approach-title" className="section-title mt-4 text-[2.4rem] leading-[1.05] sm:text-6xl">
            <span className="block">{a.headingLines[0]}</span>
            <span className="block text-blue">{a.headingLines[1]}</span>
          </h2>
          <p className="mt-5 text-lg sm:text-xl">{a.intro}</p>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-[1fr_2fr]">
          {/* feature card */}
          <Reveal className="relative flex min-h-[26rem] flex-col justify-between overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-[#1e63ff] via-[#0b4fe6] to-[#0636b8] p-8 shadow-[var(--shadow-lift)] sm:p-10">
            <div aria-hidden="true" className="breathe absolute top-[4%] right-[10%] left-[10%] h-[60%] rounded-full bg-[radial-gradient(circle,rgb(147_197_253/0.55),transparent_65%)] blur-2xl" />
            <div className="relative mx-auto w-[62%] max-w-[15rem]">
              <div className="logo-bob relative z-10 mx-auto w-[84%]">
                <Image src={mark.src} alt={site.logo.alt} width={mark.width} height={mark.height} sizes="220px" className="relative h-auto w-full drop-shadow-[0_18px_22px_rgb(3_28_92/0.55)]" />
                <span aria-hidden="true" className="logo-sheen absolute inset-0" style={{ maskImage: `url(${mark.src})`, WebkitMaskImage: `url(${mark.src})` }} />
              </div>
              <div aria-hidden="true" className="approach-podium relative -mt-[12%] h-12 w-full" />
            </div>
            <div className="relative mt-10">
              <p className="font-serif text-4xl leading-[1.08] font-semibold text-white sm:text-5xl">
                <span className="block">{f1}</span>
                <span className="block">{f2}</span>
                <span className="block text-[#8fb6ff]">{f3}</span>
              </p>
              <span className="mt-6 block h-[3px] w-10 rounded-full bg-[#8fb6ff]" aria-hidden="true" />
            </div>
          </Reveal>

          {/* numbered approach cards: two on top, three below */}
          <ol className="grid gap-5 sm:grid-cols-6" role="list">
            {a.items.map((it, i) => (
              <Reveal
                as="li"
                key={it.title}
                delay={i * 80}
                className={`card card-hover group relative flex flex-col overflow-hidden p-7 ${i < 2 ? "sm:col-span-3" : "sm:col-span-2"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span aria-hidden="true" className="font-serif text-6xl leading-none font-semibold text-blue-100 transition-colors duration-300 group-hover:text-blue/30">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span aria-hidden="true" className="icon-3d-big approach-icon transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-[-6deg]">
                    <Icon name={it.icon as IconName} size={i < 2 ? 46 : 40} strokeWidth={1.6} live />
                  </span>
                </div>
                <h3 className="mt-6 text-lg sm:text-xl">{it.title}</h3>
                <p className="mt-2">{it.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>

      {/* call-to-action bar */}
      <div className="navy-panel on-dark mt-16 lg:mt-20">
        <Reveal className="container-x flex flex-col gap-6 py-8 lg:flex-row lg:items-center lg:gap-12">
          <p className="font-serif text-2xl font-semibold text-white sm:text-3xl">
            {a.bar.lead} <span className="text-[#8fb6ff]">{a.bar.accent}</span>
          </p>
          <span aria-hidden="true" className="line-sweep hidden h-px flex-1 bg-white/20 lg:block" />
          <Link href={a.bar.cta.href} className="btn btn-primary shrink-0 self-start lg:self-center">
            {a.bar.cta.label}
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

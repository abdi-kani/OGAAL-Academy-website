"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { trainingTabs } from "@/content/site";
import { Icon } from "./Icon";
import { Reveal } from "./Reveal";

/** "Knowledge with a purpose": numbered topics on the left; hovering, focusing or clicking one shows its card. */
export function TrainingTabs() {
  const t = trainingTabs;
  const [active, setActive] = useState(0);
  const id = useId();
  const item = t.items[active];

  return (
    <section aria-labelledby={`${id}-title`} className="bg-light py-20 lg:py-28">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <Reveal>
            <p className="eyebrow">{t.eyebrow}</p>
            <h2 id={`${id}-title`} className="mt-5 text-[2.3rem] leading-[1.05] tracking-[-0.04em] sm:text-6xl">
              <span className="block">{t.headingLines[0]}</span>
              <span className="block text-blue">{t.headingLines[1]}</span>
            </h2>
          </Reveal>
          <Reveal delay={80} className="max-w-xs text-lg">
            {t.intro}
          </Reveal>
        </div>

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <Reveal>
            <div role="tablist" aria-label="Training areas" className="border-b border-line">
              {t.items.map((it, i) => {
                const on = i === active;
                return (
                  <button
                    key={it.title}
                    id={`${id}-tab-${i}`}
                    role="tab"
                    type="button"
                    aria-selected={on}
                    aria-controls={`${id}-panel`}
                    tabIndex={on ? 0 : -1}
                    onClick={() => setActive(i)}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onKeyDown={(e) => {
                      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
                      e.preventDefault();
                      const next = (i + (e.key === "ArrowDown" ? 1 : -1) + t.items.length) % t.items.length;
                      document.getElementById(`${id}-tab-${next}`)?.focus();
                    }}
                    className={`tab-row group relative flex w-full items-center gap-6 border-t border-line py-8 text-left ${on ? "is-on" : ""}`}
                  >
                    <span className={`w-8 font-display text-sm font-semibold ${on ? "text-blue" : "text-body"}`}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={`flex-1 font-display text-2xl font-semibold transition-colors duration-300 sm:text-[1.75rem] ${on ? "text-blue" : "text-body group-hover:text-navy"}`}>
                      {it.title}
                    </span>
                    <ArrowUpRight
                      size={28}
                      strokeWidth={1.5}
                      aria-hidden="true"
                      className={`transition-transform duration-300 ${on ? "translate-x-0.5 -translate-y-0.5 text-blue" : "text-body"}`}
                    />
                    <span aria-hidden="true" className="tab-line absolute -bottom-px left-0 h-[2px] w-full bg-blue" />
                  </button>
                );
              })}
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${active}`} className="card relative overflow-hidden p-8 sm:p-12">
              <div key={active} className="panel-in">
                <div className="flex items-start justify-between gap-6">
                  <p className="font-display text-xs font-bold tracking-[0.28em] text-blue uppercase">{item.eyebrow}</p>
                  <span className="icon-tile tile-pop-in h-16 w-16 rounded-2xl" aria-hidden="true">
                    <Icon name={item.icon} size={30} live />
                  </span>
                </div>
                <h3 className="mt-3 text-3xl font-semibold sm:text-4xl">{item.heading}</h3>
                <p className="mt-6 text-lg leading-relaxed">{item.text}</p>
                <Link
                  href={`/contact?type=Training&topic=${encodeURIComponent(item.title)}`}
                  className="group/link mt-10 inline-flex items-center gap-4 font-display font-bold text-navy"
                >
                  Ask about this training
                  <ArrowUpRight size={22} aria-hidden="true" className="text-blue transition-transform duration-300 group-hover/link:translate-x-1 group-hover/link:-translate-y-1" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-12">
          <Link href={t.cta.href} className="btn btn-outline">
            {t.cta.label}
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

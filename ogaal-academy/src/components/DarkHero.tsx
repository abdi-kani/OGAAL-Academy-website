import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

/**
 * Inner-page hero on the dark stage: eyebrow, large white heading ending in a blinking blue
 * square, intro, actions, and a visual on the right. Optional row of words along the bottom.
 */
export function DarkHero({
  id,
  eyebrow,
  headingLines,
  text,
  actions,
  visual,
  footer,
}: {
  id: string;
  eyebrow: ReactNode;
  headingLines: readonly string[];
  text: ReactNode;
  actions: ReactNode;
  visual: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="dark-stage on-dark relative overflow-hidden">
      <div aria-hidden="true" className="stage-grid pointer-events-none absolute inset-0" />
      <div className="container-x relative grid items-center gap-6 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16">
        <Reveal className="pb-4 lg:pb-16">
          <p className="flex items-center gap-4 font-display text-sm font-bold tracking-[0.18em] text-white/85 uppercase">{eyebrow}</p>
          <h1 id={id} className="mt-7 text-[3rem] leading-[0.95] tracking-[-0.045em] !text-white sm:text-7xl xl:text-[4.9rem]">
            {headingLines.map((l, i) => (
              <span key={l} className="block">
                {l}
                {i === headingLines.length - 1 && <span aria-hidden="true" className="blink-square ml-[0.06em] inline-block h-[0.16em] w-[0.16em] bg-blue" />}
              </span>
            ))}
          </h1>
          <div className="mt-7 max-w-md text-lg text-white/85 sm:text-xl">{text}</div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">{actions}</div>
        </Reveal>
        <Reveal delay={120} className={footer ? "" : "pb-10 lg:pb-0"}>
          {visual}
        </Reveal>
      </div>
      {footer && <div className="container-x relative">{footer}</div>}
    </section>
  );
}

"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { art, hero } from "@/content/site";
import { Icon } from "./Icon";

/** Static 3D artwork with two small floating HTML labels (gentle float, off for reduced motion). */
export function HeroArt() {
  const reduce = useReducedMotion();
  const float = (delay: number) =>
    reduce ? {} : { animate: { y: [0, -8, 0] }, transition: { duration: 6, repeat: Infinity, ease: "easeInOut" as const, delay } };

  return (
    <div className="relative mx-auto w-full max-w-[36rem]">
      <div aria-hidden="true" className="absolute inset-[8%] -z-10 rounded-full bg-[radial-gradient(circle,rgb(7_85_233/0.18),transparent_65%)] blur-2xl" />
      <Image
        src={art.hero.src}
        alt={art.hero.alt}
        width={art.hero.width}
        height={art.hero.height}
        priority
        fetchPriority="high"
        sizes="(min-width: 1024px) 560px, 92vw"
        className="relative h-auto w-full"
      />
      <motion.div
        {...float(0)}
        className="absolute top-[14%] left-0 hidden items-center sm:flex gap-3 rounded-2xl border border-white/80 bg-white/75 py-3 pr-5 pl-3 shadow-[var(--shadow-lift)] backdrop-blur-md sm:-left-4"
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-blue shadow-[var(--shadow-soft)]">
          <Icon name={hero.floatingLabels[0].icon} size={20} />
        </span>
        <span className="max-w-[8.5rem] font-display text-sm leading-tight font-bold text-navy">
          {hero.floatingLabels[0].text}
          <span className="mt-1.5 block h-[3px] w-6 rounded-full bg-blue" aria-hidden="true" />
        </span>
      </motion.div>
      <motion.div
        {...float(1.5)}
        className="absolute right-0 bottom-[30%] hidden items-center sm:flex gap-3 rounded-2xl border border-white/80 bg-white/75 py-3 pr-5 pl-3 shadow-[var(--shadow-lift)] backdrop-blur-md sm:-right-2"
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-blue shadow-[var(--shadow-soft)]">
          <Icon name={hero.floatingLabels[1].icon} size={20} />
        </span>
        <span className="max-w-[7.5rem] font-display text-sm leading-tight font-bold text-navy">
          {hero.floatingLabels[1].text}
          <span className="mt-1.5 block h-[3px] w-6 rounded-full bg-blue" aria-hidden="true" />
        </span>
      </motion.div>
      {/* On small screens the labels sit below the artwork so nothing overlaps */}
      <ul className="mt-2 flex flex-wrap justify-center gap-2 sm:hidden" role="list">
        {hero.floatingLabels.map((l) => (
          <li key={l.text} className="flex items-center gap-2 rounded-full border border-white bg-white/80 py-2 pr-4 pl-2 font-display text-sm font-bold text-navy shadow-[var(--shadow-soft)]">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-50 text-blue">
              <Icon name={l.icon} size={16} />
            </span>
            {l.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

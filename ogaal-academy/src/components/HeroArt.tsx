"use client";

import Image from "next/image";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { hero, site } from "@/content/site";
import { Icon } from "./Icon";

/**
 * The official OGAAL shield on a white medallion, with turning target rings, sonar
 * pulses, a light sheen and a gentle tilt that follows the pointer. Labels float
 * around it. All motion is off when the visitor prefers reduced motion.
 */
export function HeroArt() {
  const reduce = useReducedMotion();
  const mark = site.logo.mark;

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-12, 12]), { stiffness: 120, damping: 14 });
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [10, -10]), { stiffness: 120, damping: 14 });

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  const float = (delay: number) =>
    reduce ? {} : { animate: { y: [0, -8, 0] }, transition: { duration: 6, repeat: Infinity, ease: "easeInOut" as const, delay } };

  return (
    <div className="relative mx-auto w-full max-w-[36rem]">
      <div onPointerMove={onMove} onPointerLeave={onLeave} className="relative mx-auto aspect-square w-full [perspective:900px]">
        {/* glow */}
        <div aria-hidden="true" className="absolute inset-[12%] rounded-full bg-[radial-gradient(circle,rgb(7_85_233/0.22),transparent_65%)] blur-2xl" />

        {/* target rings: outer dashed ring turns one way, inner ring the other */}
        <svg aria-hidden="true" viewBox="0 0 200 200" className="spin-slow absolute inset-0 h-full w-full text-blue/30">
          <circle cx="100" cy="100" r="98" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="1.5 5" />
          <circle cx="100" cy="2" r="2.6" fill="currentColor" />
          <circle cx="198" cy="100" r="1.6" fill="currentColor" />
          <circle cx="30.7" cy="169.3" r="2" fill="currentColor" />
        </svg>
        <svg aria-hidden="true" viewBox="0 0 200 200" className="spin-slow-rev absolute inset-[9%] h-[82%] w-[82%] text-blue/25">
          <circle cx="100" cy="100" r="98" fill="none" stroke="currentColor" strokeWidth="0.7" />
          <path d="M100 0v10M100 190v10M0 100h10M190 100h10" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="169.3" cy="30.7" r="2.4" fill="#0755e9" />
        </svg>

        {/* sonar pulses from the centre */}
        <span aria-hidden="true" className="sonar absolute inset-[18%] rounded-full border-2 border-blue/40" />
        <span aria-hidden="true" className="sonar absolute inset-[18%] rounded-full border-2 border-blue/40 [animation-delay:1.6s]" />

        {/* medallion with the official shield */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.8, rotateY: -35 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
          className="absolute inset-[15%] [transform-style:preserve-3d]"
        >
          <motion.div
            style={reduce ? undefined : { rotateX, rotateY }}
            className="relative grid h-full w-full place-items-center rounded-full bg-gradient-to-b from-white to-[#eef3fd] shadow-[0_30px_60px_-24px_rgb(7_85_233/0.55),inset_0_2px_0_#fff] ring-1 ring-white"
          >
            <div className="logo-bob relative w-[60%]">
              <Image src={mark.src} alt={site.logo.alt} width={mark.width} height={mark.height} priority className="relative h-auto w-full drop-shadow-[0_14px_18px_rgb(8_27_58/0.22)]" sizes="240px" />
              {/* sheen clipped to the shield's shape */}
              <span
                aria-hidden="true"
                className="logo-sheen absolute inset-0"
                style={{ maskImage: `url(${mark.src})`, WebkitMaskImage: `url(${mark.src})` }}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        {...float(0)}
        className="absolute top-[4%] left-0 hidden items-center gap-3 rounded-2xl border border-white/80 bg-white/80 py-3 pr-5 pl-3 shadow-[var(--shadow-lift)] backdrop-blur-md sm:flex sm:-left-4"
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
        className="absolute bottom-[20%] right-0 hidden items-center gap-3 rounded-2xl border border-white/80 bg-white/80 py-3 pr-5 pl-3 shadow-[var(--shadow-lift)] backdrop-blur-md sm:flex sm:-right-4"
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-blue shadow-[var(--shadow-soft)]">
          <Icon name={hero.floatingLabels[1].icon} size={20} />
        </span>
        <span className="max-w-[7.5rem] font-display text-sm leading-tight font-bold text-navy">
          {hero.floatingLabels[1].text}
          <span className="mt-1.5 block h-[3px] w-6 rounded-full bg-blue" aria-hidden="true" />
        </span>
      </motion.div>
      <motion.div
        {...float(3)}
        className="absolute bottom-[2%] left-[2%] hidden items-center gap-3 rounded-2xl border border-white/80 bg-white/80 py-3 pr-5 pl-3 shadow-[var(--shadow-lift)] backdrop-blur-md sm:flex"
      >
        <span className="pulse-ring grid h-10 w-10 place-items-center rounded-full bg-blue text-white shadow-[var(--shadow-blue)]">
          <Icon name={hero.floatingLabels[2].icon} size={20} live />
        </span>
        <span className="max-w-[8.5rem] font-display text-sm leading-tight font-bold text-navy">
          {hero.floatingLabels[2].text}
          <span className="mt-1.5 block h-[3px] w-6 rounded-full bg-blue" aria-hidden="true" />
        </span>
      </motion.div>

      {/* On small screens the labels sit below the artwork so nothing overlaps */}
      <ul className="mt-2 flex flex-wrap justify-center gap-2 sm:hidden" role="list">
        {hero.floatingLabels.map((l) => (
          <li key={l.text} className="flex items-center gap-2 rounded-full border border-white bg-white/80 py-2 pr-4 pl-2 font-display text-sm font-bold text-navy shadow-[var(--shadow-soft)]">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-50 text-blue">
              <Icon name={l.icon} size={16} live />
            </span>
            {l.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

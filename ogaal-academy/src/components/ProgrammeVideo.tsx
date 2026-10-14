"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Pause, Play } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { programme } from "@/content/site";
import { Icon, type IconName } from "./Icon";
import { TrainingScene } from "./TrainingScene";

/**
 * "Video" of the two-day programme: an animated player that steps through each
 * programme item as a chapter. The scene is drawn in code (no video file), so it
 * loads instantly and stays sharp. Auto-plays, pauses on hover/focus, has real
 * play/pause and chapter buttons, and respects reduced motion.
 */
const CHAPTER_MS = 4200;

export function ProgrammeVideo() {
  const reduce = useReducedMotion();
  const chapters = programme.days.flatMap((d, di) => d.items.map((it) => ({ ...it, day: d.label, dayIndex: di })));
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hover, setHover] = useState(false);
  const [progress, setProgress] = useState(0);
  const start = useRef<number>(0);
  const raf = useRef<number>(0);

  const running = playing && !hover && !reduce;

  useEffect(() => {
    if (!running) {
      cancelAnimationFrame(raf.current);
      return;
    }
    start.current = performance.now() - progress * CHAPTER_MS;
    const tick = (now: number) => {
      const p = (now - start.current) / CHAPTER_MS;
      if (p >= 1) {
        setI((v) => (v + 1) % chapters.length);
        setProgress(0);
        start.current = now;
      } else {
        setProgress(p);
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, i, chapters.length]);

  const go = (n: number) => {
    setI(n);
    setProgress(0);
  };

  const c = chapters[i];

  return (
    <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
      {/* player */}
      <div
        className="group/player relative aspect-[3/2] overflow-hidden rounded-[var(--radius-card)] shadow-[0_30px_60px_-30px_rgb(7_85_233/0.8)] lg:aspect-auto lg:min-h-[32rem]"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        role="region"
        aria-label="Programme overview player"
      >
        <TrainingScene className="absolute inset-0 !rounded-none !shadow-none [&>svg]:h-full [&>svg]:w-full" />

        {/* chapter overlay */}
        <div key={i} className="chapter-in absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy via-navy/85 to-transparent px-5 pt-16 pb-14 sm:px-7 sm:pt-20">
          <p className="flex items-center gap-3 font-display text-xs font-bold tracking-[0.2em] text-[#8fb6ff] uppercase">
            <span className="rec-dot h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
            {c.day} · Chapter {i + 1} of {chapters.length}
          </p>
          <div className="mt-3 flex items-center gap-4">
            <span className="icon-tile icon-tile-lg !h-14 !w-14 shrink-0">
              <Icon name={c.icon as IconName} size={28} live />
            </span>
            <h3 className="text-lg !text-white sm:text-2xl">{c.text.replace(/\.$/, "")}</h3>
          </div>
        </div>

        {/* controls */}
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 px-5 pb-3 sm:px-7">
          <button
            type="button"
            onClick={() => setPlaying((v) => !v)}
            aria-label={playing ? "Pause" : "Play"}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-blue transition-transform hover:scale-105"
          >
            {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
          </button>
          <div className="flex flex-1 gap-1" aria-hidden="true">
            {chapters.map((_, n) => (
              <span key={n} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
                <span
                  className="block h-full rounded-full bg-[#8fb6ff]"
                  style={{ width: n < i ? "100%" : n === i ? `${progress * 100}%` : "0%", transition: n === i ? "none" : "width 0.3s" }}
                />
              </span>
            ))}
          </div>
          <span className="shrink-0 font-display text-xs font-bold text-white/70 tabular-nums">
            {String(i + 1).padStart(2, "0")} / {String(chapters.length).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* chapter list */}
      <div className="card flex flex-col p-5 sm:p-6">
        {programme.days.map((d, di) => (
          <div key={d.label} className={di > 0 ? "mt-5 border-t border-line pt-5" : ""}>
            <p className="flex items-center gap-3 font-display text-xs font-bold tracking-[0.2em] text-blue uppercase">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue text-[0.7rem] text-white">{String(di + 1).padStart(2, "0")}</span>
              {d.label} · {d.title}
            </p>
            <ol className="mt-3 grid gap-1.5" role="list">
              {d.items.map((it) => {
                const n = chapters.findIndex((x) => x.text === it.text);
                const on = n === i;
                return (
                  <li key={it.text}>
                    <button
                      type="button"
                      onClick={() => go(n)}
                      aria-current={on ? "true" : undefined}
                      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[0.95rem] transition-colors ${
                        on ? "bg-blue-50 font-semibold text-navy" : "text-body hover:bg-light hover:text-navy"
                      }`}
                    >
                      <span className={`icon-tile !h-8 !w-8 !rounded-lg ${on ? "" : "icon-tile-soft"}`}>
                        <Icon name={it.icon as IconName} size={16} />
                      </span>
                      <span className="flex-1">{it.text}</span>
                      {on && <Play size={12} fill="currentColor" className="text-blue" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
        <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5">
          <p className="text-sm font-semibold text-navy">{programme.feeText}</p>
          <Link href={programme.cta.href} className="group btn btn-primary">
            {programme.cta.label}
            <ArrowRight size={18} aria-hidden="true" className="nudge" />
          </Link>
        </div>
      </div>
    </div>
  );
}

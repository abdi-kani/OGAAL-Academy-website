import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

/** Serif section title with a blue accent word and a short blue rule, as in the reference design. */
export function SectionHeading({
  eyebrow,
  lead,
  accent,
  intro,
  align = "left",
  id,
  as: H = "h2",
}: {
  eyebrow?: string;
  lead: string;
  accent?: string;
  intro?: ReactNode;
  align?: "left" | "center";
  id?: string;
  as?: "h1" | "h2";
}) {
  const center = align === "center";
  return (
    <Reveal className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && <p className={`eyebrow ${center ? "eyebrow-plain" : ""}`}>{eyebrow}</p>}
      <H id={id} className={`section-title text-[2.1rem] sm:text-5xl ${eyebrow ? "mt-4" : ""}`}>
        {lead} {accent && <span className="accent">{accent}</span>}
      </H>
      <span className={`rule mt-5 ${center ? "mx-auto" : ""}`} aria-hidden="true" />
      {intro && <div className="mt-5 text-lg">{intro}</div>}
    </Reveal>
  );
}

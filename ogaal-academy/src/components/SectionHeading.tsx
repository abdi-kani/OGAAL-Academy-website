import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

/** Section title with a blue accent word, a short blue rule and an optional intro. */
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
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <H id={id} className={`text-3xl sm:text-4xl ${eyebrow ? "mt-4" : ""}`}>
        {lead} {accent && <span className="accent">{accent}</span>}
      </H>
      <span className={`rule mt-5 ${center ? "mx-auto" : ""}`} aria-hidden="true" />
      {intro && <div className="mt-5 text-lg">{intro}</div>}
    </Reveal>
  );
}

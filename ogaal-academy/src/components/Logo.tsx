import Image from "next/image";
import { site } from "@/content/site";

/**
 * Official OGAAL logo, used exactly as supplied (outer white background removed only).
 * - variant "header": the official shield mark on a white tile + the academy name set as live text
 * - variant "full": the complete official logo
 * `tone="dark"` sets the text colours for a navy background.
 */
export function Logo({
  variant = "header",
  tone = "light",
  className = "",
  priority = false,
}: {
  variant?: "header" | "full";
  tone?: "light" | "dark";
  className?: string;
  priority?: boolean;
}) {
  if (variant === "full") {
    const l = site.logo.full;
    return <Image src={l.src} alt={site.logo.alt} width={l.width} height={l.height} priority={priority} className={className} sizes="200px" />;
  }
  const m = site.logo.mark;
  const dark = tone === "dark";
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white shadow-[0_6px_16px_-8px_rgb(0_0_0/0.5)] lg:h-13 lg:w-13">
        <Image src={m.src} alt="" width={m.width} height={m.height} priority={priority} className="h-9 w-auto lg:h-10" sizes="48px" />
      </span>
      <span className="leading-none">
        <span className={`block font-display text-[1.5rem] font-extrabold tracking-tight lg:text-[1.7rem] ${dark ? "text-white" : "text-blue"}`}>OGAAL</span>
        <span
          className={`mt-1 block max-w-[13.5rem] font-display text-[0.6rem] leading-[1.25] font-extrabold tracking-[0.01em] uppercase lg:text-[0.66rem] ${dark ? "text-white/75" : "text-navy"}`}
        >
          Firearms Safety &amp; Responsibility Training Academy
        </span>
      </span>
    </span>
  );
}

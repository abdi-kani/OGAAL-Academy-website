import Image from "next/image";
import { site } from "@/content/site";

/**
 * Official OGAAL logo, used exactly as supplied (outer white background removed only).
 * - variant "header": the official shield mark + the academy name set as live text
 * - variant "full": the complete official logo
 */
export function Logo({ variant = "header", className = "", priority = false }: { variant?: "header" | "full"; className?: string; priority?: boolean }) {
  if (variant === "full") {
    const l = site.logo.full;
    return <Image src={l.src} alt={site.logo.alt} width={l.width} height={l.height} priority={priority} className={className} sizes="200px" />;
  }
  const m = site.logo.mark;
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <Image src={m.src} alt="" width={m.width} height={m.height} priority={priority} className="h-12 w-auto lg:h-14" sizes="64px" />
      <span className="leading-none">
        <span className="block font-display text-[1.55rem] font-extrabold tracking-tight text-blue lg:text-[1.75rem]">OGAAL</span>
        <span className="mt-1 block max-w-[13.5rem] font-display text-[0.62rem] leading-[1.25] font-extrabold tracking-[0.01em] text-navy uppercase lg:text-[0.68rem]">
          Firearms Safety &amp; Responsibility Training Academy
        </span>
      </span>
    </span>
  );
}

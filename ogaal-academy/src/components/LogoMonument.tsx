import Image from "next/image";
import { site } from "@/content/site";

/**
 * The official OGAAL shield standing on a dark stone plinth carved with the academy name,
 * lit by a blue light bar. Built in HTML/CSS so the name stays real text; the shield is the
 * official artwork, unchanged. Motion is CSS-only and stops for reduced motion.
 */
export function LogoMonument() {
  const mark = site.logo.mark;
  return (
    <div className="monument relative mx-auto aspect-[4/5] w-full max-w-[30rem] [container-type:inline-size]">
      {/* blue light bar and glow */}
      <span aria-hidden="true" className="beam absolute top-[2%] right-[3%] bottom-[14%] w-[3px] rounded-full" />
      <span aria-hidden="true" className="breathe absolute top-[2%] right-[14%] left-[14%] h-[55%] rounded-full bg-[radial-gradient(circle,rgb(37_99_235/0.55),transparent_65%)] blur-2xl" />

      {/* shield */}
      <div className="monument-rise absolute top-[3%] left-[24%] z-10 w-[52%]">
        <div className="relative">
          <Image
            src={mark.src}
            alt={site.logo.alt}
            width={mark.width}
            height={mark.height}
            priority
            sizes="(min-width: 1024px) 260px, 52vw"
            className="relative h-auto w-full drop-shadow-[0_0_28px_rgb(37_99_235/0.55)]"
          />
          <span aria-hidden="true" className="logo-sheen absolute inset-0" style={{ maskImage: `url(${mark.src})`, WebkitMaskImage: `url(${mark.src})` }} />
        </div>
      </div>

      {/* plinth with the carved name */}
      <div aria-hidden="true" className="plinth absolute top-[55%] right-[5%] bottom-[13%] left-[5%] flex flex-col items-center justify-center px-[4%] text-center">
        <span className="plinth-name font-display text-[17cqw] leading-none font-extrabold tracking-[-0.02em]">OGAAL</span>
        <span className="mt-[2.5cqw] font-display text-[4.3cqw] leading-tight font-bold tracking-[0.02em] text-[#d5dbe7] uppercase">
          Firearms Safety &amp;
          <br />
          Responsibility Training Academy
        </span>
        <span className="mt-[2.5cqw] flex w-[78%] items-center gap-[2cqw] text-blue">
          <span className="h-[2px] flex-1 bg-current" />
          <svg viewBox="0 0 24 24" className="h-[4.5cqw] w-[4.5cqw]" fill="currentColor">
            <path d="m12 2 2.9 6.9 7.1.6-5.4 4.7 1.7 7.3L12 17.6 5.7 21.5l1.7-7.3L2 9.5l7.1-.6z" />
          </svg>
          <span className="h-[2px] flex-1 bg-current" />
        </span>
      </div>
      <div aria-hidden="true" className="plinth-base absolute right-[1%] bottom-[9%] left-[1%] h-[4.5%]" />
      {/* floor reflection */}
      <div aria-hidden="true" className="absolute right-[-10%] bottom-0 left-[-10%] h-[12%] bg-[radial-gradient(ellipse_at_50%_0%,rgb(37_99_235/0.35),transparent_70%)]" />
    </div>
  );
}

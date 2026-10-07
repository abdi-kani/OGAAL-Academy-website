import Image from "next/image";
import { LockKeyhole } from "lucide-react";
import { site } from "@/content/site";

/**
 * The official OGAAL shield standing on a dark stone plinth carved with the academy name,
 * lit by a blue light bar. Built in HTML/CSS so the name stays real text; the shield is the
 * official artwork, unchanged. Motion is CSS-only and stops for reduced motion.
 */
export function LogoMonument({ props = false }: { props?: boolean }) {
  const mark = site.logo.mark;
  const monument = (
    <div className={`monument relative aspect-[4/5] [container-type:inline-size] ${props ? "w-[68%]" : "mx-auto w-full max-w-[30rem]"}`}>
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
  if (!props) return monument;

  return (
    <div className="relative mx-auto w-full max-w-[34rem] [container-type:inline-size]">
      {monument}
      {/* hard case with a padlock */}
      <div aria-hidden="true" className="safe-case monument-rise absolute right-[1%] bottom-[16%] z-20 aspect-[5/4] w-[31%] [animation-delay:0.25s]">
        <span className="absolute -top-[9%] left-1/2 h-[12%] w-[38%] -translate-x-1/2 rounded-t-[0.6rem] border-[0.9cqw] border-b-0 border-[#1b2231]" />
        <span className="absolute inset-x-[6%] top-[30%] h-px bg-white/10" />
        <span className="absolute inset-x-[6%] top-[70%] h-px bg-white/10" />
        <span className="absolute top-[22%] left-[10%] h-[18%] w-[9%] rounded-sm bg-[#2a3346]" />
        <span className="absolute top-[22%] right-[10%] h-[18%] w-[9%] rounded-sm bg-[#2a3346]" />
        <span className="absolute top-1/2 left-1/2 grid h-[34%] w-[26%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-md border border-white/20 bg-[#141a26] text-white/85">
          <LockKeyhole className="h-[55%] w-[55%]" strokeWidth={1.75} />
        </span>
      </div>
      {/* book */}
      <div aria-hidden="true" className="book-tilt absolute right-[6%] bottom-[3%] z-30 w-[21%]">
        <div className="book-cover monument-rise grid aspect-[4/5] place-items-center px-[10%] text-center [animation-delay:0.45s]">
          <span className="font-display text-[2.3cqw] leading-tight font-extrabold tracking-[0.04em] text-white uppercase italic">
            Firearm
            <br />
            Safety
            <br />
            Education
          </span>
        </div>
      </div>
    </div>
  );
}

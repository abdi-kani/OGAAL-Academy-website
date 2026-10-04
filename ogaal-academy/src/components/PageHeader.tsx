import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { art } from "@/content/site";
import { Reveal } from "./Reveal";

/** Inner-page hero: pale-blue atmosphere, breadcrumb, large heading, optional 3D icon. */
export function PageHeader({
  eyebrow,
  title,
  intro,
  crumb,
  icon = "shield",
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  crumb: string;
  icon?: keyof typeof art.icons;
}) {
  const a = art.icons[icon];
  return (
    <section className="sky relative overflow-hidden">
      <svg aria-hidden="true" className="pointer-events-none absolute top-0 right-0 h-full w-[60%] text-blue/10" viewBox="0 0 600 400" preserveAspectRatio="xMaxYMid slice">
        <circle cx="520" cy="200" r="260" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="520" cy="200" r="190" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="520" cy="200" r="120" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <div className="container-x relative grid items-center gap-10 py-14 sm:py-16 lg:grid-cols-[1fr_auto] lg:py-20">
        <div>
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm">
              <li>
                <Link href="/" className="font-medium hover:text-blue">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="font-semibold text-navy">
                {crumb}
              </li>
            </ol>
          </nav>
          <Reveal className="mt-8 max-w-3xl">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[3.6rem]">{title}</h1>
            {intro && <div className="mt-6 max-w-2xl text-lg sm:text-xl">{intro}</div>}
          </Reveal>
        </div>
        <Reveal delay={120} className="hidden lg:block">
          <div className="relative grid h-56 w-56 place-items-center rounded-[2.5rem] bg-white/70 shadow-[var(--shadow-lift)] ring-1 ring-white backdrop-blur">
            <Image src={a.src} alt="" width={a.width} height={a.height} className="h-auto max-h-36 w-auto max-w-40" sizes="160px" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

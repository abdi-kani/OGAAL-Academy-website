import type { ReactNode } from "react";
import Link from "next/link";
import { Icon, type IconName } from "./Icon";
import { Reveal } from "./Reveal";

/** Inner-page header: breadcrumb, eyebrow, heading and intro, with one large animated icon beside it. */
export function PageHeader({ eyebrow, title, intro, crumb, icon }: { eyebrow: string; title: ReactNode; intro?: ReactNode; crumb: string; icon: IconName }) {
  return (
    <section className="pattern-icons border-b border-line bg-light">
      <div className="container-x grid items-center gap-8 py-12 lg:grid-cols-[1fr_auto] lg:py-16">
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
            <h1 className="mt-4 text-4xl sm:text-5xl">{title}</h1>
            {intro && <div className="mt-5 max-w-2xl text-lg sm:text-xl">{intro}</div>}
          </Reveal>
        </div>
        <Reveal delay={100} className="hidden lg:block">
          <div className="relative grid h-48 w-48 place-items-center">
            <svg aria-hidden="true" viewBox="0 0 100 100" className="spin-slow absolute inset-0 h-full w-full text-blue/35">
              <circle cx="50" cy="50" r="49" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 5" />
              <circle cx="50" cy="1" r="1.8" fill="currentColor" />
            </svg>
            <span className="float-a pulse-rings grid h-36 w-36 place-items-center rounded-[2rem] border border-line bg-white text-blue" aria-hidden="true">
              <Icon name={icon} size={76} strokeWidth={1.25} live />
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

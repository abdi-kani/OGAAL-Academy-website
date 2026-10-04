"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Menu, X } from "lucide-react";
import { headerCta, nav } from "@/content/site";
import { Logo } from "./Logo";

export function Header() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mobile menu: Escape closes, focus moves in, Tab is kept inside, page scroll locked
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === "Tab" && panel) {
        const items = [toggleRef.current, ...Array.from(panel.querySelectorAll<HTMLElement>("a"))].filter(Boolean) as HTMLElement[];
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => panel?.querySelector<HTMLElement>("a")?.focus());
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-[background-color,box-shadow,border-color] duration-300 ${
        scrolled || open
          ? "border-line bg-white/85 shadow-[0_8px_30px_-18px_rgb(8_27_58/0.35)] backdrop-blur-xl"
          : "border-transparent bg-white/60 backdrop-blur-md"
      }`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-[60] focus:rounded-lg focus:bg-navy focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <div className="container-x flex h-20 items-center justify-between gap-6 lg:h-[5.5rem]">
        <Link href="/" aria-label="OGAAL Academy — home" className="shrink-0 rounded-lg">
          <Logo priority />
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1 xl:gap-3">
            {nav.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`nav-link relative block rounded-xl px-3.5 py-2 font-display text-[0.98rem] font-semibold transition-colors ${
                      active ? "text-blue" : "text-navy hover:text-blue"
                    }`}
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-3.5 -bottom-1 h-[3px] origin-center rounded-full bg-blue transition-transform duration-300 ${
                        active ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link href={headerCta.href} className="btn btn-primary btn-pill hidden !min-h-12 sm:inline-flex">
            {headerCta.label}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <button
            ref={toggleRef}
            type="button"
            className="inline-grid h-12 w-12 place-items-center rounded-full text-navy transition-colors hover:bg-blue-50 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="mobile-menu"
            ref={panelRef}
            key="menu"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: reduce ? 0 : 0.2, ease: "easeOut" }}
            className="border-t border-line bg-white lg:hidden"
          >
            <nav aria-label="Mobile" className="container-x max-h-[calc(100dvh-5rem)] overflow-y-auto py-3">
              <ul className="flex flex-col">
                {nav.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`flex min-h-14 items-center justify-between border-b border-line font-display text-lg font-bold ${
                          active ? "text-blue" : "text-navy"
                        }`}
                      >
                        {item.label}
                        {active && <span className="h-2 w-2 rounded-full bg-blue" aria-hidden="true" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <Link href={headerCta.href} className="btn btn-primary mt-5 mb-3 w-full">
                {headerCta.label}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Fades content up as it enters the viewport. Content is fully visible without JS
 * and when the visitor prefers reduced motion (see globals.css).
 */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className,
  ...rest
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
} & Omit<React.HTMLAttributes<HTMLElement>, "children" | "className">) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      el.dataset.visible = "true";
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.visible = "true";
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal=""
      className={className}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}

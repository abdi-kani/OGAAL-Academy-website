"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Plus } from "lucide-react";

type Item = { q: string; a: string };

/** Accessible accordion: real buttons with aria-expanded/aria-controls and labelled regions. */
export function Accordion({ items, defaultOpen = 0 }: { items: Item[]; defaultOpen?: number | null }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const reduce = useReducedMotion();
  const base = useId();

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        const btnId = `${base}-b${i}`;
        const panelId = `${base}-p${i}`;
        return (
          <div key={item.q} className={`card overflow-hidden ${isOpen ? "border-blue-100 shadow-[var(--shadow-lift)]" : ""}`}>
            <h3 className="font-display text-base">
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex min-h-16 w-full items-center justify-between gap-6 px-5 py-4 text-left text-[1.05rem] font-bold text-navy sm:px-7"
              >
                <span>{item.q}</span>
                <span
                  aria-hidden="true"
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all duration-300 ${
                    isOpen ? "rotate-45 bg-blue text-white" : "bg-blue-50 text-blue"
                  }`}
                >
                  <Plus size={18} />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  key="panel"
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: reduce ? 0 : 0.25, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-6 sm:px-7">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

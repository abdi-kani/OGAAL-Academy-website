"use client";

import { useState } from "react";

type Point = { month: string; label: string; value: number };

const niceMax = (n: number) => {
  if (n <= 4) return 4;
  const mag = 10 ** Math.floor(Math.log10(n));
  const step = [1, 2, 2.5, 5, 10].find((s) => n <= s * mag) ?? 10;
  return step * mag;
};

/** One series by month: thin rounded bars on one axis, a tooltip on hover or focus, and a table view. */
export function BarChart({ title, points, unit }: { title: string; points: Point[]; unit: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(...points.map((p) => p.value), 0));
  const total = points.reduce((s, p) => s + p.value, 0);
  return (
    <figure className="panel m-0 p-5">
      <figcaption>
        <h2>{title}</h2>
        <p className="text-xs">
          {total.toLocaleString("en-GB")} {unit} in this period
        </p>
      </figcaption>
      <div className="relative mt-4 flex h-44 pl-7" onMouseLeave={() => setHover(null)}>
        {[1, 0.5, 0].map((f) => (
          <div key={f} className="pointer-events-none absolute right-0 left-7 border-t border-line" style={{ top: `${(1 - f) * 100}%` }} aria-hidden="true">
            <span className="absolute top-0 -left-7 w-6 -translate-y-1/2 text-right text-[0.65rem] leading-none">{max * f}</span>
          </div>
        ))}
        {points.map((p, i) => (
          <div
            key={p.month}
            tabIndex={0}
            role="img"
            aria-label={`${p.label}: ${p.value} ${unit}`}
            className="chart-col relative flex h-full flex-1 items-end justify-center focus:outline-none"
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
          >
            {p.value > 0 && <div className="chart-bar w-[55%] max-w-6 rounded-t bg-blue" style={{ height: `${(p.value / max) * 100}%` }} />}
            {hover === i && (
              <div className={`pointer-events-none absolute bottom-full z-10 mb-1 rounded-md bg-navy px-2 py-1 text-xs font-medium whitespace-nowrap text-white ${i > points.length - 3 ? "right-0" : i < 2 ? "left-0" : ""}`}>
                {p.label}: {p.value.toLocaleString("en-GB")}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-1 flex pl-7" aria-hidden="true">
        {points.map((p, i) => (
          <span key={p.month} className="flex-1 text-center text-[0.65rem]">
            {i % 2 === 0 ? p.label : ""}
          </span>
        ))}
      </div>
      <details className="mt-3 text-xs">
        <summary className="cursor-pointer font-medium">View as table</summary>
        <table className="portal-table mt-2">
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">{unit}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.month}>
                <td>{p.label}</td>
                <td>{p.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

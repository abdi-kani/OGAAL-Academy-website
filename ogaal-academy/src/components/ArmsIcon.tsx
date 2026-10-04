import type { ReactNode, SVGProps } from "react";

/**
 * Firearm-safety outline icons drawn to match Lucide (24px grid, round caps).
 * Parts marked with `ai-*` classes animate in globals.css: once when the icon
 * scrolls into view, on hover, and on a loop when `live` is set.
 */
const arms = {
  /* Pistol: the slide racks back, as in a chamber check */
  pistol: (
    <>
      <path className="ai-slide" d="M3 6h17a1 1 0 0 1 1 1v2.5a1 1 0 0 1-1 1H3z" />
      <path d="M19 6V4.8" />
      <path d="M5 10.5 3.6 18.6a1 1 0 0 0 1 1.2h3a1 1 0 0 0 1-.8l1.1-5.5" />
      <path d="M9.8 10.5v1.6a1.9 1.9 0 0 0 1.9 1.9h1.4a1.9 1.9 0 0 0 1.9-1.9v-1.6" />
      <path d="M12 10.5v1.4" />
    </>
  ),
  /* Rifle: tilts as if being inspected */
  rifle: (
    <g className="ai-tilt">
      <path d="M14 8.6h8" />
      <path d="M21 8.6V7.3" />
      <path d="M7.5 7.6H14v3.4H7.5z" />
      <path d="M7.5 8.2 2 9.2v4.3l5.5-2.5" />
      <path d="m9.5 11-1 3.6h1.9l1-3.6" />
      <path d="m12 11 .7 3.2h1.7L14 11" />
    </g>
  ),
  /* Pistol with a padlock: the shackle drops shut */
  gunLock: (
    <>
      <path d="M2.5 3.5h11a1 1 0 0 1 1 1v1.6a1 1 0 0 1-1 1h-11z" />
      <path d="M3.8 7.1 2.8 12.6a.8.8 0 0 0 .8 1h1.8a.8.8 0 0 0 .8-.7l.7-4" />
      <path d="M7.3 7.1v.9a1.3 1.3 0 0 0 1.3 1.3h1" />
      <rect x="12.5" y="14.5" width="9" height="7" rx="1.6" />
      <path className="ai-shackle" d="M14.8 14.5v-2a2.2 2.2 0 0 1 4.4 0v2" />
      <path d="M17 17.3v1.4" />
    </>
  ),
  /* Gun safe: the combination dial turns */
  gunSafe: (
    <>
      <rect x="3" y="3" width="18" height="16" rx="2" />
      <rect x="5.8" y="5.8" width="12.4" height="10.4" rx="1" />
      <g className="ai-dial">
        <circle cx="11" cy="11" r="2.6" />
        <path d="M11 8.4v1.2" />
      </g>
      <path d="M15.6 9.2v3.6" />
      <path d="M6 19v2M18 19v2" />
    </>
  ),
  /* Target: rings ripple in towards a centre that pops */
  target: (
    <>
      <circle className="ai-ring ai-ring-1" cx="12" cy="12" r="9" />
      <circle className="ai-ring ai-ring-2" cx="12" cy="12" r="5.5" />
      <circle className="ai-dot" cx="12" cy="12" r="1.6" fill="currentColor" />
      <path d="M12 1v3.2M12 19.8V23M1 12h3.2M19.8 12H23" />
    </>
  ),
  /* Hearing protection: the cups press in */
  earProtection: (
    <>
      <path d="M5 12a7 7 0 0 1 14 0" />
      <rect className="ai-cup ai-cup-l" x="2.5" y="11" width="4.5" height="8.5" rx="2.2" />
      <rect className="ai-cup ai-cup-r" x="17" y="11" width="4.5" height="8.5" rx="2.2" />
    </>
  ),
  /* Safety glasses: a glint sweeps across the lenses */
  safetyGlasses: (
    <>
      <path d="M1.5 9.5h21" />
      <path d="M2.5 9.5v3.2A3.3 3.3 0 0 0 5.8 16h2a3.3 3.3 0 0 0 3.1-2.2l1.1-1.4 1.1 1.4a3.3 3.3 0 0 0 3.1 2.2h2a3.3 3.3 0 0 0 3.3-3.3V9.5" />
      <path className="ai-glint" d="m5 13.4 2.6-2.6" />
      <path className="ai-glint ai-glint-2" d="m15 13.4 2.6-2.6" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type ArmsIconName = keyof typeof arms;

export const armsIconNames = Object.keys(arms) as ArmsIconName[];

export function isArmsIcon(name: string): name is ArmsIconName {
  return name in arms;
}

export function ArmsIcon({
  name,
  size = 24,
  strokeWidth = 1.75,
  live = false,
  className,
  ...props
}: { name: ArmsIconName; size?: number | string; strokeWidth?: number | string; live?: boolean } & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={["ai", live && "ai-live", className].filter(Boolean).join(" ")}
      {...props}
    >
      {arms[name]}
    </svg>
  );
}

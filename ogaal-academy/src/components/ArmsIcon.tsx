import type { ReactNode, SVGProps } from "react";

/**
 * Firearm-safety line icons (24px grid, round caps), drawn to sit beside Lucide.
 * Parts with `ai-*` classes animate (see globals.css): once when the icon scrolls into
 * view, while its card is hovered, and on a loop when `live` is set.
 */
const arms = {
  /* A single cartridge: rises slightly */
  bullet: (
    <g className="ai-rise">
      <path d="M12 2.5c-2 2-3.2 4.6-3.2 7.6v1.9h6.4v-1.9c0-3-1.2-5.6-3.2-7.6z" />
      <rect x="8.8" y="12" width="6.4" height="8.5" rx="1" />
      <path d="M8.8 17h6.4" />
    </g>
  ),
  /* Three cartridges: rise one after another */
  bullets: (
    <>
      <g className="ai-b1">
        <path d="M6 3.5c-1.2 1.3-1.9 2.9-1.9 4.8V10h3.8V8.3c0-1.9-.7-3.5-1.9-4.8z" />
        <rect x="4.1" y="10" width="3.8" height="10" rx=".7" />
      </g>
      <g className="ai-b2">
        <path d="M12 3.5c-1.2 1.3-1.9 2.9-1.9 4.8V10h3.8V8.3c0-1.9-.7-3.5-1.9-4.8z" />
        <rect x="10.1" y="10" width="3.8" height="10" rx=".7" />
      </g>
      <g className="ai-b3">
        <path d="M18 3.5c-1.2 1.3-1.9 2.9-1.9 4.8V10h3.8V8.3c0-1.9-.7-3.5-1.9-4.8z" />
        <rect x="16.1" y="10" width="3.8" height="10" rx=".7" />
      </g>
    </>
  ),
  /* Pistol: the slide racks back */
  pistol: (
    <>
      <path className="ai-slide" d="M3 6.5h17a1 1 0 0 1 1 1V10a1 1 0 0 1-1 1H3z" />
      <path d="M19 6.5V5.3" />
      <path d="M5 11 3.6 19a1 1 0 0 0 1 1.2h3a1 1 0 0 0 1-.8L9.7 14" />
      <path d="M9.8 11v1.6a1.9 1.9 0 0 0 1.9 1.9h1.4a1.9 1.9 0 0 0 1.9-1.9V11" />
      <path d="M12 11v1.4" />
    </>
  ),
  /* Pistol with a padlock: the shackle drops shut */
  pistolLock: (
    <>
      <path d="M2.5 4h11a1 1 0 0 1 1 1v1.6a1 1 0 0 1-1 1h-11z" />
      <path d="M3.8 7.6 2.8 13a.8.8 0 0 0 .8 1h1.8a.8.8 0 0 0 .8-.7l.7-3.9" />
      <path d="M7.3 7.6v.9a1.3 1.3 0 0 0 1.3 1.3h1" />
      <rect x="12.5" y="14.5" width="9" height="7" rx="1.6" />
      <path className="ai-shackle" d="M14.8 14.5v-2a2.2 2.2 0 0 1 4.4 0v2" />
      <path d="M17 17.3v1.4" />
    </>
  ),
  /* Cartridge with a tick: the tick draws itself */
  bulletCheck: (
    <>
      <path d="M9 2.5C7 4.5 5.8 7.1 5.8 10.1V12h6.4v-1.9c0-3-1.2-5.6-3.2-7.6z" />
      <path d="M5.8 12v7.5a1 1 0 0 0 1 1h3.4" />
      <path d="M5.8 17h4.4" />
      <circle className="ai-ring" cx="17.5" cy="17.5" r="4.5" />
      <path className="ai-tick" d="m15.6 17.6 1.3 1.3 2.5-2.7" />
    </>
  ),
  /* Target: rings settle in, centre pops */
  target: (
    <>
      <circle className="ai-ring" cx="12" cy="12" r="9" />
      <circle className="ai-ring ai-ring-2" cx="12" cy="12" r="5" />
      <circle className="ai-dot" cx="12" cy="12" r="1.3" fill="currentColor" />
      <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" />
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
} satisfies Record<string, ReactNode>;

export type ArmsIconName = keyof typeof arms;

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

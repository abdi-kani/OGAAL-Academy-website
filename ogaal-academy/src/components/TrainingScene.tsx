/**
 * Animated training illustration: an instructor at a board with a safety-rules
 * diagram, a row of learners, a target that pulses, and a pistol with a slide that
 * racks. All CSS/SVG, loops forever, stops for reduced motion.
 */
export function TrainingScene({ className = "" }: { className?: string }) {
  return (
    <div className={`scene relative overflow-hidden rounded-[var(--radius-card)] ${className}`} aria-hidden="true">
      <svg viewBox="0 0 480 320" preserveAspectRatio="xMidYMid slice" className="h-auto w-full" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* background rings */}
        <g className="scene-spin text-white/15" style={{ transformOrigin: "360px 150px" }}>
          <circle cx="360" cy="150" r="120" strokeDasharray="3 7" strokeWidth="1" />
        </g>
        {/* floor */}
        <path d="M30 290h420" className="text-white/20" />

        {/* board */}
        <g className="text-white">
          <rect x="60" y="60" width="210" height="130" rx="8" fill="rgb(255 255 255 / 0.08)" />
          <path d="M165 190v40M140 230h50" />
          {/* drawn lines on the board */}
          <path className="scene-draw" d="M85 90h110" />
          <path className="scene-draw scene-draw-2" d="M85 115h150" />
          <path className="scene-draw scene-draw-3" d="M85 140h90" />
          {/* target drawn on the board */}
          <g className="text-[#8fb6ff]">
            <circle cx="232" cy="155" r="20" className="scene-ring" />
            <circle cx="232" cy="155" r="10" className="scene-ring scene-ring-2" />
            <circle cx="232" cy="155" r="2.5" fill="currentColor" className="scene-dot" />
          </g>
        </g>

        {/* instructor */}
        <g className="scene-instructor text-white" style={{ transformOrigin: "300px 240px" }}>
          <circle cx="300" cy="150" r="16" />
          <path d="M300 166v60M300 185l-26 22M300 185l30 -18M300 226l-16 54M300 226l16 54" />
          {/* pointer */}
          <path className="scene-pointer" d="M330 167l22-10" style={{ transformOrigin: "330px 167px" }} />
        </g>

        {/* learners */}
        {[380, 420, 460].map((x, i) => (
          <g key={x} className={`scene-learner text-white/85 scene-learner-${i + 1}`} style={{ transformOrigin: `${x - 20}px 280px` }}>
            <circle cx={x - 20} cy="215" r="12" />
            <path d={`M${x - 20} 227v30M${x - 20} 240l-14 12M${x - 20} 240l14 12M${x - 20} 257l-10 23M${x - 20} 257l10 23`} />
          </g>
        ))}

        {/* table with pistol (slide racks) and cartridges */}
        <g className="text-white">
          <path d="M50 262h120M60 262v28M160 262v28" />
          <g transform="translate(72 234) scale(1.4)">
            <path className="scene-slide" d="M3 6.5h17a1 1 0 0 1 1 1V10a1 1 0 0 1-1 1H3z" style={{ transformOrigin: "12px 8px" }} />
            <path d="M19 6.5V5.3M5 11 3.6 19a1 1 0 0 0 1 1.2h3a1 1 0 0 0 1-.8L9.7 14M9.8 11v1.6a1.9 1.9 0 0 0 1.9 1.9h1.4a1.9 1.9 0 0 0 1.9-1.9V11M12 11v1.4" />
          </g>
          <g className="text-[#8fb6ff]" transform="translate(128 236) scale(1.1)">
            <path d="M6 3.5c-1.2 1.3-1.9 2.9-1.9 4.8V10h3.8V8.3c0-1.9-.7-3.5-1.9-4.8z" />
            <rect x="4.1" y="10" width="3.8" height="10" rx=".7" />
            <path d="M14 3.5c-1.2 1.3-1.9 2.9-1.9 4.8V10h3.8V8.3c0-1.9-.7-3.5-1.9-4.8z" />
            <rect x="12.1" y="10" width="3.8" height="10" rx=".7" />
          </g>
        </g>

        {/* caption chips */}
        <g className="scene-chip" style={{ transformOrigin: "100px 36px" }}>
          <rect x="40" y="22" width="130" height="28" rx="14" fill="rgb(255 255 255 / 0.12)" stroke="rgb(255 255 255 / 0.25)" strokeWidth="1" />
          <text x="105" y="41" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700" fontFamily="Manrope Variable, Manrope, sans-serif" stroke="none">
            Classroom learning
          </text>
        </g>
        <g className="scene-chip scene-chip-2" style={{ transformOrigin: "400px 36px" }}>
          <rect x="320" y="22" width="130" height="28" rx="14" fill="rgb(255 255 255 / 0.12)" stroke="rgb(255 255 255 / 0.25)" strokeWidth="1" />
          <text x="385" y="41" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700" fontFamily="Manrope Variable, Manrope, sans-serif" stroke="none">
            Supervised practice
          </text>
        </g>
      </svg>
    </div>
  );
}

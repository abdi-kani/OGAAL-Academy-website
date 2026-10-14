import { hero } from "@/content/site";
import { Icon } from "./Icon";
import { Reveal } from "./Reveal";

/** Four floating tiles beside the home hero text, with looping icons, turning rings and sonar pulses behind. */
export function HeroTiles() {
  const floats = ["float-a", "float-b", "float-c", "float-d"];
  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* rings and pulses behind the tiles */}
      <svg aria-hidden="true" viewBox="0 0 200 200" className="spin-slow absolute inset-[-8%] h-[116%] w-[116%] text-blue/30">
        <circle cx="100" cy="100" r="98" fill="none" stroke="currentColor" strokeWidth="0.7" strokeDasharray="2 6" />
        <circle cx="100" cy="2" r="2.6" fill="currentColor" />
        <circle cx="198" cy="100" r="1.8" fill="currentColor" />
      </svg>
      <svg aria-hidden="true" viewBox="0 0 200 200" className="spin-slow-rev absolute inset-[2%] h-[96%] w-[96%] text-blue/20">
        <circle cx="100" cy="100" r="98" fill="none" stroke="currentColor" strokeWidth="0.8" />
        <circle cx="30.7" cy="169.3" r="2.2" fill="#0755e9" />
      </svg>
      <span aria-hidden="true" className="sonar absolute inset-[28%] rounded-full border-2 border-blue/30" />
      <span aria-hidden="true" className="sonar absolute inset-[28%] rounded-full border-2 border-blue/30 [animation-delay:1.6s]" />

      <ul className="relative grid grid-cols-2 gap-4" role="list">
        {hero.tiles.map((t, i) => (
          <Reveal as="li" key={t.text} delay={120 + i * 70} className={floats[i]}>
            <div className="card card-hover flex aspect-square flex-col items-center justify-center gap-4 p-5 text-center">
              <span className="icon-tile icon-tile-lg h-20 w-20 rounded-[1.25rem]" aria-hidden="true">
                <Icon name={t.icon} size={40} strokeWidth={1.5} live />
              </span>
              <span className="font-display font-bold text-navy">{t.text}</span>
            </div>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}

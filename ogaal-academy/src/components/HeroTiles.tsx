import { hero } from "@/content/site";
import { Icon } from "./Icon";
import { Reveal } from "./Reveal";

/** Four plain tiles beside the home hero text, one line icon and label each. */
export function HeroTiles() {
  return (
    <ul className="grid grid-cols-2 gap-4" role="list">
      {hero.tiles.map((t, i) => (
        <Reveal as="li" key={t.text} delay={120 + i * 70} className="card flex aspect-square flex-col items-center justify-center gap-4 p-5 text-center">
          <span className="icon-tile icon-tile-lg h-20 w-20 rounded-[1.25rem]" aria-hidden="true">
            <Icon name={t.icon} size={40} strokeWidth={1.5} />
          </span>
          <span className="font-display font-bold text-navy">{t.text}</span>
        </Reveal>
      ))}
    </ul>
  );
}

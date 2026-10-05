import Image from "next/image";
import { art, site } from "@/content/site";
import { Icon } from "./Icon";

/**
 * About hero: the official shield standing on the 3D book over a glass podium,
 * with floating glass tiles around it. Motion is CSS-only and stops for reduced motion.
 */
export function AboutHeroArt() {
  const mark = site.logo.mark;
  const book = art.icons.book;
  const shield = art.icons.shield;
  const people = art.icons.people;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[34rem]">
      <div aria-hidden="true" className="absolute inset-[10%] rounded-full bg-[radial-gradient(circle,rgb(7_85_233/0.2),transparent_65%)] blur-2xl" />
      <svg aria-hidden="true" viewBox="0 0 200 200" className="spin-slow absolute inset-0 h-full w-full text-blue/25">
        <circle cx="100" cy="100" r="98" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="1.5 5" />
        <circle cx="100" cy="2" r="2.4" fill="currentColor" />
        <circle cx="30.7" cy="169.3" r="1.8" fill="currentColor" />
      </svg>

      {/* glass podium */}
      <div aria-hidden="true" className="podium absolute right-[6%] bottom-[8%] left-[6%] h-[22%]" />
      <div aria-hidden="true" className="podium absolute right-[16%] bottom-[16%] left-[16%] h-[14%] opacity-90" />

      {/* book */}
      <Image
        src={book.src}
        alt=""
        width={book.width}
        height={book.height}
        priority
        sizes="(min-width: 1024px) 380px, 70vw"
        className="absolute bottom-[17%] left-1/2 h-auto w-[66%] -translate-x-1/2 drop-shadow-[0_18px_20px_rgb(7_85_233/0.3)]"
      />

      {/* official shield standing on the book */}
      <div className="logo-bob absolute top-[9%] left-1/2 w-[40%] -translate-x-1/2">
        <div className="relative">
          <Image
            src={mark.src}
            alt={site.logo.alt}
            width={mark.width}
            height={mark.height}
            priority
            sizes="240px"
            className="relative h-auto w-full drop-shadow-[0_20px_22px_rgb(8_27_58/0.28)]"
          />
          <span aria-hidden="true" className="logo-sheen absolute inset-0" style={{ maskImage: `url(${mark.src})`, WebkitMaskImage: `url(${mark.src})` }} />
        </div>
      </div>

      {/* floating tiles */}
      <span aria-hidden="true" className="glass-tile float-a absolute top-[16%] left-[4%]">
        <Icon name="graduation" size={30} />
      </span>
      <span aria-hidden="true" className="glass-tile float-b absolute top-[44%] left-[0%]">
        <Image src={people.src} alt="" width={people.width} height={people.height} className="h-auto w-[3rem]" sizes="48px" />
      </span>
      <span aria-hidden="true" className="glass-tile float-c absolute top-[8%] right-[4%]">
        <Icon name="award" size={30} />
      </span>
      <span aria-hidden="true" className="glass-tile float-d absolute top-[38%] right-[0%]">
        <Image src={shield.src} alt="" width={shield.width} height={shield.height} className="h-auto w-[2.3rem]" sizes="40px" />
      </span>
    </div>
  );
}

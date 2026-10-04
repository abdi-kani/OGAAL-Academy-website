import Image from "next/image";
import { Camera } from "lucide-react";

type Photo = { src: string | null; alt: string; brief: string };

/** Licensed photo when `src` is set; otherwise a clearly labelled placeholder in the site palette. */
export function PhotoPanel({ photo, className = "", sizes = "(min-width: 1024px) 50vw, 100vw" }: { photo: Photo; className?: string; sizes?: string }) {
  if (photo.src) {
    return (
      <div className={`relative overflow-hidden rounded-[1.75rem] bg-light shadow-[var(--shadow-lift)] ${className}`}>
        <Image src={photo.src} alt={photo.alt} fill sizes={sizes} className="object-cover" loading="lazy" />
      </div>
    );
  }
  return (
    <figure
      className={`relative isolate grid place-items-center overflow-hidden rounded-[1.75rem] border border-line bg-gradient-to-br from-white via-blue-50 to-blue-100 ${className}`}
      aria-label={`Photograph to be supplied: ${photo.alt}`}
    >
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full text-blue/10" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        <circle cx="330" cy="40" r="140" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="330" cy="40" r="90" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="40" cy="300" r="120" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <figcaption className="relative flex max-w-xs flex-col items-center gap-3 px-6 text-center">
        <span className="icon-tile bg-white shadow-[var(--shadow-soft)]">
          <Camera size={22} aria-hidden="true" strokeWidth={1.75} />
        </span>
        <span className="text-xs font-bold tracking-[0.18em] text-blue uppercase">Licensed photo to be supplied</span>
        <span className="text-sm text-body">{photo.alt}</span>
      </figcaption>
    </figure>
  );
}

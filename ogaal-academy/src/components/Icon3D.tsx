import Image from "next/image";
import { art } from "@/content/site";

/** Small blue 3D icon (pre-rendered static image) in a soft raised tile. */
export function Icon3D({ name }: { name: keyof typeof art.icons }) {
  const a = art.icons[name];
  return (
    <span className="icon-3d" aria-hidden="true">
      <Image src={a.src} alt="" width={a.width} height={a.height} className="h-auto max-h-[3.4rem] w-auto max-w-[3.6rem]" sizes="64px" />
    </span>
  );
}

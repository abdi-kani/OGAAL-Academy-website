import Link from "next/link";
import { site } from "@/content/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="panel w-full max-w-sm p-7">
        <Link href="/" className="mb-5 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={site.logo.mark.src} alt={site.logo.alt} className="mx-auto h-16 w-auto" />
        </Link>
        {children}
      </div>
    </main>
  );
}

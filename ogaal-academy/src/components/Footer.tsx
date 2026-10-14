import Link from "next/link";
import { ArrowRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { contact, footerNav, site } from "@/content/site";
import { CurrentYear } from "./CurrentYear";
import { Icon } from "./Icon";
import { Logo } from "./Logo";

export function Footer() {
  const email = contact.email.confirmed ? contact.email.address : null;
  return (
    <footer className="navy-panel on-dark pattern-icons pattern-icons-dark">
      <div className="container-x grid gap-12 py-16 md:grid-cols-[1.3fr_1fr_1fr] lg:py-20">
        <div>
          <Link href="/" aria-label="OGAAL Academy — home" className="inline-block rounded-2xl bg-white p-4">
            <Logo variant="full" className="h-auto w-32" />
          </Link>
          <p className="mt-6 max-w-sm font-display font-bold text-white">{site.fullName}</p>
          <p className="mt-2 font-display font-semibold text-[#8fb6ff]">{site.tagline}</p>
          <ul className="mt-6 flex gap-2" role="list" aria-label="Training themes">
            {(["pistol", "bullets", "target", "bulletCheck"] as const).map((n) => (
              <li key={n} className="icon-tile !h-10 !w-10" aria-hidden="true">
                <Icon name={n} size={20} />
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label="Footer">
          <h2 className="font-display text-xs font-bold tracking-[0.2em] text-[#8fb6ff] uppercase">Explore</h2>
          <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-1">
            {footerNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
            {site.privacyPolicyHref && (
              <li>
                <Link href={site.privacyPolicyHref} className="transition-colors hover:text-white">
                  Privacy Policy
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div>
          <h2 className="font-display text-xs font-bold tracking-[0.2em] text-[#8fb6ff] uppercase">Contact</h2>
          <ul className="mt-5 space-y-3">
            <li className="flex items-start gap-3">
              <MapPin size={18} aria-hidden="true" className="mt-1 shrink-0 text-[#8fb6ff]" />
              <span>{contact.streetAddress ? `${contact.streetAddress}, ${site.location.label}` : site.location.label}</span>
            </li>
            {contact.phone && (
              <li className="flex items-start gap-3">
                <Phone size={18} aria-hidden="true" className="mt-1 shrink-0 text-[#8fb6ff]" />
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="hover:text-white">
                  {contact.phone}
                </a>
              </li>
            )}
            {email && (
              <li className="flex items-start gap-3">
                <Mail size={18} aria-hidden="true" className="mt-1 shrink-0 text-[#8fb6ff]" />
                <a href={`mailto:${email}`} className="hover:text-white">
                  {email}
                </a>
              </li>
            )}
            {contact.openingHours && (
              <li className="flex items-start gap-3">
                <Clock size={18} aria-hidden="true" className="mt-1 shrink-0 text-[#8fb6ff]" />
                <span>{contact.openingHours}</span>
              </li>
            )}
            {contact.social.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  {s.platform}: {s.handle}
                </a>
              </li>
            ))}
          </ul>
          <Link href="/contact" className="group btn btn-primary mt-7">
            Enquire Now
            <ArrowRight size={18} aria-hidden="true" className="nudge" />
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-6 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <CurrentYear /> OGAAL Academy. All rights reserved.
          </p>
          <p>{site.location.label}</p>
        </div>
      </div>
    </footer>
  );
}

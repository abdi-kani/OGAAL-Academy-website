import Link from "next/link";
import { MapPin, Mail, Phone, Clock } from "lucide-react";
import { contact, footerNav, site } from "@/content/site";
import { Logo } from "./Logo";
import { CurrentYear } from "./CurrentYear";

export function Footer() {
  const email = contact.email.confirmed ? contact.email.address : null;
  return (
    <footer className="border-t border-line bg-light">
      <div className="container-x grid gap-12 py-16 md:grid-cols-[1.3fr_1fr_1fr] lg:py-20">
        <div>
          <Link href="/" aria-label="OGAAL Academy — home" className="inline-block rounded-lg">
            <Logo variant="full" className="h-auto w-36" />
          </Link>
          <p className="mt-6 max-w-sm font-display font-bold text-navy">{site.fullName}</p>
          <p className="mt-2 font-display font-semibold text-blue">{site.tagline}</p>
        </div>

        <nav aria-label="Footer">
          <h2 className="font-display text-xs font-bold tracking-[0.2em] text-navy uppercase">Explore</h2>
          <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-1">
            {footerNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-blue">
                  {item.label}
                </Link>
              </li>
            ))}
            {site.privacyPolicyHref && (
              <li>
                <Link href={site.privacyPolicyHref} className="transition-colors hover:text-blue">
                  Privacy Policy
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div>
          <h2 className="font-display text-xs font-bold tracking-[0.2em] text-navy uppercase">Contact</h2>
          <ul className="mt-5 space-y-3">
            <li className="flex items-start gap-3">
              <MapPin size={18} aria-hidden="true" className="mt-1 shrink-0 text-blue" />
              <span>{contact.streetAddress ? `${contact.streetAddress}, ${site.location.label}` : site.location.label}</span>
            </li>
            {contact.phone && (
              <li className="flex items-start gap-3">
                <Phone size={18} aria-hidden="true" className="mt-1 shrink-0 text-blue" />
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="hover:text-blue">{contact.phone}</a>
              </li>
            )}
            {email && (
              <li className="flex items-start gap-3">
                <Mail size={18} aria-hidden="true" className="mt-1 shrink-0 text-blue" />
                <a href={`mailto:${email}`} className="hover:text-blue">{email}</a>
              </li>
            )}
            {contact.openingHours && (
              <li className="flex items-start gap-3">
                <Clock size={18} aria-hidden="true" className="mt-1 shrink-0 text-blue" />
                <span>{contact.openingHours}</span>
              </li>
            )}
            {contact.social.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue">
                  {s.platform}: {s.handle}
                </a>
              </li>
            ))}
          </ul>
          <Link href="/contact" className="btn btn-primary mt-7">
            Enquire Now
          </Link>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-2 py-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <CurrentYear /> OGAAL Academy. All rights reserved.
          </p>
          <p>{site.location.label}</p>
        </div>
      </div>
    </footer>
  );
}

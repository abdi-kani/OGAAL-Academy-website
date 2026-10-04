import type { Metadata } from "next";
import { Suspense } from "react";
import { Clock, Mail, MapPin, MessageCircle, Phone, AtSign } from "lucide-react";
import { contact, contactPage, site } from "@/content/site";
import { EnquiryForm } from "@/components/EnquiryForm";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { isEmailConfigured } from "@/lib/email";
import { pageMetadata } from "@/lib/seo";

// Rendered per request so the form reflects the current email configuration.
export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: "Contact OGAAL Academy in Mogadishu, Somalia for training schedules, admission requirements, organisational training, and general enquiries.",
  path: "/contact",
});

type Row = { icon: React.ReactNode; label: string; value: string; href?: string; external?: boolean };

export default function ContactPage() {
  const available = isEmailConfigured();
  const rows: Row[] = [
    { icon: <MapPin size={20} />, label: "Location", value: contact.streetAddress ? `${contact.streetAddress}, ${site.location.label}` : site.location.label },
  ];
  if (contact.phone) rows.push({ icon: <Phone size={20} />, label: "Phone", value: contact.phone, href: `tel:${contact.phone.replace(/\s/g, "")}` });
  if (contact.whatsapp) rows.push({ icon: <MessageCircle size={20} />, label: "WhatsApp", value: "Message us on WhatsApp", href: `https://wa.me/${contact.whatsapp}`, external: true });
  if (contact.email.confirmed) rows.push({ icon: <Mail size={20} />, label: "Email", value: contact.email.address, href: `mailto:${contact.email.address}` });
  if (contact.openingHours) rows.push({ icon: <Clock size={20} />, label: "Opening Hours", value: contact.openingHours });
  contact.social.forEach((s) => rows.push({ icon: <AtSign size={20} />, label: s.platform, value: s.handle, href: s.url, external: true }));
  const pending = !contact.phone || !contact.email.confirmed || !contact.streetAddress || !contact.openingHours;

  return (
    <>
      <PageHeader crumb="Contact" eyebrow="Contact" title={contactPage.heading} intro={<p>{contactPage.intro}</p>} icon="people" />

      <section aria-label="Enquiry form and contact details" className="bg-light py-16 lg:py-24">
        <div className="container-x grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:gap-10">
          <Reveal>
            <Suspense fallback={<div className="card h-[48rem]" aria-hidden="true" />}>
              <EnquiryForm kind="contact" available={available} title="Send an enquiry" submitLabel="Send Enquiry" />
            </Suspense>
          </Reveal>
          <Reveal as="aside" delay={100} aria-labelledby="details-title" className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="card p-7">
              <h2 id="details-title" className="text-2xl">
                Contact details
              </h2>
              <ul className="mt-6 space-y-5" role="list">
                {rows.map((r) => (
                  <li key={r.label} className="flex items-start gap-4">
                    <span className="icon-tile !h-11 !w-11" aria-hidden="true">
                      {r.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-xs font-bold tracking-[0.16em] uppercase">{r.label}</p>
                      {r.href ? (
                        <a href={r.href} {...(r.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="font-semibold break-words text-blue underline underline-offset-4">
                          {r.value}
                        </a>
                      ) : (
                        <p className="font-semibold text-navy">{r.value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {pending && <p className="mt-6 border-t border-line pt-5 text-sm">Further contact details will be published here once confirmed.</p>}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

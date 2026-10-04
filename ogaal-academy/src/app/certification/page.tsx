import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Info, TriangleAlert } from "lucide-react";
import { certification } from "@/content/site";
import { Icon, type IconName } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Certification",
  description:
    "Successful participants receive an OGAAL Firearms Safety Training Certificate. Requirements, what the certificate confirms, and trainee conduct standards.",
  path: "/certification",
});

export default function CertificationPage() {
  return (
    <>
      <PageHeader crumb="Certification" eyebrow="Certification" title={certification.heading} intro={<p>{certification.intro}</p>} icon="shield" />

      <section aria-labelledby="cert-req-title" className="py-20 lg:py-28">
        <div className="container-x">
          <SectionHeading id="cert-req-title" lead={certification.requirementsHeading.lead} accent={certification.requirementsHeading.accent} />
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" role="list">
            {certification.requirements.map((r, i) => (
              <Reveal as="li" key={r.text} delay={i * 80} className="card p-7">
                <span className="icon-tile">
                  <Icon name={r.icon as IconName} />
                </span>
                <p className="mt-5 font-display text-lg font-bold text-navy">{r.text}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section aria-label="What the certificate confirms and trainee conduct" className="bg-light py-20 lg:py-28">
        <div className="container-x grid gap-6 lg:grid-cols-2">
          <Reveal className="card p-8 sm:p-10">
            <span className="icon-tile">
              <BadgeCheck size={24} aria-hidden="true" strokeWidth={1.75} />
            </span>
            <h2 className="mt-6 text-2xl sm:text-3xl">{certification.confirmsHeading}</h2>
            <p className="mt-4 text-lg">{certification.confirms}</p>
            <p className="mt-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 font-semibold text-navy">
              <Info size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-blue" />
              {certification.notLicence}
            </p>
          </Reveal>
          <Reveal delay={100} className="card p-8 sm:p-10">
            <span className="icon-tile">
              <Icon name="handshake" />
            </span>
            <h2 className="mt-6 text-2xl sm:text-3xl">{certification.conductHeading}</h2>
            <p className="mt-4 text-lg">{certification.conduct}</p>
            <p className="mt-6 flex items-start gap-3 rounded-xl border border-red-700/20 bg-red-50 p-4 font-semibold text-red-900">
              <TriangleAlert size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
              {certification.conductWarning}
            </p>
          </Reveal>
        </div>
        <Reveal className="container-x mt-12 text-center">
          <Link href={certification.cta.href} className="btn btn-primary">
            {certification.cta.label}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </Reveal>
      </section>
    </>
  );
}

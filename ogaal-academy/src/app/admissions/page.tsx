import type { Metadata } from "next";
import { Suspense } from "react";
import { Check, ShieldAlert } from "lucide-react";
import { admissions } from "@/content/site";
import { EnquiryForm } from "@/components/EnquiryForm";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { StepsRow } from "@/components/Sections";
import { isEmailConfigured } from "@/lib/email";
import { pageMetadata } from "@/lib/seo";

// Rendered per request so the form reflects the current email configuration.
export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Admissions",
  description:
    "Admission requirements and the application process at OGAAL Academy. Admission is subject to eligibility checks and the required vetting and clearance process.",
  path: "/admissions",
});

export default function AdmissionsPage() {
  const available = isEmailConfigured();
  return (
    <>
      <PageHeader crumb="Admissions" eyebrow="Admissions" title={admissions.heading} intro={<p>{admissions.intro}</p>} icon="people" />

      {/* Requirements */}
      <section aria-labelledby="req-title" className="py-20 lg:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-16">
          <div>
            <SectionHeading id="req-title" lead={admissions.requirementsHeading.lead} accent={admissions.requirementsHeading.accent} intro={admissions.intro} />
            <Reveal className="mt-8 flex items-start gap-3 rounded-[var(--radius-card)] border border-blue-100 bg-blue-50 p-5 text-navy">
              <ShieldAlert size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-blue" />
              <p>Applying does not guarantee admission. Enrolment depends on eligibility, required clearance, and confirmation from the academy.</p>
            </Reveal>
          </div>
          <Reveal delay={100} className="card p-7 sm:p-9">
            <h3 className="text-xl sm:text-2xl">{admissions.requirementsLead}</h3>
            <ul className="mt-6 divide-y divide-line" role="list">
              {admissions.requirements.map((r) => (
                <li key={r} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue text-white" aria-hidden="true">
                    <Check size={15} strokeWidth={2.75} />
                  </span>
                  <span className="pt-0.5 text-[1.05rem] text-navy">{r}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Process */}
      <section aria-labelledby="process-title" className="bg-light py-20 lg:py-28">
        <div className="container-x">
          <SectionHeading id="process-title" lead={admissions.processHeading.lead} accent={admissions.processHeading.accent} align="center" />
          <StepsRow steps={admissions.steps} />
        </div>
      </section>

      {/* Enquiry form */}
      <section id="enquiry" aria-label="Admissions enquiry" className="scroll-mt-24 py-20 lg:py-28">
        <div className="container-x max-w-4xl">
          <Suspense fallback={<div className="card h-[44rem]" aria-hidden="true" />}>
            <EnquiryForm kind="admissions" available={available} title={admissions.formHeading} intro={<p>{admissions.formIntro}</p>} submitLabel="Send Admissions Enquiry" />
          </Suspense>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { closingCta, faqs } from "@/content/site";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { ClosingCta, FaqList } from "@/components/Sections";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "FAQs",
  description: "Answers about OGAAL Academy's two-day programme, admission, certificates, fees, organisational training, and licensing.",
  path: "/faq",
});

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHeader crumb="FAQs" eyebrow="Help" title="Frequently Asked Questions" intro={<p>Quick answers about the programme, admission, certificates, and fees.</p>} icon="bullet" />
      <section aria-label="Questions and answers" className="pattern-icons py-14 lg:py-20">
        <div className="container-x grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <div>
            <SectionHeading lead="Still have a" accent="question?" intro="Our team can help with training dates, admission requirements, and organisational enquiries." />
            <Reveal className="mt-6">
              <Link href="/contact" className="btn btn-primary">
                Contact Us
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </Reveal>
          </div>
          <Reveal delay={80}>
            <FaqList />
          </Reveal>
        </div>
      </section>
      <ClosingCta {...closingCta} />
    </>
  );
}

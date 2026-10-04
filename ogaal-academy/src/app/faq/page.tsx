import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { closingCta, faqs } from "@/content/site";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
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
      <PageHeader crumb="FAQs" eyebrow="Help" title="Frequently Asked Questions" intro={<p>Quick answers about the programme, admission, certificates, and fees.</p>} icon="book" />
      <section aria-label="Questions and answers" className="py-20 lg:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <Reveal>
            <h2 className="section-title text-3xl sm:text-4xl">
              Still have a <span className="accent">question?</span>
            </h2>
            <span className="rule mt-5" aria-hidden="true" />
            <p className="mt-5 text-lg">Our team can help with training dates, admission requirements, and organisational enquiries.</p>
            <Link href="/contact" className="btn btn-primary mt-8">
              Contact Us
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </Reveal>
          <Reveal delay={100}>
            <FaqList />
          </Reveal>
        </div>
      </section>
      <ClosingCta {...closingCta} />
    </>
  );
}

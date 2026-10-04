import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { site } from "@/content/site";
import { isLive, organizationJsonLd, siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: site.seo.homeTitle, template: "%s | OGAAL Academy" },
  description: site.seo.homeDescription,
  applicationName: site.name,
  openGraph: {
    title: site.seo.homeTitle,
    description: site.seo.homeDescription,
    siteName: site.name,
    type: "website",
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image", title: site.seo.homeTitle, description: site.seo.homeDescription },
  // Search engines are kept out until the production domain is configured.
  robots: isLive ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0755E9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <Header />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

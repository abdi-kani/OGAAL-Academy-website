import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { formats: ["image/avif", "image/webp"] },
  poweredByHeader: false,
  serverExternalPackages: ["pdf-lib"],
  // The certificate reads the logo from disk. Serverless functions only include files that are listed or imported.
  outputFileTracingIncludes: { "/api/admin/employees/[id]/certificate/pdf": ["./public/brand/ogaal-logo.png"] },
  async redirects() {
    return [
      { source: "/faqs", destination: "/faq", permanent: true },
      { source: "/admissions", destination: "/contact", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;

import { NextResponse, type NextRequest } from "next/server";
import { coerceEnquiry, validateEnquiry } from "@/lib/enquiry";
import { isEmailConfigured, sendEnquiryEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_FILL_MS = 3000; // forms submitted faster than this are treated as automated

export async function POST(req: NextRequest) {
  // Same-origin check (blocks cross-site form posting)
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  const limit = rateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many enquiries from this connection. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const text = await req.text();
  if (text.length > 20000) return NextResponse.json({ error: "too_large" }, { status: 413 });
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // Spam protection: honeypot field and minimum time on the form.
  // Bots get a neutral response so they learn nothing; nothing is sent.
  const startedAt = typeof raw.startedAt === "number" ? raw.startedAt : 0;
  if ((typeof raw.website === "string" && raw.website.trim() !== "") || !startedAt || Date.now() - startedAt < MIN_FILL_MS) {
    return NextResponse.json({ error: "rejected" }, { status: 400 });
  }

  const input = coerceEnquiry(raw);
  if (!input) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const errors = validateEnquiry(input);
  if (Object.keys(errors).length) return NextResponse.json({ error: "invalid", errors }, { status: 422 });

  if (!isEmailConfigured()) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  try {
    const ok = await sendEnquiryEmail(input, { ip });
    if (!ok) return NextResponse.json({ error: "delivery_failed" }, { status: 502 });
  } catch {
    return NextResponse.json({ error: "delivery_failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}

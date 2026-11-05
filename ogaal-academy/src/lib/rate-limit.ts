import "server-only";

/**
 * Simple sliding-window rate limiter kept in server memory.
 * Good for a single server instance. On serverless/multi-instance hosting, replace with a shared
 * store (e.g. Upstash Redis) — see README.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const hits = new Map<string, number[]>();

/**
 * The client address for rate limiting. The proxy appends the address it saw to X-Forwarded-For, so
 * earlier entries can be forged by the client. Count back TRUSTED_PROXY_COUNT entries (default 1) from the right.
 */
export function clientIpFrom(h: Headers): string {
  const chain = (h.get("x-forwarded-for") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const hops = Math.max(1, Number(process.env.TRUSTED_PROXY_COUNT) || 1);
  return chain[Math.max(0, chain.length - hops)] || h.get("x-real-ip") || "unknown";
}

export function rateLimit(key: string, max = MAX_REQUESTS, windowMs = WINDOW_MS): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < Math.max(windowMs, WINDOW_MS))) hits.delete(k);
  return { ok: true, retryAfter: 0 };
}

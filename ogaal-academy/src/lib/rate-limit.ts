import "server-only";

/**
 * Simple sliding-window rate limiter kept in server memory.
 * Good for a single server instance. On serverless/multi-instance hosting, replace with a shared
 * store (e.g. Upstash Redis) — see README.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const hits = new Map<string, number[]>();

export function rateLimit(key: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    hits.set(key, recent);
    return { ok: false, retryAfter: Math.ceil((WINDOW_MS - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  return { ok: true, retryAfter: 0 };
}

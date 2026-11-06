import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { clientIpFrom } from "@/lib/rate-limit";
import { getAdmin, isAuthConfigured, type Admin } from "./auth";
import { StorageError, isStorageConfigured } from "./github";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export function requestIp(req: NextRequest): string {
  return clientIpFrom(req.headers);
}

/** CSRF defence alongside the SameSite cookie: state-changing requests must come from this site. */
export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof ApiError) return NextResponse.json({ error: err.message, fields: err.fields }, { status: err.status });
  if (err instanceof StorageError) {
    console.error("Admin storage error:", err.message);
    return NextResponse.json({ error: "The record storage is unavailable. Nothing was saved. Please try again." }, { status: 503 });
  }
  console.error("Admin API error:", err);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

type Ctx<P> = { req: NextRequest; admin: Admin; params: P; ip: string };

/** Every authenticated API route goes through here: origin check, session, error handling. */
export function adminRoute<P = Record<string, never>>(handler: (ctx: Ctx<P>) => Promise<Response>) {
  return async (req: NextRequest, context: { params: Promise<P> }): Promise<Response> => {
    try {
      if (!isAuthConfigured() || !isStorageConfigured()) throw new ApiError(503, "The admin system is not configured.");
      if (req.method !== "GET" && req.method !== "HEAD" && !isSameOrigin(req)) throw new ApiError(403, "Request blocked.");
      const admin = await getAdmin();
      if (!admin) throw new ApiError(401, "Please sign in.");
      return await handler({ req, admin, params: await context.params, ip: requestIp(req) });
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export async function readJson(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (body && typeof body === "object" && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {
    // falls through to the error below
  }
  throw new ApiError(400, "Invalid request.");
}

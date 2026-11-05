import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, type PortalUser } from "./auth";
import { isDbConfigured } from "./db";
import { clientIpFrom } from "@/lib/rate-limit";
import { can, type Permission } from "./permissions";

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
  console.error("Portal API error:", err);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

type Ctx<P> = { req: NextRequest; user: PortalUser; params: P; ip: string };
type Options = { permission?: Permission; allowPasswordChangePending?: boolean };

/** Every authenticated API route goes through here: origin check, session, permission, error handling. */
export function portalRoute<P = Record<string, never>>(options: Options, handler: (ctx: Ctx<P>) => Promise<Response>) {
  return async (req: NextRequest, context: { params: Promise<P> }): Promise<Response> => {
    try {
      if (!isDbConfigured()) throw new ApiError(503, "The portal database is not configured.");
      if (req.method !== "GET" && req.method !== "HEAD" && !isSameOrigin(req)) throw new ApiError(403, "Request blocked.");
      const user = await getCurrentUser();
      if (!user) throw new ApiError(401, "Please sign in.");
      if (user.must_change_password && !options.allowPasswordChangePending) throw new ApiError(403, "Please change your temporary password first.");
      if (options.permission && !can(user.role, options.permission)) throw new ApiError(403, "You do not have permission to do that.");
      return await handler({ req, user, params: await context.params, ip: requestIp(req) });
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

export function parseId(value: string): number {
  if (!/^\d{1,18}$/.test(value)) throw new ApiError(404, "Not found.");
  return Number(value);
}

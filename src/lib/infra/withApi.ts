/**
 * Higher-order wrapper for API routes.
 * Handles: auth validation, role check, rate limit, Zod body parse,
 * structured logging, request ID propagation, and uniform error responses.
 */

import { type NextRequest, NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { logger } from "./logger";
import { getRequestId } from "./requestId";
import { checkRateLimit, RATE_LIMITS, type RateLimitFeature } from "./rateLimit";

export type Role = "admin" | "counselor" | "student";

export interface ApiContext<TBody = unknown> {
  req: NextRequest;
  body: TBody;
  user: { id: string; email: string; role: Role } | null;
  requestId: string;
}

export interface ApiOptions<TBody = unknown> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  bodySchema?: ZodSchema<TBody>;
  allowedRoles?: Role[];
  rateLimit?: RateLimitFeature;
  skipAuth?: boolean;
}

export function withApi<TBody = unknown>(
  handler: (ctx: ApiContext<TBody>) => Promise<NextResponse>,
  opts: ApiOptions<TBody> = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const requestId = getRequestId(req);
    const route = req.nextUrl.pathname;
    const method = req.method;

    const logCtx = { requestId, route, method };

    // Method guard
    if (opts.method && req.method !== opts.method) {
      logger.warn(logCtx, `Method not allowed: ${req.method}`);
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405, headers: { "x-request-id": requestId } }
      );
    }

    let user: { id: string; email: string; role: Role } | null = null;

    // Auth
    if (!opts.skipAuth) {
      const supabase = createServerClient();
      const {
        data: { user: sbUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !sbUser) {
        logger.warn(logCtx, "Unauthorized request");
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401, headers: { "x-request-id": requestId } }
        );
      }

      const role = (sbUser.user_metadata?.role as Role) || "student";
      user = {
        id: sbUser.id,
        email: sbUser.email || "",
        role,
      };

      (logCtx as Record<string, unknown>).userId = user.id;

      // Role guard
      if (opts.allowedRoles && !opts.allowedRoles.includes(role)) {
        logger.warn(logCtx, `Forbidden role: ${role}`);
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403, headers: { "x-request-id": requestId } }
        );
      }

      // Rate limit
      if (opts.rateLimit) {
        const rl = RATE_LIMITS[opts.rateLimit];
        const result = await checkRateLimit(
          { userId: user.id, feature: opts.rateLimit },
          rl.limit,
          rl.windowMs
        );
        if (!result.allowed) {
          logger.warn({ ...logCtx, feature: opts.rateLimit }, "Rate limit exceeded");
          return NextResponse.json(
            {
              error: "Rate limit exceeded",
              limit: result.limit,
              remaining: result.remaining,
              resetAt: result.resetAt,
            },
            {
              status: 429,
              headers: {
                "x-request-id": requestId,
                "x-ratelimit-limit": String(result.limit),
                "x-ratelimit-remaining": String(result.remaining),
                "x-ratelimit-reset": String(result.resetAt),
              },
            }
          );
        }
      }
    }

    // Body parse
    let body = {} as TBody;
    if (opts.bodySchema && ["POST", "PUT", "PATCH"].includes(req.method)) {
      let raw: unknown;
      try {
        raw = await req.json();
      } catch {
        logger.warn(logCtx, "Invalid JSON body");
        return NextResponse.json(
          { error: "Invalid JSON body" },
          { status: 400, headers: { "x-request-id": requestId } }
        );
      }
      try {
        body = opts.bodySchema.parse(raw);
      } catch (err) {
        const zodErr = err instanceof ZodError ? err : null;
        logger.warn({ ...logCtx, zodErrors: zodErr?.errors }, "Validation failed");
        return NextResponse.json(
          {
            error: "Validation failed",
            issues: zodErr?.issues || [],
          },
          { status: 422, headers: { "x-request-id": requestId } }
        );
      }
    }

    logger.info(logCtx, "Request start");
    const start = Date.now();

    try {
      const res = await handler({
        req,
        body,
        user,
        requestId,
      });
      // Attach request ID to any response that doesn't already have it
      if (!res.headers.has("x-request-id")) {
        res.headers.set("x-request-id", requestId);
      }
      logger.info({ ...logCtx, latency_ms: Date.now() - start, status: res.status }, "Request done");
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ ...logCtx, latency_ms: Date.now() - start, error: msg }, "Request error");
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500, headers: { "x-request-id": requestId } }
      );
    }
  };
}

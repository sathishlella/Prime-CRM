import { z } from "zod";
import type { NextRequest } from "next/server";
import { createLogger } from "@/lib/logging/logger";
import { getRequestId } from "@/lib/logging/requestId";
import { checkRateLimit } from "@/lib/http/rateLimit";
import { createServerClient } from "@/lib/supabase/server";

type UserRole = "admin" | "counselor" | "student";

export interface ApiHandlerContext {
  req: NextRequest;
  requestId: string;
  logger: ReturnType<typeof createLogger>;
  user: { id: string; email: string; role: UserRole };
}

export interface ApiHandlerOptions<T extends z.ZodType> {
  schema?: T;
  requireRole?: UserRole | UserRole[];
  rateLimit?: { bucket: string; limit: number; windowMs: number };
}

type Handler<T extends z.ZodType> = (
  ctx: ApiHandlerContext & { body?: z.infer<T> }
) => Promise<Response>;

/**
 * Higher-order API handler: wraps route handlers with auth, RBAC, Zod parse,
 * rate-limit check, request-id injection, structured log, error envelope.
 *
 * Usage:
 * export const POST = withApi({ schema: mySchema, requireRole: 'admin' }, async (ctx) => {
 *   ctx.logger.info('processing request', { body: ctx.body });
 *   // ... business logic ...
 *   return Response.json({ data: ... });
 * });
 */
export function withApi<T extends z.ZodType = z.ZodType>(
  options: ApiHandlerOptions<T> = {},
  handler: Handler<T>
) {
  return async (req: NextRequest): Promise<Response> => {
    const requestId = getRequestId(req);
    const logger = createLogger(requestId, req.nextUrl.pathname);
    const startTime = Date.now();

    try {
      // 1. Auth check
      const supabase = createServerClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        logger.warn("unauthorized request");
        return Response.json(
          { error: "UNAUTHORIZED", message: "Not authenticated", requestId },
          { status: 401 }
        );
      }

      // 2. Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, role")
        .eq("id", session.user.id)
        .single();

      if (profileError || !profile) {
        logger.error("profile fetch failed", { error: profileError?.message });
        return Response.json(
          { error: "USER_NOT_FOUND", message: "User profile not found", requestId },
          { status: 404 }
        );
      }

      // 3. RBAC check
      if (options.requireRole) {
        const allowedRoles = Array.isArray(options.requireRole)
          ? options.requireRole
          : [options.requireRole];

        if (!allowedRoles.includes(profile.role as UserRole)) {
          logger.warn("forbidden request", { required: allowedRoles, actual: profile.role });
          return Response.json(
            { error: "FORBIDDEN", message: "Insufficient permissions", requestId },
            { status: 403 }
          );
        }
      }

      // 4. Rate limit check
      if (options.rateLimit) {
        const key = `${profile.id}:${options.rateLimit.bucket}`;
        const { allowed, remaining, resetAt } = checkRateLimit(
          key,
          options.rateLimit.limit,
          options.rateLimit.windowMs
        );

        if (!allowed) {
          logger.warn("rate limit exceeded", {
            bucket: options.rateLimit.bucket,
            resetAt: new Date(resetAt).toISOString(),
          });
          return Response.json(
            {
              error: "RATE_LIMITED",
              message: "Too many requests",
              requestId,
              resetAt: new Date(resetAt).toISOString(),
            },
            {
              status: 429,
              headers: {
                "x-ratelimit-limit": String(options.rateLimit.limit),
                "x-ratelimit-remaining": String(Math.max(0, remaining)),
                "x-ratelimit-reset": String(resetAt),
              },
            }
          );
        }
      }

      // 5. Zod parse
      let body: unknown;
      if (options.schema) {
        try {
          const jsonBody = await req.json();
          const parsed = options.schema.safeParse(jsonBody);

          if (!parsed.success) {
            logger.warn("validation failed", { errors: parsed.error.flatten() });
            return Response.json(
              {
                error: "VALIDATION_ERROR",
                message: "Request validation failed",
                requestId,
                details: parsed.error.flatten(),
              },
              { status: 400 }
            );
          }

          body = parsed.data;
        } catch (err) {
          logger.error("json parse failed", { error: String(err) });
          return Response.json(
            { error: "PARSE_ERROR", message: "Invalid JSON", requestId },
            { status: 400 }
          );
        }
      }

      // 6. Call handler
      const response = await handler({
        req,
        requestId,
        logger,
        user: { id: profile.id, email: profile.email, role: profile.role as UserRole },
        body,
      } as Parameters<Handler<T>>[0]);

      // 7. Log success
      const duration = Date.now() - startTime;
      logger.info("request completed", {
        status: response.status,
        duration_ms: duration,
      });

      return response;
    } catch (err) {
      // 8. Catch-all error handling
      const duration = Date.now() - startTime;
      const error = err instanceof Error ? err : new Error(String(err));

      logger.error("unhandled error", {
        error: error.message,
        stack: error.stack,
        duration_ms: duration,
      });

      return Response.json(
        {
          error: "INTERNAL_ERROR",
          message: "Internal server error",
          requestId,
        },
        { status: 500 }
      );
    }
  };
}

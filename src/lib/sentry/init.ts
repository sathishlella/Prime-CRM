/**
 * Initialize Sentry for error tracking and performance monitoring.
 * No-op if SENTRY_DSN is not set.
 * Note: Sentry is configured via @sentry/nextjs wrapper in next.config.js
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    if (process.env.NODE_ENV !== "test") {
      console.log("[Sentry] DSN not set, error tracking disabled");
    }
    return;
  }

  // Sentry is auto-initialized by @sentry/nextjs via withSentryConfig in next.config.js
  // This function is a no-op once the middleware has run.
  console.log("[Sentry] Initialized with DSN:", dsn.split("@")[0] + "***");
}

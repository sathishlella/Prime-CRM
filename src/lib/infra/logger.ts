/**
 * Structured JSON logger for Vercel + log drains.
 * Always logs a single JSON line per call so external log aggregation works.
 */

export interface LogContext {
  requestId?: string;
  userId?: string;
  route?: string;
  method?: string;
  [key: string]: unknown;
}

function logLine(level: string, ctx: LogContext, msg: string) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...ctx,
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry));
}

export const logger = {
  info(ctx: LogContext, msg: string) {
    logLine("info", ctx, msg);
  },
  warn(ctx: LogContext, msg: string) {
    logLine("warn", ctx, msg);
  },
  error(ctx: LogContext, msg: string) {
    logLine("error", ctx, msg);
  },
};

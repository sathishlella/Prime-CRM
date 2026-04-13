import { headers } from "next/headers";

export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  kind: string;
  ts: string;
  request_id: string;
  level: LogLevel;
  route?: string;
  user_id?: string;
  duration_ms?: number;
  message?: string;
  error?: string;
  stack?: string;
  [key: string]: unknown;
}

/**
 * Create a logger scoped to a request.
 * Emits one JSON line per call to stdout (Vercel log drains).
 */
export function createLogger(requestId: string, route?: string) {
  const emit = (entry: LogEntry) => {
    console.log(JSON.stringify(entry));
  };

  return {
    info(message: string, extra?: Record<string, unknown>) {
      emit({
        kind: "log",
        ts: new Date().toISOString(),
        request_id: requestId,
        level: "info",
        route,
        message,
        ...extra,
      });
    },

    warn(message: string, extra?: Record<string, unknown>) {
      emit({
        kind: "log",
        ts: new Date().toISOString(),
        request_id: requestId,
        level: "warn",
        route,
        message,
        ...extra,
      });
    },

    error(error: Error | string, extra?: Record<string, unknown>) {
      const err = typeof error === "string" ? new Error(error) : error;
      emit({
        kind: "log",
        ts: new Date().toISOString(),
        request_id: requestId,
        level: "error",
        route,
        error: err.message,
        stack: err.stack,
        ...extra,
      });
    },
  };
}

import { type NextRequest } from "next/server";

export const REQUEST_ID_HEADER = "x-request-id";

export function getRequestId(req: NextRequest): string {
  return (
    req.headers.get(REQUEST_ID_HEADER) ??
    `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );
}

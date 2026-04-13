/**
 * Extract or generate a request ID for end-to-end tracing.
 * Reads x-request-id header if present, otherwise generates a new UUID.
 */
export function getRequestId(req?: Request): string {
  if (req) {
    const existing = req.headers.get("x-request-id");
    if (existing) return existing;
  }

  return crypto.randomUUID();
}

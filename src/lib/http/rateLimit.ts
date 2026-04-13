/**
 * In-memory sliding-window rate limiter.
 * Keyed on ${userId}:${bucket}.
 * Swappable interface so Upstash Redis can drop in later.
 */

interface RateLimitEntry {
  tokens: number[];
}

const store = new Map<string, RateLimitEntry>();

/**
 * Check if a request should be allowed.
 * Returns { allowed, remaining, resetAt }.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key) || { tokens: [] };

  // Remove tokens older than the window
  entry.tokens = entry.tokens.filter((t) => now - t < windowMs);

  const remaining = limit - entry.tokens.length;
  const allowed = remaining > 0;

  if (allowed) {
    entry.tokens.push(now);
  }

  store.set(key, entry);

  const resetAt = entry.tokens.length > 0 ? entry.tokens[0] + windowMs : now;

  return { allowed, remaining: Math.max(0, remaining), resetAt };
}

/**
 * Clear all entries in the rate limit store.
 * Useful for testing or manual reset.
 */
export function clearRateLimitStore(): void {
  store.clear();
}

/**
 * Reset a specific rate limit bucket.
 */
export function resetRateLimitBucket(key: string): void {
  store.delete(key);
}

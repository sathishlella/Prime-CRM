/**
 * Token-bucket rate limiter.
 * In-memory LRU for dev/demo. Postgres-backed for production.
 */

import { createAdminClient } from "@/lib/supabase/server";

export interface RateLimitKey {
  userId: string;
  feature: string; // e.g. "evaluate", "apply-agent", "match-agent"
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // epoch ms
}

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const IN_MEMORY = new Map<string, Bucket>();

function keyString(k: RateLimitKey): string {
  return `${k.userId}:${k.feature}`;
}

function nowMs(): number {
  return Date.now();
}

function refill(
  bucket: Bucket,
  limit: number,
  windowMs: number
): { tokens: number; lastRefill: number } {
  const now = nowMs();
  const elapsed = now - bucket.lastRefill;
  if (elapsed <= 0) return bucket;
  const add = (elapsed / windowMs) * limit;
  return {
    tokens: Math.min(limit, bucket.tokens + add),
    lastRefill: now,
  };
}

export async function checkRateLimit(
  key: RateLimitKey,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const useDb = process.env.NEXT_PUBLIC_DEMO_MODE !== "true";
  if (useDb) {
    return checkPostgres(key, limit, windowMs);
  }
  return checkMemory(key, limit, windowMs);
}

function checkMemory(
  key: RateLimitKey,
  limit: number,
  windowMs: number
): RateLimitResult {
  const k = keyString(key);
  let bucket = IN_MEMORY.get(k) ?? { tokens: limit, lastRefill: nowMs() };
  bucket = refill(bucket, limit, windowMs);
  const allowed = bucket.tokens >= 1;
  if (allowed) {
    bucket.tokens -= 1;
  }
  IN_MEMORY.set(k, bucket);
  return {
    allowed,
    limit,
    remaining: Math.floor(bucket.tokens),
    resetAt: bucket.lastRefill + windowMs,
  };
}

async function checkPostgres(
  key: RateLimitKey,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    const admin = createAdminClient();
    const windowSeconds = Math.max(1, Math.round(windowMs / 1000));
    const { data, error } = await (admin.rpc as any)("check_rate_limit", {
      p_user_id: key.userId,
      p_feature: key.feature,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error || !data) {
      // Fail open on DB error so the app doesn't lock up
      return { allowed: true, limit, remaining: limit, resetAt: nowMs() + windowMs };
    }
    const row = data as {
      allowed?: boolean;
      limit?: number;
      remaining?: number;
      reset_at?: string;
    };
    return {
      allowed: row.allowed ?? true,
      limit: row.limit ?? limit,
      remaining: row.remaining ?? limit,
      resetAt: row.reset_at
        ? new Date(row.reset_at).getTime()
        : nowMs() + windowMs,
    };
  } catch {
    return { allowed: true, limit, remaining: limit, resetAt: nowMs() + windowMs };
  }
}

// Preset limits
export const RATE_LIMITS = {
  evaluate: { limit: 60, windowMs: 60 * 60 * 1000 },
  "cv-generate": { limit: 20, windowMs: 60 * 60 * 1000 },
  "interview-prep": { limit: 30, windowMs: 60 * 60 * 1000 },
  "match-agent": { limit: 10, windowMs: 60 * 60 * 1000 },
  "apply-agent": { limit: 5, windowMs: 60 * 60 * 1000 },
  scan: { limit: 10, windowMs: 60 * 60 * 1000 },
  chat: { limit: 60, windowMs: 60 * 60 * 1000 },
} as const;

export type RateLimitFeature = keyof typeof RATE_LIMITS;

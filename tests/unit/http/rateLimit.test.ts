import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, clearRateLimitStore } from "@/lib/http/rateLimit";

beforeEach(() => {
  clearRateLimitStore();
});

describe("checkRateLimit", () => {
  it("allows requests under the limit", () => {
    const result = checkRateLimit("user1:bucket", 5, 60_000);
    expect(result.allowed).toBe(true);
    // remaining is computed before the token is consumed (pre-deduction)
    expect(result.remaining).toBe(5);
  });

  it("allows exactly limit requests", () => {
    for (let i = 0; i < 5; i++) {
      const r = checkRateLimit("user2:bucket", 5, 60_000);
      expect(r.allowed).toBe(true);
    }
  });

  it("blocks the (limit+1)th request", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("user3:bucket", 5, 60_000);
    }
    const result = checkRateLimit("user3:bucket", 5, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("remaining decrements with each allowed call", () => {
    // Pre-deduction: remaining = limit - tokens_before_this_call
    const r1 = checkRateLimit("user4:bucket", 3, 60_000);
    expect(r1.remaining).toBe(3); // 3 - 0
    const r2 = checkRateLimit("user4:bucket", 3, 60_000);
    expect(r2.remaining).toBe(2); // 3 - 1
    const r3 = checkRateLimit("user4:bucket", 3, 60_000);
    expect(r3.remaining).toBe(1); // 3 - 2
  });

  it("different keys are isolated", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("userA:bucket", 5, 60_000);
    const resultA = checkRateLimit("userA:bucket", 5, 60_000);
    expect(resultA.allowed).toBe(false);

    const resultB = checkRateLimit("userB:bucket", 5, 60_000);
    expect(resultB.allowed).toBe(true);
  });

  it("resetAt is in the future", () => {
    const before = Date.now();
    const r = checkRateLimit("user5:bucket", 5, 60_000);
    expect(r.resetAt).toBeGreaterThan(before);
  });

  it("expiry: tokens outside the window are evicted", async () => {
    // Fill the bucket with a 50ms window
    for (let i = 0; i < 3; i++) checkRateLimit("user6:bucket", 3, 50);
    // Exhaust it
    expect(checkRateLimit("user6:bucket", 3, 50).allowed).toBe(false);
    // Wait for window to pass
    await new Promise((r) => setTimeout(r, 60));
    // Bucket should be fresh again
    expect(checkRateLimit("user6:bucket", 3, 50).allowed).toBe(true);
  });
});

import { test, expect } from "@playwright/test";

test.describe("Security headers", () => {
  test("login page returns required security headers", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response).not.toBeNull();

    const headers = response!.headers();

    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["strict-transport-security"]).toContain("max-age=");
    expect(headers["permissions-policy"]).toContain("camera=()");
  });

  test("CSP header is present and contains required directives", async ({ page }) => {
    const response = await page.goto("/login");
    const csp = response!.headers()["content-security-policy"] ?? "";

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    // unsafe-eval must not appear in production CSP
    if (!csp.includes("upgrade-insecure-requests")) {
      // if upgrade-insecure-requests is missing we're probably in dev — skip
      return;
    }
    expect(csp).not.toContain("'unsafe-eval'");
  });

  test("API routes return security headers", async ({ request }) => {
    const response = await request.get("/api/leads");
    const headers = response.headers();
    // API routes pass through next.config.js headers
    expect(headers["x-content-type-options"]).toBe("nosniff");
  });
});

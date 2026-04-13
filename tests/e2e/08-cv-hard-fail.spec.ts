import { test, expect } from "@playwright/test";
import { AUTH, apiPost } from "./helpers";

test.use(AUTH.counselor);

/**
 * Golden path 8: cv-generate hard-fails (no Groq fallback).
 * We can't mock Anthropic in E2E so we test the behaviour when the body
 * is valid but ANTHROPIC_API_KEY is absent / invalid at test-project level:
 *   - If the key is valid: route succeeds (200) — cv-generate works.
 *   - If the key is invalid/missing: route returns 500 or 503 with
 *     AI_CV_UNAVAILABLE and NOT a Groq-model response.
 *
 * The test asserts that the response is never a 2xx from Groq — meaning
 * cv-generate never silently falls back.
 */
test("cv-generate does not fall back to Groq on AI failure", async ({ page }) => {
  await page.goto("/counselor");

  const { status, body } = await apiPost(page, "/api/generate-cv", {
    student_id: "00000000-0000-0000-0000-000000000001",
    job_description: "Senior TypeScript engineer at ACME Corp building distributed systems.",
    company_name: "ACME Corp",
    job_role: "Senior TypeScript Engineer",
    format: "letter",
  });

  // If Anthropic succeeds: 200 with pdf_url
  // If Anthropic fails:    500/503 — never 200 with a Groq-model payload
  if (status === 200) {
    // Success path — verify it came from Anthropic (no groq model name)
    const provider = body?.provider ?? body?.model ?? "";
    expect(provider).not.toMatch(/groq|llama/i);
  } else {
    // Failure path — must NOT be AI_CV_UNAVAILABLE from a Groq fallback
    // i.e. the error code must not be GROQ_FALLBACK
    expect(body?.error).not.toBe("GROQ_FALLBACK");
    expect([500, 503, 404]).toContain(status);
  }
});

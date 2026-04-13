import { test, expect } from "@playwright/test";
import { AUTH, apiPost } from "./helpers";

test.use(AUTH.counselor);

test.describe("Zod validation envelopes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/counselor");
  });

  test("evaluate: missing cv_markdown → 400 VALIDATION_ERROR", async ({ page }) => {
    const { status, body } = await apiPost(page, "/api/evaluate", {
      student_id: "00000000-0000-0000-0000-000000000001",
      job_description: "Senior engineer role",
    });
    expect(status).toBe(400);
    expect(body?.error).toBe("VALIDATION_ERROR");
  });

  test("evaluate: invalid student_id UUID → 400", async ({ page }) => {
    const { status } = await apiPost(page, "/api/evaluate", {
      student_id: "not-a-uuid",
      job_description: "desc",
      cv_markdown: "cv",
    });
    expect(status).toBe(400);
  });

  test("generate-cv: missing company_name → 400", async ({ page }) => {
    const { status } = await apiPost(page, "/api/generate-cv", {
      student_id: "00000000-0000-0000-0000-000000000001",
      job_description: "desc",
      job_role: "Engineer",
    });
    expect(status).toBe(400);
  });

  test("apply-agent: empty job_match_ids → 400", async ({ page }) => {
    const { status } = await apiPost(page, "/api/agent/apply", {
      student_id: "00000000-0000-0000-0000-000000000001",
      job_match_ids: [],
    });
    expect(status).toBe(400);
  });

  test("update-counselor: missing student_id → 400", async ({ page }) => {
    const { status } = await apiPost(page, "/api/students/update-counselor", {
      counselor_id: "00000000-0000-0000-0000-000000000001",
    });
    expect(status).toBe(400);
  });

  test("unauthenticated request → 401", async ({ page: _ }) => {
    // Use a fresh browser context with no auth cookies
    const browser = _.context().browser()!;
    const freshCtx = await browser.newContext();
    const freshPage = await freshCtx.newPage();
    const res = await freshPage.request.post("/api/evaluate", {
      data: { student_id: "00000000-0000-0000-0000-000000000001", job_description: "d", cv_markdown: "cv" },
    });
    expect(res.status()).toBe(401);
    await freshCtx.close();
  });
});

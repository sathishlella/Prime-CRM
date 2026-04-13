import { test, expect } from "@playwright/test";
import { AUTH, apiPost } from "./helpers";

test.use(AUTH.student);

test.describe("Student dashboard", () => {
  test("lands on /student after login", async ({ page }) => {
    await page.goto("/student");
    await expect(page).toHaveURL(/\/student/);
  });

  test("shows applications section", async ({ page }) => {
    await page.goto("/student");
    await expect(page.locator("text=/applications|no applications/i").first()).toBeVisible({ timeout: 8_000 });
  });

  test("navigates to documents page", async ({ page }) => {
    await page.goto("/student/documents");
    await expect(page).toHaveURL(/\/student\/documents/);
  });

  test("navigates to CVs page", async ({ page }) => {
    await page.goto("/student/cvs");
    await expect(page).toHaveURL(/\/student\/cvs/);
  });

  test("cross-role guard: student cannot visit /admin", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/student/);
  });

  test("cross-role guard: student cannot visit /counselor", async ({ page }) => {
    await page.goto("/counselor");
    await expect(page).toHaveURL(/\/student/);
  });
});

test.describe("Chat API: student read-only safety", () => {
  test("chat rejects empty message", async ({ page }) => {
    await page.goto("/student");
    const { status } = await apiPost(page, "/api/chat", { message: "" });
    expect(status).toBe(400);
  });

  test("chat rejects message over 4000 chars", async ({ page }) => {
    await page.goto("/student");
    const { status } = await apiPost(page, "/api/chat", { message: "x".repeat(4001) });
    expect(status).toBe(400);
  });
});

test.describe("API role isolation: student cannot call counselor endpoints", () => {
  test("student gets 403 on /api/agent/apply", async ({ page }) => {
    await page.goto("/student");
    const { status } = await apiPost(page, "/api/agent/apply", {
      student_id: "00000000-0000-0000-0000-000000000001",
      job_match_ids: ["00000000-0000-0000-0000-000000000002"],
    });
    expect(status).toBe(403);
  });

  test("student gets 403 on /api/agent/match", async ({ page }) => {
    await page.goto("/student");
    const { status } = await apiPost(page, "/api/agent/match", {
      student_id: "00000000-0000-0000-0000-000000000001",
    });
    expect(status).toBe(403);
  });
});

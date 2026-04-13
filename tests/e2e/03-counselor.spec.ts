import { test, expect } from "@playwright/test";
import { AUTH, apiPost } from "./helpers";

test.use(AUTH.counselor);

test.describe("Counselor dashboard", () => {
  test("lands on /counselor after login", async ({ page }) => {
    await page.goto("/counselor");
    await expect(page).toHaveURL(/\/counselor/);
  });

  test("shows students list", async ({ page }) => {
    await page.goto("/counselor/students");
    await expect(page).toHaveURL(/\/counselor\/students/);
  });

  test("navigates to leads page", async ({ page }) => {
    await page.goto("/counselor/leads");
    await expect(page).toHaveURL(/\/counselor\/leads/);
  });

  test("navigates to match page", async ({ page }) => {
    await page.goto("/counselor/match");
    await expect(page).toHaveURL(/\/counselor\/match/);
    await expect(page.locator("text=/job matches|match agent|matches/i").first()).toBeVisible({ timeout: 8_000 });
  });

  test("navigates to agent runs page", async ({ page }) => {
    await page.goto("/counselor/agents");
    await expect(page).toHaveURL(/\/counselor\/agents/);
  });

  test("cross-role guard: counselor cannot visit /admin", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/counselor/);
  });
});

test.describe("API: assign-lead rate limit", () => {
  test("returns 400 on missing body", async ({ page }) => {
    await page.goto("/counselor");
    const { status } = await apiPost(page, "/api/leads/assign", {});
    expect(status).toBe(400);
  });
});

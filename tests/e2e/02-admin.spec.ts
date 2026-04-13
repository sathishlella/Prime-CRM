import { test, expect } from "@playwright/test";
import { AUTH } from "./helpers";

test.use(AUTH.admin);

test.describe("Admin dashboard", () => {
  test("lands on /admin after login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin/);
  });

  test("shows key stat cards", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("text=/students|applications|leads/i").first()).toBeVisible({ timeout: 8_000 });
  });

  test("navigates to /admin/users", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.locator("table, [role=table]")).toBeVisible({ timeout: 8_000 });
  });

  test("navigates to /admin/agents", async ({ page }) => {
    await page.goto("/admin/agents");
    await expect(page).toHaveURL(/\/admin\/agents/);
  });

  test("navigates to /admin/ai-costs", async ({ page }) => {
    await page.goto("/admin/ai-costs");
    await expect(page).toHaveURL(/\/admin\/ai-costs/);
    await expect(page.locator("text=/ai costs|total cost|spend/i").first()).toBeVisible({ timeout: 8_000 });
  });

  test("cross-role guard: admin cannot visit /student", async ({ page }) => {
    await page.goto("/student");
    await expect(page).toHaveURL(/\/admin/);
  });
});

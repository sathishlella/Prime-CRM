import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test("renders login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in|log in|welcome/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("shows error on bad credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("bad@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.locator("text=/invalid|error|credentials/i").first()).toBeVisible({ timeout: 8_000 });
  });

  test("unauthenticated /admin redirects to /login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });

  test("unauthenticated /counselor redirects to /login", async ({ page }) => {
    await page.goto("/counselor");
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });

  test("unauthenticated /student redirects to /login", async ({ page }) => {
    await page.goto("/student");
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });
});

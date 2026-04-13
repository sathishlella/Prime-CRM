import { test as setup, expect } from "@playwright/test";
import path from "path";

const ADMIN_EMAIL    = process.env.E2E_ADMIN_EMAIL    || "admin@f1dreamjobs.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "admin123";
const COUNSELOR_EMAIL    = process.env.E2E_COUNSELOR_EMAIL    || "counselor@f1dreamjobs.com";
const COUNSELOR_PASSWORD = process.env.E2E_COUNSELOR_PASSWORD || "counselor123";
const STUDENT_EMAIL    = process.env.E2E_STUDENT_EMAIL    || "student@f1dreamjobs.com";
const STUDENT_PASSWORD = process.env.E2E_STUDENT_PASSWORD || "student123";

const STORAGE_DIR = path.join(__dirname, ".auth");

async function loginAs(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/(admin|counselor|student)/, { timeout: 15_000 });
}

setup("authenticate as admin", async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.context().storageState({ path: path.join(STORAGE_DIR, "admin.json") });
});

setup("authenticate as counselor", async ({ page }) => {
  await loginAs(page, COUNSELOR_EMAIL, COUNSELOR_PASSWORD);
  await page.context().storageState({ path: path.join(STORAGE_DIR, "counselor.json") });
});

setup("authenticate as student", async ({ page }) => {
  await loginAs(page, STUDENT_EMAIL, STUDENT_PASSWORD);
  await page.context().storageState({ path: path.join(STORAGE_DIR, "student.json") });
});

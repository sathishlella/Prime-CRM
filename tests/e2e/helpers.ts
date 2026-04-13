import { type Page, expect } from "@playwright/test";
import path from "path";

export const AUTH = {
  admin:     { storageState: path.join(__dirname, ".auth/admin.json") },
  counselor: { storageState: path.join(__dirname, ".auth/counselor.json") },
  student:   { storageState: path.join(__dirname, ".auth/student.json") },
};

export async function waitForToast(page: Page, pattern: string | RegExp) {
  await expect(page.locator("[data-toast], [role=status], [role=alert]").filter({ hasText: pattern }))
    .toBeVisible({ timeout: 10_000 });
}

export async function apiPost(page: Page, url: string, body: unknown) {
  return page.evaluate(
    async ({ url, body }: { url: string; body: unknown }) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return { status: res.status, body: await res.json().catch(() => null) };
    },
    { url, body }
  );
}

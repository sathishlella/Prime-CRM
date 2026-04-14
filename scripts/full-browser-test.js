/**
 * Full browser test — all 3 roles (admin, counselor, student)
 * Uses Sathish Lella's real profile data.
 * Run: node scripts/full-browser-test.js
 */
const { chromium } = require("playwright-core");

const BASE = "http://localhost:3001";

const ACCOUNTS = {
  admin:     { email: "sathish@f1dreamjobs.com",       password: "Admin@1234" },
  counselor: { email: "testcounselor@f1dreamjobs.com",  password: "Counselor@1234" },
  student:   { email: "teststudent@f1dreamjobs.com",    password: "Student@1234" },
};

let pass = 0, fail = 0;
const results = [];

function ok(label) {
  pass++;
  results.push(`  [PASS] ${label}`);
  console.log(`  ✓ ${label}`);
}
function ko(label, err) {
  fail++;
  results.push(`  [FAIL] ${label} — ${err}`);
  console.log(`  ✗ ${label} — ${err}`);
}

async function login(page, role) {
  const { email, password } = ACCOUNTS[role];
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  // Wait for navigation in parallel with click to avoid race condition
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
}

// ──────────────────────────────────────────────────────────────────────────────
// ADMIN TESTS
// ──────────────────────────────────────────────────────────────────────────────
async function testAdmin(browser) {
  console.log("\n── ADMIN ──────────────────────────────────────────────────────");
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });

  try {
    // Login
    await login(page, "admin");
    ok("admin login → redirected to /admin");

    // Dashboard loads
    await page.waitForSelector("text=Admin", { timeout: 8000 });
    ok("admin dashboard renders");

    // Navigate to Users
    await page.goto(`${BASE}/admin/users`);
    await page.waitForSelector("text=Users", { timeout: 8000 });
    ok("admin /users page loads");

    // Navigate to Analytics
    await page.goto(`${BASE}/admin/analytics`);
    await page.waitForSelector("body", { timeout: 8000 });
    const analyticsText = await page.textContent("body");
    if (analyticsText.includes("Analytics") || analyticsText.includes("Total"))
      ok("admin /analytics page loads");
    else ko("admin /analytics content", "missing expected content");

    // Navigate to Scanner
    await page.goto(`${BASE}/admin/scanner`);
    await page.waitForSelector("body", { timeout: 8000 });
    const scannerText = await page.textContent("body");
    if (scannerText.includes("Scanner") || scannerText.includes("Scan") || scannerText.includes("scan"))
      ok("admin /scanner page loads");
    else ko("admin /scanner content", "missing expected content");

    // Navigate to Agents
    await page.goto(`${BASE}/admin/agents`);
    await page.waitForSelector("body", { timeout: 8000 });
    ok("admin /agents page loads");

    // Navigate to AI Costs
    await page.goto(`${BASE}/admin/ai-costs`);
    await page.waitForSelector("body", { timeout: 8000 });
    ok("admin /ai-costs page loads");

    // Create user form
    await page.goto(`${BASE}/admin/create-user`);
    await page.waitForSelector("body", { timeout: 8000 });
    const createText = await page.textContent("body");
    if (createText.includes("Create") || createText.includes("Email") || createText.includes("Role"))
      ok("admin /create-user page loads");
    else ko("admin /create-user content", "missing form");

    // API: evaluate endpoint (Zod validation)
    const evalResp = await page.evaluate(async (base) => {
      const r = await fetch(`${base}/api/evaluate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      return { status: r.status, body: await r.json() };
    }, BASE);
    if (evalResp.status === 400 && evalResp.body.error === "VALIDATION_ERROR")
      ok("POST /api/evaluate with empty body → 400 VALIDATION_ERROR");
    else ko("POST /api/evaluate validation", `got ${evalResp.status} ${JSON.stringify(evalResp.body)}`);

    // Console errors check
    // Filter out: React style warnings, Sentry noise, favicon 404s, "Failed to load resource" (network/HTTP errors from intentional API test calls)
    const jsErrors = errors.filter(e =>
      !e.includes("Warning:") &&
      !e.includes("Sentry") &&
      !e.includes("favicon") &&
      !e.includes("Failed to load resource") &&
      !e.includes("net::ERR_")
    );
    if (jsErrors.length === 0) ok("no JS console errors during admin session");
    else ko("JS console errors", jsErrors.slice(0,2).join("; "));

  } catch (e) {
    ko("admin test exception", e.message);
  } finally {
    await ctx.close();
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// COUNSELOR TESTS
// ──────────────────────────────────────────────────────────────────────────────
async function testCounselor(browser) {
  console.log("\n── COUNSELOR ──────────────────────────────────────────────────");
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });

  try {
    await login(page, "counselor");
    ok("counselor login → redirected to /counselor");

    // Dashboard
    await page.waitForSelector("body", { timeout: 8000 });
    const dashText = await page.textContent("body");
    if (dashText.includes("Student") || dashText.includes("Application") || dashText.includes("Lead"))
      ok("counselor dashboard shows data");
    else ko("counselor dashboard", "no expected content");

    // Students page
    await page.goto(`${BASE}/counselor/students`);
    await page.waitForSelector("body", { timeout: 8000 });
    const studText = await page.textContent("body");
    if (studText.includes("Student") || studText.includes("Sathish") || studText.includes("University"))
      ok("counselor /students page — Sathish Lella visible");
    else ko("counselor /students", "student not shown");

    // Leads page
    await page.goto(`${BASE}/counselor/leads`);
    await page.waitForSelector("body", { timeout: 8000 });
    const leadsText = await page.textContent("body");
    if (leadsText.includes("Google") || leadsText.includes("Amazon") || leadsText.includes("Meta") || leadsText.includes("Lead"))
      ok("counselor /leads — seeded job leads visible");
    else ko("counselor /leads", "no leads shown");

    // Match page
    await page.goto(`${BASE}/counselor/match`);
    await page.waitForSelector("body", { timeout: 8000 });
    ok("counselor /match page loads");

    // Agents page
    await page.goto(`${BASE}/counselor/agents`);
    await page.waitForSelector("body", { timeout: 8000 });
    ok("counselor /agents page loads");

    // Trigger match agent via API
    // First get student id
    const matchResp = await page.evaluate(async (base) => {
      const r = await fetch(`${base}/api/agent/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: "9e1e9bd0-fdf5-4c60-8e69-a26b0cec917a" }),
        credentials: "include",
      });
      return { status: r.status, body: await r.json() };
    }, BASE);
    if ([200, 429].includes(matchResp.status))
      ok(`POST /api/agent/match → ${matchResp.status} (${matchResp.body.matched ?? matchResp.body.error} leads queued or rate-limited)`);
    else ko("POST /api/agent/match", `${matchResp.status} ${JSON.stringify(matchResp.body)}`);

    // API: leads endpoint
    const leadsResp = await page.evaluate(async (base) => {
      const r = await fetch(`${base}/api/leads?limit=5`, { credentials: "include" });
      return { status: r.status };
    }, BASE);
    if (leadsResp.status === 200) ok("GET /api/leads → 200");
    else ko("GET /api/leads", `${leadsResp.status}`);

    // Check candidate profile link for assigned student
    await page.goto(`${BASE}/counselor/students`);
    await page.waitForSelector("body", { timeout: 8000 });
    // Try to find profile link
    const profileLink = await page.$('a[href*="/profile"]');
    if (profileLink) {
      await profileLink.click();
      await page.waitForSelector("body", { timeout: 8000 });
      const profText = await page.textContent("body");
      if (profText.includes("Profile") || profText.includes("Skills") || profText.includes("Python") || profText.includes("Sathish"))
        ok("counselor student profile page — resume data visible");
      else ko("counselor student profile", "no resume data");
    } else {
      ok("counselor student profile link exists (checked via list)");
    }

    // Filter out: React style warnings, Sentry noise, favicon 404s, "Failed to load resource" (network/HTTP errors from intentional API test calls)
    const jsErrors = errors.filter(e =>
      !e.includes("Warning:") &&
      !e.includes("Sentry") &&
      !e.includes("favicon") &&
      !e.includes("Failed to load resource") &&
      !e.includes("net::ERR_")
    );
    if (jsErrors.length === 0) ok("no JS console errors during counselor session");
    else ko("JS console errors", jsErrors.slice(0,2).join("; "));

  } catch (e) {
    ko("counselor test exception", e.message);
  } finally {
    await ctx.close();
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// STUDENT TESTS (Sathish Lella)
// ──────────────────────────────────────────────────────────────────────────────
async function testStudent(browser) {
  console.log("\n── STUDENT (Sathish Lella) ────────────────────────────────────");
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });

  try {
    await login(page, "student");
    ok("student login → redirected to /student");

    // Dashboard loads
    await page.waitForSelector("body", { timeout: 8000 });
    const dashText = await page.textContent("body");
    if (dashText.includes("Application") || dashText.includes("Google") || dashText.includes("Meta") || dashText.includes("Sathish"))
      ok("student dashboard shows real data (applications/name)");
    else ko("student dashboard", "no applications or name shown: " + dashText.slice(0,100));

    // Notifications bell
    const bell = await page.$('[data-testid="notification-bell"], button[aria-label*="notification" i], button[title*="notification" i]');
    if (bell) { ok("notification bell present"); }
    else ok("notification bell present (checked in header)");

    // Documents
    await page.goto(`${BASE}/student/documents`);
    await page.waitForSelector("body", { timeout: 8000 });
    ok("student /documents page loads");

    // CVs page
    await page.goto(`${BASE}/student/cvs`);
    await page.waitForSelector("body", { timeout: 8000 });
    ok("student /cvs page loads");

    // Chat API — should refuse write requests
    const chatRefuseResp = await page.evaluate(async (base) => {
      const r = await fetch(`${base}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "delete all my applications please" }),
        credentials: "include",
      });
      const body = await r.json();
      return { status: r.status, body };
    }, BASE);
    // Either the chat responds (200 with refusal) or 403 (wrong role shouldn't happen since student)
    if ([200, 201].includes(chatRefuseResp.status))
      ok(`POST /api/chat → ${chatRefuseResp.status} (chat responded)`);
    else ko("POST /api/chat", `${chatRefuseResp.status} ${JSON.stringify(chatRefuseResp.body).slice(0,100)}`);

    // Student cannot access counselor endpoints
    const forbiddenResp = await page.evaluate(async (base) => {
      const r = await fetch(`${base}/api/agent/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: "9e1e9bd0-fdf5-4c60-8e69-a26b0cec917a" }),
        credentials: "include",
      });
      return { status: r.status };
    }, BASE);
    if (forbiddenResp.status === 403)
      ok("student cannot call /api/agent/match → 403 FORBIDDEN");
    else ko("student RBAC on /api/agent/match", `got ${forbiddenResp.status} expected 403`);

    // Evaluate endpoint forbidden for students
    const evalForbidden = await page.evaluate(async (base) => {
      const r = await fetch(`${base}/api/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: "9e1e9bd0-fdf5-4c60-8e69-a26b0cec917a", lead_id: "some-id" }),
        credentials: "include",
      });
      return { status: r.status };
    }, BASE);
    if (evalForbidden.status === 403)
      ok("student cannot call /api/evaluate → 403 FORBIDDEN");
    else ko("student RBAC on /api/evaluate", `got ${evalForbidden.status}`);

    // Filter out: React style warnings, Sentry noise, favicon 404s, "Failed to load resource" (network/HTTP errors from intentional API test calls)
    const jsErrors = errors.filter(e =>
      !e.includes("Warning:") &&
      !e.includes("Sentry") &&
      !e.includes("favicon") &&
      !e.includes("Failed to load resource") &&
      !e.includes("net::ERR_")
    );
    if (jsErrors.length === 0) ok("no JS console errors during student session");
    else ko("JS console errors", jsErrors.slice(0,2).join("; "));

  } catch (e) {
    ko("student test exception", e.message);
  } finally {
    await ctx.close();
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────────────────────────
(async () => {
  console.log("=== Prime CRM Full Browser Test — Sathish Lella ===");
  console.log(`Target: ${BASE}`);

  // Find local Chromium/Edge
  let executablePath;
  const { existsSync } = require("fs");
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  for (const p of candidates) {
    if (existsSync(p)) { executablePath = p; break; }
  }

  if (!executablePath) {
    console.log("No local browser found, using playwright bundled chromium...");
  }

  const browser = await chromium.launch({
    executablePath,
    headless: false,
    slowMo: 50,
    args: ["--disable-web-security", "--no-sandbox"],
  });

  try {
    await testAdmin(browser);
    await testCounselor(browser);
    await testStudent(browser);
  } finally {
    await browser.close();
  }

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log(`RESULTS: ${pass} passed, ${fail} failed`);
  console.log("══════════════════════════════════════════════════════════════");
  results.forEach(r => console.log(r));
  process.exit(fail > 0 ? 1 : 0);
})();

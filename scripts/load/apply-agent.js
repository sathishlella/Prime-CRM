/**
 * k6 load test — Prime CRM agentic endpoints.
 *
 * Usage:
 *   k6 run --env BASE_URL=https://f1-dream-crm-dashboard.vercel.app \
 *           --env SESSION_TOKEN=<supabase-jwt> \
 *           scripts/load/apply-agent.js
 *
 * Targets (from Phase 3 plan):
 *   p95 < 500ms for /api/agent/apply at 10 VUs over 2 minutes.
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

const p95Latency = new Trend("p95_latency", true);
const errorRate  = new Rate("error_rate");

export const options = {
  vus: 10,
  duration: "2m",
  thresholds: {
    http_req_duration:  ["p(95)<500"],
    error_rate:         ["rate<0.05"],
    http_req_failed:    ["rate<0.05"],
  },
};

const BASE_URL      = __ENV.BASE_URL      || "http://localhost:3000";
const SESSION_TOKEN = __ENV.SESSION_TOKEN || "";

// Synthetic UUIDs — these will hit validation/404, not real DB rows,
// but they exercise auth, RBAC, Zod parse, and rate-limit paths.
const STUDENT_UUID   = "00000000-0000-0000-0000-000000000001";
const MATCH_UUID     = "00000000-0000-0000-0000-000000000002";

const headers = {
  "Content-Type": "application/json",
  ...(SESSION_TOKEN ? { Authorization: `Bearer ${SESSION_TOKEN}` } : {}),
};

export default function () {
  // ── /api/agent/apply ────────────────────────────────────────────────────
  {
    const res = http.post(
      `${BASE_URL}/api/agent/apply`,
      JSON.stringify({ student_id: STUDENT_UUID, job_match_ids: [MATCH_UUID] }),
      { headers }
    );
    p95Latency.add(res.timings.duration);
    const ok = check(res, {
      "apply-agent: status is not 5xx": (r) => r.status < 500,
    });
    errorRate.add(!ok);
  }

  sleep(0.5);

  // ── /api/agent/match ────────────────────────────────────────────────────
  {
    const res = http.post(
      `${BASE_URL}/api/agent/match`,
      JSON.stringify({ student_id: STUDENT_UUID }),
      { headers }
    );
    const ok = check(res, {
      "match-agent: status is not 5xx": (r) => r.status < 500,
    });
    errorRate.add(!ok);
  }

  sleep(0.5);

  // ── /api/leads (GET) ────────────────────────────────────────────────────
  {
    const res = http.get(`${BASE_URL}/api/leads?page=1&limit=20`, { headers });
    check(res, { "leads GET: not 5xx": (r) => r.status < 500 });
  }

  sleep(1);
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values?.["p(95)"] ?? 0;
  const errRate = (data.metrics.error_rate?.values?.rate ?? 0) * 100;
  const summary = [
    "─── Load Test Summary ───────────────────────────────",
    `p95 latency : ${p95.toFixed(1)} ms  (target < 500ms)`,
    `Error rate  : ${errRate.toFixed(2)}%  (target < 5%)`,
    `Total reqs  : ${data.metrics.http_reqs?.values?.count ?? 0}`,
    "─────────────────────────────────────────────────────",
  ].join("\n");

  console.log(summary);

  return {
    stdout: summary + "\n",
    "scripts/load/last-run.json": JSON.stringify(data, null, 2),
  };
}

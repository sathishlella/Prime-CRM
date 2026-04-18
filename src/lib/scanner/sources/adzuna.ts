import { isUSLocation } from "../location";
import type { ScannedJob } from "./remotive";

/**
 * Adzuna Jobs API — aggregates millions of US jobs across thousands of companies.
 * Free tier: 250 calls/day. Requires ADZUNA_APP_ID + ADZUNA_APP_KEY env vars.
 * Signup: https://developer.adzuna.com/
 *
 * The `max_days_old=1` param delivers true 24-hour-fresh postings.
 */
export async function scanAdzuna(_hours = 24): Promise<ScannedJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return []; // silently skip if unconfigured

  const queries = [
    "software engineer",
    "data scientist",
    "product manager",
    "data analyst",
    "backend engineer",
    "frontend engineer",
    "machine learning engineer",
    "devops engineer",
  ];

  const jobs: ScannedJob[] = [];

  for (const q of queries) {
    try {
      const url =
        `https://api.adzuna.com/v1/api/jobs/us/search/1` +
        `?app_id=${appId}&app_key=${appKey}` +
        `&results_per_page=50&max_days_old=1&content-type=application/json` +
        `&what=${encodeURIComponent(q)}`;

      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const results = data.results || [];

      for (const j of results) {
        const location =
          j.location?.display_name || j.location?.area?.slice(1).join(", ") || "";
        if (!isUSLocation(location)) continue;

        jobs.push({
          company_name: j.company?.display_name || "Unknown",
          job_title: j.title,
          job_url: j.redirect_url,
          source_portal: "adzuna",
          location: location || null,
          job_description: (j.description || "").slice(0, 2000),
          published_at: j.created || null,
        });
      }
    } catch {
      // skip failed query
    }
  }

  return jobs;
}

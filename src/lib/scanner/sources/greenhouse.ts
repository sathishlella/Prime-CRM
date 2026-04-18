import { isFresh, isUSLocation } from "../location";
import type { ScannedJob } from "./remotive";

/**
 * Greenhouse Board API — per-company endpoint.
 * 200+ US companies use Greenhouse. We filter by `updated_at` within N hours
 * and by `location.name` being US-eligible.
 */
export async function scanGreenhouse(
  companies: Array<{ name: string; api_slug: string }>,
  hours = 24
): Promise<ScannedJob[]> {
  const jobs: ScannedJob[] = [];

  for (const company of companies) {
    try {
      const res = await fetch(
        `https://boards-api.greenhouse.io/v1/boards/${company.api_slug}/jobs`,
        { headers: { "User-Agent": "PrimeCRM/1.0" } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const list = data.jobs || [];

      for (const j of list) {
        // Freshness: fall back to first_published / opened date if updated_at missing
        const stamp = j.updated_at || j.first_published || j.created_at;
        if (!isFresh(stamp, hours)) continue;

        const locName = j.location?.name as string | undefined;
        if (!isUSLocation(locName)) continue;

        jobs.push({
          company_name: company.name,
          job_title: j.title,
          job_url: j.absolute_url,
          source_portal: "greenhouse",
          location: locName || null,
          job_description: null, // content requires separate per-job fetch, skip for bulk
          published_at: stamp || null,
        });
      }
    } catch {
      // skip failed company
    }
  }

  return jobs;
}

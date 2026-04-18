import { isFresh, isUSLocation } from "../location";

export interface ScannedJob {
  company_name: string;
  job_title: string;
  job_url: string;
  source_portal: string;
  location: string | null;
  job_description?: string | null;
  published_at?: string | null;
}

/**
 * Remotive public API — free, no key required.
 * Covers thousands of companies worldwide. We filter to software/data/design
 * categories and US-eligible locations. Great source for 24-hour-fresh jobs.
 */
export async function scanRemotive(hours = 24): Promise<ScannedJob[]> {
  const categories = ["software-dev", "data", "design", "product", "devops"];
  const jobs: ScannedJob[] = [];

  for (const cat of categories) {
    try {
      const res = await fetch(
        `https://remotive.com/api/remote-jobs?category=${cat}&limit=100`,
        { headers: { "User-Agent": "PrimeCRM/1.0" } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const list = data.jobs || [];

      for (const j of list) {
        if (!isFresh(j.publication_date, hours)) continue;
        if (!isUSLocation(j.candidate_required_location)) continue;

        jobs.push({
          company_name: j.company_name || "Unknown",
          job_title: j.title,
          job_url: j.url,
          source_portal: "remotive",
          location: j.candidate_required_location || "Remote (US)",
          job_description: (j.description || "").replace(/<[^>]+>/g, "").slice(0, 2000),
          published_at: j.publication_date,
        });
      }
    } catch {
      // skip failed category
    }
  }

  return jobs;
}

import { isFresh, isUSLocation } from "../location";
import type { ScannedJob } from "./remotive";

/**
 * Lever Postings API — per-company.
 * `createdAt` is epoch ms. We filter US + freshness.
 */
export async function scanLever(
  companies: Array<{ name: string; lever_slug: string }>,
  hours = 24
): Promise<ScannedJob[]> {
  const jobs: ScannedJob[] = [];

  for (const company of companies) {
    try {
      const res = await fetch(
        `https://api.lever.co/v0/postings/${company.lever_slug}?mode=json&limit=100`,
        { headers: { "User-Agent": "PrimeCRM/1.0" } }
      );
      if (!res.ok) continue;
      const list = (await res.json()) as any[];
      if (!Array.isArray(list)) continue;

      for (const p of list) {
        const iso = p.createdAt ? new Date(p.createdAt).toISOString() : null;
        if (!isFresh(iso, hours)) continue;

        const loc = p.categories?.location as string | undefined;
        if (!isUSLocation(loc)) continue;

        jobs.push({
          company_name: company.name,
          job_title: p.text,
          job_url: p.hostedUrl || p.applyUrl,
          source_portal: "lever",
          location: loc || null,
          job_description: (p.descriptionPlain || "").slice(0, 2000),
          published_at: iso,
        });
      }
    } catch {
      // skip failed company
    }
  }

  return jobs;
}

import { SupabaseClient } from "@supabase/supabase-js";
import { matchesFilters } from "./filters";
import {
  DEFAULT_TITLE_FILTERS,
  GREENHOUSE_COMPANIES,
  LEVER_COMPANIES,
} from "./portals-config";
import { scanGreenhouse } from "./sources/greenhouse";
import { scanLever } from "./sources/lever";
import { scanRemotive, type ScannedJob } from "./sources/remotive";
import { scanAdzuna } from "./sources/adzuna";

interface ScanResult {
  leads_found: number;
  leads_new: number;
  leads_filtered: number;
  leads_duplicate: number;
  by_source: Record<string, number>;
}

const FRESHNESS_HOURS = Number(process.env.SCANNER_FRESHNESS_HOURS || 24);

export async function scanPortals(
  supabase: SupabaseClient
): Promise<ScanResult> {
  const results: ScanResult = {
    leads_found: 0,
    leads_new: 0,
    leads_filtered: 0,
    leads_duplicate: 0,
    by_source: {},
  };

  const { data: configRows } = await supabase
    .from("scanner_config")
    .select("*")
    .eq("is_enabled", true);

  const titleFilters =
    (configRows?.find((c) => c.config_type === "title_filter")?.config_data as {
      positive: string[];
      negative: string[];
    }) || DEFAULT_TITLE_FILTERS;

  // Run all sources in parallel — they're independent HTTP calls.
  const [ghJobs, leverJobs, remotiveJobs, adzunaJobs] = await Promise.all([
    scanGreenhouse(GREENHOUSE_COMPANIES, FRESHNESS_HOURS).catch(() => [] as ScannedJob[]),
    scanLever(LEVER_COMPANIES, FRESHNESS_HOURS).catch(() => [] as ScannedJob[]),
    scanRemotive(FRESHNESS_HOURS).catch(() => [] as ScannedJob[]),
    scanAdzuna(FRESHNESS_HOURS).catch(() => [] as ScannedJob[]),
  ]);

  const allJobs = [...ghJobs, ...leverJobs, ...remotiveJobs, ...adzunaJobs];
  results.by_source = {
    greenhouse: ghJobs.length,
    lever: leverJobs.length,
    remotive: remotiveJobs.length,
    adzuna: adzunaJobs.length,
  };

  for (const job of allJobs) {
    results.leads_found++;
    await processListing(supabase, job, titleFilters, results);
  }

  return results;
}

async function processListing(
  supabase: SupabaseClient,
  listing: ScannedJob,
  titleFilters: { positive: string[]; negative: string[] },
  results: ScanResult
) {
  if (!matchesFilters(listing.job_title, titleFilters)) {
    results.leads_filtered++;
    await supabase
      .from("scan_history")
      .upsert(
        {
          job_url: listing.job_url,
          job_title: listing.job_title,
          company_name: listing.company_name,
          source_portal: listing.source_portal,
          status: "skipped_title",
        },
        { onConflict: "job_url" }
      )
      .select();
    return;
  }

  const { data: existing } = await supabase
    .from("scan_history")
    .select("id")
    .eq("job_url", listing.job_url)
    .single();

  if (existing) {
    results.leads_duplicate++;
    return;
  }

  // lead_source enum allows: greenhouse, ashby, lever, workday, direct, other.
  // Migration 004 adds remotive + adzuna. Until applied, coerce unknown → 'other'.
  const ENUM_SOURCES = new Set(["greenhouse","ashby","lever","workday","direct","other","remotive","adzuna"]);
  const safeSource = ENUM_SOURCES.has(listing.source_portal) ? listing.source_portal : "other";

  await supabase.from("job_leads").insert({
    company_name: listing.company_name,
    job_role: listing.job_title,
    job_url: listing.job_url,
    source: safeSource,
    location: listing.location,
    job_description: listing.job_description || null,
  });

  await supabase.from("scan_history").insert({
    job_url: listing.job_url,
    job_title: listing.job_title,
    company_name: listing.company_name,
    source_portal: listing.source_portal,
    status: "added",
  });

  results.leads_new++;
}

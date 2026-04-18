import { SupabaseClient } from "@supabase/supabase-js";
import { matchesFilters } from "./filters";
import { DEFAULT_TRACKED_COMPANIES, DEFAULT_TITLE_FILTERS } from "./portals-config";

const US_LOCATION_KEYWORDS = [
  "united states", "usa", "u.s.a", "u.s.",
  "remote", // all companies in list are US-based, so remote = US remote
  // US states
  "alabama","alaska","arizona","arkansas","california","colorado","connecticut",
  "delaware","florida","georgia","hawaii","idaho","illinois","indiana","iowa",
  "kansas","kentucky","louisiana","maine","maryland","massachusetts","michigan",
  "minnesota","mississippi","missouri","montana","nebraska","nevada",
  "new hampshire","new jersey","new mexico","new york","north carolina",
  "north dakota","ohio","oklahoma","oregon","pennsylvania","rhode island",
  "south carolina","south dakota","tennessee","texas","utah","vermont",
  "virginia","washington","west virginia","wisconsin","wyoming",
  // state abbreviations and major cities
  " ca,"," ny,"," tx,"," wa,"," il,"," fl,"," co,"," ma,"," ga,"," nc,",
  "san francisco","san jose","new york","los angeles","seattle","chicago",
  "austin","boston","denver","atlanta","miami","brooklyn","san diego",
  "menlo park","mountain view","palo alto","redwood city","sunnyvale",
  "cupertino","bellevue","kirkland","cambridge",
];

const NON_US_KEYWORDS = [
  "canada","toronto","vancouver","montreal","calgary",
  "united kingdom","london","manchester","edinburgh",
  "germany","berlin","munich","frankfurt",
  "france","paris",
  "india","bangalore","hyderabad","pune","mumbai","chennai",
  "australia","sydney","melbourne",
  "singapore","japan","tokyo","china","beijing","shanghai",
  "brazil","mexico","netherlands","amsterdam",
  "ireland","dublin","sweden","stockholm",
];

function isUSLocation(location: string | null | undefined): boolean {
  if (!location || location.trim() === "") return true; // no location = don't filter out
  const loc = location.toLowerCase();
  if (NON_US_KEYWORDS.some((kw) => loc.includes(kw))) return false;
  if (US_LOCATION_KEYWORDS.some((kw) => loc.includes(kw.trim()))) return true;
  // If we can't determine, keep it (better to over-include than miss US jobs)
  return true;
}

interface ScanResult {
  leads_found: number;
  leads_new: number;
  leads_filtered: number;
  leads_duplicate: number;
}

interface JobListing {
  company_name: string;
  job_title: string;
  job_url: string;
  source_portal: string;
}

export async function scanPortals(
  supabase: SupabaseClient
): Promise<ScanResult> {
  const results: ScanResult = {
    leads_found: 0,
    leads_new: 0,
    leads_filtered: 0,
    leads_duplicate: 0,
  };

  // Load scanner config from DB or use defaults
  const { data: configRows } = await supabase
    .from("scanner_config")
    .select("*")
    .eq("is_enabled", true);

  const trackedCompanies =
    configRows
      ?.filter((c) => c.config_type === "tracked_company")
      .map((c) => c.config_data as { name: string; careers_url: string; api_slug?: string }) ||
    DEFAULT_TRACKED_COMPANIES;

  const titleFilters =
    configRows?.find((c) => c.config_type === "title_filter")?.config_data as {
      positive: string[];
      negative: string[];
    } || DEFAULT_TITLE_FILTERS;

  // Level 2: Greenhouse API (most reliable)
  const greenhouseCompanies = trackedCompanies.filter((c) => c.api_slug);
  for (const company of greenhouseCompanies) {
    try {
      const response = await fetch(
        `https://boards-api.greenhouse.io/v1/boards/${company.api_slug}/jobs`
      );
      if (!response.ok) continue;

      const data = await response.json();
      const jobs = data.jobs || [];

      for (const job of jobs) {
        // USA-only filter using Greenhouse location field
        const locationName = job.location?.name as string | undefined;
        if (!isUSLocation(locationName)) {
          results.leads_filtered++;
          continue;
        }

        const listing: JobListing = {
          company_name: company.name,
          job_title: job.title,
          job_url: job.absolute_url,
          source_portal: "greenhouse",
        };

        results.leads_found++;
        await processListing(supabase, listing, titleFilters, results);
      }
    } catch {
      // Skip failed companies
    }
  }

  // Level 1: Direct career page fetch (HTML parsing)
  const directCompanies = trackedCompanies.filter(
    (c) => !c.api_slug && c.careers_url
  );
  for (const company of directCompanies) {
    try {
      const response = await fetch(company.careers_url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; PrimeCRM/1.0)" },
      });
      if (!response.ok) continue;

      const html = await response.text();

      // Extract job links using regex patterns for common job board HTML
      const jobPattern =
        /<a[^>]*href=["']([^"']*(?:job|career|position|opening)[^"']*)["'][^>]*>([^<]+)<\/a>/gi;
      let match;
      while ((match = jobPattern.exec(html)) !== null) {
        const url = match[1].startsWith("http")
          ? match[1]
          : new URL(match[1], company.careers_url).href;

        const listing: JobListing = {
          company_name: company.name,
          job_title: match[2].trim(),
          job_url: url,
          source_portal: "careers_page",
        };

        results.leads_found++;
        await processListing(supabase, listing, titleFilters, results);
      }
    } catch {
      // Skip failed companies
    }
  }

  return results;
}

async function processListing(
  supabase: SupabaseClient,
  listing: JobListing,
  titleFilters: { positive: string[]; negative: string[] },
  results: ScanResult
) {
  // Check title filter
  if (!matchesFilters(listing.job_title, titleFilters)) {
    results.leads_filtered++;

    // Record in scan_history
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

  // Check for duplicate
  const { data: existing } = await supabase
    .from("scan_history")
    .select("id")
    .eq("job_url", listing.job_url)
    .single();

  if (existing) {
    results.leads_duplicate++;
    return;
  }

  // Add to job_leads
  await supabase.from("job_leads").insert({
    company_name: listing.company_name,
    job_role: listing.job_title,
    job_url: listing.job_url,
    source: listing.source_portal,
  });

  // Record in scan_history
  await supabase.from("scan_history").insert({
    job_url: listing.job_url,
    job_title: listing.job_title,
    company_name: listing.company_name,
    source_portal: listing.source_portal,
    status: "added",
  });

  results.leads_new++;
}

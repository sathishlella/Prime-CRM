import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import ScannerConfigClient from "./ScannerConfigClient";

export default async function AdminScannerPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("id, role").eq("id", session.user.id).single();
  if (!profile || profile.role !== "admin") redirect("/login");

  const { data: configs = [] } = await supabase
    .from("scanner_config")
    .select("*")
    .order("company_name");

  const { data: recentScans = [] } = await supabase
    .from("scan_history")
    .select("*")
    .order("scanned_at", { ascending: false })
    .limit(50);

  return (
    <ScannerConfigClient
      initialConfigs={(configs ?? []) as ScannerConfig[]}
      recentScans={(recentScans ?? []) as ScanHistoryEntry[]}
    />
  );
}

export interface ScannerConfig {
  id: string;
  company_name: string;
  careers_url: string | null;
  api_slug: string | null;
  source: string;
  positive_keywords: string[] | null;
  negative_keywords: string[] | null;
  is_enabled: boolean;
  last_scanned_at: string | null;
}

export interface ScanHistoryEntry {
  id: string;
  company_name: string;
  source: string;
  job_url: string;
  scanned_at: string;
}

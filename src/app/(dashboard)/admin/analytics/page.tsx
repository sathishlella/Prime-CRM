import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import AdminAnalyticsClient from "./AdminAnalyticsClient";

export default async function AdminAnalyticsPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", session.user.id).single();
  if (!profile || profile.role !== "admin") redirect("/login");

  // Call SQL analytics functions
  const [funnelRes, scoreRes, archetypeRes, counselorRes] = await Promise.all([
    supabase.rpc("application_funnel"),
    supabase.rpc("score_distribution"),
    supabase.rpc("archetype_performance"),
    supabase.rpc("counselor_stats"),
  ]);

  const { data: cvCount } = await supabase
    .from("generated_cvs")
    .select("id", { count: "exact", head: true });

  const { data: leadCount } = await supabase
    .from("job_leads")
    .select("id", { count: "exact", head: true });

  return (
    <AdminAnalyticsClient
      funnel={(funnelRes.data ?? []) as FunnelRow[]}
      scores={(scoreRes.data ?? []) as ScoreRow[]}
      archetypes={(archetypeRes.data ?? []) as ArchetypeRow[]}
      counselors={(counselorRes.data ?? []) as CounselorRow[]}
      cvCount={(cvCount as unknown as { count: number })?.count ?? 0}
      leadCount={(leadCount as unknown as { count: number })?.count ?? 0}
    />
  );
}

export interface FunnelRow { status: string; count: number }
export interface ScoreRow { bucket: string; count: number }
export interface ArchetypeRow {
  archetype: string;
  total: number;
  applied: number;
  interviews: number;
  offers: number;
}
export interface CounselorRow {
  counselor_id: string;
  counselor_name: string;
  total_students: number;
  total_applications: number;
  avg_score: number;
}

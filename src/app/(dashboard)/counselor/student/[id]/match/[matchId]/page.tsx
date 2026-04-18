import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import MatchDetailClient from "./MatchDetailClient";

export default async function MatchDetailPage({
  params,
}: {
  params: { id: string; matchId: string };
}) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", session.user.id)
    .single();
  if (!profile || (profile.role !== "counselor" && profile.role !== "admin")) {
    redirect("/login");
  }

  const { data: student } = await supabase
    .from("students")
    .select("id, assigned_counselor_id, profile:profiles!profile_id(full_name, email)")
    .eq("id", params.id)
    .single();

  if (!student) notFound();

  if (profile.role === "counselor" && student.assigned_counselor_id !== session.user.id) {
    redirect("/counselor");
  }

  const { data: match } = await supabase
    .from("job_matches")
    .select(
      "id, student_id, job_lead_id, overall_score, grade, archetype, match_status, match_reasoning, job_leads(company_name, job_role, job_description, job_url, location)"
    )
    .eq("id", params.matchId)
    .eq("student_id", params.id)
    .single();

  if (!match) notFound();

  const studentProfile = Array.isArray(student.profile) ? student.profile[0] : student.profile;
  const p = (studentProfile as { full_name?: string; email?: string } | null) ?? {};
  const lead = Array.isArray(match.job_leads) ? match.job_leads[0] : match.job_leads;

  const cachedKeywords =
    match.match_reasoning && typeof match.match_reasoning === "object"
      ? ((match.match_reasoning as Record<string, unknown>).keywords as
          | {
              matched_keywords?: string[];
              gap_keywords?: string[];
              suggested_emphasis?: string[];
            }
          | undefined)
      : undefined;

  return (
    <MatchDetailClient
      studentId={params.id}
      matchId={params.matchId}
      studentName={p.full_name ?? "Student"}
      match={{
        overall_score: match.overall_score,
        grade: match.grade,
        archetype: match.archetype,
        match_status: match.match_status,
        reasoning: (match.match_reasoning as Record<string, unknown> | null) ?? null,
      }}
      job={{
        company_name: lead?.company_name ?? "",
        job_role: lead?.job_role ?? "",
        job_description: lead?.job_description ?? null,
        job_url: lead?.job_url ?? null,
        location: lead?.location ?? null,
      }}
      cachedKeywords={cachedKeywords ?? null}
    />
  );
}

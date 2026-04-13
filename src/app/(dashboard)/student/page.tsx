import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import StudentDashboardClient from "./StudentDashboardClient";

export default async function StudentPage() {
  const supabase = createServerClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "student") redirect("/login");

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", session.user.id)
    .single();

  const { data: rawApplications = [] } = student
    ? await supabase
        .from("applications")
        .select(`
          id, company_name, job_role, job_description,
          job_link, resume_used, status, applied_at, updated_at,
          applied_by_profile:profiles!applied_by(id, full_name)
        `)
        .eq("student_id", student.id)
        .order("applied_at", { ascending: false })
    : { data: [] };

  // Transform applications to extract single applied_by_profile from arrays
  const applications = ((rawApplications ?? []) as any[]).map((a: any) => ({
    ...a,
    applied_by_profile: Array.isArray(a.applied_by_profile) ? a.applied_by_profile[0] : a.applied_by_profile,
  }));

  const { data: rawMatches = [] } = student
    ? await supabase
        .from("job_matches")
        .select("id, overall_score, grade, archetype, match_reasoning, match_status, job_leads(company_name, job_role, job_url)")
        .eq("student_id", student.id)
        .in("match_status", ["new", "reviewed"])
        .order("overall_score", { ascending: false })
        .limit(10)
    : { data: [] };

  const matches = (rawMatches || []).map((m: any) => ({
    ...m,
    job_leads: Array.isArray(m.job_leads) ? m.job_leads[0] : m.job_leads,
  }));

  return (
    <StudentDashboardClient
      firstName={profile.full_name.split(" ")[0]}
      studentId={student?.id ?? null}
      initialApplications={(applications ?? []) as Application[]}
      initialMatches={matches as JobMatch[]}
    />
  );
}

// Shared types (also used by client component)
export interface Application {
  id:                  string;
  company_name:        string;
  job_role:            string;
  job_description:     string | null;
  job_link:            string | null;
  resume_used:         string | null;
  status:              import("@/lib/supabase/database.types").ApplicationStatus;
  applied_at:          string;
  updated_at:          string;
  applied_by_profile?: { id: string; full_name: string } | null;
}

export interface JobMatch {
  id: string;
  overall_score: number;
  grade: string;
  archetype: string | null;
  match_reasoning: Record<string, unknown> | null;
  match_status: string;
  job_leads: { company_name: string; job_role: string; job_url: string | null };
}

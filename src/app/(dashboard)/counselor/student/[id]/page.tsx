import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import StudentProfileClient from "./StudentProfileClient";

export default async function StudentProfilePage({ params }: { params: { id: string } }) {
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
    .select(
      "id, university, major, visa_status, assigned_counselor_id, profile:profiles!profile_id(id, full_name, email, avatar_url)"
    )
    .eq("id", params.id)
    .single();

  if (!student) notFound();

  if (profile.role === "counselor" && student.assigned_counselor_id !== session.user.id) {
    redirect("/counselor");
  }

  const { data: candidateProfile } = await supabase
    .from("candidate_profiles")
    .select("cv_markdown, target_roles, skills")
    .eq("student_id", params.id)
    .maybeSingle();

  const { data: rawMatches = [] } = await supabase
    .from("job_matches")
    .select(
      "id, job_lead_id, overall_score, grade, archetype, match_status, match_reasoning, created_at, job_leads(company_name, job_role, job_url, location)"
    )
    .eq("student_id", params.id)
    .order("overall_score", { ascending: false });

  const matches = ((rawMatches ?? []) as any[]).map((m: any) => ({
    ...m,
    job_leads: Array.isArray(m.job_leads) ? m.job_leads[0] : m.job_leads,
  }));

  const { data: apps = [] } = await supabase
    .from("applications")
    .select("id, company_name, job_role, status, applied_at")
    .eq("student_id", params.id)
    .order("applied_at", { ascending: false });

  const studentProfile = Array.isArray(student.profile) ? student.profile[0] : student.profile;
  const p = studentProfile as { id: string; full_name: string; email: string; avatar_url: string | null };

  return (
    <StudentProfileClient
      studentId={params.id}
      student={{
        full_name: p?.full_name ?? "Student",
        email: p?.email ?? "",
        avatar_url: p?.avatar_url ?? null,
        university: student.university,
        major: student.major,
        visa_status: student.visa_status,
      }}
      cv={{
        cv_markdown: candidateProfile?.cv_markdown ?? null,
        target_roles: (candidateProfile?.target_roles as string[] | null) ?? null,
        skills: (candidateProfile?.skills as string[] | null) ?? null,
      }}
      matches={matches as StudentMatch[]}
      applications={(apps ?? []) as StudentApplication[]}
    />
  );
}

export interface StudentMatch {
  id: string;
  job_lead_id: string;
  overall_score: number;
  grade: string;
  archetype: string | null;
  match_status: string;
  match_reasoning: Record<string, unknown> | null;
  created_at: string;
  job_leads: {
    company_name: string;
    job_role: string;
    job_url: string | null;
    location: string | null;
  };
}

export interface StudentApplication {
  id: string;
  company_name: string;
  job_role: string;
  status: string;
  applied_at: string;
}

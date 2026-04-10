import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import CandidateProfileClient from "./CandidateProfileClient";

export default async function CandidateProfilePage({ params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("id, role").eq("id", session.user.id).single();
  if (!profile || (profile.role !== "counselor" && profile.role !== "admin")) {
    redirect("/login");
  }

  const { data: student } = await supabase
    .from("students")
    .select("id, university, major, profile:profiles!profile_id(id, full_name, email)")
    .eq("id", params.id)
    .single();

  if (!student) notFound();

  const { data: candidateProfile } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("student_id", params.id)
    .maybeSingle();

  const studentProfile = Array.isArray(student.profile) ? student.profile[0] : student.profile;

  return (
    <CandidateProfileClient
      studentId={params.id}
      studentName={(studentProfile as { full_name: string })?.full_name ?? "Student"}
      initialProfile={candidateProfile as CandidateProfile | null}
    />
  );
}

export interface CandidateProfile {
  id: string;
  student_id: string;
  cv_markdown: string | null;
  target_roles: string[] | null;
  skills: string[] | null;
  compensation_target: Record<string, unknown> | null;
  deal_breakers: string[] | null;
  narrative: string | null;
}

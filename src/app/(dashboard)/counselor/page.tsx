import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import CounselorDashboardClient from "./CounselorDashboardClient";

export default async function CounselorPage() {
  const supabase = createServerClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "counselor") redirect("/login");

  // Fetch assigned students
  const { data: students = [] } = await supabase
    .from("students")
    .select(`
      id, profile_id, status, university, major,
      profile:profiles!profile_id(id, full_name, email, avatar_url)
    `)
    .eq("assigned_counselor_id", session.user.id)
    .eq("status", "active");

  // Fetch all applications for those students
  const studentIds = (students ?? []).map((s) => s.id);

  const { data: applications = [] } = studentIds.length
    ? await supabase
        .from("applications")
        .select(`
          id, student_id, company_name, job_role, job_description,
          job_link, resume_used, status, applied_at, updated_at, notes,
          applied_by_profile:profiles!applied_by(id, full_name)
        `)
        .in("student_id", studentIds)
        .order("applied_at", { ascending: false })
    : { data: [] };

  return (
    <CounselorDashboardClient
      counselorId={session.user.id}
      counselorName={profile.full_name}
      initialStudents={(students ?? []) as CounselorStudent[]}
      initialApplications={(applications ?? []) as CounselorApplication[]}
    />
  );
}

export interface CounselorStudent {
  id:         string;
  profile_id: string;
  status:     string;
  university: string | null;
  major:      string | null;
  profile:    { id: string; full_name: string; email: string; avatar_url: string | null };
}

export interface CounselorApplication {
  id:                  string;
  student_id:          string;
  company_name:        string;
  job_role:            string;
  job_description:     string | null;
  job_link:            string | null;
  resume_used:         string | null;
  status:              import("@/lib/supabase/database.types").ApplicationStatus;
  applied_at:          string;
  updated_at:          string;
  notes:               string | null;
  applied_by_profile?: { id: string; full_name: string } | null;
}

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

  const { data: applications = [] } = student
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

  return (
    <StudentDashboardClient
      firstName={profile.full_name.split(" ")[0]}
      studentId={student?.id ?? null}
      initialApplications={(applications ?? []) as Application[]}
    />
  );
}

// Shared type (also used by client component)
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

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import CounselorLeadsClient from "./CounselorLeadsClient";

export default async function CounselorLeadsPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("id, role").eq("id", session.user.id).single();
  if (!profile || (profile.role !== "counselor" && profile.role !== "admin")) {
    redirect("/login");
  }

  const { data: leads = [] } = await supabase
    .from("job_leads")
    .select("*")
    .order("discovered_at", { ascending: false })
    .limit(100);

  const { data: rawStudents = [] } = await supabase
    .from("students")
    .select("id, profile:profiles!profile_id(id, full_name)")
    .eq("assigned_counselor_id", session.user.id);

  const students = (rawStudents as Array<Record<string, unknown>>).map((s) => ({
    id: s.id as string,
    profile: Array.isArray(s.profile) ? (s.profile[0] as { id: string; full_name: string }) : (s.profile as { id: string; full_name: string }),
  }));

  return (
    <CounselorLeadsClient
      counselorId={session.user.id}
      initialLeads={(leads ?? []) as JobLead[]}
      students={students}
    />
  );
}

export interface JobLead {
  id: string;
  company_name: string;
  job_role: string;
  job_url: string;
  job_description: string | null;
  location: string | null;
  source: string;
  status: string;
  assigned_to: string | null;
  discovered_at: string;
}

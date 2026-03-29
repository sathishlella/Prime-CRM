import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import CounselorStudentsClient from "./CounselorStudentsClient";

export default async function CounselorStudentsPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("id, role").eq("id", session.user.id).single();
  if (!profile || profile.role !== "counselor") redirect("/login");

  const { data: students = [] } = await supabase
    .from("students")
    .select(`
      id, university, major, graduation_date, visa_status, status,
      profile:profiles!profile_id(id, full_name, email, avatar_url)
    `)
    .eq("assigned_counselor_id", session.user.id)
    .order("created_at");

  return (
    <CounselorStudentsClient
      counselorId={session.user.id}
      students={(students ?? []) as CounselorStudentEntry[]}
    />
  );
}

export interface CounselorStudentEntry {
  id:              string;
  university:      string | null;
  major:           string | null;
  graduation_date: string | null;
  visa_status:     string | null;
  status:          string;
  profile:         { id: string; full_name: string; email: string; avatar_url: string | null };
}

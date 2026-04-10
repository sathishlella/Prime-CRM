import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import StudentCVsClient from "./StudentCVsClient";

export default async function StudentCVsPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("id, role").eq("id", session.user.id).single();
  if (!profile || profile.role !== "student") redirect("/login");

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", session.user.id)
    .single();

  if (!student) {
    return <StudentCVsClient cvs={[]} />;
  }

  const { data: cvs = [] } = await supabase
    .from("generated_cvs")
    .select("*")
    .eq("student_id", student.id)
    .order("created_at", { ascending: false });

  return <StudentCVsClient cvs={(cvs ?? []) as GeneratedCV[]} />;
}

export interface GeneratedCV {
  id: string;
  company_name: string;
  job_role: string;
  pdf_url: string | null;
  page_count: number;
  keyword_coverage: number;
  format: string;
  created_at: string;
}

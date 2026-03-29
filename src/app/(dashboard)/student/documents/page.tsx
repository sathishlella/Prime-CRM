import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import StudentDocumentsClient from "./StudentDocumentsClient";

export default async function StudentDocumentsPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", session.user.id)
    .single();
  if (!profile || profile.role !== "student") redirect("/login");

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", session.user.id)
    .single();

  const { data: docs = [] } = student
    ? await supabase
        .from("documents")
        .select(`id, student_id, file_name, file_url, file_type, uploaded_by, created_at,
                 uploaded_by_profile:profiles!uploaded_by(full_name)`)
        .eq("student_id", student.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <StudentDocumentsClient
      studentId={student?.id ?? null}
      initialDocs={(docs ?? []) as StudentDoc[]}
    />
  );
}

export interface StudentDoc {
  id:          string;
  student_id:  string;
  file_name:   string;
  file_url:    string;
  file_type:   string;
  uploaded_by: string;
  created_at:  string;
  uploaded_by_profile?: { full_name: string } | null;
}

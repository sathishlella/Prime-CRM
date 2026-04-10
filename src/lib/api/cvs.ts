export async function generateCV(
  studentId: string,
  jobDescription: string,
  companyName: string,
  jobRole: string,
  opts?: { application_id?: string; format?: "letter" | "a4" }
) {
  const res = await fetch("/api/generate-cv", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      student_id: studentId,
      job_description: jobDescription,
      company_name: companyName,
      job_role: jobRole,
      ...opts,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "CV generation failed");
  }
  return res.json() as Promise<{
    pdf_url: string;
    cv_id: string;
    page_count: number;
    keyword_coverage: number;
  }>;
}

export async function getStudentCVs(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  studentId: string
) {
  const { data } = await supabase
    .from("generated_cvs")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  return data || [];
}

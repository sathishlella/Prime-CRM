export async function generateInterviewPrep(
  applicationId: string,
  studentId: string,
  companyName: string,
  jobRole: string,
  jobDescription?: string
) {
  const res = await fetch("/api/interview-prep", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      application_id: applicationId,
      student_id: studentId,
      company_name: companyName,
      job_role: jobRole,
      job_description: jobDescription,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Interview prep failed");
  }
  return res.json();
}

export async function getInterviewPrep(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  applicationId: string
) {
  const { data } = await supabase
    .from("interview_prep")
    .select("*")
    .eq("application_id", applicationId)
    .single();
  return data;
}

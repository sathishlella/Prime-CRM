import type { EvaluationResult } from "@/lib/ai/prompts/evaluate";

export async function evaluateJD(
  studentId: string,
  jobDescription: string,
  opts?: { company_name?: string; job_role?: string; job_url?: string }
): Promise<{
  evaluation: EvaluationResult;
  application_id: string;
  company_name: string;
  job_role: string;
}> {
  const res = await fetch("/api/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      student_id: studentId,
      job_description: jobDescription,
      ...opts,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Evaluation failed");
  }

  return res.json();
}

export async function getEvaluationByApplication(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  applicationId: string
) {
  const { data } = await supabase
    .from("evaluation_scores")
    .select("*")
    .eq("application_id", applicationId)
    .single();
  return data;
}

export async function getEvaluationsByStudent(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  studentId: string
) {
  const { data } = await supabase
    .from("evaluation_scores")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  return data || [];
}

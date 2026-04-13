import { createServerClient } from "@/lib/supabase/server";
import { callClaude } from "@/lib/ai/claude";
import {
  EvaluationResult,
  buildEvaluationSystemPrompt,
  buildEvaluationUserPrompt,
} from "@/lib/ai/prompts/evaluate";
import { withApi } from "@/lib/http/withApi";
import { evaluateSchema } from "@/lib/http/zodSchemas";

export const POST = withApi(
  { schema: evaluateSchema, requireRole: ["admin", "counselor"], rateLimit: { bucket: "ai:evaluate", limit: 20, windowMs: 60 * 60 * 1000 } },
  async ({ body, user, requestId, logger }) => {
    const supabase = createServerClient();
    const { student_id, job_description } = body;

    try {
      logger.info("evaluating job match", { student_id });

      const { data: student } = await supabase
        .from("students")
        .select("*, profiles!students_profile_id_fkey(full_name, email)")
        .eq("id", student_id)
        .single();

      if (!student) {
        logger.warn("student not found", { student_id });
        return new Response(
          JSON.stringify({
            error: "STUDENT_NOT_FOUND",
            message: "Student not found",
            requestId,
          }),
          { status: 404, headers: { "content-type": "application/json" } }
        );
      }

      const { data: candidateProfile } = await supabase
        .from("candidate_profiles")
        .select("*")
        .eq("student_id", student_id)
        .single();

      const rawProfiles = student.profiles as unknown;
      const studentProfile = Array.isArray(rawProfiles)
        ? (rawProfiles[0] as { full_name: string; email: string })
        : (rawProfiles as { full_name: string; email: string });

      const systemPrompt = buildEvaluationSystemPrompt();
      const userPrompt = buildEvaluationUserPrompt(
        {
          full_name: studentProfile?.full_name ?? "Student",
          cv_markdown: candidateProfile?.cv_markdown || null,
          target_roles: candidateProfile?.target_roles || [],
          skills: candidateProfile?.skills || [],
          compensation_target: (candidateProfile?.compensation_target as unknown as string | null) || null,
          visa_status: student.visa_status,
          university: student.university,
          major: student.major,
        },
        job_description
      );

      const { data: evaluation, usage } = await callClaude<EvaluationResult>(
        systemPrompt,
        userPrompt,
        { feature: "evaluate", maxTokens: 8192, userId: user.id, requestId }
      );

      logger.info("evaluation complete", { student_id, grade: evaluation.grade, tokens_out: usage?.output_tokens });

      return Response.json({
        evaluation,
        usage,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error("evaluation failed", { error: error.message, stack: error.stack });
      throw err;
    }
  }
);

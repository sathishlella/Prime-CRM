import { createServerClient } from "@/lib/supabase/server";
import { callClaude } from "@/lib/ai/claude";
import {
  InterviewPrepResult,
  buildInterviewPrepSystemPrompt,
  buildInterviewPrepUserPrompt,
} from "@/lib/ai/prompts/interview-prep";
import { withApi } from "@/lib/http/withApi";
import { interviewPrepSchema } from "@/lib/http/zodSchemas";

export const POST = withApi(
  { schema: interviewPrepSchema, requireRole: ["admin", "counselor"], rateLimit: { bucket: "ai:interview-prep", limit: 20, windowMs: 60 * 60 * 1000 } },
  async ({ body, user, requestId, logger }) => {
    try {
      logger.info("generating interview prep", { student_id: body.student_id });

      const supabase = createServerClient();
      const { application_id, student_id, company_name, job_role, job_description } = body;

      const { data: candidateProfile } = await supabase
        .from("candidate_profiles")
        .select("cv_markdown, skills")
        .eq("student_id", student_id)
        .single();

      let jd = job_description;
      if (!jd && application_id) {
        const { data: app } = await supabase
          .from("applications")
          .select("job_description")
          .eq("id", application_id)
          .single();
        jd = app?.job_description || "";
      }

      const { data: prepData } = await callClaude<InterviewPrepResult>(
        buildInterviewPrepSystemPrompt(),
        buildInterviewPrepUserPrompt(
          company_name,
          job_role,
          jd,
          candidateProfile?.cv_markdown || null,
          candidateProfile?.skills || []
        ),
        { feature: "interview-prep", maxTokens: 8192, userId: user.id, requestId }
      );

      if (application_id) {
        await supabase.from("interview_prep").upsert(
          {
            application_id,
            student_id,
            company_name,
            job_role,
            prep_data: prepData as unknown as Record<string, unknown>,
            created_by: user.id,
          },
          { onConflict: "application_id" }
        );
      }

      logger.info("interview prep complete", { student_id });

      return Response.json({ prep_data: prepData });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error("interview prep generation failed", { error: error.message, stack: error.stack });
      throw err;
    }
  }
);

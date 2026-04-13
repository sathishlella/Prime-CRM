import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { callClaude } from "@/lib/ai/claude";
import {
  InterviewPrepResult,
  buildInterviewPrepSystemPrompt,
  buildInterviewPrepUserPrompt,
} from "@/lib/ai/prompts/interview-prep";
import { withApi } from "@/lib/infra/withApi";
import { interviewPrepSchema } from "@/lib/infra/zodSchemas";

export const POST = withApi(
  async ({ body, user }) => {
    const supabase = createServerClient();
    const { application_id, student_id, company_name, job_role, job_description } = body;

    const { data: candidateProfile } = await supabase
      .from("candidate_profiles")
      .select("cv_markdown, skills")
      .eq("student_id", student_id)
      .single();

    let jd = job_description;
    if (!jd) {
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
      { feature: "interview-prep", maxTokens: 8192, userId: user!.id }
    );

    await supabase.from("interview_prep").upsert(
      {
        application_id,
        student_id,
        company_name,
        job_role,
        prep_data: prepData as unknown as Record<string, unknown>,
        created_by: user!.id,
      },
      { onConflict: "application_id" }
    );

    return NextResponse.json({ prep_data: prepData });
  },
  { method: "POST", allowedRoles: ["admin", "counselor"], bodySchema: interviewPrepSchema, rateLimit: "interview-prep" }
);

import { createServerClient } from "@/lib/supabase/server";
import { aiJson } from "@/lib/ai/router";
import {
  CoverLetterResult,
  buildCoverLetterSystemPrompt,
  buildCoverLetterUserPrompt,
  renderCoverLetterMarkdown,
} from "@/lib/ai/prompts/cover-letter";
import { withApi } from "@/lib/http/withApi";
import { coverLetterSchema } from "@/lib/http/zodSchemas";

export const maxDuration = 60;

export const POST = withApi(
  {
    schema: coverLetterSchema,
    requireRole: ["admin", "counselor"],
    rateLimit: { bucket: "ai:cover-letter", limit: 20, windowMs: 60 * 60 * 1000 },
  },
  async ({ body, user, requestId, logger }) => {
    const { student_id, match_id, emphasis_keywords = [], job_description_override } = body;
    const supabase = createServerClient();

    const { data: student } = await supabase
      .from("students")
      .select(
        "id, assigned_counselor_id, profile:profiles!profile_id(full_name, email)"
      )
      .eq("id", student_id)
      .single();

    if (!student) {
      return Response.json(
        { error: "NOT_FOUND", message: "Student not found", requestId },
        { status: 404 }
      );
    }

    if (user.role === "counselor" && student.assigned_counselor_id !== user.id) {
      return Response.json(
        { error: "FORBIDDEN", message: "Not assigned to this student", requestId },
        { status: 403 }
      );
    }

    const { data: match } = await supabase
      .from("job_matches")
      .select(
        "id, student_id, job_leads(company_name, job_role, job_description)"
      )
      .eq("id", match_id)
      .eq("student_id", student_id)
      .single();

    if (!match) {
      return Response.json(
        { error: "NOT_FOUND", message: "Match not found for this student", requestId },
        { status: 404 }
      );
    }

    const lead = Array.isArray(match.job_leads) ? match.job_leads[0] : match.job_leads;
    if (!lead) {
      return Response.json(
        { error: "NOT_FOUND", message: "Job lead missing", requestId },
        { status: 404 }
      );
    }

    const { data: candidateProfile } = await supabase
      .from("candidate_profiles")
      .select("cv_markdown")
      .eq("student_id", student_id)
      .maybeSingle();

    if (!candidateProfile?.cv_markdown) {
      return Response.json(
        { error: "NO_CV", message: "Student has no CV", requestId },
        { status: 400 }
      );
    }

    const profile = Array.isArray(student.profile) ? student.profile[0] : student.profile;
    const candidateName =
      (profile as { full_name?: string } | null)?.full_name ?? "Candidate";

    const effectiveJd = (job_description_override ?? lead.job_description ?? "").trim();

    logger.info("generating cover letter", {
      match_id,
      keywords: emphasis_keywords.length,
      jd_source: job_description_override ? "override" : lead.job_description ? "lead" : "empty",
    });

    const result = await aiJson<CoverLetterResult>({
      feature: "cv-generate",
      system: buildCoverLetterSystemPrompt(),
      user: buildCoverLetterUserPrompt(
        candidateProfile.cv_markdown,
        candidateName,
        lead.job_role,
        lead.company_name,
        effectiveJd,
        emphasis_keywords
      ),
      userId: user.id,
      requestId,
    });

    const markdown = renderCoverLetterMarkdown(result.data, candidateName);

    return Response.json({
      letter: result.data,
      markdown,
      provider: result.provider,
      fell_back: result.fellBack,
    });
  }
);

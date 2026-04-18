import { createServerClient } from "@/lib/supabase/server";
import { aiJson } from "@/lib/ai/router";
import {
  KeywordsResult,
  buildKeywordsSystemPrompt,
  buildKeywordsUserPrompt,
} from "@/lib/ai/prompts/keywords";
import { withApi } from "@/lib/http/withApi";
import { keywordsSchema } from "@/lib/http/zodSchemas";

export const maxDuration = 60;

export const POST = withApi(
  {
    schema: keywordsSchema,
    requireRole: ["admin", "counselor"],
    rateLimit: { bucket: "ai:keywords", limit: 30, windowMs: 60 * 60 * 1000 },
  },
  async ({ body, user, requestId, logger }) => {
    const { match_id, job_description_override } = body;
    const supabase = createServerClient();

    const { data: match } = await supabase
      .from("job_matches")
      .select(
        "id, student_id, job_lead_id, match_reasoning, job_leads(company_name, job_role, job_description)"
      )
      .eq("id", match_id)
      .single();

    if (!match) {
      logger.warn("match not found", { match_id });
      return Response.json(
        { error: "NOT_FOUND", message: "Match not found", requestId },
        { status: 404 }
      );
    }

    if (user.role === "counselor") {
      const { data: student } = await supabase
        .from("students")
        .select("assigned_counselor_id")
        .eq("id", match.student_id)
        .single();
      if (!student || student.assigned_counselor_id !== user.id) {
        return Response.json(
          { error: "FORBIDDEN", message: "Not assigned to this student", requestId },
          { status: 403 }
        );
      }
    }

    const lead = Array.isArray(match.job_leads) ? match.job_leads[0] : match.job_leads;
    if (!lead) {
      return Response.json(
        { error: "NOT_FOUND", message: "Job lead missing", requestId },
        { status: 404 }
      );
    }

    // Cache only valid when no override (paste-JD) is provided
    if (!job_description_override) {
      const cached =
        match.match_reasoning && typeof match.match_reasoning === "object"
          ? (match.match_reasoning as Record<string, unknown>).keywords
          : null;
      if (cached && typeof cached === "object") {
        const c = cached as Partial<KeywordsResult>;
        if (
          Array.isArray(c.matched_keywords) &&
          Array.isArray(c.gap_keywords) &&
          Array.isArray(c.suggested_emphasis)
        ) {
          logger.info("keywords cache hit", { match_id });
          return Response.json({ ...c, cached: true });
        }
      }
    }

    const { data: candidateProfile } = await supabase
      .from("candidate_profiles")
      .select("cv_markdown")
      .eq("student_id", match.student_id)
      .maybeSingle();

    if (!candidateProfile?.cv_markdown) {
      return Response.json(
        { error: "NO_CV", message: "Student has no CV", requestId },
        { status: 400 }
      );
    }

    logger.info("extracting keywords", { match_id });

    const effectiveJd = (job_description_override ?? lead.job_description ?? "").trim();

    const result = await aiJson<KeywordsResult>({
      feature: "pattern-analysis",
      system: buildKeywordsSystemPrompt(),
      user: buildKeywordsUserPrompt(
        candidateProfile.cv_markdown,
        lead.job_role,
        lead.company_name,
        effectiveJd
      ),
      userId: user.id,
      requestId,
    });

    // Only cache when using the canonical job_description (no override)
    if (!job_description_override) {
      const prior = (match.match_reasoning as Record<string, unknown>) ?? {};
      await supabase
        .from("job_matches")
        .update({ match_reasoning: { ...prior, keywords: result.data } })
        .eq("id", match_id);
    }

    // If caller supplied a JD override, save it on the lead so it's reused later
    if (job_description_override && !lead.job_description) {
      await supabase
        .from("job_leads")
        .update({ job_description: job_description_override } as any)
        .eq("id", match.job_lead_id);
    }

    return Response.json({ ...result.data, cached: false });
  }
);

import { createServerClient, createAdminClient } from "@/lib/supabase/server";
import { callClaude } from "@/lib/ai/claude";
import {
  CVTailorResult,
  buildCVTailorSystemPrompt,
  buildCVTailorUserPrompt,
} from "@/lib/ai/prompts/cv-tailor";
import { buildHTML, generatePDFFromHTML, normalizeTextForATS } from "@/lib/ai/cv-generator";
import { withApi } from "@/lib/http/withApi";
import { tailorCvSchema } from "@/lib/http/zodSchemas";

export const maxDuration = 120;

export const POST = withApi(
  {
    schema: tailorCvSchema,
    requireRole: ["admin", "counselor"],
    rateLimit: { bucket: "ai:tailor-cv", limit: 10, windowMs: 60 * 60 * 1000 },
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
      .select("id, job_lead_id, job_leads(company_name, job_role, job_description)")
      .eq("id", match_id)
      .eq("student_id", student_id)
      .single();

    if (!match) {
      return Response.json(
        { error: "NOT_FOUND", message: "Match not found", requestId },
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
    const candidateProfileName = (profile as { full_name?: string; email?: string } | null) ?? {};
    const candidateName = candidateProfileName.full_name ?? "Candidate";
    const candidateEmail = candidateProfileName.email ?? "";

    const keywordDirective =
      emphasis_keywords.length > 0
        ? `\n\n## Keywords the counselor wants emphasized (use naturally in summary, competencies, and bullets when truthful):\n${emphasis_keywords.slice(0, 20).join(", ")}`
        : "";

    const effectiveJd = (job_description_override ?? lead.job_description ?? "").trim();

    logger.info("tailoring cv for match", {
      match_id,
      keywords: emphasis_keywords.length,
      jd_source: job_description_override ? "override" : lead.job_description ? "lead" : "empty",
    });

    const { data: tailoringData } = await callClaude<CVTailorResult>(
      buildCVTailorSystemPrompt(),
      buildCVTailorUserPrompt(
        candidateProfile.cv_markdown,
        effectiveJd + keywordDirective,
        candidateName
      ),
      { feature: "cv-generate", maxTokens: 8192, userId: user.id, requestId }
    );

    if (job_description_override && !lead.job_description && match.job_lead_id) {
      await supabase
        .from("job_leads")
        .update({ job_description: job_description_override } as any)
        .eq("id", match.job_lead_id);
    }

    let html = buildHTML({
      tailoringData,
      candidateName,
      email: candidateEmail,
      linkedinUrl: undefined,
      portfolioUrl: undefined,
      location: undefined,
      format: "letter",
      language: "en",
    });
    const { html: normalized } = normalizeTextForATS(html);
    html = normalized;

    let pdfBuffer: Buffer | null = null;
    try {
      pdfBuffer = await generatePDFFromHTML(html, "letter");
    } catch (err) {
      logger.error("pdf generation failed — html fallback", { error: String(err) });
    }

    if (!pdfBuffer) {
      return Response.json({
        pdf_url: null,
        html,
        tailoring_data: tailoringData,
        keyword_coverage: tailoringData.keyword_coverage,
        keywords_used: tailoringData.keywords_used,
        warning: "PDF unavailable — HTML returned",
      });
    }

    const slug = lead.company_name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const date = new Date().toISOString().split("T")[0];
    const fileName = `cv-${slug}-${date}.pdf`;
    const storagePath = `${student_id}/${fileName}`;
    const admin = createAdminClient();

    const { error: uploadError } = await admin.storage
      .from("generated-cvs")
      .upload(storagePath, pdfBuffer, { contentType: "application/pdf", upsert: true });

    if (uploadError) {
      logger.error("cv upload failed", { error: uploadError.message });
      return Response.json(
        { error: "UPLOAD_FAILED", message: "Failed to upload PDF", requestId },
        { status: 500 }
      );
    }

    const { data: urlData, error: urlError } = await admin.storage
      .from("generated-cvs")
      .createSignedUrl(storagePath, 3600);
    if (urlError) {
      logger.error("signed url failed", { error: urlError.message });
    }
    const pdfUrl = urlData?.signedUrl || null;
    const pdfString = pdfBuffer.toString("latin1");
    const pageCount = (pdfString.match(/\/Type\s*\/Page[^s]/g) || []).length;

    const { data: cvRecord } = await supabase
      .from("generated_cvs")
      .insert({
        application_id: null,
        student_id,
        company_name: lead.company_name,
        job_role: lead.job_role,
        pdf_url: pdfUrl ?? "",
        pdf_path: storagePath,
        content: tailoringData as unknown as Record<string, unknown>,
        keyword_coverage: tailoringData.keyword_coverage,
        page_count: pageCount,
        format: "letter",
        created_by: user.id,
      })
      .select("id")
      .single();

    return Response.json({
      pdf_url: pdfUrl,
      html,
      cv_id: cvRecord?.id,
      page_count: pageCount,
      keyword_coverage: tailoringData.keyword_coverage,
      keywords_used: tailoringData.keywords_used,
    });
  }
);

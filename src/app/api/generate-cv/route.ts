import { createServerClient, createAdminClient } from "@/lib/supabase/server";
import { callClaude } from "@/lib/ai/claude";
import {
  CVTailorResult,
  buildCVTailorSystemPrompt,
  buildCVTailorUserPrompt,
} from "@/lib/ai/prompts/cv-tailor";
import { buildHTML, generatePDFFromHTML, normalizeTextForATS } from "@/lib/ai/cv-generator";
import { withApi } from "@/lib/http/withApi";
import { generateCvSchema } from "@/lib/http/zodSchemas";

export const maxDuration = 60;

export const POST = withApi(
  { schema: generateCvSchema, requireRole: ["admin", "counselor"], rateLimit: { bucket: "ai:generate-cv", limit: 10, windowMs: 60 * 60 * 1000 } },
  async ({ body, user, requestId, logger }) => {
    const supabase = createServerClient();
    const {
      student_id,
      application_id,
      job_description,
      company_name,
      job_role,
      format = "letter",
    } = body;

    try {
      logger.info("generating tailored CV", { student_id });

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

      if (!candidateProfile?.cv_markdown) {
        logger.warn("student has no CV", { student_id });
        return new Response(
          JSON.stringify({
            error: "NO_CV",
            message: "Student has no CV. Please add a CV in the candidate profile first.",
            requestId,
          }),
          { status: 400, headers: { "content-type": "application/json" } }
        );
      }

      const rawProfiles = student.profiles as unknown;
      const studentProfile = Array.isArray(rawProfiles)
        ? (rawProfiles[0] as { full_name: string; email: string })
        : (rawProfiles as { full_name: string; email: string });

      const { data: tailoringData } = await callClaude<CVTailorResult>(
        buildCVTailorSystemPrompt(),
        buildCVTailorUserPrompt(
          candidateProfile.cv_markdown,
          job_description,
          studentProfile.full_name
        ),
        { feature: "cv-generate", maxTokens: 8192, userId: user.id, requestId }
      );

      let html = buildHTML({
        tailoringData,
        candidateName: studentProfile.full_name,
        email: studentProfile.email,
        linkedinUrl: undefined,
        portfolioUrl: undefined,
        location: undefined,
        format: format as "letter" | "a4",
        language: "en",
      });

      const { html: normalizedHtml } = normalizeTextForATS(html);
      html = normalizedHtml;

      let pdfBuffer: Buffer;
      try {
        pdfBuffer = await generatePDFFromHTML(html, format as "letter" | "a4");
      } catch (err) {
        logger.error("PDF generation failed, returning HTML fallback", { error: String(err) });
        return Response.json({
          html,
          tailoring_data: tailoringData,
          error: "PDF generation unavailable. HTML content returned instead.",
          keyword_coverage: tailoringData.keyword_coverage,
        });
      }

      const slug = company_name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const date = new Date().toISOString().split("T")[0];
      const fileName = `cv-${slug}-${date}.pdf`;
      const storagePath = `${student_id}/${fileName}`;

      const adminClient = createAdminClient();

      const { error: uploadError } = await adminClient.storage
        .from("generated-cvs")
        .upload(storagePath, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) {
        logger.error("CV upload failed", { error: uploadError.message });
        return new Response(
          JSON.stringify({
            error: "UPLOAD_FAILED",
            message: "Failed to upload PDF",
            requestId,
          }),
          { status: 500, headers: { "content-type": "application/json" } }
        );
      }

      const { data: urlData } = await adminClient.storage
        .from("generated-cvs")
        .createSignedUrl(storagePath, 3600);

      const pdfUrl = urlData?.signedUrl || "";
      const pdfString = pdfBuffer.toString("latin1");
      const pageCount = (pdfString.match(/\/Type\s*\/Page[^s]/g) || []).length;

      const { data: cvRecord } = await supabase
        .from("generated_cvs")
        .insert({
          application_id: application_id || null,
          student_id,
          company_name,
          job_role,
          pdf_url: pdfUrl,
          pdf_path: storagePath,
          content: tailoringData as unknown as Record<string, unknown>,
          keyword_coverage: tailoringData.keyword_coverage,
          page_count: pageCount,
          format: format as string,
          created_by: user.id,
        })
        .select("id")
        .single();

      logger.info("CV generation complete", { student_id, page_count: pageCount });

      return Response.json({
        pdf_url: pdfUrl,
        cv_id: cvRecord?.id,
        page_count: pageCount,
        keyword_coverage: tailoringData.keyword_coverage,
        keywords_used: tailoringData.keywords_used,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error("CV generation failed", { error: error.message, stack: error.stack });
      throw err;
    }
  }
);

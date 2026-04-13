import { NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/supabase/server";
import { callClaude } from "@/lib/ai/claude";
import {
  CVTailorResult,
  buildCVTailorSystemPrompt,
  buildCVTailorUserPrompt,
} from "@/lib/ai/prompts/cv-tailor";
import { buildHTML, generatePDFFromHTML, normalizeTextForATS } from "@/lib/ai/cv-generator";
import { withApi } from "@/lib/infra/withApi";
import { generateCvSchema } from "@/lib/infra/zodSchemas";
import { logger } from "@/lib/infra/logger";

export const maxDuration = 60;

export const POST = withApi(
  async ({ body, user, requestId }) => {
    const supabase = createServerClient();
    const {
      student_id,
      application_id,
      job_description,
      company_name,
      job_role,
      format = "letter",
    } = body;

    const { data: student } = await supabase
      .from("students")
      .select("*, profiles!students_profile_id_fkey(full_name, email)")
      .eq("id", student_id)
      .single();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const { data: candidateProfile } = await supabase
      .from("candidate_profiles")
      .select("*")
      .eq("student_id", student_id)
      .single();

    if (!candidateProfile?.cv_markdown) {
      return NextResponse.json(
        { error: "Student has no CV. Please add a CV in the candidate profile first." },
        { status: 400 }
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
      { feature: "cv-generate", maxTokens: 8192, userId: user!.id }
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
      logger.error({ requestId, error: String(err) }, "PDF generation failed, returning HTML fallback");
      return NextResponse.json({
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
      logger.error({ requestId, error: uploadError.message }, "CV upload failed");
      return NextResponse.json({ error: "Failed to upload PDF" }, { status: 500 });
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
        created_by: user!.id,
      })
      .select("id")
      .single();

    return NextResponse.json({
      pdf_url: pdfUrl,
      cv_id: cvRecord?.id,
      page_count: pageCount,
      keyword_coverage: tailoringData.keyword_coverage,
      keywords_used: tailoringData.keywords_used,
    });
  },
  { method: "POST", allowedRoles: ["admin", "counselor"], bodySchema: generateCvSchema, rateLimit: "cv-generate" }
);

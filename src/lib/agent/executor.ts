/**
 * Agent step executor — idempotent, durable actions for the worker tick route.
 * All DB clients here use the admin client because the worker runs without
 * a user session (cron / edge function).
 */

import { createAdminClient } from "@/lib/supabase/server";
import { callClaude } from "@/lib/ai/claude";
import {
  EvaluationResult,
  buildEvaluationSystemPrompt,
  buildEvaluationUserPrompt,
} from "@/lib/ai/prompts/evaluate";
import {
  CVTailorResult,
  buildCVTailorSystemPrompt,
  buildCVTailorUserPrompt,
} from "@/lib/ai/prompts/cv-tailor";
import {
  InterviewPrepResult,
  buildInterviewPrepSystemPrompt,
  buildInterviewPrepUserPrompt,
} from "@/lib/ai/prompts/interview-prep";
import { buildHTML, generatePDFFromHTML, normalizeTextForATS } from "@/lib/ai/cv-generator";
import * as Sentry from "@sentry/nextjs";
import { createLogger } from "@/lib/logging/logger";
const logger = createLogger("executor", "/lib/agent/executor");

const admin = createAdminClient;

// ─── MATCH / EVALUATE STEP ──────────────────────────────────────────────────

export async function executeEvaluateStep(
  input: {
    student_id: string;
    lead_id: string;
    company_name: string;
    job_role: string;
    job_description?: string;
    job_url?: string;
  },
  requestId?: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = admin();

  // Check if already matched
  const { data: existing } = await supabase
    .from("job_matches")
    .select("id")
    .eq("student_id", input.student_id)
    .eq("job_lead_id", input.lead_id)
    .single();

  if (existing) {
    return { ok: true };
  }

  const [{ data: student }, { data: candidateProfile }] = await Promise.all([
    supabase.from("students").select("*, profiles!students_profile_id_fkey(full_name, email)").eq("id", input.student_id).single(),
    supabase.from("candidate_profiles").select("*").eq("student_id", input.student_id).single(),
  ]);

  if (!student) return { ok: false, error: "Student not found" };

  const rawProfiles = student.profiles as unknown;
  const studentProfile = Array.isArray(rawProfiles)
    ? (rawProfiles[0] as { full_name: string; email: string })
    : (rawProfiles as { full_name: string; email: string });

  try {
    const { data: evaluation } = await callClaude<EvaluationResult>(
      buildEvaluationSystemPrompt(),
      buildEvaluationUserPrompt(
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
        input.job_description || "",
        input.company_name,
        input.job_role
      ),
      { feature: "match", maxTokens: 4096 }
    );

    const { error } = await supabase.from("job_matches").insert({
      student_id: input.student_id,
      job_lead_id: input.lead_id,
      overall_score: evaluation.overall_score,
      grade: evaluation.grade,
      archetype: evaluation.archetype,
      match_reasoning: evaluation.blocks as unknown as Record<string, unknown>,
      match_status: "new",
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    logger.error("executeEvaluateStep failed", { requestId, error: String(err) });
    Sentry.captureException(err);
    return { ok: false, error: String(err) };
  }
}

// ─── CREATE APPLICATION STEP ────────────────────────────────────────────────

export async function executeCreateAppStep(
  input: {
    student_id: string;
    company_name: string;
    job_role: string;
    job_description?: string;
    job_url?: string;
  }
): Promise<{ ok: boolean; application_id?: string; error?: string }> {
  const supabase = admin();

  // Idempotency check
  const { data: existing } = await supabase
    .from("applications")
    .select("id")
    .eq("student_id", input.student_id)
    .eq("company_name", input.company_name)
    .eq("job_role", input.job_role)
    .single();

  if (existing) {
    return { ok: true, application_id: existing.id };
  }

  const { data, error } = await supabase
    .from("applications")
    .insert({
      student_id: input.student_id,
      company_name: input.company_name,
      job_role: input.job_role,
      job_description: input.job_description || null,
      job_link: input.job_url || null,
      status: "applied",
      applied_by: "00000000-0000-0000-0000-000000000000",
    } as any)
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, application_id: data!.id };
}

// ─── GENERATE CV STEP ───────────────────────────────────────────────────────

export async function executeGenCvStep(
  input: {
    student_id: string;
    application_id?: string;
    company_name: string;
    job_role: string;
    job_description?: string;
  },
  requestId?: string
): Promise<{ ok: boolean; cv_id?: string; error?: string }> {
  const supabase = admin();

  // Idempotency check
  if (input.application_id) {
    const { data: existing } = await supabase
      .from("generated_cvs")
      .select("id")
      .eq("application_id", input.application_id)
      .single();
    if (existing) return { ok: true, cv_id: existing.id };
  }

  const [{ data: student }, { data: candidateProfile }] = await Promise.all([
    supabase.from("students").select("*, profiles!students_profile_id_fkey(full_name, email)").eq("id", input.student_id).single(),
    supabase.from("candidate_profiles").select("*").eq("student_id", input.student_id).single(),
  ]);

  if (!student) return { ok: false, error: "Student not found" };
  if (!candidateProfile?.cv_markdown) return { ok: false, error: "No CV markdown" };

  const rawProfiles = student.profiles as unknown;
  const studentProfile = Array.isArray(rawProfiles)
    ? (rawProfiles[0] as { full_name: string; email: string })
    : (rawProfiles as { full_name: string; email: string });

  try {
    const { data: tailoringData } = await callClaude<CVTailorResult>(
      buildCVTailorSystemPrompt(),
      buildCVTailorUserPrompt(candidateProfile.cv_markdown, input.job_description || "", studentProfile.full_name),
      { feature: "cv-generate", maxTokens: 8192 }
    );

    let html = buildHTML({
      tailoringData,
      candidateName: studentProfile.full_name,
      email: studentProfile.email,
      format: "letter",
      language: "en",
    });
    html = normalizeTextForATS(html).html;

    const pdfBuffer = await generatePDFFromHTML(html, "letter");

    const slug = input.company_name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const date = new Date().toISOString().split("T")[0];
    const fileName = `cv-${slug}-${date}.pdf`;
    const storagePath = `${input.student_id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("generated-cvs")
      .upload(storagePath, pdfBuffer, { contentType: "application/pdf", upsert: true });

    if (uploadError) return { ok: false, error: uploadError.message };

    const { data: urlData } = await supabase.storage.from("generated-cvs").createSignedUrl(storagePath, 3600);
    const pdfUrl = urlData?.signedUrl || "";

    const pdfString = pdfBuffer.toString("latin1");
    const pageCount = (pdfString.match(/\/Type\s*\/Page[^s]/g) || []).length;

    const { data: cvRecord, error: cvError } = await supabase
      .from("generated_cvs")
      .insert({
        application_id: input.application_id || null,
        student_id: input.student_id,
        company_name: input.company_name,
        job_role: input.job_role,
        pdf_url: pdfUrl,
        pdf_path: storagePath,
        content: tailoringData as unknown as Record<string, unknown>,
        keyword_coverage: tailoringData.keyword_coverage,
        page_count: pageCount,
        format: "letter",
        created_by: "00000000-0000-0000-0000-000000000000",
      } as any)
      .select("id")
      .single();

    if (cvError) return { ok: false, error: cvError.message };
    return { ok: true, cv_id: cvRecord!.id };
  } catch (err) {
    logger.error("executeGenCvStep failed", { requestId, error: String(err) });
    Sentry.captureException(err);
    return { ok: false, error: String(err) };
  }
}

// ─── GENERATE INTERVIEW PREP STEP ───────────────────────────────────────────

export async function executeGenPrepStep(
  input: {
    student_id: string;
    application_id: string;
    company_name: string;
    job_role: string;
    job_description?: string;
  },
  requestId?: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = admin();

  // Idempotency check
  const { data: existing } = await supabase
    .from("interview_prep")
    .select("id")
    .eq("application_id", input.application_id)
    .single();
  if (existing) return { ok: true };

  const { data: candidateProfile } = await supabase
    .from("candidate_profiles")
    .select("cv_markdown, skills")
    .eq("student_id", input.student_id)
    .single();

  try {
    const { data: prepData } = await callClaude<InterviewPrepResult>(
      buildInterviewPrepSystemPrompt(),
      buildInterviewPrepUserPrompt(
        input.company_name,
        input.job_role,
        input.job_description || "",
        candidateProfile?.cv_markdown || null,
        candidateProfile?.skills || []
      ),
      { feature: "interview-prep", maxTokens: 8192 }
    );

    const { error } = await supabase.from("interview_prep").insert({
      application_id: input.application_id,
      student_id: input.student_id,
      company_name: input.company_name,
      job_role: input.job_role,
      prep_data: prepData as unknown as Record<string, unknown>,
      created_by: "00000000-0000-0000-0000-000000000000",
    } as any);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    logger.error("executeGenPrepStep failed", { requestId, error: String(err) });
    Sentry.captureException(err);
    return { ok: false, error: String(err) };
  }
}

// ─── NOTIFY STEP ────────────────────────────────────────────────────────────

export async function executeNotifyStep(
  input: {
    student_id: string;
    application_id: string;
    company_name: string;
    job_role: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = admin();

  // Fetch student profile id for notification
  const { data: student } = await supabase
    .from("students")
    .select("profile_id")
    .eq("id", input.student_id)
    .single();

  if (!student?.profile_id) return { ok: false, error: "Student profile not found" };

  const { error } = await supabase.from("notifications").insert({
    user_id: student.profile_id,
    title: `New application: ${input.company_name}`,
    message: `Your counselor applied to ${input.job_role} at ${input.company_name}.`,
    type: "application",
    is_read: false,
  } as any);

  if (error) return { ok: false, error: error.message };

  // Fire-and-forget email (non-blocking)
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "new_application", appId: input.application_id }),
    });
  } catch {
    // ignore email failure
  }

  return { ok: true };
}

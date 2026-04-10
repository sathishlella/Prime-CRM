import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { callClaude } from "@/lib/ai/claude";
import {
  EvaluationResult,
  buildEvaluationSystemPrompt,
  buildEvaluationUserPrompt,
} from "@/lib/ai/prompts/evaluate";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "counselor"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { student_id, job_description, company_name, job_role, job_url } =
      body;

    if (!student_id || !job_description) {
      return NextResponse.json(
        { error: "student_id and job_description are required" },
        { status: 400 }
      );
    }

    // Fetch student + candidate profile
    const { data: student } = await supabase
      .from("students")
      .select("*, profiles(full_name, email)")
      .eq("id", student_id)
      .single();

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const { data: candidateProfile } = await supabase
      .from("candidate_profiles")
      .select("*")
      .eq("student_id", student_id)
      .single();

    // Build prompt
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
      job_description,
      company_name,
      job_role
    );

    // Call Claude
    const { data: evaluation, usage } = await callClaude<EvaluationResult>(
      systemPrompt,
      userPrompt,
      { maxTokens: 8192 }
    );

    // Create application if it doesn't exist
    let application_id: string | null = null;
    const extractedCompany = company_name || evaluation.blocks.a_role_summary.domain || "Unknown";
    const extractedRole = job_role || evaluation.archetype || "Unknown Role";

    // Check for existing application
    const { data: existingApp } = await supabase
      .from("applications")
      .select("id")
      .eq("student_id", student_id)
      .eq("company_name", extractedCompany)
      .eq("job_role", extractedRole)
      .single();

    if (existingApp) {
      application_id = existingApp.id;
    } else {
      const { data: newApp } = await supabase
        .from("applications")
        .insert({
          student_id,
          company_name: extractedCompany,
          job_role: extractedRole,
          job_description,
          job_link: job_url || null,
          resume_used: null,
          notes: null,
          status: "applied",
          applied_by: user.id,
        })
        .select("id")
        .single();

      application_id = newApp?.id || null;
    }

    // Store evaluation score
    if (application_id) {
      await supabase.from("evaluation_scores").upsert(
        {
          application_id,
          student_id,
          overall_score: evaluation.overall_score,
          grade: evaluation.grade,
          archetype: evaluation.archetype,
          recommendation: evaluation.recommendation,
          blocks: evaluation.blocks as unknown as Record<string, unknown>,
          keywords: evaluation.keywords,
          summary: null,
          created_by: user.id,
        },
        { onConflict: "application_id" }
      );
    }

    return NextResponse.json({
      evaluation,
      application_id,
      company_name: extractedCompany,
      job_role: extractedRole,
      usage,
    });
  } catch (error) {
    console.error("Evaluation error:", error);
    return NextResponse.json(
      { error: "Evaluation failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { callClaude } from "@/lib/ai/claude";
import {
  InterviewPrepResult,
  buildInterviewPrepSystemPrompt,
  buildInterviewPrepUserPrompt,
} from "@/lib/ai/prompts/interview-prep";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "counselor"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { application_id, student_id, company_name, job_role, job_description } = body;

    if (!application_id || !student_id || !company_name || !job_role) {
      return NextResponse.json(
        { error: "application_id, student_id, company_name, and job_role are required" },
        { status: 400 }
      );
    }

    // Fetch candidate profile
    const { data: candidateProfile } = await supabase
      .from("candidate_profiles")
      .select("cv_markdown, skills")
      .eq("student_id", student_id)
      .single();

    // Get JD from application if not provided
    let jd = job_description;
    if (!jd) {
      const { data: app } = await supabase
        .from("applications")
        .select("job_description")
        .eq("id", application_id)
        .single();
      jd = app?.job_description || "";
    }

    // Call Claude
    const { data: prepData } = await callClaude<InterviewPrepResult>(
      buildInterviewPrepSystemPrompt(),
      buildInterviewPrepUserPrompt(
        company_name,
        job_role,
        jd,
        candidateProfile?.cv_markdown || null,
        candidateProfile?.skills || []
      ),
      { feature: "interview-prep", maxTokens: 8192, userId: user.id }
    );

    // Store
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

    return NextResponse.json({ prep_data: prepData });
  } catch (error) {
    console.error("Interview prep error:", error);
    return NextResponse.json(
      { error: "Interview prep generation failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}

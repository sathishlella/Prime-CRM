import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/infra/withApi";
import { applyAgentSchema } from "@/lib/infra/zodSchemas";
import { logger } from "@/lib/infra/logger";

export const POST = withApi(
  async ({ body, user, requestId }) => {
    const supabase = createServerClient();
    const { student_id, job_match_ids } = body;

    if (job_match_ids.length === 0) {
      return NextResponse.json({ error: "No jobs selected" }, { status: 400 });
    }

    // Verify counselor is assigned to this student (or admin)
    const { data: student } = await supabase
      .from("students")
      .select("assigned_counselor_id")
      .eq("id", student_id)
      .single();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (user!.role === "counselor" && student.assigned_counselor_id !== user!.id) {
      return NextResponse.json({ error: "Not assigned to this student" }, { status: 403 });
    }

    // Fetch job matches with lead details
    const { data: matches } = await supabase
      .from("job_matches")
      .select("id, job_lead_id, overall_score, grade, archetype, match_reasoning, job_leads(company_name, job_role, job_description, job_url)")
      .in("id", job_match_ids)
      .eq("student_id", student_id)
      .eq("match_status", "new");

    if (!matches || matches.length === 0) {
      return NextResponse.json({ error: "No valid job matches found" }, { status: 400 });
    }

    // Create agent run
    const totalSteps = matches.length * 4; // create_app, gen_cv, gen_prep, notify
    const { data: run, error: runError } = await supabase
      .from("agent_runs")
      .insert({
        run_type: "apply",
        student_id,
        initiated_by: user!.id,
        status: "queued",
        total_steps: totalSteps,
        completed_steps: 0,
        failed_steps: 0,
        input: null,
        output: null,
        error: null,
        started_at: null,
        completed_at: null,
      } as any)
      .select("id")
      .single();

    if (runError || !run) {
      logger.error({ requestId, error: runError?.message }, "Failed to create apply run");
      return NextResponse.json({ error: "Failed to create apply run" }, { status: 500 });
    }

    // Mark matches as queued
    await supabase.from("job_matches").update({ match_status: "queued" }).in("id", job_match_ids);

    // Create steps
    const steps: any[] = [];
    matches.forEach((match: any, idx: number) => {
      const lead = match.job_leads as {
        company_name: string;
        job_role: string;
        job_description: string | null;
        job_url: string | null;
      };
      const base = {
        student_id,
        match_id: match.id,
        company_name: lead.company_name,
        job_role: lead.job_role,
        job_description: lead.job_description,
        job_url: lead.job_url,
      };
      const offset = idx * 4;
      steps.push(
        { run_id: run.id, step_index: offset + 0, step_type: "create_app", status: "pending", input: base },
        { run_id: run.id, step_index: offset + 1, step_type: "gen_cv", status: "pending", input: base },
        { run_id: run.id, step_index: offset + 2, step_type: "gen_prep", status: "pending", input: base },
        { run_id: run.id, step_index: offset + 3, step_type: "notify", status: "pending", input: base }
      );
    });

    const { error: stepsError } = await supabase.from("agent_run_steps").insert(steps);
    if (stepsError) {
      logger.error({ requestId, error: stepsError.message }, "Failed to create apply steps");
      return NextResponse.json({ error: "Failed to create apply steps" }, { status: 500 });
    }

    return NextResponse.json({ run_id: run.id, jobs: matches.length, steps: totalSteps });
  },
  { method: "POST", allowedRoles: ["admin", "counselor"], bodySchema: applyAgentSchema, rateLimit: "apply-agent" }
);

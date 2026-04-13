import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/infra/withApi";
import { matchAgentSchema } from "@/lib/infra/zodSchemas";
import { logger } from "@/lib/infra/logger";

export const POST = withApi(
  async ({ body, user, requestId }) => {
    const supabase = createServerClient();
    const { student_id } = body;

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

    // Fetch candidate profile for cheap pre-filter keywords
    const { data: candidateProfile } = await supabase
      .from("candidate_profiles")
      .select("target_roles, skills, location_preference, cv_markdown")
      .eq("student_id", student_id)
      .single() as any;

    const keywords = new Set<string>();
    ((candidateProfile as any)?.target_roles || []).forEach((k: string) => keywords.add(k.toLowerCase()));
    ((candidateProfile as any)?.skills || []).forEach((k: string) => keywords.add(k.toLowerCase()));

    // Fetch unassigned leads not yet matched for this student
    const { data: leads } = await supabase
      .from("job_leads")
      .select("id, company_name, job_role, job_description, job_url, location")
      .eq("status", "new")
      .not("id", "in", supabase.from("job_matches").select("job_lead_id").eq("student_id", student_id))
      .order("discovered_at", { ascending: false })
      .limit(50);

    // Cheap pre-filter by keywords if we have them
    let filteredLeads = leads || [];
    if (keywords.size > 0) {
      filteredLeads = filteredLeads.filter((lead) => {
        const text = `${lead.job_role} ${lead.company_name}`.toLowerCase();
        return Array.from(keywords).some((kw) => text.includes(kw));
      });
    }

    // Location filter
    if ((candidateProfile as any)?.location_preference) {
      const loc = (candidateProfile as any).location_preference.toLowerCase();
      filteredLeads = filteredLeads.filter((lead) => {
        if (!lead.location) return true;
        return lead.location.toLowerCase().includes(loc) || loc.includes(lead.location.toLowerCase());
      });
    }

    if (filteredLeads.length === 0) {
      return NextResponse.json({ run_id: null, matched: 0, message: "No new leads to match" });
    }

    // Create agent run
    const { data: run, error: runError } = await supabase
      .from("agent_runs")
      .insert({
        run_type: "match",
        student_id,
        initiated_by: user!.id,
        status: "queued",
        total_steps: filteredLeads.length,
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
      logger.error({ requestId, error: runError?.message }, "Failed to create match run");
      return NextResponse.json({ error: "Failed to create match run" }, { status: 500 });
    }

    // Create steps
    const steps = filteredLeads.map((lead, idx) => ({
      run_id: run.id,
      step_index: idx,
      step_type: "evaluate" as const,
      status: "pending" as const,
      input: {
        student_id,
        lead_id: lead.id,
        company_name: lead.company_name,
        job_role: lead.job_role,
        job_description: lead.job_description,
        job_url: lead.job_url,
      },
    }));

    const { error: stepsError } = await supabase.from("agent_run_steps").insert(steps as any);
    if (stepsError) {
      logger.error({ requestId, error: stepsError.message }, "Failed to create match steps");
      return NextResponse.json({ error: "Failed to create match steps" }, { status: 500 });
    }

    return NextResponse.json({ run_id: run.id, matched: filteredLeads.length });
  },
  { method: "POST", allowedRoles: ["admin", "counselor"], bodySchema: matchAgentSchema, rateLimit: "match-agent" }
);

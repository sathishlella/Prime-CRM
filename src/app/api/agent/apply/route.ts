import { createServerClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/http/withApi";
import { applyAgentSchema } from "@/lib/http/zodSchemas";

export const POST = withApi(
  {
    schema: applyAgentSchema,
    requireRole: ["admin", "counselor"],
    rateLimit: { bucket: "apply-agent", limit: 2, windowMs: 10 * 60 * 1000 },
  },
  async ({ body, user, requestId, logger }) => {
    try {
      const { student_id, job_match_ids } = body;
      logger.info("starting apply agent", { student_id, jobs: job_match_ids.length });

      const supabase = createServerClient();

      // Verify counselor is assigned to this student (or admin)
      const { data: student } = await supabase
        .from("students")
        .select("assigned_counselor_id")
        .eq("id", student_id)
        .single();

      if (!student) {
        logger.warn("student not found for apply", { student_id });
        return Response.json(
          { error: "NOT_FOUND", message: "Student not found", requestId },
          { status: 404 }
        );
      }

      if (user.role === "counselor" && student.assigned_counselor_id !== user.id) {
        logger.warn("counselor not assigned to student", { student_id, counselor_id: user.id });
        return Response.json(
          { error: "FORBIDDEN", message: "Not assigned to this student", requestId },
          { status: 403 }
        );
      }

      // Fetch job matches with lead details
      const { data: matches } = await supabase
        .from("job_matches")
        .select("id, job_lead_id, overall_score, grade, archetype, match_reasoning, job_leads(company_name, job_role, job_description, job_url)")
        .in("id", job_match_ids)
        .eq("student_id", student_id)
        .eq("match_status", "new");

      if (!matches || matches.length === 0) {
        logger.warn("no valid job matches found", { student_id });
        return Response.json(
          { error: "VALIDATION_ERROR", message: "No valid job matches found", requestId },
          { status: 400 }
        );
      }

      // Create agent run (4 steps per job: create_app, gen_cv, gen_prep, notify)
      const totalSteps = matches.length * 4;
      const { data: run, error: runError } = await supabase
        .from("agent_runs")
        .insert({
          run_type: "apply",
          student_id,
          initiated_by: user.id,
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
        logger.error("failed to create apply run", { error: runError?.message });
        throw runError ?? new Error("Failed to create apply run");
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
        logger.error("failed to create apply steps", { error: stepsError.message });
        throw stepsError;
      }

      logger.info("apply agent enqueued", { run_id: run.id, jobs: matches.length, steps: totalSteps });
      return Response.json({ run_id: run.id, jobs: matches.length, steps: totalSteps });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error("apply agent failed", { error: error.message, stack: error.stack });
      throw err;
    }
  }
);

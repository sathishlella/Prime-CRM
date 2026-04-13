import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/infra/withApi";
import { logger } from "@/lib/infra/logger";
import {
  executeEvaluateStep,
  executeCreateAppStep,
  executeGenCvStep,
  executeGenPrepStep,
  executeNotifyStep,
} from "@/lib/agent/executor";

const BATCH_SIZE = 5;
const MAX_ATTEMPTS = 3;

export const POST = withApi(
  async ({ req, requestId }) => {
    // Cron secret check (even though skipAuth is true, we verify the bearer)
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      logger.warn({ route: "/api/agent/tick", requestId }, "Invalid cron secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Pull pending/failed steps with attempts < MAX_ATTEMPTS
    const { data: steps, error: stepsError } = await supabase
      .from("agent_run_steps")
      .select("*")
      .in("status", ["pending", "failed"])
      .lt("attempts", MAX_ATTEMPTS)
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE * 2); // fetch a bit more so we can filter for CV safety

    if (stepsError || !steps || steps.length === 0) {
      return NextResponse.json({ processed: 0 });
    }

    // Safety: if any CV step exists, process only CV steps and limit to 1
    // to avoid Playwright timeouts starving other work.
    let batch = steps;
    const hasCv = steps.some((s) => s.step_type === "gen_cv");
    if (hasCv) {
      batch = steps.filter((s) => s.step_type === "gen_cv").slice(0, 1);
    } else {
      batch = steps.slice(0, BATCH_SIZE);
    }

    const processedRunIds = new Set<string>();

    for (const step of batch) {
      processedRunIds.add(step.run_id);

      // Mark running
      const { error: lockError } = await supabase
        .from("agent_run_steps")
        .update({
          status: "running",
          attempts: (step.attempts || 0) + 1,
          started_at: new Date().toISOString(),
        })
        .eq("id", step.id)
        .eq("status", step.status); // optimistic lock

      if (lockError) {
        logger.warn({ requestId, stepId: step.id }, "Could not lock step, skipping");
        continue;
      }

      // Ensure run is marked running and started_at is set
      await supabase
        .from("agent_runs")
        .update({
          status: "running",
          started_at: step.started_at || new Date().toISOString(),
        })
        .eq("id", step.run_id)
        .eq("status", "queued");

      let result: { ok: boolean; error?: string; application_id?: string; cv_id?: string } = { ok: false, error: "Unknown step type" };

      try {
        switch (step.step_type) {
          case "evaluate":
            result = await executeEvaluateStep(step.input as any, requestId);
            break;
          case "create_app": {
            result = await executeCreateAppStep(step.input as any);
            if (result.ok && result.application_id) {
              // Cascade application_id to subsequent steps for this job
              await cascadeApplicationId(supabase, step.run_id, step.step_index, result.application_id);
            }
            break;
          }
          case "gen_cv": {
            const input = step.input as any;
            result = await executeGenCvStep(input, requestId);
            break;
          }
          case "gen_prep": {
            const input = step.input as any;
            if (!input.application_id) {
              result = { ok: false, error: "Missing application_id for prep" };
            } else {
              result = await executeGenPrepStep(input, requestId);
            }
            break;
          }
          case "notify": {
            const input = step.input as any;
            if (!input.application_id) {
              result = { ok: false, error: "Missing application_id for notify" };
            } else {
              result = await executeNotifyStep(input);
            }
            break;
          }
        }
      } catch (err) {
        result = { ok: false, error: String(err) };
      }

      // Update step result
      await supabase
        .from("agent_run_steps")
        .update({
          status: result.ok ? "done" : "failed",
          error: result.error || null,
          output: result.ok
            ? { application_id: result.application_id, cv_id: result.cv_id }
            : null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", step.id);
    }

    // Update run aggregates for all touched runs
    for (const runId of Array.from(processedRunIds)) {
      const { data: counts } = await supabase
        .from("agent_run_steps")
        .select("status")
        .eq("run_id", runId);

      const total = counts?.length || 0;
      const completed = counts?.filter((c) => c.status === "done").length || 0;
      const failed = counts?.filter((c) => c.status === "failed").length || 0;
      const pending = counts?.filter((c) => ["pending", "running"].includes(c.status)).length || 0;

      let runStatus = "running";
      if (pending === 0) {
        runStatus = failed > 0 ? "failed" : "completed";
      }

      await supabase
        .from("agent_runs")
        .update({
          status: runStatus,
          total_steps: total,
          completed_steps: completed,
          failed_steps: failed,
          completed_at: runStatus === "completed" || runStatus === "failed" ? new Date().toISOString() : null,
        })
        .eq("id", runId);
    }

    return NextResponse.json({ processed: batch.length });
  },
  { method: "POST", skipAuth: true }
);

async function cascadeApplicationId(
  supabase: ReturnType<typeof createAdminClient>,
  runId: string,
  stepIndex: number,
  applicationId: string
) {
  // For the same job (same step_index block of 4), inject application_id into gen_cv, gen_prep, notify
  const blockStart = Math.floor(stepIndex / 4) * 4;
  const blockEnd = blockStart + 3;
  const { data: siblings } = await supabase
    .from("agent_run_steps")
    .select("id, step_index, input")
    .eq("run_id", runId)
    .gte("step_index", blockStart)
    .lte("step_index", blockEnd);

  for (const s of siblings || []) {
    if (s.step_index === stepIndex) continue;
    const input = (s.input || {}) as Record<string, unknown>;
    if (!input.application_id) {
      input.application_id = applicationId;
      await supabase.from("agent_run_steps").update({ input }).eq("id", s.id);
    }
  }
}

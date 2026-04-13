import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logging/logger";
import { getRequestId } from "@/lib/logging/requestId";
import {
  executeEvaluateStep,
  executeCreateAppStep,
  executeGenCvStep,
  executeGenPrepStep,
  executeNotifyStep,
} from "@/lib/agent/executor";

const BATCH_SIZE = 5;
const MAX_ATTEMPTS = 3;

export async function POST(req: NextRequest): Promise<Response> {
  const requestId = getRequestId(req);
  const logger = createLogger(requestId, "/api/agent/tick");

  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      logger.warn("invalid cron secret");
      return Response.json(
        { error: "UNAUTHORIZED", message: "Invalid cron secret", requestId },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Pull pending/failed steps with attempts < MAX_ATTEMPTS
    const { data: steps, error: stepsError } = await supabase
      .from("agent_run_steps")
      .select("*")
      .in("status", ["pending", "failed"])
      .lt("attempts", MAX_ATTEMPTS)
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE * 2);

    if (stepsError || !steps || steps.length === 0) {
      return Response.json({ processed: 0 });
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

      // Mark running (optimistic lock on status)
      const { error: lockError } = await supabase
        .from("agent_run_steps")
        .update({
          status: "running",
          attempts: (step.attempts || 0) + 1,
          started_at: new Date().toISOString(),
        })
        .eq("id", step.id)
        .eq("status", step.status);

      if (lockError) {
        logger.warn("could not lock step, skipping", { stepId: step.id });
        continue;
      }

      // Ensure run is marked running
      await supabase
        .from("agent_runs")
        .update({
          status: "running",
          started_at: step.started_at || new Date().toISOString(),
        })
        .eq("id", step.run_id)
        .eq("status", "queued");

      let result: { ok: boolean; error?: string; application_id?: string; cv_id?: string } = {
        ok: false,
        error: "Unknown step type",
      };

      try {
        switch (step.step_type) {
          case "evaluate":
            result = await executeEvaluateStep(step.input as any, requestId);
            break;
          case "create_app": {
            result = await executeCreateAppStep(step.input as any);
            if (result.ok && result.application_id) {
              await cascadeApplicationId(supabase, step.run_id, step.step_index, result.application_id);
            }
            break;
          }
          case "gen_cv": {
            result = await executeGenCvStep(step.input as any, requestId);
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
          completed_at:
            runStatus === "completed" || runStatus === "failed"
              ? new Date().toISOString()
              : null,
        })
        .eq("id", runId);
    }

    logger.info("tick complete", { processed: batch.length });
    return Response.json({ processed: batch.length });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error("tick failed", { error: error.message, stack: error.stack });
    throw err;
  }
}

async function cascadeApplicationId(
  supabase: ReturnType<typeof createAdminClient>,
  runId: string,
  stepIndex: number,
  applicationId: string
) {
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

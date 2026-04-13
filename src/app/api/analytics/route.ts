import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { callClaude } from "@/lib/ai/claude";
import {
  PatternAnalysisResult,
  buildPatternAnalysisSystemPrompt,
  buildPatternAnalysisUserPrompt,
} from "@/lib/ai/prompts/pattern-analysis";
import { withApi } from "@/lib/infra/withApi";
import { logger } from "@/lib/infra/logger";

export const GET = withApi(
  async ({ user, requestId }) => {
    const supabase = createServerClient();

    const [funnelRes, scoreRes, archetypeRes, studentsRes, appsRes] =
      await Promise.all([
        supabase.rpc("application_funnel"),
        supabase.rpc("score_distribution"),
        supabase.rpc("archetype_performance"),
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("applications").select("id", { count: "exact", head: true }),
      ]);

    const funnel = (funnelRes.data || []) as Array<{ status: string; count: number }>;
    const scoreDistribution = (scoreRes.data || []) as Array<{ bucket: string; count: number }>;
    const archetypePerformance = (archetypeRes.data || []) as Array<{
      archetype: string;
      total: number;
      applied: number;
      interviews: number;
      offers: number;
    }>;

    let aiInsights: PatternAnalysisResult | null = null;
    const totalApps = appsRes.count || 0;

    if (totalApps >= 5) {
      try {
        const { data } = await callClaude<PatternAnalysisResult>(
          buildPatternAnalysisSystemPrompt(),
          buildPatternAnalysisUserPrompt({
            funnel,
            scoreDistribution,
            archetypePerformance: archetypePerformance.map((a) => ({
              archetype: a.archetype,
              total: a.total,
              interviews: a.interviews,
              offers: a.offers,
              conversion_rate:
                a.total > 0 ? Math.round((a.offers / a.total) * 100) : 0,
            })),
            totalStudents: studentsRes.count || 0,
            totalApplications: totalApps,
          }),
          { feature: "pattern-analysis", userId: user!.id }
        );
        aiInsights = data;
      } catch (err) {
        logger.error({ requestId, error: String(err) }, "AI analytics insights failed");
        // AI insights are optional
      }
    }

    return NextResponse.json({
      funnel,
      score_distribution: scoreDistribution,
      archetype_performance: archetypePerformance,
      total_students: studentsRes.count || 0,
      total_applications: totalApps,
      ai_insights: aiInsights,
    });
  },
  { method: "GET", allowedRoles: ["admin"] }
);

import { createServerClient } from "@/lib/supabase/server";
import { callClaude } from "@/lib/ai/claude";
import {
  PatternAnalysisResult,
  buildPatternAnalysisSystemPrompt,
  buildPatternAnalysisUserPrompt,
} from "@/lib/ai/prompts/pattern-analysis";
import { withApi } from "@/lib/http/withApi";

export const GET = withApi(
  { requireRole: "admin" },
  async ({ user, requestId, logger }) => {
    try {
      logger.info("fetching analytics");

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
            { feature: "pattern-analysis", userId: user.id, requestId }
          );
          aiInsights = data;
        } catch (err) {
          logger.error("AI analytics insights failed", { error: String(err) });
          // AI insights are optional
        }
      }

      logger.info("analytics complete", { total_apps: totalApps });

      return Response.json({
        funnel,
        score_distribution: scoreDistribution,
        archetype_performance: archetypePerformance,
        total_students: studentsRes.count || 0,
        total_applications: totalApps,
        ai_insights: aiInsights,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error("analytics fetch failed", { error: error.message, stack: error.stack });
      throw err;
    }
  }
);

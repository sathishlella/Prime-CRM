import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { callClaude } from "@/lib/ai/claude";
import {
  PatternAnalysisResult,
  buildPatternAnalysisSystemPrompt,
  buildPatternAnalysisUserPrompt,
} from "@/lib/ai/prompts/pattern-analysis";

export async function GET() {
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

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch aggregated data
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

    // Get AI insights if we have enough data
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
          })
        );
        aiInsights = data;
      } catch {
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
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

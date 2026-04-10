export interface PatternAnalysisResult {
  insights: Array<{
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
    action: string;
  }>;
  top_performing_archetypes: string[];
  underperforming_areas: string[];
  recommendation: string;
}

export function buildPatternAnalysisSystemPrompt(): string {
  return `You are an AI analytics expert for a job placement consultancy. You analyze application data to identify patterns, trends, and actionable recommendations.

## Output Format

Respond with ONLY a valid JSON object:

{
  "insights": [
    {
      "title": "short title",
      "description": "detailed explanation",
      "impact": "high|medium|low",
      "action": "specific action to take"
    }
  ],
  "top_performing_archetypes": ["archetype1", "archetype2"],
  "underperforming_areas": ["area1", "area2"],
  "recommendation": "2-3 sentence overall recommendation"
}

## Rules
- Generate 3-5 actionable insights
- Base everything on the data provided, never fabricate statistics
- Focus on what's actionable, not just descriptive
- Highlight both successes and areas for improvement`;
}

export function buildPatternAnalysisUserPrompt(data: {
  funnel: Array<{ status: string; count: number }>;
  scoreDistribution: Array<{ bucket: string; count: number }>;
  archetypePerformance: Array<{
    archetype: string;
    total: number;
    interviews: number;
    offers: number;
    conversion_rate: number;
  }>;
  totalStudents: number;
  totalApplications: number;
}): string {
  return `## Application Data Summary

**Total Students:** ${data.totalStudents}
**Total Applications:** ${data.totalApplications}

### Application Funnel
${data.funnel.map((f) => `- ${f.status}: ${f.count}`).join("\n")}

### Score Distribution
${data.scoreDistribution.map((s) => `- ${s.bucket}: ${s.count}`).join("\n")}

### Archetype Performance
${data.archetypePerformance
  .map(
    (a) =>
      `- ${a.archetype}: ${a.total} total, ${a.interviews} interviews, ${a.offers} offers, ${a.conversion_rate}% conversion`
  )
  .join("\n")}

---

Analyze this data and provide actionable insights. Return ONLY the JSON object.`;
}

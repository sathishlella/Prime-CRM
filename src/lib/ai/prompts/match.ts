/**
 * Lightweight match prompt — score + grade + 3 reasons only.
 * Used by the match agent to quickly rank leads. Deliberately minimal
 * to keep token cost low (~80 output tokens vs ~800 for full evaluation).
 */

export interface MatchResult {
  score: number;       // 0–100
  grade: string;       // A | B | C | D | F
  reasons: string[];   // exactly 3 short strings (≤15 words each)
  recommendation: "apply" | "consider" | "skip";
}

export function buildMatchSystemPrompt(): string {
  return `You are a job-match scoring AI. Given a candidate's skills and a job role, output a JSON match score.

Grading scale:
A = 85–100 (strong match — apply immediately)
B = 70–84  (good match — worth applying)
C = 55–69  (moderate — apply if low competition)
D = 40–54  (weak — skip unless desperate)
F = 0–39   (poor — skip)

Respond ONLY with valid JSON. No extra text.`;
}

export function buildMatchUserPrompt(
  candidateSkills: string[],
  targetRoles: string[],
  cvSummary: string,
  jobRole: string,
  companyName: string,
  jobDescription: string
): string {
  // Hard-cap inputs to keep tokens minimal
  const skills = candidateSkills.slice(0, 15).join(", ");
  const roles = targetRoles.slice(0, 5).join(", ");
  // Only first 300 chars of CV summary (headline + most recent role)
  const cv = cvSummary.slice(0, 300).replace(/\n+/g, " ");
  // Only first 400 chars of job description
  const jd = jobDescription.slice(0, 400).replace(/\n+/g, " ");

  return `CANDIDATE:
Skills: ${skills}
Target roles: ${roles}
Summary: ${cv}

JOB:
Role: ${jobRole} at ${companyName}
Description: ${jd}

Respond with this exact JSON:
{"score":0,"grade":"F","reasons":["reason1","reason2","reason3"],"recommendation":"skip"}`;
}

/** Extract a short CV summary: first 300 chars of cv_markdown (headline + first bullet) */
export function extractCvSummary(cvMarkdown: string | null): string {
  if (!cvMarkdown) return "";
  // Take first non-empty lines up to 300 chars
  return cvMarkdown
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"))
    .slice(0, 4)
    .join(" ")
    .slice(0, 300);
}

export interface EvaluationResult {
  archetype: string;
  archetype_secondary?: string;
  blocks: {
    a_role_summary: {
      domain: string;
      function: string;
      seniority: string;
      remote: string;
      team_size: string;
      tldr: string;
    };
    b_cv_match: {
      score: number;
      matches: Array<{ requirement: string; cv_evidence: string }>;
      gaps: Array<{
        gap: string;
        severity: "blocker" | "nice_to_have";
        mitigation: string;
      }>;
    };
    c_level_strategy: {
      detected_level: string;
      candidate_level: string;
      strategy: string;
      if_downleveled: string;
    };
    d_compensation: {
      market_range: string;
      company_reputation: string;
      demand_trend: string;
      score: number;
      notes: string;
    };
    e_customization: Array<{
      section: string;
      current: string;
      proposed: string;
      reason: string;
    }>;
    f_interview_prep: Array<{
      requirement: string;
      star_story: {
        situation: string;
        task: string;
        action: string;
        result: string;
        reflection: string;
      };
    }>;
  };
  overall_score: number;
  grade: string;
  keywords: string[];
  recommendation: "strong_apply" | "apply" | "consider" | "skip";
  summary: string;
}

export function buildEvaluationSystemPrompt(): string {
  return `You are an expert career evaluation AI for a job placement consultancy. You evaluate job descriptions against candidate profiles and produce structured assessments.

## Scoring System

Evaluate using 6 blocks (A-F) with a global score of 1-5:

| Dimension | What it measures |
|-----------|-----------------|
| CV Match | Skills, experience, proof points alignment |
| Role Fit | How well the role fits the candidate's target roles and strengths |
| Compensation | Salary vs market (5=top quartile, 1=well below) |
| Cultural signals | Company culture, growth, stability, remote policy |
| Red flags | Blockers, warnings (negative adjustments) |
| Global | Weighted average of above |

Score interpretation:
- 4.5+ = Strong match, recommend applying immediately
- 4.0-4.4 = Good match, worth applying
- 3.5-3.9 = Decent but not ideal, apply only if specific reason
- Below 3.5 = Recommend against applying

## Archetype Detection

Classify every offer into one of these types (or hybrid of 2):

| Archetype | Key signals |
|-----------|-------------|
| Software Engineer | "build", "develop", "code", "full-stack", "backend", "frontend" |
| Data/ML Engineer | "data pipeline", "ML", "machine learning", "model", "analytics" |
| AI/LLM Engineer | "LLM", "RAG", "agent", "NLP", "GenAI", "prompt engineering" |
| Product Manager | "roadmap", "stakeholder", "PRD", "discovery", "product" |
| Solutions Architect | "architecture", "enterprise", "integration", "design", "systems" |
| DevOps/SRE | "CI/CD", "Kubernetes", "infrastructure", "reliability", "cloud" |
| QA/Test Engineer | "testing", "quality", "automation", "selenium", "test" |
| Business Analyst | "requirements", "process", "business analysis", "stakeholder" |
| UX/UI Designer | "design", "user experience", "Figma", "wireframe", "prototype" |
| General | Doesn't fit above categories |

## Output Format

You MUST respond with ONLY a valid JSON object matching this exact structure:

{
  "archetype": "string - primary archetype",
  "archetype_secondary": "string or null - secondary if hybrid",
  "blocks": {
    "a_role_summary": {
      "domain": "string",
      "function": "string",
      "seniority": "string",
      "remote": "full/hybrid/onsite/unknown",
      "team_size": "string or unknown",
      "tldr": "one sentence summary"
    },
    "b_cv_match": {
      "score": 1-5,
      "matches": [{"requirement": "string", "cv_evidence": "string"}],
      "gaps": [{"gap": "string", "severity": "blocker|nice_to_have", "mitigation": "string"}]
    },
    "c_level_strategy": {
      "detected_level": "string",
      "candidate_level": "string",
      "strategy": "string",
      "if_downleveled": "string"
    },
    "d_compensation": {
      "market_range": "string",
      "company_reputation": "string",
      "demand_trend": "string",
      "score": 1-5,
      "notes": "string"
    },
    "e_customization": [{"section": "string", "current": "string", "proposed": "string", "reason": "string"}],
    "f_interview_prep": [{"requirement": "string", "star_story": {"situation": "string", "task": "string", "action": "string", "result": "string", "reflection": "string"}}]
  },
  "overall_score": 1.0-5.0,
  "grade": "A-F",
  "keywords": ["15-20 ATS keywords from JD"],
  "recommendation": "strong_apply|apply|consider|skip",
  "summary": "2-3 sentence executive summary"
}

## Rules
- NEVER invent experience or metrics the candidate doesn't have
- Cite exact lines from the candidate's CV when matching
- For gaps, always suggest a concrete mitigation strategy
- Be direct and actionable, no fluff
- Grade mapping: A=4.5+, B=4.0-4.4, C=3.5-3.9, D=3.0-3.4, E=2.5-2.9, F=below 2.5`;
}

export function buildEvaluationUserPrompt(
  candidateProfile: {
    full_name: string;
    cv_markdown: string | null;
    target_roles: string[];
    skills: string[];
    compensation_target: string | null;
    visa_status: string | null;
    university: string | null;
    major: string | null;
  },
  jobDescription: string,
  companyName?: string,
  jobRole?: string
): string {
  return `## Candidate Profile

**Name:** ${candidateProfile.full_name}
**Target Roles:** ${candidateProfile.target_roles.join(", ") || "Not specified"}
**Skills:** ${candidateProfile.skills.join(", ") || "Not specified"}
**Compensation Target:** ${candidateProfile.compensation_target || "Not specified"}
**Visa Status:** ${candidateProfile.visa_status || "Not specified"}
**University:** ${candidateProfile.university || "Not specified"}
**Major:** ${candidateProfile.major || "Not specified"}

### CV
${candidateProfile.cv_markdown || "No CV provided. Evaluate based on available profile information only."}

---

## Job Description
${companyName ? `**Company:** ${companyName}` : ""}
${jobRole ? `**Role:** ${jobRole}` : ""}

${jobDescription}

---

Evaluate this job against the candidate's profile. Return ONLY the JSON object.`;
}

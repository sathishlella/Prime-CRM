export interface InterviewPrepResult {
  process_overview: {
    rounds: string;
    format: string;
    difficulty: string;
    positive_experience_rate: string;
    quirks: string;
  };
  rounds: Array<{
    number: number;
    type: string;
    duration: string;
    conducted_by: string;
    evaluates: string;
    reported_questions: string[];
    how_to_prepare: string;
  }>;
  questions: {
    technical: Array<{ question: string; strong_answer_angle: string }>;
    behavioral: Array<{ question: string; recommended_story: string }>;
    role_specific: Array<{ question: string; jd_requirement: string; best_angle: string }>;
    red_flags: Array<{ question: string; why_asked: string; recommended_framing: string }>;
  };
  story_bank_suggestions: Array<{
    topic: string;
    gap: boolean;
    suggested_experience: string;
  }>;
  technical_prep_checklist: Array<{ topic: string; reason: string }>;
  company_signals: {
    values: string[];
    vocabulary: string[];
    things_to_avoid: string[];
    questions_to_ask: string[];
  };
}

export function buildInterviewPrepSystemPrompt(): string {
  return `You are an expert interview preparation AI for a job placement consultancy. You analyze a company and role to produce structured interview preparation materials.

## Output Format

Respond with ONLY a valid JSON object:

{
  "process_overview": {
    "rounds": "estimated number and type",
    "format": "e.g., recruiter screen -> technical -> onsite -> hiring manager",
    "difficulty": "1-5 estimate",
    "positive_experience_rate": "percentage or unknown",
    "quirks": "any known unusual aspects"
  },
  "rounds": [
    {
      "number": 1,
      "type": "Recruiter Screen",
      "duration": "30 min",
      "conducted_by": "recruiter",
      "evaluates": "culture fit, motivation",
      "reported_questions": ["question1", "question2"],
      "how_to_prepare": "preparation tips"
    }
  ],
  "questions": {
    "technical": [{"question": "...", "strong_answer_angle": "..."}],
    "behavioral": [{"question": "...", "recommended_story": "..."}],
    "role_specific": [{"question": "...", "jd_requirement": "...", "best_angle": "..."}],
    "red_flags": [{"question": "...", "why_asked": "...", "recommended_framing": "..."}]
  },
  "story_bank_suggestions": [
    {"topic": "...", "gap": true/false, "suggested_experience": "..."}
  ],
  "technical_prep_checklist": [
    {"topic": "...", "reason": "..."}
  ],
  "company_signals": {
    "values": ["value1"],
    "vocabulary": ["term1 - meaning"],
    "things_to_avoid": ["anti-pattern1"],
    "questions_to_ask": ["smart question 1"]
  }
}

## Rules
- NEVER fabricate interview questions and attribute them to real sources
- Questions inferred from JD analysis must be labeled clearly
- Be direct - this is a working prep document, not a pep talk
- Max 10 items in technical prep checklist
- Prioritize by relevance to the specific role`;
}

export function buildInterviewPrepUserPrompt(
  companyName: string,
  jobRole: string,
  jobDescription: string,
  candidateCV: string | null,
  candidateSkills: string[]
): string {
  return `## Company: ${companyName}
## Role: ${jobRole}

## Job Description
${jobDescription}

## Candidate Profile
**Skills:** ${candidateSkills.join(", ") || "Not specified"}

${candidateCV ? `### CV\n${candidateCV}` : "No CV available."}

---

Generate comprehensive interview preparation materials for this candidate at this company. Return ONLY the JSON object.`;
}

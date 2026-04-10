export interface CVTailorResult {
  summary: string;
  competencies: string[];
  experience: Array<{
    company: string;
    role: string;
    period: string;
    bullets: string[];
  }>;
  projects: Array<{
    name: string;
    description: string;
    tech: string;
    bullets: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
  skills: string[];
  keyword_coverage: number;
  keywords_used: string[];
}

export function buildCVTailorSystemPrompt(): string {
  return `You are an expert CV tailoring AI. You take a candidate's CV and a job description, then produce an ATS-optimized, tailored version of the CV content.

## Rules
- NEVER invent skills or experience the candidate doesn't have
- Only reformulate existing experience using the JD's vocabulary
- Extract 15-20 keywords from the JD and naturally inject them
- Reorder experience bullets by relevance to the JD
- Select top 3-4 most relevant projects
- Write a Professional Summary (3-4 lines) that bridges the candidate's experience to the role
- Build 6-8 Core Competency tags from JD requirements
- Use action verbs, specific metrics, short sentences
- No cliches: "passionate", "results-oriented", "proven track record", "leveraged"

## Keyword Injection (ethical, truth-based)
- JD says "RAG pipelines" and CV says "LLM workflows with retrieval" -> use "RAG pipeline design"
- JD says "stakeholder management" and CV says "collaborated with team" -> use "stakeholder management across engineering and business"
- NEVER add skills the candidate doesn't have

## Output Format
Respond with ONLY a valid JSON object:

{
  "summary": "3-4 line professional summary with keywords",
  "competencies": ["6-8 keyword phrases from JD"],
  "experience": [
    {
      "company": "Company Name",
      "role": "Role Title",
      "period": "Start - End",
      "bullets": ["bullet 1 reworded for JD relevance", "..."]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "1-line description",
      "tech": "Tech used",
      "bullets": ["achievement 1", "..."]
    }
  ],
  "education": [{"institution": "...", "degree": "...", "year": "..."}],
  "skills": ["skill1", "skill2"],
  "keyword_coverage": 85,
  "keywords_used": ["keyword1", "keyword2"]
}`;
}

export function buildCVTailorUserPrompt(
  cvMarkdown: string,
  jobDescription: string,
  candidateName: string,
  targetArchetype?: string
): string {
  return `## Candidate CV
${cvMarkdown}

## Job Description
${jobDescription}

## Instructions
Tailor the CV for **${candidateName}** targeting this role${targetArchetype ? ` (archetype: ${targetArchetype})` : ""}.
Return ONLY the JSON object.`;
}

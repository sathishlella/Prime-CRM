import { callClaudeText } from "./claude";

export async function parseRawCVToMarkdown(rawText: string): Promise<string> {
  const { text } = await callClaudeText(
    `You convert raw resume/CV text into clean, structured markdown. Use standard sections: Summary, Experience, Projects, Education, Skills. Keep all metrics and dates intact. Output ONLY the markdown, no explanation.`,
    `Convert this resume text to clean markdown:\n\n${rawText}`,
    { maxTokens: 4096 }
  );
  return text.trim();
}

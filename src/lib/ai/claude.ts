import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";
const MAX_RETRIES = 3;

export interface ClaudeResponse<T> {
  data: T;
  usage: { input_tokens: number; output_tokens: number };
}

export async function callClaude<T>(
  systemPrompt: string,
  userPrompt: string,
  opts?: { maxTokens?: number }
): Promise<ClaudeResponse<T>> {
  const maxTokens = opts?.maxTokens || 4096;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("No text content in Claude response");
      }

      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = textBlock.text.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      const data = JSON.parse(jsonStr) as T;

      return {
        data,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
        },
      };
    } catch (err) {
      lastError = err as Error;
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError;
}

export async function callClaudeText(
  systemPrompt: string,
  userPrompt: string,
  opts?: { maxTokens?: number }
): Promise<{ text: string; usage: { input_tokens: number; output_tokens: number } }> {
  const maxTokens = opts?.maxTokens || 4096;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in Claude response");
  }

  return {
    text: textBlock.text,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
    },
  };
}

/**
 * Anthropic (Claude) provider adapter.
 *
 * Replaces the original src/lib/ai/claude.ts implementation. The SDK's own
 * retry logic is disabled (maxRetries: 0) so retries live exclusively in our
 * router layer — otherwise we'd get 9-deep retry storms (3 SDK × 3 router).
 *
 * JSON parsing handles Claude's tendency to wrap output in markdown code
 * fences (```json ... ```) even when asked for raw JSON.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  AiProviderError,
  type ProviderJsonInput,
  type ProviderJsonOutput,
  type ProviderTextInput,
  type ProviderTextOutput,
} from "./types";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AiProviderError({
      provider: "anthropic",
      message: "ANTHROPIC_API_KEY missing",
      code: "missing_api_key",
      retryable: true,
    });
  }
  _client = new Anthropic({
    apiKey,
    maxRetries: 0,
  });
  return _client;
}

function getModel(): string {
  return process.env.CLAUDE_MODEL || DEFAULT_MODEL;
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  return trimmed;
}

function normalizeError(err: unknown): AiProviderError {
  if (err instanceof AiProviderError) return err;

  // Anthropic SDK throws APIError subclasses with .status
  const e = err as { status?: number; name?: string; message?: string };
  const status = typeof e?.status === "number" ? e.status : undefined;
  const isAbort = e?.name === "AbortError";
  const isTimeout = e?.name === "TimeoutError";

  const retryable =
    isAbort ||
    isTimeout ||
    (typeof status === "number" && (status >= 500 || status === 429));

  return new AiProviderError({
    provider: "anthropic",
    message: e?.message || "Anthropic call failed",
    status,
    code: isAbort ? "abort" : isTimeout ? "timeout" : undefined,
    retryable,
    cause: err,
  });
}

export async function anthropicJson(
  input: ProviderJsonInput
): Promise<ProviderJsonOutput> {
  const client = getClient();
  const model = getModel();

  let response: Awaited<ReturnType<typeof client.messages.create>>;
  try {
    response = await client.messages.create(
      {
        model,
        max_tokens: input.maxTokens,
        system: input.system,
        messages: [{ role: "user", content: input.user }],
      },
      { signal: input.signal }
    );
  } catch (err) {
    throw normalizeError(err);
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new AiProviderError({
      provider: "anthropic",
      message: "No text block in Anthropic response",
      code: "empty_response",
      retryable: true,
    });
  }

  const jsonStr = extractJson(textBlock.text);
  let data: unknown;
  try {
    data = JSON.parse(jsonStr);
  } catch (err) {
    throw new AiProviderError({
      provider: "anthropic",
      message: "Anthropic returned non-JSON content",
      code: "json_parse_error",
      retryable: false,
      cause: err,
    });
  }

  return {
    data,
    model,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
    },
  };
}

export async function anthropicText(
  input: ProviderTextInput
): Promise<ProviderTextOutput> {
  const client = getClient();
  const model = getModel();

  let response: Awaited<ReturnType<typeof client.messages.create>>;
  try {
    response = await client.messages.create(
      {
        model,
        max_tokens: input.maxTokens,
        system: input.system,
        messages: [{ role: "user", content: input.user }],
      },
      { signal: input.signal }
    );
  } catch (err) {
    throw normalizeError(err);
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new AiProviderError({
      provider: "anthropic",
      message: "No text block in Anthropic response",
      code: "empty_response",
      retryable: true,
    });
  }

  return {
    text: textBlock.text,
    model,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
    },
  };
}

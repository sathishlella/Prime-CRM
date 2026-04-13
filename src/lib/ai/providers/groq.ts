/**
 * Groq provider adapter (fallback only).
 *
 * Uses the OpenAI-compatible chat completions endpoint with Llama 3.3 70B.
 * No SDK dependency — plain fetch keeps the bundle small and avoids version
 * coupling. JSON mode uses response_format:{ type: "json_object" }, which
 * (unlike Claude) returns raw JSON in choices[0].message.content with no
 * markdown fences.
 *
 * Hard-coded fallback API key per project owner request: if GROQ_API_KEY is
 * unset, fall back to the embedded key. This is intentional — the entire
 * point of Groq here is to be the always-on backup.
 */

import {
  AiProviderError,
  type ProviderJsonInput,
  type ProviderJsonOutput,
  type ProviderTextInput,
  type ProviderTextOutput,
} from "./types";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

// Hard-coded fallback key — overridden by GROQ_API_KEY env if present.
const EMBEDDED_FALLBACK_KEY = "GROQ_KEY_REMOVED";

function getApiKey(): string {
  return process.env.GROQ_API_KEY || EMBEDDED_FALLBACK_KEY;
}

function getModel(): string {
  return process.env.GROQ_MODEL || DEFAULT_MODEL;
}

interface GroqChatResponse {
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

async function callGroq(args: {
  system: string;
  user: string;
  maxTokens: number;
  jsonMode: boolean;
  signal?: AbortSignal;
}): Promise<GroqChatResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new AiProviderError({
      provider: "groq",
      message: "GROQ_API_KEY missing and no embedded fallback",
      code: "missing_api_key",
      retryable: false,
    });
  }

  const body: Record<string, unknown> = {
    model: getModel(),
    messages: [
      { role: "system", content: args.system },
      { role: "user", content: args.user },
    ],
    max_tokens: args.maxTokens,
    temperature: 0.2,
  };
  if (args.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  let res: Response;
  try {
    res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: args.signal,
    });
  } catch (err) {
    const e = err as { name?: string; message?: string };
    const isAbort = e?.name === "AbortError";
    throw new AiProviderError({
      provider: "groq",
      message: e?.message || "Groq fetch failed",
      code: isAbort ? "abort" : "network_error",
      retryable: !isAbort,
      cause: err,
    });
  }

  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.text()).slice(0, 500);
    } catch {
      // ignore
    }
    throw new AiProviderError({
      provider: "groq",
      message: `Groq HTTP ${res.status}: ${detail}`,
      status: res.status,
      retryable: res.status >= 500 || res.status === 429,
    });
  }

  let json: GroqChatResponse;
  try {
    json = (await res.json()) as GroqChatResponse;
  } catch (err) {
    throw new AiProviderError({
      provider: "groq",
      message: "Groq returned non-JSON envelope",
      code: "envelope_parse_error",
      retryable: true,
      cause: err,
    });
  }

  return json;
}

export async function groqJson(
  input: ProviderJsonInput
): Promise<ProviderJsonOutput> {
  const json = await callGroq({
    system: input.system,
    user: input.user,
    maxTokens: input.maxTokens,
    jsonMode: true,
    signal: input.signal,
  });

  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new AiProviderError({
      provider: "groq",
      message: "Groq returned empty content",
      code: "empty_response",
      retryable: true,
    });
  }

  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch (err) {
    throw new AiProviderError({
      provider: "groq",
      message: "Groq returned non-JSON content",
      code: "json_parse_error",
      retryable: false,
      cause: err,
    });
  }

  return {
    data,
    model: json.model,
    usage: {
      input_tokens: json.usage.prompt_tokens,
      output_tokens: json.usage.completion_tokens,
    },
  };
}

export async function groqText(
  input: ProviderTextInput
): Promise<ProviderTextOutput> {
  const json = await callGroq({
    system: input.system,
    user: input.user,
    maxTokens: input.maxTokens,
    jsonMode: false,
    signal: input.signal,
  });

  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new AiProviderError({
      provider: "groq",
      message: "Groq returned empty content",
      code: "empty_response",
      retryable: true,
    });
  }

  return {
    text: content,
    model: json.model,
    usage: {
      input_tokens: json.usage.prompt_tokens,
      output_tokens: json.usage.completion_tokens,
    },
  };
}

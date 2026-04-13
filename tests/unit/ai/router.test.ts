import { describe, it, expect, vi, beforeEach } from "vitest";
import { AiProviderError } from "@/lib/ai/providers/types";

// ─── Mock external deps before importing the router ─────────────────────────

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: () => ({
    from: () => ({ insert: () => Promise.resolve({ error: null }) }),
  }),
}));

const mockAnthropicJson = vi.fn();
const mockAnthropicText = vi.fn();
const mockGroqJson = vi.fn();
const mockGroqText = vi.fn();

vi.mock("@/lib/ai/providers/anthropic", () => ({
  get anthropicJson() { return mockAnthropicJson; },
  get anthropicText() { return mockAnthropicText; },
}));
vi.mock("@/lib/ai/providers/groq", () => ({
  get groqJson() { return mockGroqJson; },
  get groqText() { return mockGroqText; },
}));

// Import after mocks are registered
const { aiJson, aiText } = await import("@/lib/ai/router");

const FAKE_OUTPUT = {
  data: { score: 90 },
  model: "claude-sonnet",
  usage: { input_tokens: 100, output_tokens: 50 },
};

const FAKE_TEXT_OUTPUT = {
  text: "Here is the answer.",
  model: "claude-sonnet",
  usage: { input_tokens: 80, output_tokens: 40 },
};

const BASE_OPTS = {
  feature: "evaluate" as const,
  system: "You are a helper",
  user: "Evaluate this job",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("aiJson — happy path", () => {
  it("returns primary provider result when Anthropic succeeds", async () => {
    mockAnthropicJson.mockResolvedValueOnce(FAKE_OUTPUT);
    const result = await aiJson(BASE_OPTS);
    expect(result.fellBack).toBe(false);
    expect(result.provider).toBe("anthropic");
    expect(result.data).toEqual({ score: 90 });
    expect(mockGroqJson).not.toHaveBeenCalled();
  });
});

describe("aiJson — Groq fallback", () => {
  const retryableErr = new AiProviderError({
    provider: "anthropic",
    message: "Service unavailable",
    status: 503,
    retryable: true,
  });

  it("falls back to Groq on retryable Anthropic error for evaluate", async () => {
    mockAnthropicJson.mockRejectedValueOnce(retryableErr);
    mockGroqJson.mockResolvedValueOnce({ ...FAKE_OUTPUT, model: "llama-3.3-70b" });
    const result = await aiJson(BASE_OPTS);
    expect(result.fellBack).toBe(true);
    expect(result.provider).toBe("groq");
    expect(mockGroqJson).toHaveBeenCalledOnce();
  });

  it("also falls back for interview-prep", async () => {
    mockAnthropicJson.mockRejectedValueOnce(retryableErr);
    mockGroqJson.mockResolvedValueOnce({ ...FAKE_OUTPUT, model: "llama" });
    const result = await aiJson({ ...BASE_OPTS, feature: "interview-prep" });
    expect(result.fellBack).toBe(true);
  });

  it("also falls back for match", async () => {
    mockAnthropicJson.mockRejectedValueOnce(retryableErr);
    mockGroqJson.mockResolvedValueOnce({ ...FAKE_OUTPUT, model: "llama" });
    const result = await aiJson({ ...BASE_OPTS, feature: "match" });
    expect(result.fellBack).toBe(true);
  });

  it("also falls back for chat", async () => {
    mockAnthropicJson.mockRejectedValueOnce(retryableErr);
    mockGroqJson.mockResolvedValueOnce({ ...FAKE_OUTPUT, model: "llama" });
    const result = await aiJson({ ...BASE_OPTS, feature: "chat" });
    expect(result.fellBack).toBe(true);
  });
});

describe("aiJson — hard-fail features (no Groq fallback)", () => {
  const retryableErr = new AiProviderError({
    provider: "anthropic",
    message: "Overloaded",
    status: 529,
    retryable: true,
  });

  it("cv-generate does NOT fall back — throws immediately", async () => {
    mockAnthropicJson.mockRejectedValueOnce(retryableErr);
    await expect(aiJson({ ...BASE_OPTS, feature: "cv-generate" })).rejects.toThrow();
    expect(mockGroqJson).not.toHaveBeenCalled();
  });

  it("cv-parse does NOT fall back — throws immediately", async () => {
    mockAnthropicJson.mockRejectedValueOnce(retryableErr);
    await expect(aiJson({ ...BASE_OPTS, feature: "cv-parse" })).rejects.toThrow();
    expect(mockGroqJson).not.toHaveBeenCalled();
  });
});

describe("aiJson — non-retryable errors never fall back", () => {
  it("400 error is not retried", async () => {
    const nonRetryable = new AiProviderError({
      provider: "anthropic",
      message: "Bad request",
      status: 400,
      retryable: false,
    });
    mockAnthropicJson.mockRejectedValueOnce(nonRetryable);
    await expect(aiJson(BASE_OPTS)).rejects.toThrow();
    expect(mockGroqJson).not.toHaveBeenCalled();
  });

  it("401 error is not retried", async () => {
    const auth = new AiProviderError({
      provider: "anthropic",
      message: "Unauthorized",
      status: 401,
      retryable: false,
    });
    mockAnthropicJson.mockRejectedValueOnce(auth);
    await expect(aiJson(BASE_OPTS)).rejects.toThrow();
    expect(mockGroqJson).not.toHaveBeenCalled();
  });

  it("non-AiProviderError is not retried", async () => {
    mockAnthropicJson.mockRejectedValueOnce(new Error("Network error"));
    await expect(aiJson(BASE_OPTS)).rejects.toThrow("Network error");
    expect(mockGroqJson).not.toHaveBeenCalled();
  });
});

describe("aiJson — both providers fail", () => {
  it("throws the fallback provider error when both fail", async () => {
    const primaryErr = new AiProviderError({ provider: "anthropic", message: "down", status: 503, retryable: true });
    const fallbackErr = new AiProviderError({ provider: "groq", message: "also down", status: 503, retryable: true });
    mockAnthropicJson.mockRejectedValueOnce(primaryErr);
    mockGroqJson.mockRejectedValueOnce(fallbackErr);
    await expect(aiJson(BASE_OPTS)).rejects.toThrow("also down");
  });
});

describe("aiText — happy path", () => {
  it("returns text from primary provider", async () => {
    mockAnthropicText.mockResolvedValueOnce(FAKE_TEXT_OUTPUT);
    const result = await aiText(BASE_OPTS);
    expect(result.text).toBe("Here is the answer.");
    expect(result.fellBack).toBe(false);
    expect(result.provider).toBe("anthropic");
  });
});

describe("aiText — Groq fallback", () => {
  it("falls back to Groq on retryable error", async () => {
    const err = new AiProviderError({ provider: "anthropic", message: "overloaded", status: 529, retryable: true });
    mockAnthropicText.mockRejectedValueOnce(err);
    mockGroqText.mockResolvedValueOnce({ ...FAKE_TEXT_OUTPUT, model: "llama" });
    const result = await aiText(BASE_OPTS);
    expect(result.fellBack).toBe(true);
    expect(result.provider).toBe("groq");
  });
});

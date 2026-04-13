/**
 * Shared types for the AI provider layer.
 *
 * The router (../router.ts) is the only public entrypoint. Provider modules
 * (anthropic.ts, groq.ts) implement these contracts. Application code never
 * imports a provider directly.
 */

export type AiFeature =
  | "evaluate"
  | "interview-prep"
  | "pattern-analysis"
  | "match"
  | "chat"
  | "cv-generate"
  | "cv-parse";

export type AiProviderName = "anthropic" | "groq";

export interface AiUsage {
  input_tokens: number;
  output_tokens: number;
}

export interface AiJsonResult<T> {
  data: T;
  provider: AiProviderName;
  model: string;
  usage: AiUsage;
  latency_ms: number;
  /** True when the call succeeded only on the fallback provider. */
  fellBack: boolean;
}

export interface AiTextResult {
  text: string;
  provider: AiProviderName;
  model: string;
  usage: AiUsage;
  latency_ms: number;
  fellBack: boolean;
}

export interface AiCallOptions {
  feature: AiFeature;
  system: string;
  user: string;
  maxTokens?: number;
  /** Optional abort signal for caller-side cancellation. */
  signal?: AbortSignal;
  /** For logging / cost attribution. */
  userId?: string;
  requestId?: string;
}

/**
 * Normalized error shape used across providers. The router inspects
 * `retryable` to decide whether to fall back to the secondary provider.
 *
 * Retry rules (router.ts):
 *   - retryable: status >= 500, status === 429, code === "timeout", AbortError
 *   - NOT retryable: 400, 401, 403, schema validation, missing API key
 */
export class AiProviderError extends Error {
  readonly retryable: boolean;
  readonly status?: number;
  readonly code?: string;
  readonly provider: AiProviderName;

  constructor(args: {
    provider: AiProviderName;
    message: string;
    status?: number;
    code?: string;
    retryable: boolean;
    cause?: unknown;
  }) {
    super(args.message, { cause: args.cause });
    this.name = "AiProviderError";
    this.provider = args.provider;
    this.status = args.status;
    this.code = args.code;
    this.retryable = args.retryable;
  }
}

export interface ProviderJsonInput {
  system: string;
  user: string;
  maxTokens: number;
  signal?: AbortSignal;
}

export interface ProviderTextInput extends ProviderJsonInput {}

export interface ProviderJsonOutput {
  data: unknown;
  model: string;
  usage: AiUsage;
}

export interface ProviderTextOutput {
  text: string;
  model: string;
  usage: AiUsage;
}

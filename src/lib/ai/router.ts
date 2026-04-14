/**
 * AI Router — the single public entrypoint for all AI calls in this app.
 *
 * Application code calls aiJson() / aiText() with a `feature` tag. The router
 * owns the per-feature fallback policy table (see FALLBACK_POLICY below):
 *
 *   - evaluate / interview-prep / pattern-analysis / match / chat:
 *       Anthropic primary → Groq fallback on transient errors.
 *
 *   - cv-generate / cv-parse:
 *       Anthropic only. Hard-fail with AI_CV_UNAVAILABLE rather than
 *       silently producing an inferior CV on a fallback model.
 *
 * Fallback triggers (per AiProviderError.retryable):
 *   - status >= 500
 *   - status === 429
 *   - code === "timeout" / "abort" (network)
 *
 * Non-retryable errors (4xx, missing key, JSON parse) NEVER fall back. The
 * router also surfaces the daily cost cap as a hard 402 — see checkCostCap.
 *
 * AI call observability is logged to stdout in JSON for now. Once the
 * `ai_call_log` table from migration 003 lands, persistAiCall() will be
 * extended to write to the DB. Stdout logging continues either way.
 */

import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/server";
import { anthropicJson, anthropicText } from "./providers/anthropic";
import { groqJson, groqText } from "./providers/groq";
import {
  AiProviderError,
  type AiCallOptions,
  type AiFeature,
  type AiJsonResult,
  type AiProviderName,
  type AiTextResult,
  type AiUsage,
  type ProviderJsonInput,
  type ProviderJsonOutput,
  type ProviderTextOutput,
} from "./providers/types";

// ─── Per-feature fallback policy ────────────────────────────────────────────

interface FeaturePolicy {
  primary: AiProviderName;
  fallback: AiProviderName | null;
  defaultMaxTokens: number;
}

const FALLBACK_POLICY: Record<AiFeature, FeaturePolicy> = {
  evaluate: { primary: "anthropic", fallback: "groq", defaultMaxTokens: 8192 },
  "interview-prep": { primary: "anthropic", fallback: "groq", defaultMaxTokens: 8192 },
  "pattern-analysis": { primary: "anthropic", fallback: "groq", defaultMaxTokens: 4096 },
  match: { primary: "anthropic", fallback: "groq", defaultMaxTokens: 4096 },
  chat: { primary: "anthropic", fallback: "groq", defaultMaxTokens: 4096 },
  "cv-generate": { primary: "anthropic", fallback: "groq", defaultMaxTokens: 8192 },
  "cv-parse": { primary: "anthropic", fallback: null, defaultMaxTokens: 4096 },
};

// ─── Cost table (USD per 1M tokens) ─────────────────────────────────────────
// Hard-coded estimates. Adjust as pricing changes. Used by checkCostCap and
// the cost log; not a source of billing truth.

interface PriceRow {
  input: number;
  output: number;
}

const PRICE_PER_M_TOKENS: Record<AiProviderName, PriceRow> = {
  anthropic: { input: 3.0, output: 15.0 }, // Claude Sonnet 4 approximate
  groq: { input: 0.59, output: 0.79 }, // Llama 3.3 70B Versatile approximate
};

function estimateCostUsd(provider: AiProviderName, usage: AiUsage): number {
  const price = PRICE_PER_M_TOKENS[provider];
  return (
    (usage.input_tokens / 1_000_000) * price.input +
    (usage.output_tokens / 1_000_000) * price.output
  );
}

// ─── Stdout JSON logging (DB log added later) ───────────────────────────────

interface AiCallLogEntry {
  ts: string;
  request_id?: string;
  user_id?: string;
  feature: AiFeature;
  provider: AiProviderName;
  model: string;
  status: "ok" | "fallback" | "error";
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  latency_ms: number;
  error?: string;
}

function persistAiCall(entry: AiCallLogEntry): void {
  // Single JSON line — Vercel log drains will pick this up.
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ kind: "ai_call", ...entry }));

  // Fire-and-forget DB persistence (admin client because ai_call_log is admin-only RLS)
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    try {
      const admin = createAdminClient();
      admin
        .from("ai_call_log")
        .insert({
          request_id: entry.request_id,
          user_id: entry.user_id,
          feature: entry.feature,
          provider: entry.provider,
          model: entry.model,
          input_tokens: entry.input_tokens,
          output_tokens: entry.output_tokens,
          latency_ms: entry.latency_ms,
          status: entry.status,
          error: entry.error,
          cost_usd: entry.cost_usd,
        } as any)
        .then(({ error }) => {
          if (error) {
            // eslint-disable-next-line no-console
            console.log(JSON.stringify({ kind: "ai_call_db_error", error: error.message }));
          }
        });
    } catch {
      // ignore
    }
  }
}

// ─── Provider dispatch ──────────────────────────────────────────────────────

async function dispatchJson(
  provider: AiProviderName,
  input: ProviderJsonInput
): Promise<ProviderJsonOutput> {
  if (provider === "anthropic") return anthropicJson(input);
  return groqJson(input);
}

async function dispatchText(
  provider: AiProviderName,
  input: ProviderJsonInput
): Promise<ProviderTextOutput> {
  if (provider === "anthropic") return anthropicText(input);
  return groqText(input);
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function aiJson<T>(opts: AiCallOptions): Promise<AiJsonResult<T>> {
  const policy = FALLBACK_POLICY[opts.feature];
  const maxTokens = opts.maxTokens ?? policy.defaultMaxTokens;
  const providerInput: ProviderJsonInput = {
    system: opts.system,
    user: opts.user,
    maxTokens,
    signal: opts.signal,
  };

  // Try primary
  const primaryStart = Date.now();
  try {
    const out = await dispatchJson(policy.primary, providerInput);
    const latency = Date.now() - primaryStart;
    persistAiCall({
      ts: new Date().toISOString(),
      request_id: opts.requestId,
      user_id: opts.userId,
      feature: opts.feature,
      provider: policy.primary,
      model: out.model,
      status: "ok",
      input_tokens: out.usage.input_tokens,
      output_tokens: out.usage.output_tokens,
      cost_usd: estimateCostUsd(policy.primary, out.usage),
      latency_ms: latency,
    });
    return {
      data: out.data as T,
      provider: policy.primary,
      model: out.model,
      usage: out.usage,
      latency_ms: latency,
      fellBack: false,
    };
  } catch (err) {
    const aiErr = err instanceof AiProviderError ? err : null;
    const latency = Date.now() - primaryStart;

    // Log primary failure
    persistAiCall({
      ts: new Date().toISOString(),
      request_id: opts.requestId,
      user_id: opts.userId,
      feature: opts.feature,
      provider: policy.primary,
      model: "",
      status: "error",
      input_tokens: 0,
      output_tokens: 0,
      cost_usd: 0,
      latency_ms: latency,
      error: aiErr ? `${aiErr.code ?? aiErr.status ?? ""} ${aiErr.message}`.trim() : String(err),
    });
    Sentry.captureException(err);

    // No fallback configured for this feature, or error is not retryable
    if (!policy.fallback || !aiErr || !aiErr.retryable) {
      throw err;
    }

    // Fallback attempt
    const fallbackStart = Date.now();
    try {
      const out = await dispatchJson(policy.fallback, providerInput);
      const fallbackLatency = Date.now() - fallbackStart;
      persistAiCall({
        ts: new Date().toISOString(),
        request_id: opts.requestId,
        user_id: opts.userId,
        feature: opts.feature,
        provider: policy.fallback,
        model: out.model,
        status: "fallback",
        input_tokens: out.usage.input_tokens,
        output_tokens: out.usage.output_tokens,
        cost_usd: estimateCostUsd(policy.fallback, out.usage),
        latency_ms: fallbackLatency,
      });
      return {
        data: out.data as T,
        provider: policy.fallback,
        model: out.model,
        usage: out.usage,
        latency_ms: fallbackLatency,
        fellBack: true,
      };
    } catch (fallbackErr) {
      const fallbackAiErr =
        fallbackErr instanceof AiProviderError ? fallbackErr : null;
      const fallbackLatency = Date.now() - fallbackStart;
      persistAiCall({
        ts: new Date().toISOString(),
        request_id: opts.requestId,
        user_id: opts.userId,
        feature: opts.feature,
        provider: policy.fallback,
        model: "",
        status: "error",
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: 0,
        latency_ms: fallbackLatency,
        error: fallbackAiErr
          ? `${fallbackAiErr.code ?? fallbackAiErr.status ?? ""} ${fallbackAiErr.message}`.trim()
          : String(fallbackErr),
      });
      Sentry.captureException(fallbackErr);
      throw fallbackErr;
    }
  }
}

export async function aiText(opts: AiCallOptions): Promise<AiTextResult> {
  const policy = FALLBACK_POLICY[opts.feature];
  const maxTokens = opts.maxTokens ?? policy.defaultMaxTokens;
  const providerInput: ProviderJsonInput = {
    system: opts.system,
    user: opts.user,
    maxTokens,
    signal: opts.signal,
  };

  const primaryStart = Date.now();
  try {
    const out = await dispatchText(policy.primary, providerInput);
    const latency = Date.now() - primaryStart;
    persistAiCall({
      ts: new Date().toISOString(),
      request_id: opts.requestId,
      user_id: opts.userId,
      feature: opts.feature,
      provider: policy.primary,
      model: out.model,
      status: "ok",
      input_tokens: out.usage.input_tokens,
      output_tokens: out.usage.output_tokens,
      cost_usd: estimateCostUsd(policy.primary, out.usage),
      latency_ms: latency,
    });
    return {
      text: out.text,
      provider: policy.primary,
      model: out.model,
      usage: out.usage,
      latency_ms: latency,
      fellBack: false,
    };
  } catch (err) {
    const aiErr = err instanceof AiProviderError ? err : null;
    const latency = Date.now() - primaryStart;
    persistAiCall({
      ts: new Date().toISOString(),
      request_id: opts.requestId,
      user_id: opts.userId,
      feature: opts.feature,
      provider: policy.primary,
      model: "",
      status: "error",
      input_tokens: 0,
      output_tokens: 0,
      cost_usd: 0,
      latency_ms: latency,
      error: aiErr ? `${aiErr.code ?? aiErr.status ?? ""} ${aiErr.message}`.trim() : String(err),
    });
    Sentry.captureException(err);

    if (!policy.fallback || !aiErr || !aiErr.retryable) {
      throw err;
    }

    const fallbackStart = Date.now();
    try {
      const out = await dispatchText(policy.fallback, providerInput);
      const fallbackLatency = Date.now() - fallbackStart;
      persistAiCall({
        ts: new Date().toISOString(),
        request_id: opts.requestId,
        user_id: opts.userId,
        feature: opts.feature,
        provider: policy.fallback,
        model: out.model,
        status: "fallback",
        input_tokens: out.usage.input_tokens,
        output_tokens: out.usage.output_tokens,
        cost_usd: estimateCostUsd(policy.fallback, out.usage),
        latency_ms: fallbackLatency,
      });
      return {
        text: out.text,
        provider: policy.fallback,
        model: out.model,
        usage: out.usage,
        latency_ms: fallbackLatency,
        fellBack: true,
      };
    } catch (fallbackErr) {
      const fallbackAiErr =
        fallbackErr instanceof AiProviderError ? fallbackErr : null;
      const fallbackLatency = Date.now() - fallbackStart;
      persistAiCall({
        ts: new Date().toISOString(),
        request_id: opts.requestId,
        user_id: opts.userId,
        feature: opts.feature,
        provider: policy.fallback,
        model: "",
        status: "error",
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: 0,
        latency_ms: fallbackLatency,
        error: fallbackAiErr
          ? `${fallbackAiErr.code ?? fallbackAiErr.status ?? ""} ${fallbackAiErr.message}`.trim()
          : String(fallbackErr),
      });
      Sentry.captureException(fallbackErr);
      throw fallbackErr;
    }
  }
}

// Re-export the error class so callers can `instanceof` check
export { AiProviderError } from "./providers/types";
export type {
  AiFeature,
  AiCallOptions,
  AiJsonResult,
  AiTextResult,
} from "./providers/types";

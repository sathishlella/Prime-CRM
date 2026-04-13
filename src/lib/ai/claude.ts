/**
 * Legacy compatibility shim — delegates to the multi-provider router.
 *
 * @deprecated Import from `@/lib/ai/router` directly. This shim exists so the
 * 5 historic call sites (api/evaluate, api/generate-cv, api/interview-prep,
 * api/analytics, lib/ai/cv-parser) keep working with minimal churn during the
 * migration. New code MUST go through `aiJson` / `aiText` from the router.
 *
 * The `feature` option is required so the router can apply the correct
 * fallback policy (Groq fallback for evaluate/interview-prep/etc.; hard fail
 * for cv-generate / cv-parse).
 */

import { aiJson, aiText } from "./router";
import type { AiFeature, AiUsage } from "./providers/types";

export interface ClaudeResponse<T> {
  data: T;
  usage: AiUsage;
}

export interface ClaudeCallOptions {
  /** Required: drives fallback policy and rate-limit bucket. */
  feature: AiFeature;
  maxTokens?: number;
  /** Pass-through for logging / cost attribution. */
  userId?: string;
  requestId?: string;
}

export async function callClaude<T>(
  systemPrompt: string,
  userPrompt: string,
  opts: ClaudeCallOptions
): Promise<ClaudeResponse<T>> {
  const result = await aiJson<T>({
    feature: opts.feature,
    system: systemPrompt,
    user: userPrompt,
    maxTokens: opts.maxTokens,
    userId: opts.userId,
    requestId: opts.requestId,
  });
  return {
    data: result.data,
    usage: result.usage,
  };
}

export async function callClaudeText(
  systemPrompt: string,
  userPrompt: string,
  opts: ClaudeCallOptions
): Promise<{ text: string; usage: AiUsage }> {
  const result = await aiText({
    feature: opts.feature,
    system: systemPrompt,
    user: userPrompt,
    maxTokens: opts.maxTokens,
    userId: opts.userId,
    requestId: opts.requestId,
  });
  return {
    text: result.text,
    usage: result.usage,
  };
}

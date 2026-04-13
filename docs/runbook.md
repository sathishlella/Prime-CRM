# Prime CRM — Oncall Runbook

## 1. Cancel a runaway agent run

```sql
-- Find running runs
SELECT id, run_type, status, total_steps, completed_steps, created_at
FROM agent_runs
WHERE status IN ('queued','running')
ORDER BY created_at DESC
LIMIT 20;

-- Cancel by run ID (also skips all pending steps)
UPDATE agent_runs
SET status = 'canceled', updated_at = now()
WHERE id = '<run_id>';

UPDATE agent_run_steps
SET status = 'skipped', updated_at = now()
WHERE run_id = '<run_id>'
  AND status IN ('pending','running');
```

## 2. Flush a rate-limit bucket

The in-memory rate limiter resets on each serverless cold start. For persistent buckets via Supabase:

```sql
DELETE FROM rate_limit_buckets WHERE key LIKE '<user_id>:%';
```

For the in-memory limiter in local dev, restart the dev server.

## 3. Rotate the Groq API key

1. Generate a new key at `console.groq.com`.
2. In Vercel → Settings → Environment Variables, update `GROQ_API_KEY`.
3. Redeploy: `vercel --prod` or push to `main`.
4. Verify: hit `/api/evaluate` and check logs for `"provider":"groq"` when Anthropic is offline.

## 4. Rotate the Anthropic API key

1. Generate a new key at `console.anthropic.com`.
2. Update `ANTHROPIC_API_KEY` in Vercel environment variables.
3. Redeploy and verify with a test evaluation request.

## 5. Rotate CRON_SECRET

1. Generate: `openssl rand -hex 32`.
2. Update `CRON_SECRET` in Vercel environment variables.
3. Update the same value in Supabase Edge Function secrets (if using pg_cron + Edge Function).
4. Redeploy.

## 6. Stuck pending steps (locked by a crashed invocation)

Steps locked by a crashed tick remain in `status='running'` with `locked_until` in the past.

```sql
-- Find stuck steps
SELECT id, run_id, step_type, status, locked_until, attempts
FROM agent_run_steps
WHERE status = 'running'
  AND locked_until < now();

-- Release them back to pending
UPDATE agent_run_steps
SET status = 'pending', locked_by = null, locked_until = null
WHERE status = 'running'
  AND locked_until < now();
```

The next tick will reclaim them automatically (max delay: 2 minutes via `locked_until`).

## 7. Sentry triage

- Errors appear at `sentry.io` under project `prime-crm`.
- Each error carries `request_id` — match against Vercel log drain with `"request_id":"<id>"`.
- Common error codes: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `INTERNAL_ERROR` (500).

## 8. AI daily cost cap exceeded (`COST_CAP_EXCEEDED`)

Users receive `402` when their daily AI spend exceeds `AI_DAILY_COST_CAP_USD` (default $20).

```sql
-- Check today's spend per user
SELECT user_id, sum(cost_usd) AS total_today
FROM ai_call_log
WHERE created_at >= current_date
GROUP BY user_id
ORDER BY total_today DESC;
```

To temporarily raise the cap, update `AI_DAILY_COST_CAP_USD` in Vercel env and redeploy.

## 9. Emergency: disable all AI endpoints

Set `ANTHROPIC_API_KEY=disabled` and `GROQ_API_KEY=disabled` in Vercel env.
All AI routes will return `503 AI_UNAVAILABLE`. CRUD routes are unaffected.

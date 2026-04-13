-- ============================================================
-- Prime CRM — Agentic Engine Migration
-- Adds durable workflow tables, match scoring, chat, and
-- AI cost observability.
-- ============================================================

-- ─── Ensure enums and job_leads exist (dependencies from 001) ───────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
    CREATE TYPE public.lead_status AS ENUM ('new', 'reviewed', 'assigned', 'dismissed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_source') THEN
    CREATE TYPE public.lead_source AS ENUM ('greenhouse', 'ashby', 'lever', 'workday', 'direct', 'other');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.job_leads (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name            TEXT NOT NULL,
  job_role                TEXT NOT NULL,
  job_url                 TEXT NOT NULL,
  job_description         TEXT,
  location                TEXT,
  source                  public.lead_source NOT NULL DEFAULT 'other',
  source_id               TEXT,
  status                  public.lead_status NOT NULL DEFAULT 'new',
  assigned_to             UUID REFERENCES public.students(id) ON DELETE SET NULL,
  assigned_application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  discovered_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_leads_url ON public.job_leads(job_url);
CREATE INDEX IF NOT EXISTS idx_job_leads_status ON public.job_leads(status);

ALTER TABLE public.job_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_leads: admin full" ON public.job_leads
  FOR ALL USING (public.current_user_role() = 'admin');
CREATE POLICY "job_leads: counselor full" ON public.job_leads
  FOR ALL USING (public.current_user_role() = 'counselor');

-- ─── Rate limit token bucket (internal) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  key             TEXT PRIMARY KEY,
  tokens          NUMERIC NOT NULL,
  last_refill     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lock down the bucket table; function below uses SECURITY DEFINER
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rate_limit_buckets: admin only" ON public.rate_limit_buckets
  FOR ALL USING (public.current_user_role() = 'admin');

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_feature TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
) RETURNS TABLE(allowed BOOLEAN, "limit" INTEGER, remaining INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key TEXT;
  v_tokens NUMERIC;
  v_last_refill TIMESTAMPTZ;
  v_now TIMESTAMPTZ := now();
  v_elapsed NUMERIC;
  v_add NUMERIC;
BEGIN
  v_key := p_user_id::TEXT || ':' || p_feature;

  SELECT b.tokens, b.last_refill INTO v_tokens, v_last_refill
  FROM public.rate_limit_buckets b
  WHERE b.key = v_key
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    v_tokens := p_limit;
    v_last_refill := v_now;
    INSERT INTO public.rate_limit_buckets(key, tokens, last_refill)
    VALUES (v_key, v_tokens - 1, v_now);
    RETURN QUERY SELECT TRUE, p_limit, p_limit - 1, v_now + (p_window_seconds || ' seconds')::INTERVAL;
    RETURN;
  END IF;

  v_elapsed := EXTRACT(EPOCH FROM (v_now - v_last_refill));
  v_add := (v_elapsed / p_window_seconds) * p_limit;
  v_tokens := LEAST(p_limit, v_tokens + v_add);

  IF v_tokens >= 1 THEN
    v_tokens := v_tokens - 1;
    UPDATE public.rate_limit_buckets
    SET tokens = v_tokens, last_refill = v_now
    WHERE key = v_key;
    RETURN QUERY SELECT TRUE, p_limit, GREATEST(0, FLOOR(v_tokens)::INTEGER), v_now + (p_window_seconds || ' seconds')::INTERVAL;
  ELSE
    UPDATE public.rate_limit_buckets
    SET last_refill = v_now
    WHERE key = v_key;
    RETURN QUERY SELECT FALSE, p_limit, 0, v_now + (p_window_seconds || ' seconds')::INTERVAL;
  END IF;
END;
$$;

-- ─── TABLE: job_matches ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.job_matches (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  job_lead_id       UUID NOT NULL REFERENCES public.job_leads(id) ON DELETE CASCADE,
  overall_score     NUMERIC(2,1) NOT NULL CHECK (overall_score >= 1 AND overall_score <= 5),
  grade             TEXT NOT NULL CHECK (grade IN ('A','B','C','D','E','F')),
  archetype         TEXT,
  match_reasoning   JSONB,
  match_status      TEXT NOT NULL DEFAULT 'new' CHECK (match_status IN ('new','reviewed','queued','applied','dismissed')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, job_lead_id)
);

-- ─── TABLE: agent_runs ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type          TEXT NOT NULL CHECK (run_type IN ('match','apply','digest')),
  student_id        UUID REFERENCES public.students(id) ON DELETE CASCADE,
  initiated_by      UUID NOT NULL REFERENCES public.profiles(id),
  status            TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','completed','failed','cancelled')),
  total_steps       INTEGER DEFAULT 0,
  completed_steps   INTEGER DEFAULT 0,
  failed_steps      INTEGER DEFAULT 0,
  input             JSONB,
  output            JSONB,
  error             TEXT,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── TABLE: agent_run_steps ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_run_steps (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id            UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  step_index        INTEGER NOT NULL,
  step_type         TEXT NOT NULL CHECK (step_type IN ('evaluate','create_app','gen_cv','gen_prep','notify')),
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','done','failed','skipped')),
  input             JSONB,
  output            JSONB,
  error             TEXT,
  attempts          INTEGER DEFAULT 0,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(run_id, step_index)
);

-- ─── TABLE: ai_call_log ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_call_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id        TEXT,
  user_id           UUID REFERENCES public.profiles(id),
  feature           TEXT NOT NULL,
  provider          TEXT NOT NULL CHECK (provider IN ('anthropic','groq')),
  model             TEXT NOT NULL,
  input_tokens      INTEGER,
  output_tokens     INTEGER,
  cost_usd          NUMERIC(12,6),
  latency_ms        INTEGER,
  status            TEXT NOT NULL CHECK (status IN ('ok','fallback','error')),
  error             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── TABLE: chat_threads ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID REFERENCES public.students(id) ON DELETE CASCADE,
  title             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── TABLE: chat_messages ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id         UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  role              TEXT NOT NULL CHECK (role IN ('user','assistant','tool')),
  content           TEXT,
  tool_calls        JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_job_matches_student_status ON public.job_matches(student_id, match_status);
CREATE INDEX IF NOT EXISTS idx_job_matches_score ON public.job_matches(student_id, overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON public.agent_runs(status, run_type, created_at);
CREATE INDEX IF NOT EXISTS idx_agent_runs_initiated_by ON public.agent_runs(initiated_by);
CREATE INDEX IF NOT EXISTS idx_agent_run_steps_run_status ON public.agent_run_steps(run_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_run_steps_pending ON public.agent_run_steps(status, step_index) WHERE status IN ('pending','failed');
CREATE INDEX IF NOT EXISTS idx_ai_call_log_user ON public.ai_call_log(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON public.chat_messages(thread_id, created_at);

-- ─── Triggers ───────────────────────────────────────────────────────────────
CREATE TRIGGER trg_job_matches_updated_at
  BEFORE UPDATE ON public.job_matches
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_run_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_call_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- job_matches
CREATE POLICY "job_matches: admin full" ON public.job_matches
  FOR ALL USING (public.current_user_role() = 'admin');
CREATE POLICY "job_matches: counselor own students" ON public.job_matches
  FOR ALL USING (public.current_user_role() = 'counselor' AND student_id IN (SELECT public.counselor_student_ids()));
CREATE POLICY "job_matches: student reads own" ON public.job_matches
  FOR SELECT USING (student_id = public.current_student_id());

-- agent_runs
CREATE POLICY "agent_runs: admin full" ON public.agent_runs
  FOR ALL USING (public.current_user_role() = 'admin');
CREATE POLICY "agent_runs: counselor sees own" ON public.agent_runs
  FOR ALL USING (public.current_user_role() = 'counselor' AND initiated_by = auth.uid());
CREATE POLICY "agent_runs: student reads own" ON public.agent_runs
  FOR SELECT USING (student_id = public.current_student_id());

-- agent_run_steps (access cascades from run visibility)
CREATE POLICY "agent_run_steps: admin full" ON public.agent_run_steps
  FOR ALL USING (public.current_user_role() = 'admin');
CREATE POLICY "agent_run_steps: counselor via run" ON public.agent_run_steps
  FOR ALL USING (run_id IN (
    SELECT r.id FROM public.agent_runs r WHERE r.initiated_by = auth.uid()
  ));
CREATE POLICY "agent_run_steps: student via run" ON public.agent_run_steps
  FOR SELECT USING (run_id IN (
    SELECT r.id FROM public.agent_runs r WHERE r.student_id = public.current_student_id()
  ));

-- ai_call_log (admin only)
CREATE POLICY "ai_call_log: admin full" ON public.ai_call_log
  FOR ALL USING (public.current_user_role() = 'admin');

-- chat_threads
CREATE POLICY "chat_threads: admin full" ON public.chat_threads
  FOR ALL USING (public.current_user_role() = 'admin');
CREATE POLICY "chat_threads: student own" ON public.chat_threads
  FOR ALL USING (student_id = public.current_student_id());

-- chat_messages
CREATE POLICY "chat_messages: admin full" ON public.chat_messages
  FOR ALL USING (public.current_user_role() = 'admin');
CREATE POLICY "chat_messages: student own thread" ON public.chat_messages
  FOR ALL USING (thread_id IN (
    SELECT t.id FROM public.chat_threads t WHERE t.student_id = public.current_student_id()
  ));

-- ─── Realtime ───────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_run_steps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

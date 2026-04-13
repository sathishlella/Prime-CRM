-- ============================================================
-- Prime CRM — AI Tables Migration (safe/idempotent)
-- Adds 7 new tables for AI-powered features.
-- Existing tables (profiles, students, applications, etc.) are untouched.
-- ============================================================

-- ─── TABLE: candidate_profiles ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.candidate_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id            UUID UNIQUE NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  target_roles          TEXT[] DEFAULT '{}',
  archetypes            JSONB DEFAULT '[]',
  narrative_headline    TEXT,
  narrative_exit_story  TEXT,
  superpowers           TEXT[] DEFAULT '{}',
  proof_points          JSONB DEFAULT '[]',
  compensation_target   TEXT,
  compensation_minimum  TEXT,
  compensation_currency TEXT DEFAULT 'USD',
  location_preference   TEXT,
  visa_status_detail    TEXT,
  cv_markdown           TEXT,
  skills                TEXT[] DEFAULT '{}',
  deal_breakers         TEXT[] DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── TABLE: evaluation_scores ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.evaluation_scores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id    UUID UNIQUE NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  student_id        UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  overall_score     NUMERIC(2,1) NOT NULL CHECK (overall_score >= 1 AND overall_score <= 5),
  grade             TEXT NOT NULL CHECK (grade IN ('A','B','C','D','E','F')),
  archetype         TEXT NOT NULL,
  recommendation    TEXT NOT NULL CHECK (recommendation IN ('strong_apply','apply','consider','skip')),
  blocks            JSONB NOT NULL,
  keywords          TEXT[] DEFAULT '{}',
  evaluated_by      UUID NOT NULL REFERENCES public.profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── TABLE: generated_cvs ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.generated_cvs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id    UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  student_id        UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  company_name      TEXT NOT NULL,
  job_role          TEXT NOT NULL,
  pdf_url           TEXT NOT NULL,
  pdf_storage_path  TEXT NOT NULL,
  tailoring_data    JSONB,
  keyword_coverage  NUMERIC(4,1),
  page_count        INTEGER DEFAULT 1,
  generated_by      UUID NOT NULL REFERENCES public.profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── TABLE: interview_prep ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.interview_prep (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id    UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  student_id        UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  company_name      TEXT NOT NULL,
  job_role          TEXT NOT NULL,
  prep_data         JSONB NOT NULL,
  story_bank        JSONB DEFAULT '[]',
  generated_by      UUID NOT NULL REFERENCES public.profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── TABLE: job_leads (idempotent; skips if already exists from 003) ────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_leads') THEN
    CREATE TABLE public.job_leads (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_name      TEXT NOT NULL,
      job_title         TEXT NOT NULL,
      job_url           TEXT NOT NULL,
      source_portal     TEXT,
      source_query      TEXT,
      is_verified       BOOLEAN DEFAULT false,
      is_expired        BOOLEAN DEFAULT false,
      is_assigned       BOOLEAN DEFAULT false,
      assigned_to       UUID REFERENCES public.students(id) ON DELETE SET NULL,
      assigned_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
      assigned_at       TIMESTAMPTZ,
      discovered_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- ─── TABLE: scan_history ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.scan_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_url         TEXT NOT NULL,
  job_title       TEXT,
  company_name    TEXT,
  source_portal   TEXT,
  status          TEXT NOT NULL DEFAULT 'added' CHECK (status IN ('added','skipped_title','skipped_dup','skipped_expired')),
  scanned_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── TABLE: scanner_config ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.scanner_config (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type     TEXT NOT NULL CHECK (config_type IN ('tracked_company','search_query','title_filter')),
  config_data     JSONB NOT NULL,
  is_enabled      BOOLEAN DEFAULT true,
  created_by      UUID NOT NULL REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_evaluation_scores_app ON public.evaluation_scores(application_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_scores_student ON public.evaluation_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_generated_cvs_student ON public.generated_cvs(student_id);
CREATE INDEX IF NOT EXISTS idx_generated_cvs_app ON public.generated_cvs(application_id);
CREATE INDEX IF NOT EXISTS idx_interview_prep_app ON public.interview_prep(application_id);
CREATE INDEX IF NOT EXISTS idx_interview_prep_student ON public.interview_prep(student_id);

-- Only create job_leads indexes if the columns exist (handles 003 schema drift)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'job_leads' AND column_name = 'is_assigned') THEN
    CREATE INDEX IF NOT EXISTS idx_job_leads_assigned ON public.job_leads(is_assigned);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_job_leads_url ON public.job_leads(job_url);
CREATE UNIQUE INDEX IF NOT EXISTS idx_scan_history_unique_url ON public.scan_history(job_url);

-- ─── Triggers ───────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_candidate_profiles_updated_at ON public.candidate_profiles;
CREATE TRIGGER trg_candidate_profiles_updated_at
  BEFORE UPDATE ON public.candidate_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_interview_prep_updated_at ON public.interview_prep;
CREATE TRIGGER trg_interview_prep_updated_at
  BEFORE UPDATE ON public.interview_prep
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_scanner_config_updated_at ON public.scanner_config;
CREATE TRIGGER trg_scanner_config_updated_at
  BEFORE UPDATE ON public.scanner_config
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.evaluation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.generated_cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.interview_prep ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.job_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.scanner_config ENABLE ROW LEVEL SECURITY;

-- helper to create policies idempotently
DO $$
BEGIN
  -- candidate_profiles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_profiles' AND policyname = 'candidate_profiles: admin full') THEN
    CREATE POLICY "candidate_profiles: admin full" ON public.candidate_profiles FOR ALL USING (public.current_user_role() = 'admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_profiles' AND policyname = 'candidate_profiles: counselor own students') THEN
    CREATE POLICY "candidate_profiles: counselor own students" ON public.candidate_profiles FOR ALL USING (public.current_user_role() = 'counselor' AND student_id IN (SELECT public.counselor_student_ids()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'candidate_profiles' AND policyname = 'candidate_profiles: student reads own') THEN
    CREATE POLICY "candidate_profiles: student reads own" ON public.candidate_profiles FOR SELECT USING (student_id = public.current_student_id());
  END IF;

  -- evaluation_scores
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'evaluation_scores' AND policyname = 'evaluation_scores: admin full') THEN
    CREATE POLICY "evaluation_scores: admin full" ON public.evaluation_scores FOR ALL USING (public.current_user_role() = 'admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'evaluation_scores' AND policyname = 'evaluation_scores: counselor own students') THEN
    CREATE POLICY "evaluation_scores: counselor own students" ON public.evaluation_scores FOR ALL USING (public.current_user_role() = 'counselor' AND student_id IN (SELECT public.counselor_student_ids()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'evaluation_scores' AND policyname = 'evaluation_scores: student reads own') THEN
    CREATE POLICY "evaluation_scores: student reads own" ON public.evaluation_scores FOR SELECT USING (student_id = public.current_student_id());
  END IF;

  -- generated_cvs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'generated_cvs' AND policyname = 'generated_cvs: admin full') THEN
    CREATE POLICY "generated_cvs: admin full" ON public.generated_cvs FOR ALL USING (public.current_user_role() = 'admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'generated_cvs' AND policyname = 'generated_cvs: counselor own students') THEN
    CREATE POLICY "generated_cvs: counselor own students" ON public.generated_cvs FOR ALL USING (public.current_user_role() = 'counselor' AND student_id IN (SELECT public.counselor_student_ids()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'generated_cvs' AND policyname = 'generated_cvs: student reads own') THEN
    CREATE POLICY "generated_cvs: student reads own" ON public.generated_cvs FOR SELECT USING (student_id = public.current_student_id());
  END IF;

  -- interview_prep
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'interview_prep' AND policyname = 'interview_prep: admin full') THEN
    CREATE POLICY "interview_prep: admin full" ON public.interview_prep FOR ALL USING (public.current_user_role() = 'admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'interview_prep' AND policyname = 'interview_prep: counselor own students') THEN
    CREATE POLICY "interview_prep: counselor own students" ON public.interview_prep FOR ALL USING (public.current_user_role() = 'counselor' AND student_id IN (SELECT public.counselor_student_ids()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'interview_prep' AND policyname = 'interview_prep: student reads own') THEN
    CREATE POLICY "interview_prep: student reads own" ON public.interview_prep FOR SELECT USING (student_id = public.current_student_id());
  END IF;

  -- job_leads (skip if already managed by 003)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'job_leads' AND policyname = 'job_leads: admin full') THEN
    CREATE POLICY "job_leads: admin full" ON public.job_leads FOR ALL USING (public.current_user_role() = 'admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'job_leads' AND policyname = 'job_leads: counselor full') THEN
    CREATE POLICY "job_leads: counselor full" ON public.job_leads FOR ALL USING (public.current_user_role() = 'counselor');
  END IF;

  -- scan_history
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'scan_history' AND policyname = 'scan_history: admin full') THEN
    CREATE POLICY "scan_history: admin full" ON public.scan_history FOR ALL USING (public.current_user_role() = 'admin');
  END IF;

  -- scanner_config
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'scanner_config' AND policyname = 'scanner_config: admin full') THEN
    CREATE POLICY "scanner_config: admin full" ON public.scanner_config FOR ALL USING (public.current_user_role() = 'admin');
  END IF;
END $$;

-- ─── Realtime (safe add) ────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'evaluation_scores') THEN
    NULL;
  ELSE
    ALTER PUBLICATION supabase_realtime ADD TABLE public.evaluation_scores;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'interview_prep') THEN
    NULL;
  ELSE
    ALTER PUBLICATION supabase_realtime ADD TABLE public.interview_prep;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'job_leads') THEN
    NULL;
  ELSE
    ALTER PUBLICATION supabase_realtime ADD TABLE public.job_leads;
  END IF;
END $$;

-- ─── Storage bucket for generated CVs ───────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('generated-cvs', 'generated-cvs', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage: generated-cvs student reads own') THEN
    CREATE POLICY "storage: generated-cvs student reads own" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'generated-cvs'
        AND (storage.foldername(name))[1] = (SELECT id::TEXT FROM public.students WHERE profile_id = auth.uid())
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage: generated-cvs counselor manages') THEN
    CREATE POLICY "storage: generated-cvs counselor manages" ON storage.objects
      FOR ALL USING (
        bucket_id = 'generated-cvs'
        AND (storage.foldername(name))[1] IN (SELECT id::TEXT FROM public.students WHERE assigned_counselor_id = auth.uid())
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage: generated-cvs admin full') THEN
    CREATE POLICY "storage: generated-cvs admin full" ON storage.objects
      FOR ALL USING (bucket_id = 'generated-cvs' AND public.current_user_role() = 'admin');
  END IF;
END $$;

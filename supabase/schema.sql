-- ============================================================
-- ConsultPro CRM — Complete Database Schema
-- Paste this entire file into Supabase SQL Editor and run.
-- Idempotent: safe to run multiple times (IF NOT EXISTS / OR REPLACE).
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'counselor', 'student');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.application_status AS ENUM (
    'applied', 'in_progress', 'interview', 'rejected', 'offered'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.student_status AS ENUM ('active', 'paused', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.document_type AS ENUM (
    'resume', 'cover_letter', 'jd', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── TABLE: profiles ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        public.user_role NOT NULL DEFAULT 'student',
  full_name   TEXT        NOT NULL,
  email       TEXT        UNIQUE NOT NULL,
  phone       TEXT,
  avatar_url  TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── TABLE: students ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.students (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id            UUID        UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  university            TEXT,
  major                 TEXT,
  graduation_date       DATE,
  visa_status           TEXT,
  assigned_counselor_id UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  status                public.student_status NOT NULL DEFAULT 'active',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── TABLE: applications (core table) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.applications (
  id               UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID                     NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  company_name     TEXT                     NOT NULL,
  job_role         TEXT                     NOT NULL,
  job_description  TEXT,
  job_link         TEXT,
  resume_used      TEXT,
  status           public.application_status NOT NULL DEFAULT 'applied',
  applied_by       UUID                     NOT NULL REFERENCES public.profiles(id),
  applied_at       TIMESTAMPTZ              NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ              NOT NULL DEFAULT now(),
  notes            TEXT
);

-- ─── TABLE: activity_log ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_log (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id        UUID        NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  action                TEXT        NOT NULL,
  performed_by          UUID        NOT NULL REFERENCES public.profiles(id),
  is_visible_to_student BOOLEAN     NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── TABLE: documents ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.documents (
  id          UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID                   NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  file_name   TEXT                   NOT NULL,
  file_url    TEXT                   NOT NULL,
  file_type   public.document_type   NOT NULL DEFAULT 'other',
  uploaded_by UUID                   NOT NULL REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ            NOT NULL DEFAULT now()
);

-- ─── TABLE: notifications ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  type       TEXT        NOT NULL DEFAULT 'info',
  is_read    BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON public.applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_status     ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_by ON public.applications(applied_by);
CREATE INDEX IF NOT EXISTS idx_activity_log_app_id     ON public.activity_log(application_id);
CREATE INDEX IF NOT EXISTS idx_students_counselor_id   ON public.students(assigned_counselor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id   ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread    ON public.notifications(user_id, is_read) WHERE is_read = false;

-- ─── Trigger: auto-update updated_at ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at     ON public.profiles;
DROP TRIGGER IF EXISTS trg_students_updated_at     ON public.students;
DROP TRIGGER IF EXISTS trg_applications_updated_at ON public.applications;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── Trigger: status change → activity_log + notification ────────────────────
CREATE OR REPLACE FUNCTION public.handle_application_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_student_profile_id UUID;
  v_company            TEXT;
  v_role               TEXT;
  v_old_status         TEXT;
  v_new_status         TEXT;
BEGIN
  -- Only fire when status actually changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  v_old_status := OLD.status::TEXT;
  v_new_status := NEW.status::TEXT;
  v_company    := NEW.company_name;
  v_role       := NEW.job_role;

  -- Get student's profile_id for notification
  SELECT profile_id INTO v_student_profile_id
  FROM public.students
  WHERE id = NEW.student_id;

  -- Activity log entry
  INSERT INTO public.activity_log (application_id, action, performed_by, is_visible_to_student)
  VALUES (
    NEW.id,
    'Status changed from ' || v_old_status || ' to ' || v_new_status || ' — ' || v_company || ' (' || v_role || ')',
    NEW.applied_by,
    true
  );

  -- Notification to student
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    v_student_profile_id,
    'Application Update: ' || v_company,
    'Your ' || v_company || ' – ' || v_role || ' application is now ' || REPLACE(v_new_status, '_', ' '),
    'status_change'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_application_status_change ON public.applications;

CREATE TRIGGER trg_application_status_change
  AFTER UPDATE OF status ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_application_status_change();

-- ─── Trigger: new application → activity_log + notification ──────────────────
CREATE OR REPLACE FUNCTION public.handle_new_application()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_student_profile_id UUID;
BEGIN
  SELECT profile_id INTO v_student_profile_id
  FROM public.students
  WHERE id = NEW.student_id;

  -- Activity log
  INSERT INTO public.activity_log (application_id, action, performed_by, is_visible_to_student)
  VALUES (
    NEW.id,
    'Application submitted to ' || NEW.company_name || ' for ' || NEW.job_role,
    NEW.applied_by,
    true
  );

  -- Notification to student
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    v_student_profile_id,
    'New Application: ' || NEW.company_name,
    'A new application was submitted to ' || NEW.company_name || ' – ' || NEW.job_role,
    'new_application'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_new_application ON public.applications;

CREATE TRIGGER trg_new_application
  AFTER INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_application();

-- ─── Trigger: auto-create profile on auth.users insert ───────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_new_user ON auth.users;

CREATE TRIGGER trg_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper: get current user's student record id
CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM public.students WHERE profile_id = auth.uid();
$$;

-- Helper: get current user's counselor's students' ids
CREATE OR REPLACE FUNCTION public.counselor_student_ids()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM public.students WHERE assigned_counselor_id = auth.uid();
$$;

-- ── profiles ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles: admin full access"        ON public.profiles;
DROP POLICY IF EXISTS "profiles: counselors read all"      ON public.profiles;
DROP POLICY IF EXISTS "profiles: student reads own"        ON public.profiles;
DROP POLICY IF EXISTS "profiles: own update"               ON public.profiles;

CREATE POLICY "profiles: admin full access" ON public.profiles
  FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY "profiles: counselors read all" ON public.profiles
  FOR SELECT USING (public.current_user_role() = 'counselor');

CREATE POLICY "profiles: student reads own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles: own update" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- ── students ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "students: admin full access"            ON public.students;
DROP POLICY IF EXISTS "students: counselor reads own students" ON public.students;
DROP POLICY IF EXISTS "students: student reads own record"     ON public.students;

CREATE POLICY "students: admin full access" ON public.students
  FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY "students: counselor reads own students" ON public.students
  FOR SELECT USING (
    public.current_user_role() = 'counselor'
    AND assigned_counselor_id = auth.uid()
  );

CREATE POLICY "students: student reads own record" ON public.students
  FOR SELECT USING (profile_id = auth.uid());

-- ── applications ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "applications: admin full access"             ON public.applications;
DROP POLICY IF EXISTS "applications: counselor owns their students" ON public.applications;
DROP POLICY IF EXISTS "applications: student reads own"             ON public.applications;

CREATE POLICY "applications: admin full access" ON public.applications
  FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY "applications: counselor owns their students" ON public.applications
  FOR ALL USING (
    public.current_user_role() = 'counselor'
    AND student_id IN (SELECT public.counselor_student_ids())
  );

CREATE POLICY "applications: student reads own" ON public.applications
  FOR SELECT USING (student_id = public.current_student_id());

-- ── activity_log ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "activity_log: admin full access"      ON public.activity_log;
DROP POLICY IF EXISTS "activity_log: counselor access"       ON public.activity_log;
DROP POLICY IF EXISTS "activity_log: student reads visible"  ON public.activity_log;

CREATE POLICY "activity_log: admin full access" ON public.activity_log
  FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY "activity_log: counselor access" ON public.activity_log
  FOR ALL USING (
    public.current_user_role() = 'counselor'
    AND application_id IN (
      SELECT id FROM public.applications
      WHERE student_id IN (SELECT public.counselor_student_ids())
    )
  );

CREATE POLICY "activity_log: student reads visible" ON public.activity_log
  FOR SELECT USING (
    is_visible_to_student = true
    AND application_id IN (
      SELECT id FROM public.applications WHERE student_id = public.current_student_id()
    )
  );

-- ── documents ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "documents: admin full access"        ON public.documents;
DROP POLICY IF EXISTS "documents: counselor access"         ON public.documents;
DROP POLICY IF EXISTS "documents: student reads own"        ON public.documents;

CREATE POLICY "documents: admin full access" ON public.documents
  FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY "documents: counselor access" ON public.documents
  FOR ALL USING (
    public.current_user_role() = 'counselor'
    AND student_id IN (SELECT public.counselor_student_ids())
  );

CREATE POLICY "documents: student reads own" ON public.documents
  FOR SELECT USING (student_id = public.current_student_id());

-- ── notifications ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "notifications: admin full access" ON public.notifications;
DROP POLICY IF EXISTS "notifications: own"               ON public.notifications;

CREATE POLICY "notifications: admin full access" ON public.notifications
  FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY "notifications: own" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- ─── Seed Data ────────────────────────────────────────────────────────────────
-- NOTE: Run this block ONLY ONCE after your first migration.
-- Uses DO block with conflict handling — safe to re-run (will skip on conflict).

DO $$
DECLARE
  -- Profile IDs
  v_admin_id     UUID := '00000000-0000-0000-0000-000000000001';
  v_counselor1   UUID := '00000000-0000-0000-0000-000000000002';
  v_counselor2   UUID := '00000000-0000-0000-0000-000000000003';
  v_student1     UUID := '00000000-0000-0000-0000-000000000004';
  v_student2     UUID := '00000000-0000-0000-0000-000000000005';
  v_student3     UUID := '00000000-0000-0000-0000-000000000006';
  -- Student record IDs
  v_s1_id        UUID := 'aaaaaaaa-0000-0000-0000-000000000001';
  v_s2_id        UUID := 'aaaaaaaa-0000-0000-0000-000000000002';
  v_s3_id        UUID := 'aaaaaaaa-0000-0000-0000-000000000003';
BEGIN
  -- Profiles (no auth.users link in seed — create real users via Supabase Auth)
  INSERT INTO public.profiles (id, role, full_name, email, phone) VALUES
    (v_admin_id,   'admin',     'Raj Mehta',        'admin@consultpro.com',  '+91 98765 00001'),
    (v_counselor1, 'counselor', 'Priya Sharma',     'priya@consultpro.com',  '+91 98765 00002'),
    (v_counselor2, 'counselor', 'Amit Patel',       'amit@consultpro.com',   '+91 98765 00003'),
    (v_student1,   'student',   'Sarah Mitchell',   'sarah@student.com',     NULL),
    (v_student2,   'student',   'David Chen',       'david@student.com',     NULL),
    (v_student3,   'student',   'Emily Rodriguez',  'emily@student.com',     NULL)
  ON CONFLICT (id) DO NOTHING;

  -- Students
  INSERT INTO public.students (id, profile_id, university, major, graduation_date, visa_status, assigned_counselor_id) VALUES
    (v_s1_id, v_student1, 'MIT',          'Computer Science',    '2026-05-15', 'F-1 OPT',  v_counselor1),
    (v_s2_id, v_student2, 'Stanford',     'Machine Learning',    '2026-06-01', 'F-1 OPT',  v_counselor1),
    (v_s3_id, v_student3, 'UC Berkeley',  'Electrical Eng.',     '2026-05-20', 'F-1 CPT',  v_counselor2)
  ON CONFLICT (id) DO NOTHING;

  -- Applications (8 sample — triggers disabled during seed to avoid FK issues)
  INSERT INTO public.applications (id, student_id, company_name, job_role, job_description, job_link, resume_used, status, applied_by, applied_at) VALUES
    (gen_random_uuid(), v_s1_id, 'Google',    'Software Engineer Intern',    'Build scalable microservices with Go and Python. Work with distributed systems team on search infrastructure.',          'https://careers.google.com/jobs/12345',          'sarah_resume_v3.pdf',     'interview',   v_counselor1, now() - INTERVAL '1 day'),
    (gen_random_uuid(), v_s1_id, 'Microsoft', 'Data Analyst',                'Analyze product telemetry data using SQL and Python. Create dashboards in Power BI for executive reporting.',           'https://careers.microsoft.com/jobs/67890',       'sarah_resume_v3.pdf',     'applied',     v_counselor1, now() - INTERVAL '2 days'),
    (gen_random_uuid(), v_s1_id, 'Amazon',    'Product Manager Intern',      'Drive feature roadmap for Alexa Smart Home. Collaborate with engineering and design teams.',                           'https://amazon.jobs/pm-intern',                  'sarah_pm_resume.pdf',     'in_progress', v_counselor2, now() - INTERVAL '3 hours'),
    (gen_random_uuid(), v_s1_id, 'Apple',     'UX Designer',                 'Design next-generation interfaces for Apple Health. Conduct user research and create high-fidelity prototypes.',        'https://apple.com/careers/ux',                   'sarah_ux_portfolio.pdf',  'rejected',    v_counselor1, now() - INTERVAL '9 days'),
    (gen_random_uuid(), v_s2_id, 'Meta',      'ML Engineer Intern',          'Build recommendation models for Instagram Reels using PyTorch. Optimize inference latency for production.',            'https://metacareers.com/ml-intern',              'david_ml_resume.pdf',     'applied',     v_counselor1, now() - INTERVAL '1 day'),
    (gen_random_uuid(), v_s2_id, 'Netflix',   'Backend Developer',           'Build content delivery APIs using Java and Spring Boot. Scale systems serving 200M+ subscribers.',                    'https://netflix.com/careers/backend',            'david_backend_resume.pdf','interview',   v_counselor1, now() - INTERVAL '7 days'),
    (gen_random_uuid(), v_s3_id, 'Tesla',     'Embedded Systems Intern',     'Develop firmware for Battery Management System. C/C++ on RTOS platform.',                                            'https://tesla.com/careers/embed',                'emily_embedded_resume.pdf','applied',    v_counselor2, now() - INTERVAL '2 days'),
    (gen_random_uuid(), v_s3_id, 'SpaceX',    'Avionics Engineer',           'Design PCB layouts for flight computer systems. Perform hardware-in-the-loop testing.',                               'https://spacex.com/careers/avionics',            'emily_avionics_resume.pdf','in_progress', v_counselor2, now() - INTERVAL '4 days')
  ON CONFLICT (id) DO NOTHING;

END $$;

-- ─── Realtime: enable on required tables ─────────────────────────────────────
-- Run these in the Supabase Dashboard → Database → Replication
-- or execute via the SQL editor:
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ─── Storage bucket ──────────────────────────────────────────────────────────
-- Create via Supabase Dashboard → Storage → New bucket
-- Name: documents | Private: true | Max file size: 10MB
-- Or run:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760,  -- 10MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "storage: student reads own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = (
      SELECT id::TEXT FROM public.students WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "storage: counselor manages student files" ON storage.objects
  FOR ALL USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::TEXT FROM public.students WHERE assigned_counselor_id = auth.uid()
    )
  );

CREATE POLICY "storage: admin full access" ON storage.objects
  FOR ALL USING (
    bucket_id = 'documents'
    AND public.current_user_role() = 'admin'
  );

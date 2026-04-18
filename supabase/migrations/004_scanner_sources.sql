-- Add aggregator sources to lead_source enum.
-- ALTER TYPE ADD VALUE cannot be wrapped in BEGIN/END DO, so each is a standalone statement.

ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'remotive';
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'adzuna';

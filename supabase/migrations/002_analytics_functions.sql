-- ============================================================
-- Prime CRM — Analytics SQL Functions (safe/idempotent)
-- ============================================================

CREATE OR REPLACE FUNCTION public.application_funnel()
RETURNS TABLE(status TEXT, count BIGINT) AS $$
  SELECT status::TEXT, COUNT(*) FROM public.applications GROUP BY status ORDER BY COUNT(*) DESC;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.score_distribution()
RETURNS TABLE(score_bucket TEXT, count BIGINT) AS $$
  SELECT
    CASE
      WHEN overall_score >= 4.5 THEN '4.5-5.0'
      WHEN overall_score >= 4.0 THEN '4.0-4.4'
      WHEN overall_score >= 3.5 THEN '3.5-3.9'
      ELSE 'Below 3.5'
    END as score_bucket,
    COUNT(*)
  FROM public.evaluation_scores
  GROUP BY score_bucket
  ORDER BY score_bucket DESC;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.archetype_performance()
RETURNS TABLE(archetype TEXT, total BIGINT, interviews BIGINT, offers BIGINT, conversion_rate NUMERIC) AS $$
  SELECT
    es.archetype,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE a.status = 'interview') as interviews,
    COUNT(*) FILTER (WHERE a.status = 'offered') as offers,
    ROUND(COUNT(*) FILTER (WHERE a.status IN ('interview','offered'))::NUMERIC / NULLIF(COUNT(*),0) * 100, 1)
  FROM public.evaluation_scores es
  JOIN public.applications a ON a.id = es.application_id
  GROUP BY es.archetype
  ORDER BY 4 DESC NULLS LAST;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.counselor_stats(p_counselor_id UUID)
RETURNS TABLE(total_students BIGINT, total_applications BIGINT, total_interviews BIGINT, total_offers BIGINT, avg_score NUMERIC) AS $$
  SELECT
    (SELECT COUNT(*) FROM public.students WHERE assigned_counselor_id = p_counselor_id),
    COUNT(a.*),
    COUNT(*) FILTER (WHERE a.status = 'interview'),
    COUNT(*) FILTER (WHERE a.status = 'offered'),
    ROUND(AVG(es.overall_score), 1)
  FROM public.applications a
  JOIN public.students s ON s.id = a.student_id AND s.assigned_counselor_id = p_counselor_id
  LEFT JOIN public.evaluation_scores es ON es.application_id = a.id;
$$ LANGUAGE sql STABLE;

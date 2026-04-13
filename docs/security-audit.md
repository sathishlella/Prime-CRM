# Prime CRM — Security Audit

## RLS Policy Audit

| Table | Admin | Counselor | Student | Notes |
|---|---|---|---|---|
| `profiles` | Full | Own row read | Own row read | Auth via `current_user_role()` |
| `students` | Full | Assigned students | Own row | Via `counselor_student_ids()` |
| `applications` | Full | Assigned students | Own via `current_student_id()` | |
| `documents` | Full | Assigned students | Own | Storage bucket also gated |
| `notifications` | Full | Via students | Own user_id | |
| `activity_log` | Full | Read via students | Own | Append-only (INSERT trigger) |
| `job_leads` | Full | Full | None | Students never see raw leads |
| `candidate_profiles` | Full | Assigned students | Own | |
| `job_matches` | Full | Via counselor_student_ids | Own | |
| `agent_runs` | Full | Own initiated_by | None | |
| `agent_run_steps` | Full | Via agent_runs | None | |
| `ai_call_log` | Full | None | None | No user-level access |
| `chat_threads` | Full | Via students | Own | |
| `chat_messages` | Full | Via students | Own thread | |
| `generated_cvs` | Full | Via students | Own | |

### Verification query

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = FALSE;
-- Must return 0 rows
```

---

## Input Validation Coverage

| Endpoint | Auth | RBAC | Zod | Rate limit |
|---|---|---|---|---|
| `POST /api/evaluate` | ✅ | ✅ admin/counselor | ✅ | ✅ 20/hr |
| `POST /api/generate-cv` | ✅ | ✅ admin/counselor | ✅ | ✅ 10/hr |
| `POST /api/interview-prep` | ✅ | ✅ admin/counselor | ✅ | ✅ 20/hr |
| `GET /api/analytics` | ✅ | ✅ admin | — | — |
| `GET /api/candidate-profile` | ✅ | ✅ all roles | — | — |
| `PUT /api/candidate-profile` | ✅ | ✅ admin/counselor | ✅ | — |
| `GET /api/leads` | ✅ | ✅ admin/counselor | — | — |
| `POST /api/leads/assign` | ✅ | ✅ admin/counselor | ✅ | — |
| `POST /api/scan` | ✅ | ✅ admin | — | ✅ 5/hr |
| `POST /api/email` | ✅ | ✅ admin/counselor | ✅ | — |
| `POST /api/students/update-counselor` | ✅ | ✅ admin | ✅ | — |
| `POST /api/users/delete` | ✅ | ✅ admin | ✅ | — |
| `POST /api/agent/match` | ✅ | ✅ admin/counselor | ✅ | ✅ 5/min |
| `POST /api/agent/apply` | ✅ | ✅ admin/counselor | ✅ | ✅ 2/10min |
| `POST /api/chat` | ✅ | ✅ student | ✅ | ✅ 30/min |
| `GET /api/cron/scan` | Bearer CRON_SECRET | — | — | — |
| `POST /api/agent/tick` | Bearer CRON_SECRET | — | — | — |
| `GET /api/agent/digest` | Bearer CRON_SECRET | — | — | — |

---

## CSP Evaluation

Current directives (production):

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob: https://*.supabase.co;
connect-src 'self' https://*.supabase.co wss://*.supabase.co
           https://api.anthropic.com https://api.groq.com
           https://*.sentry.io https://o4511213641334784.ingest.sentry.io;
worker-src 'self' blob:;
frame-src 'none';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
```

| Directive | Status | Notes |
|---|---|---|
| `unsafe-eval` in prod | ✅ Removed | Only present in `NODE_ENV=development` |
| `unsafe-inline` in script-src | ⚠️ Present | Needed until nonce infra wired — see `src/lib/security/csp.ts` |
| `frame-ancestors 'none'` | ✅ | Prevents clickjacking |
| `upgrade-insecure-requests` | ✅ | Forces HTTPS |
| HSTS | ✅ 2yr + preload | Prevents HTTPS downgrade |

**Next step:** wire `generateNonce()` from `src/lib/security/csp.ts` into middleware and pass nonce to all `<Script>` tags, then drop `'unsafe-inline'`.

---

## Known Accepted Risks

| Risk | Mitigation | Owner |
|---|---|---|
| `'unsafe-inline'` in script-src | Nonce infra planned (csp.ts ready) | Phase 3.1 |
| In-memory rate limiter resets on cold start | Acceptable for current scale; Upstash Redis interface ready | Future |
| Chat tool output not HTML-escaped | Content never rendered as HTML; JSON only | N/A |
| pg_cron not on all Supabase plans | Vercel cron fallback at `/api/agent/tick` | ✅ |

# F1 Dream Jobs CRM — Agent Guide

This file provides comprehensive guidance for AI coding agents working on the F1 Dream Jobs CRM (also referred to as Prime CRM or ConsultPro CRM) codebase.

---

## Project Overview

**F1 Dream Jobs CRM** is a student job consultancy platform that tracks job applications on behalf of international students. It connects three user roles in a unified workflow:

- **Counselors** find jobs, submit applications, evaluate candidates, generate tailored CVs, and prepare students for interviews.
- **Students** log in to view their application status, history, documents, and AI-generated interview prep materials.
- **Admins** manage users, oversee all platform activity, configure job scanners, and view analytics.

### Business Flow
```
COUNSELOR finds a job → adds Company, Role, JD, Resume, Link
    ↓
System records: who applied, when, status
    ↓
STUDENT logs in → sees every application with full details + notifications
    ↓
ADMIN sees everything — all students, all counselors, all data + analytics
```

### AI-Powered Features
The platform includes several AI-driven capabilities:
- **Candidate Evaluation**: Analyze fit between a student's profile and a job posting, producing a score, grade, archetype, and recommendation.
- **Tailored CV Generation**: Generate a customized PDF resume optimized for a specific job application.
- **Interview Prep**: Generate company-specific interview questions, story banks, and preparation strategies.
- **Job Lead Scanner**: Automatically scan Greenhouse APIs and company career pages for new job postings.
- **Agent Runner**: Async background worker that processes AI steps (evaluate, create application, generate CV, generate prep, notify) in batches.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.5+ |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime |
| Styling | Tailwind CSS 3.4 + inline styles |
| Animations | Framer Motion + CSS keyframes |
| State Management | Zustand |
| Forms | React Hook Form + Zod |
| Icons | SVG (inline) |
| AI | Anthropic Claude SDK (`@anthropic-ai/sdk`) + Groq fallback |
| Email | Resend (`resend`) |
| PDF/Scraping | Playwright Core + `@sparticuz/chromium` |
| Error Tracking | Sentry (`@sentry/nextjs`) |
| Unit Testing | Vitest (`vitest`) |
| E2E Testing | Playwright (`@playwright/test`) |

---

## Project Structure

```
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth route group
│   │   │   ├── layout.tsx            # Minimal auth layout
│   │   │   └── login/
│   │   │       └── page.tsx          # Login page with demo mode UI
│   │   ├── (dashboard)/              # Dashboard route group (protected)
│   │   │   ├── layout.tsx            # Dashboard shell with sidebar + session check
│   │   │   ├── admin/                # Admin portal
│   │   │   │   ├── page.tsx
│   │   │   │   ├── AdminDashboardClient.tsx
│   │   │   │   ├── analytics/
│   │   │   │   ├── create-user/
│   │   │   │   ├── scanner/
│   │   │   │   ├── users/
│   │   │   │   ├── agents/
│   │   │   │   └── ai-costs/
│   │   │   ├── counselor/            # Counselor portal
│   │   │   │   ├── page.tsx
│   │   │   │   ├── CounselorDashboardClient.tsx
│   │   │   │   ├── leads/
│   │   │   │   ├── match/
│   │   │   │   ├── students/
│   │   │   │   └── agents/
│   │   │   └── student/              # Student portal
│   │   │       ├── page.tsx
│   │   │       ├── StudentDashboardClient.tsx
│   │   │       ├── cvs/
│   │   │       └── documents/
│   │   ├── api/                      # API routes
│   │   │   ├── agent/
│   │   │   │   ├── apply/            # Queue an apply-agent run
│   │   │   │   ├── digest/           # Daily digest cron
│   │   │   │   ├── match/            # Manual match trigger
│   │   │   │   └── tick/             # Worker cron (1 min)
│   │   │   ├── analytics/
│   │   │   ├── candidate-profile/
│   │   │   ├── chat/
│   │   │   ├── cron/scan/            # Vercel cron for scanning
│   │   │   ├── email/
│   │   │   ├── evaluate/             # AI evaluation endpoint
│   │   │   ├── generate-cv/          # AI CV generation
│   │   │   ├── interview-prep/       # AI interview prep
│   │   │   ├── leads/
│   │   │   ├── scan/                 # Manual scanner trigger
│   │   │   ├── students/update-counselor/
│   │   │   └── users/delete/
│   │   ├── globals.css               # Global styles + design tokens
│   │   ├── layout.tsx                # Root layout (fonts, SessionGuard, OfflineBanner)
│   │   ├── global-error.tsx          # Sentry-wrapped error boundary
│   │   └── page.tsx                  # Root redirect to /login
│   ├── components/                   # Shared UI components
│   │   ├── DashboardShell.tsx        # Layout wrapper with ambient blobs
│   │   ├── Sidebar.tsx               # Navigation sidebar
│   │   ├── TopBar.tsx                # Header with user menu
│   │   ├── GlassCard.tsx             # Glass morphism card
│   │   ├── StatusBadge.tsx           # Application status badge
│   │   ├── DataTable.tsx             # Table component
│   │   ├── Modal.tsx                 # Dialog modal
│   │   ├── FileUpload.tsx            # Document upload
│   │   ├── NotificationBell.tsx      # Notifications UI
│   │   ├── Toast.tsx                 # Toast notifications
│   │   ├── SessionGuard.tsx          # Session expiration guard
│   │   ├── OfflineBanner.tsx         # Offline indicator
│   │   ├── EvaluationCard.tsx        # AI evaluation display
│   │   ├── InterviewPrepCard.tsx     # Interview prep display
│   │   ├── ScoreBadge.tsx            # Score badge component
│   │   ├── GenerateCVModal.tsx       # CV generation modal
│   │   ├── MatchCard.tsx             # Job match card
│   │   ├── AgentRunCard.tsx          # Agent run status card
│   │   ├── AgentRunsViewer.tsx       # Agent runs list
│   │   ├── StudentChat.tsx           # Student chat panel
│   │   ├── ChatPanel.tsx             # Generic chat panel
│   │   ├── ChatMessage.tsx           # Chat message bubble
│   │   ├── Avatar.tsx                # User avatar
│   │   ├── StatCard.tsx              # Statistic card
│   │   ├── Skeleton.tsx              # Loading shimmer
│   │   ├── ProgressBar.tsx           # Progress indicator
│   │   └── BlobBackground.tsx        # Animated background blobs
│   └── lib/                          # Utilities and business logic
│       ├── supabase/
│       │   ├── client.ts             # Browser Supabase client (+ mock for demo)
│       │   ├── server.ts             # Server Component client + admin client
│       │   └── database.types.ts     # TypeScript DB types
│       ├── hooks/
│       │   ├── useAuth.ts            # Auth hook with idle timeout + demo users
│       │   ├── useRealtime.ts        # Realtime subscriptions
│       │   └── useNotifications.ts   # Notifications logic
│       ├── stores/
│       │   ├── authStore.ts          # Zustand auth state
│       │   ├── appStore.ts           # Application state
│       │   └── uiStore.ts            # UI state
│       ├── api/
│       │   ├── applications.ts       # Application CRUD + demo fallback
│       │   ├── students.ts           # Student CRUD + demo fallback
│       │   ├── documents.ts          # Document CRUD
│       │   ├── evaluations.ts        # Evaluation CRUD
│       │   ├── interviewPrep.ts      # Interview prep CRUD
│       │   ├── leads.ts              # Job leads CRUD
│       │   ├── cvs.ts                # Generated CVs CRUD
│       │   ├── notifications.ts      # Notifications API
│       │   └── mockData.ts           # Demo mode data
│       ├── actions/
│       │   └── createUser.ts         # Server action for user creation
│       ├── ai/
│       │   ├── router.ts             # Unified AI router with fallback + cost logging
│       │   ├── claude.ts             # Legacy Claude wrapper (still used in some spots)
│       │   ├── cv-generator.ts       # CV generation logic (Playwright + HTML)
│       │   ├── cv-parser.ts          # CV parsing utilities
│       │   ├── prompts/              # AI prompts
│       │   │   ├── evaluate.ts
│       │   │   ├── cv-tailor.ts
│       │   │   ├── interview-prep.ts
│       │   │   └── pattern-analysis.ts
│       │   ├── providers/
│       │   │   ├── anthropic.ts
│       │   │   ├── groq.ts
│       │   │   └── types.ts
│       │   └── templates/            # CV HTML templates
│       ├── agent/
│       │   └── executor.ts           # Agent step implementations
│       ├── scanner/
│       │   ├── index.ts              # Portal scanning orchestrator
│       │   ├── filters.ts            # Job title filtering logic
│       │   └── portals-config.ts     # Default tracked companies & filters
│       ├── email/
│       │   └── index.ts              # Resend email templates & senders
│       ├── http/
│       │   ├── withApi.ts            # HOF for auth, RBAC, rate limit, Zod
│       │   ├── rateLimit.ts          # In-memory rate limiter
│       │   └── zodSchemas.ts         # Shared Zod schemas for API routes
│       ├── logging/
│       │   ├── logger.ts             # Structured JSON stdout logger
│       │   └── requestId.ts          # Request ID extraction
│       ├── security/
│       │   └── csp.ts                # CSP helpers
│       └── sentry/
│           └── init.ts               # Sentry init helpers
├── supabase/
│   └── migrations/                   # Database migrations
│       ├── 001_prime_crm_ai_tables.sql
│       ├── 002_analytics_functions.sql
│       └── 003_agentic.sql
├── tests/
│   ├── e2e/                          # Playwright end-to-end tests
│   │   ├── global.setup.ts           # Auth setup for 3 roles
│   │   ├── 01-login.spec.ts
│   │   ├── 02-admin.spec.ts
│   │   ├── 03-counselor.spec.ts
│   │   ├── 04-student.spec.ts
│   │   ├── 05-rate-limit.spec.ts
│   │   ├── 06-security-headers.spec.ts
│   │   ├── 07-zod-validation.spec.ts
│   │   └── 08-cv-hard-fail.spec.ts
│   └── unit/                         # Vitest unit tests
│       ├── ai/router.test.ts
│       └── http/
│           ├── rateLimit.test.ts
│           └── zodSchemas.test.ts
├── middleware.ts                     # Auth + role-based routing
├── tailwind.config.ts                # Tailwind customization
├── next.config.js                    # Next.js config + security headers + Sentry
├── vercel.json                       # Vercel cron jobs + function config
├── vitest.config.ts                  # Vitest configuration
├── playwright.config.ts              # Playwright configuration
├── sentry.server.config.ts           # Sentry server config
├── sentry.edge.config.ts             # Sentry edge config
├── instrumentation.ts                # Next.js instrumentation hook
└── package.json                      # Dependencies
```

---

## Build and Development Commands

```bash
# Install dependencies
npm install

# Start development server (localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint

# TypeScript type check (no emit)
npm run type-check

# Run unit tests (Vitest, node environment)
npm run test

# Run unit tests in watch mode
npm run test:watch

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests (Playwright, auto-starts dev server locally)
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Load testing (k6)
npm run load
```

---

## Environment Variables

Create `.env.local` from `.env.local.example`:

```bash
# ─── Supabase ────────────────────────────────────────────────────────────────
# Found in: Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here  # NEVER expose to client

# ─── App ─────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ─── Demo Mode ───────────────────────────────────────────────────────────────
NEXT_PUBLIC_DEMO_MODE=false

# ─── Email (Resend) ──────────────────────────────────────────────────────────
RESEND_API_KEY=re_your_api_key_here

# ─── Claude AI ───────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-your-key-here
CLAUDE_MODEL=claude-sonnet-4-20250514

# ─── Groq AI Fallback ────────────────────────────────────────────────────────
GROQ_API_KEY=gsk_your_key_here

# ─── Cron Security ───────────────────────────────────────────────────────────
CRON_SECRET=generate-a-random-32-char-string

# ─── Sentry ──────────────────────────────────────────────────────────────────
SENTRY_AUTH_TOKEN=your_sentry_auth_token
SENTRY_ORG=o4511213641334784
SENTRY_PROJECT=prime-crm
```

### Demo Mode Credentials
When `NEXT_PUBLIC_DEMO_MODE=true`, the following demo accounts are baked into `src/lib/hooks/useAuth.ts`:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@consultpro.com | demo123 |
| Counselor | priya@consultpro.com | demo123 |
| Student | sarah@student.com | demo123 |

**Note:** The login page UI (`src/app/(auth)/login/page.tsx`) displays slightly different emails (`admin@f1dreamjobs.com`, `priya@f1dreamjobs.com`) but the actual demo auth logic in `useAuth.ts` accepts the `@consultpro.com` variants. Both domains may work depending on which auth path a page uses.

---

## Authentication & Authorization

### Role-Based Access Control

The app has three roles with a strict hierarchy:

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all data and users; bypasses RLS with `service_role` key |
| **Counselor** | Can add/update applications only for assigned students; read-only on their students |
| **Student** | Read-only view of own applications; cannot see internal notes |

### Middleware Protection (`middleware.ts`)
1. Redirects unauthenticated users to `/login`
2. Redirects authenticated users away from `/login` to their role home (`/admin`, `/counselor`, `/student`)
3. Blocks cross-role access (e.g., a student cannot visit `/admin`)
4. Injects `x-request-id` header for tracing

### Idle Timeout
Sessions automatically expire after **30 minutes of inactivity**. The `useAuth` hook tracks user activity (`mousemove`, `keydown`, etc.) and signs out idle users. In demo mode, the timeout is also enforced via `localStorage` session expiry.

---

## Database Schema

Database migrations live in `supabase/migrations/`:
- `001_prime_crm_ai_tables.sql` — Core CRM + AI feature tables + RLS
- `002_analytics_functions.sql` — SQL analytics functions
- `003_agentic.sql` — Agent runs, steps, job matches, AI call logging

Apply them via the Supabase SQL Editor or CLI.

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | All users (admin/counselor/student), linked to `auth.users` |
| `students` | Extended profile: university, visa_status, assigned_counselor, status |
| `applications` | Core table; every job applied on a student's behalf |
| `activity_log` | Audit trail; auto-populated by DB trigger on status change |
| `documents` | File metadata; actual files in Supabase Storage bucket `documents` |
| `notifications` | Per-user notification feed |

### AI & Agent Tables

| Table | Purpose |
|-------|---------|
| `candidate_profiles` | Structured candidate data: target roles, skills, narrative, deal breakers |
| `evaluation_scores` | AI evaluation results per application |
| `generated_cvs` | Metadata for AI-generated PDF CVs stored in `generated-cvs` bucket |
| `interview_prep` | AI-generated interview prep data per application |
| `job_leads` | Discovered job postings from the scanner |
| `job_matches` | AI-evaluated matches between students and job leads |
| `scan_history` | History of scanned URLs with deduplication |
| `scanner_config` | Scanner settings: tracked companies, title filters |
| `agent_runs` | Top-level async job records (apply, digest, etc.) |
| `agent_run_steps` | Individual steps within an agent run |
| `ai_call_log` | Persisted AI call metadata for cost tracking |

### Enums

```typescript
type Role = "admin" | "counselor" | "student";
type ApplicationStatus = "applied" | "in_progress" | "interview" | "rejected" | "offered";
type StudentStatus = "active" | "paused" | "completed";
type DocumentType = "resume" | "cover_letter" | "jd" | "other";
type LeadStatus = "new" | "reviewed" | "assigned" | "dismissed";
type LeadSource = "greenhouse" | "ashby" | "lever" | "workday" | "direct" | "other";
```

### Row Level Security (RLS)

RLS is **critical** — it is the sole data isolation mechanism between roles. All tables have RLS enabled with policies that restrict access based on:
- `public.current_user_role()` helper
- `public.counselor_student_ids()` helper
- `auth.uid()` matching `profile_id` or `student_id`

Admin operations that bypass RLS use `createAdminClient()` from `src/lib/supabase/server.ts`.

### Analytics SQL Functions

Defined in `supabase/migrations/002_analytics_functions.sql`:
- `application_funnel()` — counts per application status
- `score_distribution()` — evaluation score buckets
- `archetype_performance()` — interviews/offers per archetype
- `counselor_stats(p_counselor_id)` — per-counselor aggregates

---

## Design System

### Visual Language

- **Glass morphism**: `background: rgba(255,255,255,0.78)`, `backdropFilter: blur(40px)`, rounded corners (20-24px)
- **Ambient blobs**: 3 animated radial-gradient blobs (blue/mint/violet) at very low opacity (3-7%)
- **Easing**: Always `cubic-bezier(.4,0,.2,1)`
- **Font**: `'Inter'` (Google Fonts), weights 300-800

### Status Colors

| Status | Color | Hex |
|--------|-------|-----|
| applied | Blue | `#3b82f6` |
| in_progress | Amber | `#f59e0b` |
| interview | Green | `#10b981` |
| rejected | Red | `#ef4444` |
| offered | Violet | `#8b5cf6` |

### Tailwind Customizations

See `tailwind.config.ts` for:
- Brand color palette (`brand-50` to `brand-900`)
- Mint accent colors
- Status color mappings
- Custom animations (`blob-a`, `blob-b`, `blob-c`, `fade-up`, `shake`, `float`)
- Box shadows (`glass`, `glass-hover`, `brand`)

### CSS Classes (`globals.css`)

```css
.glass           /* Glass morphism card */
.glass-hover     /* Glass card with hover lift */
.glass-topbar    /* Topbar glass blur */
.card            /* White card with subtle shadow */
.card-hover      /* White card with hover lift */
.btn-brand       /* Primary action button */
.btn-ghost       /* Secondary button */
.input-field     /* Form input */
.status-badge    /* Status indicator */
.sidebar-item    /* Navigation item */
.sidebar-item-active /* Active nav item */
.skeleton        /* Loading shimmer */
.section-label   /* Uppercase section label */
```

### Mobile Responsiveness

Extensive mobile-first CSS is in `globals.css`:
- Tables transform into card layouts on small screens
- Modals become bottom sheets on mobile
- Stats grids collapse to 2 columns
- Sidebar becomes an overlay drawer

---

## Key Patterns

### Supabase Client Usage

```typescript
// Browser/client component
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
// Note: in demo mode this returns a mock client with empty responses.

// Server Component
import { createServerClient } from "@/lib/supabase/server";
const supabase = createServerClient();

// Admin operations (bypass RLS)
import { createAdminClient } from "@/lib/supabase/server";
const admin = createAdminClient();
```

### API Routes with `withApi`

All new API routes should use the `withApi` higher-order function (`src/lib/http/withApi.ts`). It provides:
- Session authentication
- Profile + RBAC check (`requireRole`)
- In-memory rate limiting (`rateLimit`)
- Zod body validation (`schema`)
- Request ID injection
- Structured JSON logging
- Consistent error envelopes (`{ error, message, requestId }`)

Example:
```typescript
import { withApi } from "@/lib/http/withApi";
import { mySchema } from "@/lib/http/zodSchemas";

export const POST = withApi(
  { schema: mySchema, requireRole: ["admin", "counselor"], rateLimit: { bucket: "my-feature", limit: 5, windowMs: 60_000 } },
  async ({ body, user, requestId, logger }) => {
    // ... business logic
    return Response.json({ data: ... });
  }
);
```

### API Functions with Demo Mode

All API functions in `src/lib/api/` support demo mode:

```typescript
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function getApplications() {
  if (DEMO_MODE) {
    return { data: MOCK_APPLICATIONS, error: null };
  }
  // Real Supabase query...
}
```

In demo mode, some mutations update in-memory arrays (`demoApplications`, `demoStudents`) so the UI responds immediately.

### Form Handling

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

### Server + Client Component Split

Each dashboard page follows this pattern:
1. `page.tsx` (Server Component) — fetches data, validates role, passes data to client
2. `*Client.tsx` (Client Component) — handles interactivity, state, and mutations
3. `loading.tsx` / `error.tsx` — UX boundaries

Because Supabase foreign-key relations often return arrays in the JS client, server pages normalize them:

```typescript
const applications = (rawApplications as any[]).map((a: any) => ({
  ...a,
  applied_by_profile: Array.isArray(a.applied_by_profile)
    ? a.applied_by_profile[0]
    : a.applied_by_profile,
}));
```

### Email Notifications

The `src/lib/api/applications.ts` functions trigger emails via `POST /api/email` in a fire-and-forget pattern (wrapped in `try/catch` so UI is never blocked). The `/api/email` route looks up student/counselor data and sends via Resend using templates in `src/lib/email/index.ts`.

Email templates available:
- `welcomeTemplate`
- `newApplicationTemplate`
- `statusChangeTemplate`
- `counselorAssignedTemplate`

---

## Realtime Features

Status changes and AI-generated content trigger real-time updates:

1. Counselor updates application status or generates an evaluation
2. DB trigger creates `activity_log` entry + `notification` record
3. Supabase Realtime broadcasts change
4. Dashboard updates live (no page refresh)

Tables enabled for Realtime: `applications`, `notifications`, `evaluation_scores`, `job_leads`, `interview_prep`, `agent_runs`, `agent_run_steps`

---

## AI Features

### AI Router (`src/lib/ai/router.ts`)

All new AI calls should go through `aiJson<T>()` or `aiText()` in the router. It provides:
- **Per-feature fallback policy**: Most features use Anthropic primary → Groq fallback on transient errors (`status >= 500`, `429`, timeout/abort). `cv-generate` and `cv-parse` have **no fallback** — they hard-fail with `AI_CV_UNAVAILABLE` rather than producing an inferior CV.
- **Cost tracking**: Estimates USD cost per call and persists to `ai_call_log`.
- **Observability**: Every call is logged as a single JSON line to stdout.
- **Sentry integration**: Errors are captured automatically.

### Candidate Evaluation (`/api/evaluate`)

Accepts a student CV and job description, returns:
- `overall_score` (1-5)
- `grade` (A-F)
- `archetype` (e.g., "Full-Stack Builder")
- `recommendation` (`strong_apply`, `apply`, `consider`, `skip`)
- `blocks` (structured reasoning)
- `keywords`

Results are saved to `evaluation_scores`.

### CV Generation (`/api/generate-cv`)

Generates a tailored PDF resume using Playwright + `@sparticuz/chromium`. The PDF is uploaded to the `generated-cvs` Supabase Storage bucket and metadata saved to `generated_cvs`.

### Interview Prep (`/api/interview-prep`)

Generates company/role-specific prep data including:
- Predicted questions
- Story bank
- Talking points
- Strategy recommendations

Results are saved to `interview_prep`.

---

## Agent Runner

The agent runner is an async background job system for batch AI operations (primarily the "apply agent").

### How it works
1. A counselor triggers `/api/agent/apply` with a student and selected job matches.
2. An `agent_runs` record is created with `status: "queued"`.
3. `agent_run_steps` are created (4 per job): `evaluate` → `create_app` → `gen_cv` → `gen_prep` → `notify`.
4. The `/api/agent/tick` cron (every 1 minute) pulls pending steps, locks them, and dispatches to `src/lib/agent/executor.ts`.
5. Step results cascade (e.g., `create_app` writes the `application_id` into sibling steps).
6. Run aggregates are updated after each tick batch.

### Cron Jobs (`vercel.json`)
- `/api/cron/scan` — scan for job leads every 6 hours
- `/api/agent/digest` — daily digest at 07:00
- `/api/agent/tick` — process agent steps every 1 minute

All cron endpoints are protected by `CRON_SECRET` (`Authorization: Bearer {CRON_SECRET}`).

---

## Job Scanner

### Scanner Logic (`src/lib/scanner/index.ts`)

The scanner fetches job listings from two sources:
1. **Greenhouse API** (`boards-api.greenhouse.io/v1/boards/{slug}/jobs`) for companies with an `api_slug`
2. **Direct career page scraping** (regex-based link extraction) for companies with a `careers_url`

### Filtering (`src/lib/scanner/filters.ts`)

Jobs are filtered by title using `positive` and `negative` keyword lists from `scanner_config`.

### Deduplication

New listings are checked against `scan_history` (unique index on `job_url`). Duplicates are skipped.

---

## Security Considerations

### Headers (`next.config.js`)

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-DNS-Prefetch-Control: off`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Permissions-Policy` — camera/mic/geolocation/payment disabled
- Content Security Policy configured for Supabase, Google Fonts, Anthropic API, and Sentry resources

### Important Rules

1. **Never** expose `SUPABASE_SERVICE_ROLE_KEY` to the client bundle
2. **Always** use RLS policies for data access control
3. **Validate** all inputs with Zod schemas before processing
4. **Sanitize** user-generated content before display
5. **Check** role permissions in middleware, server actions, and `withApi` for sensitive routes
6. **Protect** cron and admin API routes with secrets or session checks

---

## Testing Strategy

### Unit Tests (Vitest)
- Config: `vitest.config.ts`
- Environment: `node`
- Globals enabled
- Test files: `tests/unit/**/*.test.ts`
- Coverage includes: `src/lib/ai/**`, `src/lib/http/**`, `src/lib/logging/**`
- Run: `npm run test` / `npm run test:coverage`

### E2E Tests (Playwright)
- Config: `playwright.config.ts`
- Test directory: `tests/e2e`
- Auto-starts dev server when not in CI (`npm run dev`)
- `global.setup.ts` authenticates all 3 roles and saves storage state
- Subsequent tests reuse authenticated contexts from `.auth/`
- Run: `npm run test:e2e` / `npm run test:e2e:ui`

### Static Analysis
- **TypeScript** compile-time checks (`npm run type-check`)
- **ESLint** for code quality (`npm run lint`)

### Manual Testing Checklist

- [ ] Login with each role (admin, counselor, student)
- [ ] Verify role-based route protection
- [ ] Test idle timeout (30 min)
- [ ] Verify demo mode works without Supabase
- [ ] Create a user as admin and confirm welcome email
- [ ] Submit an application as counselor and verify student notification
- [ ] Change application status and verify real-time update + email
- [ ] Test AI evaluation, CV generation, and interview prep
- [ ] Run scanner manually via `/api/scan` and verify job leads
- [ ] Queue an apply-agent run and verify steps complete via `/api/agent/tick`

---

## Deployment

### Vercel (Recommended)

1. Connect GitHub repo to Vercel
2. Add all environment variables in Vercel Dashboard
3. Deploy

### Environment Requirements

- Node.js 18+
- All environment variables configured
- Supabase project with migrations applied (`supabase/migrations/*.sql`)
- Supabase Storage buckets created: `documents`, `generated-cvs`
- Vercel Cron Jobs enabled (configured in `vercel.json`)

---

## Reference Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | High-level project overview and build sequence |
| `ConsultPro-CRM-Prompts.md` | Sequential prompts for production implementation |
| `consultpro-crm-sample.jsx` | Standalone React demo (no build step) |
| `supabase/migrations/001_prime_crm_ai_tables.sql` | Core + AI tables + RLS |
| `supabase/migrations/002_analytics_functions.sql` | Analytics SQL functions |
| `supabase/migrations/003_agentic.sql` | Agent runs, steps, matches, AI call log |

---

## Common Tasks

### Adding a New API Function

1. Add to the appropriate file in `src/lib/api/`
2. Support demo mode with `MOCK_DATA` fallback
3. Use TypeScript types from `database.types.ts`
4. Return `{ data, error }` shape
5. If it triggers an email, use the fire-and-forget `/api/email` pattern

### Adding a New API Route

1. Create `route.ts` under `src/app/api/{feature}/`
2. Wrap handler with `withApi` from `src/lib/http/withApi.ts`
3. Add Zod schema to `src/lib/http/zodSchemas.ts`
4. Apply `requireRole` and `rateLimit` as appropriate

### Adding a New Page

1. Create a folder in the appropriate role directory (`admin/`, `counselor/`, `student/`)
2. Add `loading.tsx` and `error.tsx` for UX boundaries
3. Create `*Client.tsx` for client interactivity
4. Keep the server entry as `page.tsx`

### Adding a New Component

1. Create in `src/components/`
2. Use Tailwind classes and CSS utilities from the design system
3. Accept `className` prop for composition when appropriate
4. Export as default or named export

### Modifying the Database Schema

1. Create a new migration file in `supabase/migrations/`
2. Apply changes in Supabase SQL Editor
3. Update `src/lib/supabase/database.types.ts`
4. Regenerate types: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/database.types.ts`

### Adding a New AI Feature

1. Add the prompt in `src/lib/ai/prompts/`
2. Wire it through `src/lib/ai/router.ts` (add a `AiFeature` if needed)
3. Create an API route in `src/app/api/`
4. Add a client-side API wrapper in `src/lib/api/` if needed
5. Add UI component(s) in `src/components/`
6. Update `AGENTS.md` with the new feature

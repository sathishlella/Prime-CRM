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
The platform includes several AI-driven capabilities powered by Anthropic Claude:
- **Candidate Evaluation**: Analyze fit between a student's profile and a job posting, producing a score, grade, archetype, and recommendation.
- **Tailored CV Generation**: Generate a customized PDF resume optimized for a specific job application.
- **Interview Prep**: Generate company-specific interview questions, story banks, and preparation strategies.
- **Job Lead Scanner**: Automatically scan Greenhouse APIs and company career pages for new job postings.

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
| Styling | Tailwind CSS 3.4 |
| Animations | Framer Motion |
| State Management | Zustand |
| Forms | React Hook Form + Zod |
| Icons | SVG (inline) |
| AI | Anthropic Claude SDK (`@anthropic-ai/sdk`) |
| Email | Resend (`resend`) |
| PDF/Scraping | Playwright Core + `@sparticuz/chromium` |

---

## Project Structure

```
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth route group
│   │   │   ├── layout.tsx            # Minimal auth layout
│   │   │   └── login/
│   │   │       └── page.tsx          # Login page with demo mode
│   │   ├── (dashboard)/              # Dashboard route group (protected)
│   │   │   ├── layout.tsx            # Dashboard shell with sidebar + session check
│   │   │   ├── admin/                # Admin portal
│   │   │   │   ├── page.tsx          # Admin dashboard (server)
│   │   │   │   ├── AdminDashboardClient.tsx
│   │   │   │   ├── analytics/        # Admin analytics page
│   │   │   │   ├── create-user/      # Create new users
│   │   │   │   ├── scanner/          # Scanner configuration
│   │   │   │   └── users/            # User management
│   │   │   ├── counselor/            # Counselor portal
│   │   │   │   ├── page.tsx          # Counselor dashboard
│   │   │   │   ├── CounselorDashboardClient.tsx
│   │   │   │   ├── leads/            # Job leads management
│   │   │   │   └── students/         # Assigned students + profiles
│   │   │   └── student/              # Student portal
│   │   │       ├── page.tsx          # Student dashboard
│   │   │       ├── StudentDashboardClient.tsx
│   │   │       ├── cvs/              # Generated CVs
│   │   │       └── documents/        # Student documents
│   │   ├── api/                      # API routes
│   │   │   ├── analytics/            # Analytics data endpoint
│   │   │   ├── candidate-profile/    # Candidate profile CRUD
│   │   │   ├── cron/scan/            # Vercel cron job for scanning
│   │   │   ├── email/                # Email sending endpoint
│   │   │   ├── evaluate/             # AI candidate evaluation
│   │   │   ├── generate-cv/          # AI CV generation
│   │   │   ├── interview-prep/       # AI interview prep
│   │   │   ├── leads/                # Job leads API
│   │   │   ├── scan/                 # Manual scanner trigger
│   │   │   ├── students/update-counselor/
│   │   │   └── users/delete/         # User deletion
│   │   ├── globals.css               # Global styles + design tokens
│   │   ├── layout.tsx                # Root layout (fonts, SessionGuard, OfflineBanner)
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
│   │   ├── Avatar.tsx                # User avatar
│   │   ├── StatCard.tsx              # Statistic card
│   │   ├── Skeleton.tsx              # Loading shimmer
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
│       │   ├── claude.ts             # Claude API client wrapper
│       │   ├── cv-generator.ts       # CV generation logic
│       │   ├── cv-parser.ts          # CV parsing utilities
│       │   ├── prompts/              # AI prompts (evaluate, interview-prep, etc.)
│       │   └── templates/            # CV templates
│       ├── scanner/
│       │   ├── index.ts              # Portal scanning orchestrator
│       │   ├── filters.ts            # Job title filtering logic
│       │   └── portals-config.ts     # Default tracked companies & filters
│       └── email/
│           └── index.ts              # Resend email templates & senders
├── supabase/
│   └── migrations/                   # Database migrations (NOT schema.sql)
│       ├── 001_prime_crm_ai_tables.sql
│       └── 002_analytics_functions.sql
├── middleware.ts                     # Auth + role-based routing
├── tailwind.config.ts                # Tailwind customization
├── next.config.js                    # Next.js config + security headers
├── vercel.json                       # Vercel cron jobs + function config
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

# ─── Cron Security ───────────────────────────────────────────────────────────
CRON_SECRET=generate-a-random-32-char-string
```

### Demo Mode Credentials
When `NEXT_PUBLIC_DEMO_MODE=true`, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@consultpro.com | demo123 |
| Counselor | priya@consultpro.com | demo123 |
| Student | sarah@student.com | demo123 |

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
2. Redirects authenticated users away from `/login` to their role home
3. Blocks cross-role access (e.g., a student cannot visit `/admin`)

### Idle Timeout
Sessions automatically expire after **30 minutes of inactivity**. The `useAuth` hook tracks user activity (`mousemove`, `keydown`, etc.) and signs out idle users. In demo mode, the timeout is also enforced via `localStorage` session expiry.

---

## Database Schema

Database migrations live in `supabase/migrations/` (not `supabase/schema.sql`). Apply them via the Supabase SQL Editor or CLI.

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | All users (admin/counselor/student), linked to `auth.users` |
| `students` | Extended profile: university, visa_status, assigned_counselor, status |
| `applications` | Core table; every job applied on a student's behalf |
| `activity_log` | Audit trail; auto-populated by DB trigger on status change |
| `documents` | File metadata; actual files in Supabase Storage bucket `documents` |
| `notifications` | Per-user notification feed |

### AI Tables

| Table | Purpose |
|-------|---------|
| `candidate_profiles` | Structured candidate data: target roles, skills, narrative, deal breakers |
| `evaluation_scores` | AI evaluation results per application (score, grade, archetype, recommendation) |
| `generated_cvs` | Metadata for AI-generated PDF CVs stored in `generated-cvs` bucket |
| `interview_prep` | AI-generated interview prep data per application |
| `job_leads` | Discovered job postings from the scanner |
| `scan_history` | History of scanned URLs with deduplication |
| `scanner_config` | Scanner settings: tracked companies, title filters, search queries |

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

- **Glass morphism**: `background: rgba(255,255,255,0.78)`, `backdropFilter: blur(40px)`, rounded corners (20px)
- **Ambient blobs**: 3 animated radial-gradient blobs (blue/mint/violet) at very low opacity (3-7%)
- **Easing**: Always `cubic-bezier(.4,0,.2,1)` (stored as CSS var `--ease`)
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

// Server Component
import { createServerClient } from "@/lib/supabase/server";
const supabase = createServerClient();

// Admin operations (bypass RLS)
import { createAdminClient } from "@/lib/supabase/server";
const admin = createAdminClient();
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

In demo mode, mutations update in-memory arrays (`demoApplications`, `demoStudents`) so the UI responds immediately.

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

Tables enabled for Realtime: `applications`, `notifications`, `evaluation_scores`, `job_leads`, `interview_prep`

---

## AI Features

### Claude Integration (`src/lib/ai/claude.ts`)

All AI calls go through `callClaude<T>(systemPrompt, userPrompt)` which:
- Uses `ANTHROPIC_API_KEY` and `CLAUDE_MODEL`
- Retries up to 3 times with exponential backoff
- Extracts JSON from markdown code blocks if present
- Returns `{ data, usage }`

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

## Job Scanner

### Scanner Logic (`src/lib/scanner/index.ts`)

The scanner fetches job listings from two sources:
1. **Greenhouse API** (`boards-api.greenhouse.io/v1/boards/{slug}/jobs`) for companies with an `api_slug`
2. **Direct career page scraping** (regex-based link extraction) for companies with a `careers_url`

### Filtering (`src/lib/scanner/filters.ts`)

Jobs are filtered by title using `positive` and `negative` keyword lists from `scanner_config`.

### Deduplication

New listings are checked against `scan_history` (unique index on `job_url`). Duplicates are skipped.

### Cron Job

`vercel.json` configures an automatic scan every 6 hours:
```json
{
  "crons": [{ "path": "/api/cron/scan", "schedule": "0 */6 * * *" }]
}
```

The cron endpoint is protected by `CRON_SECRET` (via `Authorization: Bearer {CRON_SECRET}`).

---

## Security Considerations

### Headers (`next.config.js`)

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- Content Security Policy configured for Supabase, Google Fonts, and Anthropic API resources

### Important Rules

1. **Never** expose `SUPABASE_SERVICE_ROLE_KEY` to the client bundle
2. **Always** use RLS policies for data access control
3. **Validate** all inputs with Zod schemas before processing
4. **Sanitize** user-generated content before display
5. **Check** role permissions in middleware and server actions for sensitive routes
6. **Protect** cron and admin API routes with secrets or session checks

---

## Testing Strategy

Currently, the project uses:
- **TypeScript** for compile-time type safety (`npm run type-check`)
- **ESLint** for code quality (`npm run lint`)
- **Demo mode** for manual testing without a live Supabase project

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

---

## Reference Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | High-level project overview and build sequence |
| `ConsultPro-CRM-Prompts.md` | Sequential prompts for production implementation |
| `consultpro-crm-sample.jsx` | Standalone React demo (no build step) |
| `supabase/migrations/001_prime_crm_ai_tables.sql` | AI feature tables + RLS |
| `supabase/migrations/002_analytics_functions.sql` | Analytics SQL functions |

---

## Common Tasks

### Adding a New API Function

1. Add to the appropriate file in `src/lib/api/`
2. Support demo mode with `MOCK_DATA` fallback
3. Use TypeScript types from `database.types.ts`
4. Return `{ data, error }` shape
5. If it triggers an email, use the fire-and-forget `/api/email` pattern

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
2. Add any orchestration logic in `src/lib/ai/`
3. Create an API route in `src/app/api/`
4. Add a client-side API wrapper in `src/lib/api/` if needed
5. Add UI component(s) in `src/components/`
6. Update `AGENTS.md` with the new feature

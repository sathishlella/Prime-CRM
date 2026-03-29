# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**ConsultPro CRM** — a student job consultancy platform for tracking job applications on behalf of students.

- **Sample/prototype:** `consultpro-crm-sample.jsx` — a self-contained React demo (no build step, in-memory data, no auth)
- **Production build plan:** `ConsultPro-CRM-Prompts.md` — 11 sequential prompts describing the full production implementation

---

## Target Production Stack

```
Next.js 14 App Router + TypeScript
Supabase (PostgreSQL + Auth + Storage + Realtime)
Tailwind CSS + Framer Motion
Zustand (state management)
React Hook Form + Zod (validation)
Vercel (hosting)
```

---

## Core Business Logic

```
COUNSELOR finds a job → adds Company, Role, JD, Resume, Link
    ↓
System records: who applied, when, status
    ↓
STUDENT logs in → sees every application with full details
    ↓
ADMIN sees everything — all students, all counselors, all data
```

Three roles with strict permission hierarchy:
- **Admin** — full access, bypasses RLS via `service_role` key
- **Counselor** — can add/update applications only for their assigned students
- **Student** — read-only view of their own applications; cannot see internal notes

---

## Architecture (Production App)

### Folder Structure
```
/src/app/(auth)/login/page.tsx          ← public login page
/src/app/(dashboard)/layout.tsx         ← shared sidebar + topbar
/src/app/(dashboard)/admin/page.tsx
/src/app/(dashboard)/counselor/page.tsx
/src/app/(dashboard)/student/page.tsx
/src/lib/supabase/client.ts             ← browser Supabase client
/src/lib/supabase/server.ts             ← RSC Supabase client
/src/lib/hooks/useAuth.ts               ← user, role, signIn(), signOut()
/src/lib/hooks/useRealtime.ts           ← generic Realtime subscription
/src/lib/hooks/useNotifications.ts      ← notifications + unread count
/src/lib/api/applications.ts           ← CRUD for applications table
/src/lib/api/students.ts
/src/lib/api/documents.ts
/src/lib/api/notifications.ts
/src/components/                        ← shared design system components
```

### Key Database Tables
- `profiles` — all users (admin/counselor/student), linked to `auth.users`
- `students` — extended profile: university, visa_status, assigned_counselor
- `applications` — core table; every job applied on a student's behalf
- `activity_log` — audit trail; auto-populated by DB trigger on status change
- `documents` — file metadata; actual files in Supabase Storage bucket `documents`
- `notifications` — per-user notification feed

### RLS (Row Level Security)
RLS is **critical** — it is the sole data isolation mechanism between roles. Students, counselors, and admins receive different data from the same queries based on their JWT role. Admin operations use `service_role` key (server-only, never exposed to client).

### Realtime Flow
Status change by counselor → DB trigger creates `activity_log` entry + `notification` record → Supabase Realtime broadcasts → student dashboard updates live (no page refresh).

---

## Design System (Sample & Production)

The sample JSX defines the visual language used throughout:

- **Glass morphism:** `background: rgba(255,255,255,0.5)`, `backdropFilter: blur(20px)`, `border: 1px solid rgba(255,255,255,0.65)`, `borderRadius: 18`
- **Blob background:** 3 fixed animated radial-gradient blobs (blue/mint/violet, 4–6% opacity)
- **Easing:** always `cubic-bezier(.4,0,.2,1)` (stored as `ease` constant)
- **Font:** `'Outfit'` (Google Fonts), weights 400–800
- **Status colors:** applied=blue `#3b82f6`, in_progress=amber `#f59e0b`, interview=green `#10b981`, rejected=red `#ef4444`, offered=violet `#8b5cf6`
- **Entrance animation:** `fadeUp` (translateY 12–24px → 0, fade in)

---

## Sample File (consultpro-crm-sample.jsx)

This is a **standalone demo** — single JSX file, no routing, no backend, data is hardcoded in `initApps()`. It demonstrates:
- All three portals (Student / Counselor / Admin) with role-switching via login screen
- Complete UI patterns: glass cards, stat cards, application expansion, status badge, modal, inline editing
- State management with `useState`/`useEffect` only — no external libraries

When building production components, use this file as the visual/UX reference.

---

## Build Sequence (from Prompts file)

The 11 prompts in `ConsultPro-CRM-Prompts.md` must be executed in order:

| Week | Prompts | Gate |
|------|---------|------|
| 1 | 1 (setup) → 2 (DB schema) → 3 (auth) → 4 (design system) | Login works, blank dashboards visible |
| 2 | 5 (student) → 6 (counselor) → 7 (admin) | Counselor can add apps, student sees them |
| 3 | 8 (notifications) → 9 (file uploads) → 10 (wire everything) | Full real-time flow works end-to-end |
| 4 | 11 (deploy) | Live on Vercel + custom domain |

**Prompt 2 (DB schema) must be complete before any UI prompts.** Prompt 4 (design system components) must exist before Prompts 5–7.

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY   ← server-only, never in client bundle
NEXT_PUBLIC_APP_URL
```

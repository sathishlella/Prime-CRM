# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project

**F1 Dream Jobs CRM** — production web app for tracking job applications on behalf of F1 visa students. Live at `https://f1-dream-crm-dashboard.vercel.app/`.

---

## Commands

```bash
npm run dev          # start dev server (localhost:3000)
npm run build        # production build (runs type-check)
npm run type-check   # tsc --noEmit only
npm run lint         # next lint
```

No test suite is configured. Validate changes with `npm run build` before pushing — Vercel runs `npm run build` on every push to `main`.

---

## Stack

```
Next.js 14 App Router + TypeScript + React 18.3
Supabase (PostgreSQL + Auth + Storage + Realtime)
Tailwind CSS (utility layer only) + Framer Motion
Zustand (uiStore: toasts)
React Hook Form + Zod
Vercel (auto-deploy from main branch)
```

**React 18 constraint:** Use `useFormState` / `useFormStatus` from `react-dom` — NOT `useActionState` (React 19 only).

---

## Architecture

### Route groups
```
src/app/(auth)/login/           ← public, no layout
src/app/(dashboard)/layout.tsx  ← auth guard + DashboardShell (sidebar + topbar)
src/app/(dashboard)/admin/
src/app/(dashboard)/counselor/
src/app/(dashboard)/student/
```

The dashboard layout server-fetches the session and profile, redirects to `/login` if missing, then renders `DashboardShell` with the profile passed as prop.

### Data flow
- **Server Components** fetch initial data from Supabase and pass it as props to `*Client.tsx` components
- **Client Components** handle interactivity, optimistic state updates, and Realtime subscriptions
- **Server Actions** (`src/lib/actions/`) handle mutations that need the `service_role` key (e.g. `createUserAction`)
- **`src/lib/api/`** — client-side Supabase CRUD helpers used from Client Components

### Key files
```
src/lib/supabase/client.ts      ← browser client (anon key)
src/lib/supabase/server.ts      ← RSC client (anon key, cookie-based)
src/lib/supabase/admin.ts       ← service_role client (server-only)
src/lib/stores/uiStore.ts       ← Zustand: toasts (addToast, removeToast)
src/lib/actions/createUser.ts   ← Server Action: admin creates accounts
src/components/DashboardShell   ← layout wrapper (Sidebar + TopBar + ToastContainer)
```

### Database tables
- `profiles` — all users; `role` field drives RLS and UI routing
- `students` — extended student profile linked to `profiles`; holds `assigned_counselor_id`
- `applications` — core table; FK to `students`; `status` drives the pipeline
- `activity_log` — append-only audit trail; populated by DB trigger on status change
- `documents` — file metadata; actual files in Supabase Storage bucket `documents`
- `notifications` — per-user feed; populated by DB trigger on new application / status change

### RLS
RLS is the sole data isolation layer. Never bypass it on client paths. The `service_role` key is used only in Server Actions and server-side API routes — never in client bundles.

### Realtime
Counselor updates status → DB trigger creates `activity_log` + `notifications` rows → Supabase Realtime broadcasts → student dashboard updates without refresh (`src/lib/hooks/useRealtime.ts`).

---

## Design System

**Apple-inspired premium UI.** Key rules:

| Token | Value |
|---|---|
| Font | `Inter` (loaded via Google Fonts in `layout.tsx`) |
| Background | `linear-gradient(160deg, #F7F9FC, #F5F8FD, #F3F6FB)` |
| Accent | `#0A6EBD` (hover: `#0857A0`) |
| Text primary | `#0A0F1E` |
| Text secondary | `#4A5568` / `#6B7280` |
| Glass card | `rgba(255,255,255,0.78)`, `blur(40px)`, `border: rgba(0,0,0,0.06)` |
| White card | `background: #FFFFFF`, `border: rgba(0,0,0,0.06)`, `borderRadius: 20px` |
| Letter-spacing | `-0.01em` on body copy, `-0.5px` on headings |

CSS custom properties are defined in `globals.css` (`--accent`, `--ink`, `--surface`, `--shadow-*`, etc.). Use those variables rather than hardcoding hex values.

**No emojis anywhere.** Use inline SVG icons.

**Status colors** (in `StatusBadge.tsx`):
- applied `#2563EB` · in_progress `#D97706` · interview `#059669` · rejected `#DC2626` · offered `#7C3AED`

**Animations:** entrance = `fadeUp` keyframe, spring hover = `translateY(-2px)` + shadow lift. Easing: `cubic-bezier(.4,0,.2,1)`.

---

## Auth & User Creation

- Login: `supabase.auth.signInWithPassword` — role read from `profiles` table, redirect to `/{role}`
- Admin creates accounts: `src/lib/actions/createUser.ts` Server Action → `auth.admin.createUser({ email_confirm: true })` — no email verification needed
- First admin must be created manually in Supabase Auth dashboard, then `UPDATE profiles SET role = 'admin'` in SQL editor

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY   ← server-only, never in client bundle
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_DEMO_MODE       ← "true" shows demo credentials on login screen
```

---

## Git

Author all commits as: `--author="Sathish Lella <lellasathish490@gmail.com>"`
Do not add Claude as co-author.

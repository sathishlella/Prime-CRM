# ConsultPro CRM — Agent Guide

This document provides essential information for AI coding agents working on the ConsultPro CRM project.

---

## Project Overview

**ConsultPro CRM** is a student job consultancy platform for tracking job applications on behalf of students. It provides full transparency where students can see every application submitted by their counselors.

### Business Flow

```
COUNSELOR finds a job → adds Company, Role, JD, Resume, Link
    ↓
System records: who applied, when, status
    ↓
STUDENT logs in → sees every application with full details
    ↓
ADMIN sees everything — all students, all counselors, all data
```

### User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all data; can manage users, view analytics |
| **Counselor** | Can add/update applications only for their assigned students |
| **Student** | Read-only view of their own applications; cannot see internal notes |

---

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.5+ |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime |
| Styling | Tailwind CSS 3.4 |
| Animation | Framer Motion |
| State Management | Zustand |
| Forms | React Hook Form + Zod |
| Font | Outfit (Google Fonts) |

---

## Project Structure

```
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth route group
│   │   │   ├── layout.tsx
│   │   │   └── login/
│   │   │       └── page.tsx          # Public login page
│   │   ├── (dashboard)/              # Dashboard route group (protected)
│   │   │   ├── layout.tsx            # Shared dashboard shell
│   │   │   ├── admin/                # Admin portal
│   │   │   │   ├── page.tsx
│   │   │   │   ├── analytics/
│   │   │   │   └── users/
│   │   │   ├── counselor/            # Counselor portal
│   │   │   │   ├── page.tsx
│   │   │   │   └── students/
│   │   │   └── student/              # Student portal
│   │   │       ├── page.tsx
│   │   │       └── documents/
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Root redirect to /login
│   │   └── globals.css               # Global styles + Tailwind
│   ├── components/                   # Shared UI components
│   │   ├── Avatar.tsx
│   │   ├── BlobBackground.tsx
│   │   ├── DashboardShell.tsx
│   │   ├── DataTable.tsx
│   │   ├── FileUpload.tsx
│   │   ├── GlassCard.tsx             # Core glass morphism card
│   │   ├── Modal.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── OfflineBanner.tsx
│   │   ├── SessionGuard.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Skeleton.tsx
│   │   ├── StatCard.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── Toast.tsx
│   │   └── TopBar.tsx
│   └── lib/                          # Utilities and business logic
│       ├── api/                      # Data layer
│       │   ├── applications.ts
│       │   ├── documents.ts
│       │   ├── notifications.ts
│       │   └── students.ts
│       ├── hooks/                    # Custom React hooks
│       │   ├── useAuth.ts            # Authentication + idle timeout
│       │   ├── useNotifications.ts
│       │   └── useRealtime.ts
│       ├── stores/                   # Zustand stores
│       │   ├── appStore.ts
│       │   ├── authStore.ts
│       │   └── uiStore.ts
│       └── supabase/                 # Supabase clients
│           ├── client.ts             # Browser client
│           ├── database.types.ts     # TypeScript types
│           └── server.ts             # Server Component client
├── supabase/
│   └── schema.sql                    # Complete database schema
├── middleware.ts                     # Auth middleware + role guards
├── tailwind.config.ts                # Tailwind + design tokens
├── postcss.config.js
├── next.config.js                    # Next.js config + security headers
└── package.json
```

---

## Build and Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint

# Type checking (without emitting)
npm run type-check
```

---

## Environment Variables

Create `.env.local` based on `.env.local.example`:

```bash
# Supabase — Found in: Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here  # Server-only, NEVER expose to client

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important:** `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and must only be used in server-side code.

---

## Design System

### Glass Morphism (Primary Visual Language)

```tsx
// Core glass effect — use the GlassCard component
<GlassCard hoverable padding="20px">
  Content here
</GlassCard>

// Or use CSS utility classes
glass       → background: rgba(255,255,255,0.5), backdrop-blur(20px)
glass-hover → glass + hover lift effect
```

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `brand-500` | `#3b82f6` | Primary blue |
| `mint-500` | `#10b981` | Accent green |
| `status.applied` | `#3b82f6` | Applied status |
| `status.in_progress` | `#f59e0b` | In Progress status |
| `status.interview` | `#10b981` | Interview status |
| `status.rejected` | `#ef4444` | Rejected status |
| `status.offered` | `#8b5cf6` | Offered status |
| `surface.DEFAULT` | `#f8faff` | Page background start |

### Animations

| Name | Duration | Description |
|------|----------|-------------|
| `fadeUp` | 0.45s | Entrance animation (opacity 0→1, Y 14px→0) |
| `blob-a/b/c` | 17-25s | Background blob morphing (infinite) |
| `float` | 4s | Gentle floating effect |
| `shake` | 0.4s | Error state feedback |

### Easing

Always use `cubic-bezier(.4, 0, .2, 1)` — available as CSS var `--ease` or Tailwind `ease-smooth`.

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | All users (admin/counselor/student), linked to `auth.users` |
| `students` | Extended profile: university, visa_status, assigned_counselor |
| `applications` | Core table; every job applied on a student's behalf |
| `activity_log` | Audit trail; auto-populated by DB trigger on status change |
| `documents` | File metadata; actual files in Supabase Storage bucket `documents` |
| `notifications` | Per-user notification feed |

### Enums

```typescript
type Role = "admin" | "counselor" | "student";
type ApplicationStatus = "applied" | "in_progress" | "interview" | "rejected" | "offered";
type StudentStatus = "active" | "paused" | "completed";
type DocumentType = "resume" | "cover_letter" | "jd" | "other";
```

### Row Level Security (RLS)

**RLS is critical** — it is the sole data isolation mechanism. Students, counselors, and admins receive different data from the same queries based on their JWT role.

Key policies:
- Students can only read their own records
- Counselors can only access their assigned students
- Admins have full access (using `service_role` key for server operations)

### Database Triggers

1. **Auto-update `updated_at`** — on profiles, students, applications
2. **Status change → activity_log + notification** — notifies students of updates
3. **New application → activity_log + notification** — notifies students of new submissions
4. **New auth user → auto-create profile** — maintains profile sync

---

## Authentication & Authorization

### Middleware (`middleware.ts`)

- Protects all routes except `/login`
- Redirects unauthenticated users to `/login`
- Redirects authenticated users from `/login` to their role-based home
- Enforces cross-role access guards (students cannot access `/admin`, etc.)

### useAuth Hook (`src/lib/hooks/useAuth.ts`)

```typescript
const { user, profile, role, isLoading, signIn, signOut } = useAuth();
```

Features:
- 30-minute idle timeout (auto-logout)
- Session persistence via Supabase
- Role-based navigation after login

### Role-Based Homes

```typescript
const ROLE_HOME = {
  admin:     "/admin",
  counselor: "/counselor",
  student:   "/student",
};
```

---

## Supabase Clients

### Browser Client (`src/lib/supabase/client.ts`)

```typescript
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
```

Use in: Client Components, hooks, browser-only code

### Server Client (`src/lib/supabase/server.ts`)

```typescript
import { createServerClient, createAdminClient } from "@/lib/supabase/server";

// Regular server operations (respects RLS)
const supabase = createServerClient();

// Admin operations (bypasses RLS) — NEVER expose to client
const admin = createAdminClient();
```

Use in: Server Components, API routes, server actions

---

## Realtime Features

Supabase Realtime is enabled on:
- `applications` — live status updates
- `notifications` — instant notification delivery

Flow: Status change by counselor → DB trigger creates notification → Realtime broadcasts → student dashboard updates live (no refresh).

---

## Code Style Guidelines

### TypeScript

- Strict mode enabled
- Use `type` for type aliases, `interface` for object shapes
- Export types from `database.types.ts` for DB entities

### Component Structure

```typescript
"use client"; // If needed

import { useState } from "react"; // React imports first
import { motion } from "framer-motion"; // Third-party
import { createClient } from "@/lib/supabase/client"; // Absolute imports (@/*)
import GlassCard from "@/components/GlassCard"; // Components

// Types
interface Props { ... }

// Component
export default function ComponentName({ prop }: Props) {
  // Implementation
}
```

### Naming Conventions

- Components: PascalCase (`GlassCard.tsx`)
- Hooks: camelCase with `use` prefix (`useAuth.ts`)
- API functions: camelCase (`createApplication`)
- Stores: camelCase with `use` prefix (`useAuthStore`)

### Styling

- Prefer Tailwind utility classes for simple styling
- Use inline `style` prop for dynamic glass morphism values
- Use `globals.css` utility classes (`.glass`, `.btn-brand`) for consistency

---

## Testing Strategy

Currently, the project does not have automated tests configured. When adding tests:

1. **Unit Tests** — Test utility functions, hooks with `@testing-library/react`
2. **Integration Tests** — Test API layer with mocked Supabase
3. **E2E Tests** — Use Playwright for critical user flows (login, add application, status change)

---

## Security Considerations

### Critical Rules

1. **NEVER** expose `SUPABASE_SERVICE_ROLE_KEY` to the client
2. **ALWAYS** use `createAdminClient()` only in server-side code
3. **ALWAYS** verify user permissions before database operations
4. **NEVER** trust client input — validate with Zod schemas

### Security Headers (Configured in `next.config.js`)

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- Content Security Policy configured for Supabase domains

---

## Deployment

### Platform

Recommended: **Vercel**

### Environment Setup

1. Set all environment variables in Vercel Dashboard
2. Ensure `SUPABASE_SERVICE_ROLE_KEY` is only in server environment
3. Configure custom domain if needed

### Database Setup

1. Run `supabase/schema.sql` in Supabase SQL Editor
2. Enable Realtime on `applications` and `notifications` tables
3. Create Storage bucket `documents` (private, 10MB limit)

---

## Reference Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Additional context for Claude Code |
| `ConsultPro-CRM-Prompts.md` | 11 sequential build prompts |
| `consultpro-crm-sample.jsx` | Standalone demo (visual reference) |
| `supabase/schema.sql` | Complete database schema |

---

## Common Tasks

### Adding a New API Function

```typescript
// src/lib/api/feature.ts
"use client";

import { createClient } from "@/lib/supabase/client";

const supabase = () => createClient();

export async function createFeature(data: FeatureInput) {
  const { data: result, error } = await supabase()
    .from("table")
    .insert(data)
    .select()
    .single();
  
  return { data: result, error };
}
```

### Adding a New Page

1. Create directory under appropriate route group
2. Add `page.tsx` with Server Component fetching data
3. Add `*Client.tsx` for interactive UI if needed
4. Follow existing role-based guards pattern

### Adding a Database Migration

1. Add SQL to `supabase/schema.sql` using `IF NOT EXISTS`
2. Update `database.types.ts` with new types
3. Apply to Supabase via SQL Editor

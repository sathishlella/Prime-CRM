# F1 Dream Jobs CRM — Agent Guide

This file provides comprehensive guidance for AI coding agents working on the F1 Dream Jobs CRM codebase.

---

## Project Overview

**F1 Dream Jobs CRM** (also referred to as ConsultPro CRM) is a student job consultancy platform for tracking job applications on behalf of international students. It connects three user roles in a unified workflow:

- **Counselors** find jobs and submit applications for students
- **Students** log in to view their application status and history
- **Admins** manage users and oversee all platform activity

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

---

## Project Structure

```
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth route group
│   │   │   ├── layout.tsx            # Auth layout (minimal)
│   │   │   └── login/
│   │   │       └── page.tsx          # Login page with demo mode
│   │   ├── (dashboard)/              # Dashboard route group (protected)
│   │   │   ├── layout.tsx            # Dashboard shell with sidebar
│   │   │   ├── admin/                # Admin portal
│   │   │   ├── counselor/            # Counselor portal
│   │   │   └── student/              # Student portal
│   │   ├── globals.css               # Global styles + design tokens
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Root redirect
│   ├── components/                   # Shared UI components
│   │   ├── DashboardShell.tsx        # Layout wrapper with blobs
│   │   ├── Sidebar.tsx               # Navigation sidebar
│   │   ├── TopBar.tsx                # Header with user menu
│   │   ├── GlassCard.tsx             # Glass morphism card
│   │   ├── StatusBadge.tsx           # Application status badge
│   │   ├── DataTable.tsx             # Table component
│   │   ├── Modal.tsx                 # Dialog modal
│   │   ├── FileUpload.tsx            # Document upload
│   │   ├── NotificationBell.tsx      # Notifications UI
│   │   ├── Toast.tsx                 # Toast notifications
│   │   └── ...
│   └── lib/                          # Utilities and business logic
│       ├── supabase/
│       │   ├── client.ts             # Browser Supabase client
│       │   ├── server.ts             # Server Component client
│       │   └── database.types.ts     # TypeScript DB types
│       ├── hooks/
│       │   ├── useAuth.ts            # Auth hook with idle timeout
│       │   ├── useRealtime.ts        # Realtime subscriptions
│       │   └── useNotifications.ts   # Notifications logic
│       ├── stores/
│       │   ├── authStore.ts          # Zustand auth state
│       │   ├── appStore.ts           # Application state
│       │   └── uiStore.ts            # UI state
│       ├── api/
│       │   ├── applications.ts       # Application CRUD
│       │   ├── students.ts           # Student CRUD
│       │   ├── documents.ts          # Document CRUD
│       │   ├── notifications.ts      # Notifications API
│       │   └── mockData.ts           # Demo mode data
│       └── actions/
│           └── createUser.ts         # Server action for user creation
├── supabase/
│   ├── schema.sql                    # Complete DB schema
│   └── config.toml                   # Supabase CLI config
├── middleware.ts                     # Auth + role-based routing
├── tailwind.config.ts                # Tailwind customization
├── next.config.js                    # Next.js config + security headers
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

# Public — safe to expose to the browser
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Secret — NEVER expose this to the client bundle (server-only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ─── App ─────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ─── Demo Mode (optional) ────────────────────────────────────────────────────
# Set to "true" to run without Supabase (uses mock data)
NEXT_PUBLIC_DEMO_MODE=true
```

---

## Authentication & Authorization

### Role-Based Access Control

The app has three roles with a strict hierarchy:

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all data and users; bypasses RLS with service_role key |
| **Counselor** | Can add/update applications only for assigned students; read-only on their students |
| **Student** | Read-only view of own applications; cannot see internal notes |

### Demo Mode Credentials

When `NEXT_PUBLIC_DEMO_MODE=true`, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@consultpro.com | demo123 |
| Counselor | priya@consultpro.com | demo123 |
| Student | sarah@student.com | demo123 |

### Idle Timeout

Sessions automatically expire after **30 minutes of inactivity**. The `useAuth` hook tracks user activity (mousemove, keydown, etc.) and signs out idle users.

---

## Database Schema

Core tables (see `supabase/schema.sql` for complete schema):

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

RLS is **critical** — it is the sole data isolation mechanism between roles. Students, counselors, and admins receive different data from the same queries based on their JWT role. Admin operations use `service_role` key (server-only, never exposed to client).

---

## Design System

### Visual Language

- **Glass morphism**: `background: rgba(255,255,255,0.78)`, `backdropFilter: blur(40px)`, rounded corners (20px)
- **Ambient blobs**: 3 animated radial-gradient blobs (blue/mint/violet) at low opacity (3-7%)
- **Easing**: Always `cubic-bezier(.4,0,.2,1)` (stored as `var(--ease)`)
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
- Custom animations (blob-a, blob-b, blob-c, fade-up, shake)
- Box shadows (glass, glass-hover, brand)

### CSS Classes (globals.css)

```css
.glass           /* Glass morphism card */
.glass-hover     /* Glass card with hover effect */
.card            /* White card with subtle shadow */
.card-hover      /* White card with hover lift */
.btn-brand       /* Primary action button */
.btn-ghost       /* Secondary button */
.input-field     /* Form input */
.status-badge    /* Status indicator */
.sidebar-item    /* Navigation item */
.skeleton        /* Loading shimmer */
```

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

### Protected Routes

Routes under `(dashboard)/` are automatically protected by:
1. `middleware.ts` — redirects unauthenticated users to `/login`
2. `middleware.ts` — redirects users to their role-appropriate home
3. Dashboard layout (`(dashboard)/layout.tsx`) — server-side session check

---

## Realtime Features

Status changes trigger real-time updates:

1. Counselor updates application status
2. DB trigger creates `activity_log` entry + `notification` record
3. Supabase Realtime broadcasts change
4. Student dashboard updates live (no page refresh)

Tables enabled for Realtime: `applications`, `notifications`

---

## Security Considerations

### Headers (next.config.js)

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- Content Security Policy configured for Supabase resources

### Important Rules

1. **Never** expose `SUPABASE_SERVICE_ROLE_KEY` to client
2. **Always** use RLS policies for data access control
3. **Validate** all inputs with Zod schemas
4. **Sanitize** user-generated content before display
5. **Check** role permissions in middleware for sensitive routes

---

## Testing Strategy

Currently, the project uses:
- **TypeScript** for compile-time type safety (`npm run type-check`)
- **ESLint** for code quality (`npm run lint`)
- **Demo mode** for manual testing without Supabase setup

### Manual Testing Checklist

- [ ] Login with each role (admin, counselor, student)
- [ ] Verify role-based route protection
- [ ] Test idle timeout (30 min)
- [ ] Verify demo mode works without Supabase
- [ ] Test real-time updates (requires Supabase)

---

## Deployment

### Vercel (Recommended)

1. Connect GitHub repo to Vercel
2. Add environment variables in Vercel Dashboard
3. Deploy

### Environment Requirements

- Node.js 18+
- Environment variables configured
- Supabase project with schema applied (`supabase/schema.sql`)

---

## Reference Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | High-level project overview and build sequence |
| `ConsultPro-CRM-Prompts.md` | 11 sequential prompts for production implementation |
| `consultpro-crm-sample.jsx` | Standalone React demo (no build step) |
| `supabase/schema.sql` | Complete database schema with RLS policies |

---

## Common Tasks

### Adding a New API Function

1. Add to appropriate file in `src/lib/api/`
2. Support demo mode with `MOCK_DATA` fallback
3. Use TypeScript types from `database.types.ts`
4. Return `{ data, error }` shape

### Adding a New Page

1. Create folder in appropriate role directory (`admin/`, `counselor/`, `student/`)
2. Use `loading.tsx` and `error.tsx` for UX
3. Create `*Client.tsx` for client components
4. Keep server components as `page.tsx`

### Adding a New Component

1. Create in `src/components/`
2. Use Tailwind classes from design system
3. Accept `className` prop for composition
4. Export as default or named export

### Modifying the Database Schema

1. Edit `supabase/schema.sql`
2. Apply changes in Supabase SQL Editor
3. Update `src/lib/supabase/database.types.ts`
4. Regenerate types: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/database.types.ts`

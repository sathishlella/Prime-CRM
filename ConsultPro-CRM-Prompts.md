# CONSULTPRO CRM — PRODUCTION PROMPT BIBLE
## Student Job Consultancy • Admin + Counselor + Student
### Simple. Efficient. Transparent. 500+ Accounts.

---

> **Cost:** $0–25/month  
> **Stack:** Next.js 14 + Supabase + Vercel  
> **Build Time:** 3–4 weeks  
> **Roles:** Admin (full access) → Counselor (add data) → Student (view only)

---

## THE CORE WORKFLOW (your business logic)

```
COUNSELOR finds a job → adds Company, Role, JD, Resume, Link
    ↓
System records: who applied, when, status
    ↓
STUDENT logs in → sees every application with full details
    ↓
ADMIN sees everything — all students, all counselors, all data
```

**That's it. Simple. Every prompt below builds toward this.**

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROMPT 1 — PROJECT SETUP
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
You are a senior full-stack engineer. Set up a production-ready project
for a student job consultancy CRM.

TECH STACK (do not change):
• Next.js 14 App Router + TypeScript
• Supabase (PostgreSQL + Auth + Storage + Realtime)
• Tailwind CSS + Framer Motion
• Zustand (state management)
• React Hook Form + Zod (forms + validation)
• Hosted on Vercel (free tier)

CREATE:
1. Complete folder structure:
   /src/app/(auth)/login/page.tsx
   /src/app/(dashboard)/layout.tsx        ← shared sidebar + header
   /src/app/(dashboard)/admin/page.tsx
   /src/app/(dashboard)/counselor/page.tsx
   /src/app/(dashboard)/student/page.tsx

2. package.json with exact versions

3. tailwind.config.ts with:
   - White/soft blue/mint color palette
   - Glass morphism utility classes
   - Custom animation keyframes for liquid blob morphing
   - Smooth easing curves

4. middleware.ts that:
   - Blocks unauthenticated users from /dashboard/*
   - Redirects by role after login:
     admin → /admin
     counselor → /counselor  
     student → /student
   - Prevents cross-role access (student can't see /admin)

5. .env.local.example with all required variables

6. Supabase client files:
   /src/lib/supabase/client.ts  (browser)
   /src/lib/supabase/server.ts  (RSC)

All code must be production-ready. No TODO comments. Immediately runnable.
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROMPT 2 — DATABASE SCHEMA
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Design the complete PostgreSQL schema for Supabase.
Output a single .sql file I can paste into the Supabase SQL Editor.

BUSINESS CONTEXT:
- Consultancy applies to jobs FOR students
- Counselors add application data
- Students view their applications
- Admin sees everything

TABLE: profiles
───────────────
- id UUID (references auth.users)
- role ENUM ('admin', 'counselor', 'student')
- full_name TEXT NOT NULL
- email TEXT UNIQUE NOT NULL
- phone TEXT
- avatar_url TEXT
- is_active BOOLEAN DEFAULT true
- created_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ DEFAULT now()

TABLE: students
───────────────
- id UUID PRIMARY KEY
- profile_id → profiles.id (UNIQUE)
- university TEXT
- major TEXT
- graduation_date DATE
- visa_status TEXT
- assigned_counselor_id → profiles.id
- status ENUM ('active', 'paused', 'completed') DEFAULT 'active'
- created_at, updated_at

TABLE: applications  ← THIS IS THE CORE TABLE
─────────────────────
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- student_id → students.id NOT NULL
- company_name TEXT NOT NULL
- job_role TEXT NOT NULL
- job_description TEXT          ← the JD
- job_link TEXT                 ← URL to job posting
- resume_used TEXT              ← filename of resume used
- status ENUM ('applied', 'in_progress', 'interview', 'rejected', 'offered')
  DEFAULT 'applied'
- applied_by → profiles.id     ← which counselor applied
- applied_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ DEFAULT now()
- notes TEXT                    ← internal counselor notes

TABLE: activity_log
───────────────────
- id UUID PRIMARY KEY
- application_id → applications.id
- action TEXT NOT NULL          ← "Status changed to Interview"
- performed_by → profiles.id
- is_visible_to_student BOOLEAN DEFAULT true
- created_at TIMESTAMPTZ DEFAULT now()

TABLE: documents
────────────────
- id UUID PRIMARY KEY
- student_id → students.id
- file_name TEXT
- file_url TEXT
- file_type TEXT ('resume', 'cover_letter', 'jd', 'other')
- uploaded_by → profiles.id
- created_at TIMESTAMPTZ DEFAULT now()

ROW LEVEL SECURITY (RLS) — CRITICAL:
─────────────────────────────────────
STUDENTS can only:
  SELECT on applications WHERE student_id = their student record
  SELECT on activity_log WHERE is_visible_to_student = true
    AND application belongs to them
  SELECT on documents WHERE student_id = their student record

COUNSELORS can:
  SELECT/INSERT/UPDATE applications WHERE student's assigned_counselor = them
  SELECT/INSERT activity_log for their students' applications
  SELECT/INSERT documents for their students

ADMINS can:
  ALL operations on ALL tables (bypass via service_role key)

ALSO INCLUDE:
- Trigger: auto-update updated_at on applications
- Trigger: on applications.status change → INSERT into activity_log
- Indexes on: applications(student_id, status), activity_log(application_id)
- Seed data: 1 admin, 2 counselors, 3 students, 8 sample applications

Output ONE complete .sql file. Use IF NOT EXISTS. Idempotent.
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROMPT 3 — AUTH & LOGIN PAGE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Build the complete authentication system.

FILE 1: /src/app/(auth)/login/page.tsx
──────────────────────────────────────
DESIGN: White liquid morphism
- Background: soft gradient (barely-blue white #f8faff → #f0f5ff)
- 3 floating blob shapes animating with CSS keyframes:
  • Each blob: radial-gradient, border-radius morphing, slow translate movement
  • Different timings (18s, 22s, 15s) for organic feel
  • Colors: soft blue 6% opacity, mint 5% opacity, violet 4% opacity
- Centered glass card:
  • backdrop-filter: blur(20px)
  • background: rgba(255,255,255, 0.5)
  • border: 1px solid rgba(255,255,255, 0.65)
  • border-radius: 18px
  • layered shadow: 0 4px 24px rgba(0,0,0,0.03)
- Logo/brand mark at top (gradient blue→green)
- Email input with floating label animation
- Password input with floating label animation
- Sign In button:
  • gradient: blue → green
  • hover: translateY(-2px) + enhanced shadow
  • loading: spinner + "Signing in..."
  • success: redirect to role-based dashboard
- Error state: red text + input shake animation
- ALL transitions: cubic-bezier(.4,0,.2,1)
- Entrance: card fades up from 24px below + scales from 0.97

FILE 2: /src/lib/hooks/useAuth.ts
─────────────────────────────────
Returns: user, role, profile, isLoading, signIn(), signOut()
- Reads role from profiles table after Supabase auth
- Redirects to correct dashboard after login

FILE 3: Auth middleware (update middleware.ts)
─────────────────────────────────────────────
- Protected routes: /admin/*, /counselor/*, /student/*
- Public routes: /login
- Session refresh on every request
- Role-based redirects

SECURITY:
- Server-validated auth state
- Auto-logout after 30 min idle
- httpOnly cookies for session
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROMPT 4 — DESIGN SYSTEM COMPONENTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Build a minimal, elegant design system for a white liquid morphism CRM.
These are SHARED components used across all 3 portals.

PHILOSOPHY:
- White space is luxury
- Glass cards everywhere
- Every interaction is animated (butter smooth)
- Color used sparingly — through status badges and accents
- Font: "Outfit" from Google Fonts (weights: 400, 500, 600, 700, 800)

BUILD THESE COMPONENTS (React + Tailwind + Framer Motion):

1. GlassCard.tsx
   Props: children, hoverable?, padding?, onClick?
   - backdrop-filter: blur(20px)
   - background: rgba(255,255,255,0.5)
   - border: 1px solid rgba(255,255,255,0.65)
   - border-radius: 18px
   - shadow: 0 4px 24px rgba(0,0,0,0.03)
   - If hoverable: translateY(-2px) + enhanced shadow on hover
   - Entrance animation: fade up 12px

2. StatusBadge.tsx
   Props: status ('applied'|'in_progress'|'interview'|'rejected'|'offered')
   Colors:
   - applied: blue #3b82f6
   - in_progress: amber #f59e0b
   - interview: green #10b981
   - rejected: red #ef4444
   - offered: violet #8b5cf6
   - Each: tinted background at 8% opacity + colored text

3. StatCard.tsx
   Props: icon (emoji), value (number), label (text)
   - Glass card with centered layout
   - Number animates counting up on mount (800ms)
   - Stagger-ready (accepts delay prop)

4. Avatar.tsx
   Props: initials, size?, color?
   - Rounded square with gradient tinted background
   - Initials centered, bold

5. BlobBackground.tsx
   - 3 absolutely positioned blobs
   - CSS keyframe animations for border-radius morphing + translate
   - Fixed position, behind all content
   - GPU accelerated (transform only)

6. Sidebar.tsx
   Props: role, currentPath
   - Role-specific nav items:
     Student: Dashboard, My Applications
     Counselor: Dashboard, Add Application, My Students
     Admin: Dashboard, All Users, All Applications, Analytics
   - Active item: gradient background + glow
   - Hover: item shifts right 3px
   - Collapse on mobile (hamburger)

7. TopBar.tsx
   Props: title, user, onLogout
   - Sticky, blur background
   - Brand mark left, user + logout right
   - Border bottom with subtle white border

8. DataTable.tsx
   Props: columns, data, onRowClick?
   - Glass card wrapper
   - Header row with uppercase labels
   - Hover rows with subtle blue tint
   - Animated row entrance (staggered)

9. Modal.tsx
   Props: isOpen, onClose, title, children
   - Blurred backdrop overlay
   - Glass card centered
   - Scale up from 0.96 + fade in
   - Close on Escape + backdrop click

10. Toast.tsx
    - Appears top-right
    - Glass card with message
    - Auto-dismiss after 3s
    - Slide in + fade out

globals.css must include all @keyframes:
  blobA, blobB, blobC (morphing blobs)
  fadeUp (entrance)
  float (gentle hover)
  spin (loading spinner)
  shake (error feedback)

Every component: TypeScript strict, proper props, forwarded refs.
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROMPT 5 — STUDENT DASHBOARD
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Build the STUDENT DASHBOARD. This is the transparency screen.
The student sees EVERYTHING the consultancy team is doing for them.

PAGE: /src/app/(dashboard)/student/page.tsx

THE STUDENT CAN:
✅ See total applications count
✅ See breakdown: Applied / In Progress / Interview / Rejected / Offered
✅ See every application with: Company, Role, JD, Resume, Status, Time
✅ Filter by status
✅ Click to expand and see full job description + resume used
✅ See WHO applied (which counselor) and WHEN

THE STUDENT CANNOT:
❌ Add or edit anything
❌ See internal counselor notes
❌ See other students' data

LAYOUT:
───────
1. GREETING: "Hi {firstName} 👋" + subtitle

2. STAT CARDS (4 glass cards in a row):
   📨 Applied (count)
   ⚙️ In Progress (count)
   🎯 Interview (count)  
   📊 Total (count)
   - Numbers animate counting up on mount
   - Staggered entrance (each delayed 70ms)

3. FILTER TABS: All | Applied | In Progress | Interview | Rejected | Offered
   - Active tab: gradient background with glow
   - Click: smooth filter transition

4. APPLICATION CARDS (list, one per application):
   Each card shows:
   ┌──────────────────────────────────────────────┐
   │ [G] Google          ┌──────────┐            │
   │     SWE Intern      │ INTERVIEW │            │
   │                     └──────────┘            │
   │ Applied by Priya S. • Mar 28, 2026 9:15 AM  │
   └──────────────────────────────────────────────┘
   
   Click to EXPAND and show:
   - Full Job Description text
   - Resume filename used (📄 sarah_resume_v3.pdf)
   - Last updated timestamp
   - Link to original job posting (opens in new tab)

   Animation: cards slide up with stagger on mount
   Expand: smooth max-height transition

5. REAL-TIME (Supabase Realtime):
   - When counselor adds application → it appears instantly
   - When status changes → badge updates live
   - No page refresh needed

DATA FETCHING:
- React Server Component for initial load
- Supabase Realtime subscription for live updates
- RLS ensures student sees ONLY their own data

DESIGN:
- White liquid morphism (use design system components)
- BlobBackground behind everything
- Glass cards for every section
- All transitions: cubic-bezier(.4,0,.2,1)
- Responsive: works on mobile (360px) to desktop
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROMPT 6 — COUNSELOR DASHBOARD
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Build the COUNSELOR DASHBOARD. This is where applications get added.

PAGE: /src/app/(dashboard)/counselor/page.tsx

THE COUNSELOR CAN:
✅ See stats for their assigned students
✅ Add new applications (company, role, JD, resume, link)
✅ Update application status (click status badge → dropdown)
✅ See all applications they've submitted in a table
✅ Filter/search applications

THE COUNSELOR CANNOT:
❌ See students assigned to other counselors
❌ Access admin functions
❌ Delete applications (only admin can)

LAYOUT:
───────
1. HEADER with "+ Add Application" button (gradient, prominent)

2. STAT CARDS (5 in a row):
   👥 My Students | 📨 Applied | ⚙️ In Progress | 🎯 Interview | 📊 Total

3. APPLICATION TABLE (DataTable component):
   Columns: Student | Company/Role | Resume | Status | Date
   - Student: avatar + name
   - Company/Role: company bold, role below in gray
   - Resume: filename with 📄 icon
   - Status: clickable badge → opens dropdown to change status
   - Date: applied date
   
   Status Change Flow:
   - Click badge → dropdown appears below with all status options
   - Select new status → updates database + shows success toast
   - Automatically: 
     • Updates updated_at timestamp
     • Creates activity_log entry
     • Triggers real-time update to student's dashboard
     • Student sees status change INSTANTLY

4. "ADD APPLICATION" MODAL (opens on button click):
   Fields:
   - Student * (dropdown of assigned students)
   - Company * (text input)
   - Role * (text input)
   - Job Link (URL input)
   - Resume File (text input for filename, or file upload)
   - Job Description (textarea)
   
   Submit → Creates application record + activity_log entry
   Success → toast notification + modal closes + table updates
   
   Validation: Student, Company, Role are required

DESIGN:
- Same white liquid morphism as student dashboard
- Glass card table wrapper
- Hover rows with subtle blue tint
- Modal: glass card centered over blurred backdrop
- All form inputs: clean borders, focus glow animation
- Toast: slides in top-right on success/error
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROMPT 7 — ADMIN DASHBOARD
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Build the ADMIN DASHBOARD. Admin has COMPLETE access to everything.

PAGE: /src/app/(dashboard)/admin/page.tsx

THE ADMIN CAN:
✅ See all students across all counselors
✅ See all applications across entire system
✅ See counselor performance (how many apps each counselor submitted)
✅ Click any student → see their full application history
✅ Create/edit/deactivate any user (admin, counselor, student)
✅ Change any application status
✅ View pipeline overview (visual breakdown by status)
✅ Access everything counselors and students can see

LAYOUT:
───────
1. GREETING: "Admin Overview 👑" + summary subtitle

2. STAT CARDS (4 in a row):
   🎓 Total Students | 📋 Counselors | 📊 Total Applications | 🔥 Recent (48hrs)

3. PIPELINE OVERVIEW (visual bar):
   Shows all application statuses as proportional colored segments
   Each segment: count number + status label
   Animated width transition on mount

4. TEAM PERFORMANCE (2-column grid of counselor cards):
   Each counselor card:
   - Avatar + name + email
   - 3 mini stats: Students count | Applications count | Interviews count
   - All in a glass card

5. ALL STUDENTS LIST (glass card table):
   Each row: Avatar + Name | Assigned Counselor | Status badges (counts)
   Click any student → DRILL DOWN view showing:
   - Student profile header (name, email, app count)
   - 4 stat cards (by status)
   - Full list of their applications with details
   - Back button to return to main admin view

6. USER MANAGEMENT (separate tab or section):
   - Create new user (admin/counselor/student)
   - Assign/reassign counselors to students
   - Deactivate accounts
   - All changes logged

ADMIN POWER:
- Uses Supabase service_role key for operations
- Bypasses all RLS policies
- Every action creates audit log entry

DESIGN:
- Same white liquid morphism
- More dense layout than student view (more data)
- Drill-down transitions: smooth page animation
- Color-coded everywhere: blue for data, green for success, red for alerts
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROMPT 8 — REAL-TIME NOTIFICATIONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Build the real-time notification system. This makes the CRM feel ALIVE.

WHAT TRIGGERS NOTIFICATIONS:
1. Counselor adds application → Student gets notified
2. Status changes → Student gets notified instantly
3. Document uploaded → Student gets notified
4. New student assigned → Counselor gets notified
5. Offer received → Everyone gets notified (celebration!)

COMPONENTS:

1. /src/lib/hooks/useRealtime.ts
   - Generic Supabase Realtime subscription hook
   - Subscribe to table changes filtered by user
   - Auto-cleanup on unmount
   - Reconnect on disconnection

2. /src/lib/hooks/useNotifications.ts
   - Subscribes to notifications table for current user
   - Returns: notifications[], unreadCount, markAsRead()
   - Triggers toast on new notification

3. NotificationBell component (in TopBar):
   - Bell icon with red badge showing unread count
   - Badge bounces when new notification arrives
   - Click: dropdown with recent notifications
   - Each notification: icon + message + time ago
   - "Mark all read" button

4. Toast system:
   - New notification → toast slides in top-right
   - Auto-dismiss after 4 seconds
   - Max 3 stacked toasts
   - Click toast → navigate to relevant page

5. Student dashboard live updates:
   - Application cards update in real-time
   - New applications appear with slide-down animation
   - Status badges update instantly when counselor changes them
   - No page refresh ever needed

DATABASE:
- notifications table with: user_id, title, message, type, is_read, created_at
- Supabase Realtime enabled on: applications, notifications
- Database trigger: on application INSERT/UPDATE → create notification
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROMPT 9 — FILE UPLOAD & DOCUMENTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Build the document management system for resumes, JDs, and cover letters.

FEATURES:
1. Counselor uploads resume for student:
   - Drag-and-drop zone with animated dashed border
   - Accept: PDF, DOC, DOCX (max 10MB)
   - Upload to Supabase Storage: documents/{student_id}/resumes/{filename}
   - Progress bar animation during upload
   - Success: green checkmark + toast

2. Resume selection when adding application:
   - Dropdown shows all uploaded resumes for selected student
   - Or text field to type resume filename

3. Student can view/download their documents:
   - Document list with glass cards
   - File type icon + name + upload date + uploaded by
   - Download button generates signed URL (1-hour expiry)

4. Storage structure:
   documents/
     {student_id}/
       resumes/
       cover_letters/
       other/

5. Security:
   - Private bucket (no public access)
   - Signed URLs for downloads
   - RLS: students see only their files
   - Counselors see only assigned students' files
   - Admin sees all

Supabase Storage bucket: 'documents' (private, 10MB max)
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROMPT 10 — CONNECT ALL FEATURES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
You are a principal engineer connecting 9 independently built modules
into ONE working CRM application.

All modules use: Next.js 14 + TypeScript + Supabase + Tailwind + Framer Motion

YOUR TASK: Wire everything together.

STEP 1: LAYOUT ARCHITECTURE
────────────────────────────
/src/app/layout.tsx
- Load Outfit font from Google Fonts
- Wrap in SupabaseProvider + NotificationProvider
- Global CSS with all animation keyframes
- Toaster container

/src/app/(auth)/layout.tsx
- Centered layout, BlobBackground, no sidebar

/src/app/(dashboard)/layout.tsx
- BlobBackground (subtle, behind everything)
- Sidebar (role-based navigation)
- TopBar (brand, notifications, user, logout)
- Main content area (scrollable)
- Realtime subscriptions initialized here

STEP 2: NAVIGATION MAP
───────────────────────
STUDENT:
  📊 Dashboard     → /student       (stats + application cards)
  📁 Documents     → /student/documents

COUNSELOR:
  📊 Dashboard     → /counselor     (stats + table + add form)
  👥 My Students   → /counselor/students

ADMIN:
  📊 Dashboard     → /admin         (overview + pipeline + team)
  👥 Users         → /admin/users   (CRUD all users)
  📊 Analytics     → /admin/analytics

STEP 3: API LAYER
─────────────────
/src/lib/api/applications.ts
- getApplications(filters) → RLS handles permissions
- createApplication(data) → counselor adds job
- updateStatus(id, status) → triggers notification to student
- getApplicationsByStudent(studentId)

/src/lib/api/students.ts
- getStudents(counselorId?) → filtered by role
- getStudentById(id)
- createStudent(data) → admin only

/src/lib/api/documents.ts
- uploadDocument(file, metadata)
- getDocuments(studentId)
- getSignedUrl(path)

/src/lib/api/notifications.ts
- getNotifications(userId)
- markAsRead(id)
- createNotification(data)

STEP 4: STATE MANAGEMENT (Zustand)
──────────────────────────────────
authStore: user, role, profile, signIn(), signOut()
uiStore: sidebarOpen, toasts[], addToast()
appStore: applications[], filters, addApplication(), updateStatus()

STEP 5: REALTIME WIRING
────────────────────────
In dashboard layout, start subscriptions:

Student subscribes to:
- applications WHERE student_id = me → update cards live
- notifications WHERE user_id = me → show toasts

Counselor subscribes to:
- applications WHERE student.counselor = me → update table
- notifications WHERE user_id = me

Admin subscribes to:
- all applications → live feed
- all notifications → system monitor

STEP 6: ERROR & LOADING STATES
───────────────────────────────
- Every page: loading.tsx with skeleton matching layout
- Error boundary: glass card with retry button
- Network offline: top banner
- Session expired: redirect to /login with toast

STEP 7: RESPONSIVE
───────────────────
- Mobile (<640px): sidebar hidden, hamburger menu, stacked cards
- Tablet (640-1024px): sidebar collapsed (icons only)
- Desktop (>1024px): sidebar expanded

STEP 8: THE DATA FLOW
──────────────────────
This is the EXACT flow that creates transparency:

1. Counselor opens /counselor
2. Clicks "+ Add Application"
3. Fills form: Student=Sarah, Company=Google, Role=SWE,
   JD="Build microservices...", Resume=sarah_v3.pdf, Link=careers.google.com
4. Clicks Submit
5. INSTANTLY:
   a. Application saved to database (applied_by = counselor, applied_at = now)
   b. Activity log entry created ("Application submitted to Google")
   c. Notification created for Sarah
   d. Supabase Realtime broadcasts to Sarah's dashboard
   e. Sarah sees new card appear with slide-down animation
   f. Sarah's stat cards update (Applied count +1)
   g. Toast shows on Sarah's screen: "New application: Google — SWE Intern"

6. Later, counselor clicks Sarah's Google application status badge
7. Changes status from "Applied" → "Interview"
8. INSTANTLY:
   a. Status updated in database + updated_at refreshed
   b. Activity log: "Status changed from Applied to Interview"
   c. Notification to Sarah: "Your Google application is now in Interview stage"
   d. Sarah's badge updates live, stat cards recalculate
   e. Admin's pipeline bar chart updates

THAT is 100% transparency. Zero phone calls needed.

Generate ALL integration code. Every layout, provider, API function,
store, and realtime subscription. This is the glue.
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROMPT 11 — DEPLOY TO PRODUCTION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Deploy the ConsultPro CRM to production. Budget: under $25/month.

STEP 1: SUPABASE (free tier)
────────────────────────────
- Create project (US East region)
- Run the .sql migration from Prompt 2
- Enable RLS on ALL tables
- Enable Realtime on: applications, notifications
- Create Storage bucket: 'documents' (private, 10MB limit)
- Auth settings: email/password, 30min session, rate limit 5/15min

STEP 2: VERCEL (free tier)
──────────────────────────
- Connect GitHub repo
- Add environment variables:
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY (server only)
  NEXT_PUBLIC_APP_URL
- Deploy to yourapp.vercel.app
- Custom domain: app.yourconsultancy.com
  → Add domain in Vercel → Update DNS CNAME → SSL auto

STEP 3: MONITORING (all free)
─────────────────────────────
- Vercel Analytics (built-in)
- Sentry free tier (error tracking)
- UptimeRobot (uptime monitoring)

STEP 4: SECURITY CHECKLIST
───────────────────────────
□ RLS enabled + tested for every role
□ service_role key NEVER exposed to client
□ Input validation with Zod on all forms
□ File upload validation (type + size)
□ CSP headers in next.config.js
□ Rate limiting on auth endpoints

STEP 5: FIRST USERS
────────────────────
- Create admin account via Supabase Auth dashboard
- Admin creates counselor accounts from /admin/users
- Admin creates student accounts and assigns counselors
- Students receive welcome email with login link

COST BREAKDOWN:
Supabase Free:    $0  (500MB DB, 1GB storage, 50k users)
Vercel Free:      $0  (100GB bandwidth)
Domain:           $1  (Cloudflare registrar)
─────────────────────
TOTAL:            $1/month

AT SCALE (2000+ users):
Supabase Pro:     $25/month
Vercel Pro:       $20/month
─────────────────────
TOTAL:            $45/month
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# HOW TO USE THESE PROMPTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
WEEK 1: Foundation
  → Prompt 1 (setup) → Prompt 2 (database) → Prompt 3 (login)
  → Prompt 4 (design system)
  → TEST: Can you log in and see blank dashboards?

WEEK 2: Core Features
  → Prompt 5 (student dashboard)
  → Prompt 6 (counselor dashboard)
  → Prompt 7 (admin dashboard)
  → TEST: Can counselor add apps? Can student see them?

WEEK 3: Polish & Connect
  → Prompt 8 (notifications)
  → Prompt 9 (file uploads)
  → Prompt 10 (wire everything together)
  → TEST: Full flow — counselor adds app → student sees it instantly

WEEK 4: Ship
  → Prompt 11 (deploy)
  → Final testing with real users
  → Launch 🚀

RULES:
1. Run ONE prompt at a time
2. Test the output before moving to next prompt
3. If something breaks, paste the error and ask for fix
4. Database schema (Prompt 2) MUST work before anything else
5. Design system (Prompt 4) MUST exist before UI prompts
6. Assembly (Prompt 10) is where bugs surface — be patient
```

---

*11 focused prompts. One clear workflow. Ship in 4 weeks.*

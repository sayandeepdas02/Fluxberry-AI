# Fluxberry AI — Production Architecture Plan

**Author:** Principal Staff Engineer  
**Date:** 2026-05-14  
**Status:** Implementation Blueprint  
**Scope:** Transform from frontend-heavy prototype to production-grade multi-tenant SaaS

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Authentication Architecture](#2-authentication-architecture)
3. [Multi-Tenant RBAC Architecture](#3-multi-tenant-rbac-architecture)
4. [Database Schema Improvements](#4-database-schema-improvements)
5. [Backend API Refactor Plan](#5-backend-api-refactor-plan)
6. [Event Architecture](#6-event-architecture)
7. [Candidate Lifecycle Architecture](#7-candidate-lifecycle-architecture)
8. [Frontend Routing Strategy](#8-frontend-routing-strategy)
9. [State Management Strategy](#9-state-management-strategy)
10. [Error Handling Architecture](#10-error-handling-architecture)
11. [Queue Architecture](#11-queue-architecture)
12. [Email Infrastructure](#12-email-infrastructure)
13. [Observability Architecture](#13-observability-architecture)
14. [Implementation Roadmap](#14-implementation-roadmap)
15. [Technical Debt Elimination Checklist](#15-technical-debt-elimination-checklist)
16. [Production Readiness Checklist](#16-production-readiness-checklist)
17. [Critical Security Checklist](#17-critical-security-checklist)

---

## 1. Current State Assessment

### What Exists (Solid Foundation)

The backend is **far more complete** than the frontend suggests:

| Layer | Status | Detail |
|-------|--------|--------|
| Mongoose Models | 40+ models | Organization, User, Job, Candidate, Application, Assessment, Attempt, Interview, Offer, Onboarding, Workflow, CRM, Referral, Billing, Audit |
| API Routes | 32 modules, 190+ endpoints | Auth, Jobs, ATS, Assessments, AI Interview, Offers, Onboarding, CRM, Prospects, Analytics, Collaboration, Referrals, Billing |
| BullMQ Queues | 10 queues | Evaluation, Notification, AI-Interview, Resume-Parsing, Email, Analytics, Workflow, ATS-Screening, ATS-Rescoring, Offer-Expiry |
| RBAC | 9 roles | OWNER, SUPER_ADMIN, ADMIN, RECRUITER, HIRING_MANAGER, INTERVIEWER, COORDINATOR, FINANCE_ADMIN, VIEWER |
| Auth Guard | JWT + middleware | `authGuard`, `requireOrgAccess(role)`, `requireOrganization` |
| Service Integrations | 11 | S3, Resend, Judge0, Deepgram, ElevenLabs, LiveKit, OpenAI, Ribbon, Google Calendar, Stripe, Google OAuth |

### What's Broken

| Issue | Severity | Root Cause |
|-------|----------|------------|
| Auth disabled on frontend | **CRITICAL** | Manually replaced auth-context.tsx and protected-route.tsx with stubs during local dev setup |
| `/signup` and `/signin` show "Route not found" | **CRITICAL** | Frontend auth forms call backend `/api/auth/signup` which exists, but the forms may have validation issues or CORS problems. The "Route not found" error is client-side |
| `POST /onboarding/complete` returns 404 | **HIGH** | Route exists in app.ts (`/api/onboarding`) but the controller or route handler may not match the expected path |
| Dashboard sidebar shows 30+ nav items, ~15 are dead | **HIGH** | Nav config has items for pages that don't exist or have no implementation |
| No Next.js middleware for auth | **HIGH** | All routes publicly accessible even when auth is restored |
| Mongoose model duplication | **MEDIUM** | `TalentPool`, `SavedSearch`, `CandidateBookmark`, `FollowUpReminder` defined in both `index.ts` and `crm.models.ts` (patched with guard pattern, but root cause not fixed) |
| Import path errors in `ai/intelligence/` | **MEDIUM** | Had `../../../` instead of `../../` (patched) |
| Top-level await in CJS context | **MEDIUM** | `ai-intelligence.controller.ts` used top-level `await import()` (patched with lazy init) |
| `questions.ts` API uses raw fetch, not apiClient | **LOW** | No token injection, no error normalization |

### Architecture Gaps

```
                    WHAT SHOULD EXIST
                    ─────────────────
Landing ──→ Signup ──→ Onboard ──→ Dashboard ──→ Create Job ──→ Publish
                                       │                          │
                                       │                   Candidates Apply
                                       │                          │
                                       ├── ATS Pipeline ←─── Applications
                                       │        │
                                       │   AI Screening ──→ Shortlist
                                       │        │
                                       │   Send Assessment ──→ Candidate Takes Test
                                       │        │
                                       │   AI Interview ──→ Evaluation Report
                                       │        │
                                       │   Generate Offer ──→ Candidate Signs
                                       │        │
                                       │   Onboarding ──→ Hire Complete
                                       │
                                       ├── Analytics (aggregated view)
                                       └── Settings (org config)

                    WHAT ACTUALLY WORKS E2E
                    ──────────────────────
Landing ──→ Onboard (bypassed auth) ──→ Dashboard Home
                                            │
                                       Create Job ✅
                                       Manage Jobs ✅
                                       ATS Pipeline ✅ (Kanban)
                                       AI Interview ✅ (standalone)
                                       Inbox ✅ (activity feed)
                                       Settings ✅ (read-only)
                                       
                    DISCONNECTED BUT FUNCTIONAL
                    ───────────────────────────
                    /jobs, /jobs/[slug] (public apply) ✅ but NOT linked from dashboard
                    /offer/[token] (offer flow) ✅ but NOT triggerable from dashboard
                    /onboarding/[token] (candidate onboarding) ✅ but NOT triggerable from dashboard
                    /assessment/[id]/... (test flow) ✅ but NOT triggerable from dashboard
                    /[companySlug]/careers (branded page) ✅ but NOT linked from dashboard
```

---

## 2. Authentication Architecture

### Current State
- Backend has full JWT auth: signup, login, Google OAuth, refresh token rotation, logout
- Frontend auth was replaced with stubs for local dev testing
- No Next.js middleware for route protection

### Target Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     AUTH FLOW                                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Browser                    Backend                          │
│  ───────                    ───────                          │
│                                                              │
│  POST /auth/signup ──────→ Create User + Org ──→ JWT pair    │
│     {email, password,       Hash password                    │
│      firstName, lastName,   Create Organization              │
│      organizationName}      Create OrganizationMember        │
│                             Return { user, tokens }          │
│                                                              │
│  POST /auth/login ───────→ Verify credentials ──→ JWT pair   │
│     {email, password}       Check password hash              │
│                             Return { user, tokens }          │
│                                                              │
│  POST /auth/google ──────→ Verify Google token ──→ JWT pair  │
│     {credential}            Find or create user              │
│                             Return { user, tokens }          │
│                                                              │
│  GET /auth/me ───────────→ Validate JWT ──→ User object      │
│     Authorization: Bearer    Decode token                    │
│                              Populate organization           │
│                                                              │
│  POST /auth/refresh ─────→ Rotate refresh token              │
│     {refreshToken}          Validate refresh token           │
│                             Issue new access + refresh       │
│                                                              │
│  POST /auth/logout ──────→ Invalidate refresh token          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Implementation Steps

**Step 1: Restore real auth-context.tsx**
- Bring back the original AuthProvider with real API calls
- Keep the token refresh queue logic in client.ts (already implemented)
- Token storage: httpOnly cookie for refresh token, localStorage for access token

**Step 2: Restore real protected-route.tsx**
- Restore the original ProtectedRoute with `isAuthenticated` checks
- Restore `requireIncompleteOnboarding` and `requireCompletedOnboarding` logic

**Step 3: Add Next.js middleware.ts**
```typescript
// middleware.ts — at project root
const PUBLIC_ROUTES = [
  '/',
  '/signin',
  '/signup',
  '/pricing',
  '/jobs',
  '/jobs/(.*)',
  '/company/(.*)',
  '/(.*)/careers(.*)',
  '/offer/(.*)',
  '/onboarding/(.*)',
  '/assessment/(.*)',
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('fluxai_token')?.value;
  const isPublic = PUBLIC_ROUTES.some(p => 
    new RegExp(`^${p}$`).test(request.nextUrl.pathname)
  );
  
  if (!isPublic && !token) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }
}
```

**Step 4: Fix /signin and /signup forms**
- Debug the "Route not found" error — likely a client-side routing issue, not backend
- Test the actual `POST /api/auth/signup` and `POST /api/auth/login` endpoints
- Verify CORS headers allow the frontend origin

**Step 5: Post-auth routing logic**
```
Login success:
  → user.onboardingCompleted === false → /onboard/step-1
  → user.onboardingCompleted === true  → /dashboard

Signup success:
  → Always → /onboard/step-1

Onboarding complete:
  → POST /api/onboarding/complete → /dashboard
```

**Step 6: Session management**
- Access token: 15min TTL, stored in memory/localStorage
- Refresh token: 7d TTL, httpOnly cookie
- On 401 → attempt refresh → on refresh fail → logout + redirect /signin
- Support "logout from all devices" via refresh token invalidation in DB

---

## 3. Multi-Tenant RBAC Architecture

### Current State
Backend already has a solid RBAC system:

```
Organization
  └── OrganizationMember (role: OWNER | ADMIN | RECRUITER | HIRING_MANAGER | ...)
       └── User

auth.guard.js:
  authGuard         → validates JWT, attaches user to req
  requireOrgAccess  → checks user's org membership + role
  requireOrganization → ensures org context exists
```

### What's Missing: Frontend Role Enforcement

**The sidebar renders ALL items regardless of role.** Fix:

```typescript
// src/config/navigation.ts — add role requirements
interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  requiredRoles?: OrgRole[];  // NEW
  featureFlag?: string;       // NEW
  badge?: string;
}

// Example:
{ label: "Settings", href: "/dashboard/settings", icon: Settings, requiredRoles: ["OWNER", "ADMIN"] },
{ label: "Billing", href: "/dashboard/billing", icon: CreditCard, requiredRoles: ["OWNER", "FINANCE_ADMIN"] },
```

**Sidebar component filters:**
```typescript
// sidebar.tsx
const { user } = useAuth();
const userRole = user?.organization?.role;

const visibleItems = mainNavItems.filter(item => 
  !item.requiredRoles || item.requiredRoles.includes(userRole)
);
```

### Role Hierarchy

```
OWNER           → Full access, billing, delete org
SUPER_ADMIN     → Full access except billing
ADMIN           → Manage jobs, candidates, assessments, interviews, settings
RECRUITER       → Create/manage jobs, manage candidates, send assessments
HIRING_MANAGER  → View candidates, provide feedback, approve offers
INTERVIEWER     → Conduct interviews, submit scorecards
COORDINATOR     → Schedule interviews, manage logistics
FINANCE_ADMIN   → View billing, approve offers (compensation)
VIEWER          → Read-only access
```

### Invite Flow

```
Admin → Settings → Team → Invite Member
  → POST /api/organizations/:orgId/members/invite
  → Email sent with invite token
  → Invitee clicks link → /signup?invite=TOKEN
  → Signup creates user + links to org with specified role
```

---

## 4. Database Schema Improvements

### 4.1 Deduplicate Models

**Problem:** `TalentPool`, `SavedSearch`, `CandidateBookmark`, `FollowUpReminder` are defined in both `index.ts` and `crm.models.ts` with slightly different schemas.

**Fix:** 
1. Keep the `crm.models.ts` versions (newer, more detailed)
2. Remove the duplicates from `index.ts`
3. Re-export from `index.ts` via `export { TalentPool, ... } from './crm.models.js'`
4. Remove the `mongoose.models.X || mongoose.model()` guards (they mask the real problem)

### 4.2 Add Missing Indexes

```javascript
// High-cardinality queries that need compound indexes:
ApplicationSchema.index({ jobId: 1, status: 1, createdAt: -1 })  // pipeline view
CandidateSchema.index({ organizationId: 1, email: 1 }, { unique: true })  // dedup
AssessmentAttemptSchema.index({ assessmentId: 1, status: 1 })  // results listing
ActivityLogSchema.index({ organizationId: 1, entityType: 1, createdAt: -1 })  // inbox feed
```

### 4.3 Enforce Org Scoping

Every query that touches org-scoped data must include `organizationId` in the filter. Add a Mongoose plugin:

```javascript
function orgScopePlugin(schema) {
  schema.pre(['find', 'findOne', 'countDocuments', 'aggregate'], function() {
    if (!this.getFilter().organizationId && !this._skipOrgScope) {
      throw new Error('Query missing organizationId — potential cross-org leak');
    }
  });
}
```

### 4.4 Standardize Workflow State Enums

```typescript
// Candidate Lifecycle States (unified)
enum CandidateLifecycleState {
  APPLIED = 'APPLIED',
  SCREENING = 'SCREENING',
  SCREENED_PASS = 'SCREENED_PASS',
  SCREENED_FAIL = 'SCREENED_FAIL',
  ASSESSMENT_SENT = 'ASSESSMENT_SENT',
  ASSESSMENT_COMPLETED = 'ASSESSMENT_COMPLETED',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  INTERVIEW_COMPLETED = 'INTERVIEW_COMPLETED',
  OFFER_PENDING = 'OFFER_PENDING',
  OFFER_SENT = 'OFFER_SENT',
  OFFER_ACCEPTED = 'OFFER_ACCEPTED',
  OFFER_DECLINED = 'OFFER_DECLINED',
  ONBOARDING = 'ONBOARDING',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}
```

---

## 5. Backend API Refactor Plan

### 5.1 Fix Broken Routes

| Route | Issue | Fix |
|-------|-------|-----|
| `POST /api/auth/signup` | Works but frontend form shows "Route not found" | Debug frontend form — likely calling wrong path or getting CORS error displayed as route error |
| `POST /api/auth/login` | Same | Same |
| `POST /api/onboarding/complete` | 404 | Verify route registration in `app.ts` — the route file exists but may not export correctly |
| `GET /api/dashboard/summary` | May 500 with no data | Add graceful empty-state response when no jobs/candidates exist |

### 5.2 API Response Consistency

The response wrapper middleware already normalizes to `{ success, data, error }`. Verify every controller uses it:

```javascript
// Good (uses res.success):
res.success(data)
res.success(data, 201)

// Bad (bypasses wrapper):
res.json({ success: true, data })  // ← Find and replace these
res.status(200).json(result)       // ← These too
```

### 5.3 Request Validation Layer

Add Zod validation middleware to every route:

```typescript
// Common pattern:
router.post('/', authGuard, requireOrgAccess('RECRUITER'), 
  validate(createJobSchema),  // ← ADD THIS
  jobController.create
);

// Validation middleware:
function validate(schema: z.ZodSchema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: result.error.issues[0].message, details: result.error.issues }
      });
    }
    req.body = result.data;
    next();
  };
}
```

### 5.4 API Versioning Strategy

Don't version now — but prepare for it:
- Keep current routes under `/api/` (implicitly v1)
- When breaking changes needed: add `/api/v2/` prefix
- Deprecation headers on old endpoints

---

## 6. Event Architecture

### Current State
- BullMQ queues exist for async processing
- `ActivityLog` model captures events
- No centralized event bus — events are emitted ad-hoc in controllers

### Target: Centralized Domain Event System

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVENT BUS ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Controller Action ──→ EventBus.emit('candidate.applied', {     │
│                          organizationId,                        │
│                          candidateId,                           │
│                          jobId,                                 │
│                          applicationId,                         │
│                          source,                                │
│                          timestamp                              │
│                        })                                       │
│                                                                 │
│  EventBus                                                       │
│    ├── Sync Listeners (same process)                            │
│    │     ├── ActivityLog.create(event)                           │
│    │     ├── WebSocket.broadcast(event)                          │
│    │     └── WorkflowEngine.evaluate(event)                     │
│    │                                                            │
│    └── Async Listeners (BullMQ queues)                          │
│          ├── notification queue → Send email                    │
│          ├── ats-screening queue → Score candidate              │
│          ├── analytics queue → Update counters                  │
│          └── workflow queue → Execute automations               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Domain Events Catalog

```typescript
// Core lifecycle events
'candidate.created'
'candidate.applied'
'candidate.stage_moved'
'candidate.rejected'
'candidate.withdrawn'

// Screening events
'screening.started'
'screening.completed'
'screening.override'

// Assessment events
'assessment.invited'
'assessment.started'
'assessment.round_completed'
'assessment.completed'
'assessment.expired'

// Interview events
'interview.scheduled'
'interview.started'
'interview.completed'
'interview.scored'

// Offer events
'offer.created'
'offer.sent'
'offer.viewed'
'offer.accepted'
'offer.declined'
'offer.expired'

// Onboarding events
'onboarding.started'
'onboarding.document_uploaded'
'onboarding.document_approved'
'onboarding.document_rejected'
'onboarding.completed'

// System events
'job.created'
'job.published'
'job.closed'
'workflow.triggered'
'workflow.completed'
```

### Implementation

```typescript
// src/common/events/event-bus.ts
import { EventEmitter } from 'events';

class DomainEventBus extends EventEmitter {
  async emit(event: string, payload: DomainEvent): Promise<boolean> {
    // 1. Persist to ActivityLog (sync)
    await ActivityLog.create({
      organizationId: payload.organizationId,
      entityType: event.split('.')[0],
      action: event.split('.')[1],
      entityId: payload.entityId,
      actorId: payload.actorId,
      actorType: payload.actorType || 'user',
      metadata: payload,
      createdAt: new Date(),
    });

    // 2. Emit to sync listeners
    super.emit(event, payload);

    // 3. Enqueue async work
    if (this.asyncHandlers.has(event)) {
      for (const handler of this.asyncHandlers.get(event)) {
        await handler.queue.add(handler.jobType, payload, handler.options);
      }
    }

    return true;
  }
}

export const eventBus = new DomainEventBus();
```

---

## 7. Candidate Lifecycle Architecture

### Unified Candidate Timeline

Every candidate gets a **single timeline** aggregating all interactions:

```
┌──────────────────────────────────────────────────────────────┐
│ CANDIDATE TIMELINE (single source of truth)                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  2024-01-15 09:00  Applied via /jobs/senior-backend          │
│  2024-01-15 09:01  Resume parsed (85% match score)           │
│  2024-01-15 09:02  ATS Screening: SHORTLISTED (score: 82)    │
│  2024-01-15 10:30  Moved to SCREENING stage by John          │
│  2024-01-16 14:00  Assessment sent (3 rounds: MCQ+DSA+AI)    │
│  2024-01-17 11:00  Assessment started                        │
│  2024-01-17 12:30  MCQ round completed (8/10)                │
│  2024-01-17 13:00  DSA round completed (3/4 test cases)      │
│  2024-01-17 14:00  AI Interview completed (score: 78)        │
│  2024-01-17 14:01  Assessment completed (overall: 82%)       │
│  2024-01-18 09:00  Moved to INTERVIEW stage by Sarah         │
│  2024-01-19 15:00  Live interview with CTO (scorecard: 4.2)  │
│  2024-01-20 10:00  Hiring committee: HIRE (3/3 unanimous)    │
│  2024-01-20 14:00  Offer generated from template             │
│  2024-01-20 14:30  Offer sent to candidate                   │
│  2024-01-21 09:00  Offer viewed by candidate                 │
│  2024-01-22 11:00  Offer accepted + signed                   │
│  2024-01-22 11:01  Onboarding initiated                      │
│  2024-01-25 09:00  ID document uploaded                      │
│  2024-01-25 10:00  ID document approved                      │
│  2024-01-30 09:00  Onboarding completed → HIRED              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Implementation: Candidate Detail Page

The dashboard needs a **candidate drawer/page** that shows:

1. **Header**: Name, email, current stage, match score
2. **Timeline tab**: Unified chronological events (from ActivityLog)
3. **Resume tab**: Parsed resume + original file
4. **Assessments tab**: All attempts with scores
5. **Interviews tab**: Scheduled + completed with scorecards
6. **Notes tab**: Recruiter notes
7. **Actions**: Move stage, Send assessment, Schedule interview, Generate offer

```
GET /api/candidates/:candidateId/timeline?page=1&limit=50
→ Returns unified timeline from ActivityLog filtered by candidateId
```

---

## 8. Frontend Routing Strategy

### Route Categories

```
PUBLIC (no auth required)
├── /                           Landing page
├── /pricing                    Pricing page
├── /signin                     Login form
├── /signup                     Registration form
├── /jobs                       Public job listing
├── /jobs/[slug]                Job detail + apply
├── /company/[slug]             Company profile
├── /[companySlug]/careers      Branded career page
├── /[companySlug]/careers/[id] Branded job apply
├── /offer/[token]              Offer letter (token-based)
├── /onboarding/[token]         Candidate onboarding (token-based)
└── /assessment/[id]/*          Assessment flow (token-based)

ONBOARDING (auth required, onboarding NOT complete)
├── /onboard/step-1             Profile
├── /onboard/step-2             Hiring stack
└── /onboard/step-3             Workspace

DASHBOARD (auth required, onboarding complete)
├── /dashboard                  Home
├── /dashboard/inbox            Activity feed
├── /dashboard/candidates       Candidate table + drawer
├── /dashboard/jobs/create      Create job wizard
├── /dashboard/jobs/manage      Job listing
├── /dashboard/ats/pipeline     Kanban board
├── /dashboard/interviews/ai    AI interview
├── /dashboard/settings         Org settings
└── /dashboard/settings/team    Team management
```

### Hide Unimplemented Nav Items

**Immediately remove from navigation config:**
- `/dashboard/crm` (use `/dashboard/candidates` instead)
- `/dashboard/analytics` (stub — add back when implemented)
- `/dashboard/referrals` (stub)
- `/dashboard/jobs/insights` (stub)
- `/dashboard/jobs/distribution` (stub)
- `/dashboard/ats/candidates` (duplicate of `/dashboard/candidates`)
- `/dashboard/ats/automations` (stub)
- `/dashboard/ats/scorecards` (stub)
- `/dashboard/talent-prospect/*` (5 items — all stubs)
- `/dashboard/interviews/assessments` (stub)
- `/dashboard/interviews/live` (stub)
- `/dashboard/interviews/question-bank` (stub)
- `/dashboard/interviews/reports` (stub)
- `/dashboard/onboarding/*` (4 items — all stubs)
- `/dashboard/marketplace` (stub)
- `/dashboard/career-page` (stub)

**Reduced navigation (Phase 1):**

```
HOME
├── Home
├── Inbox
└── Candidates

HIRING
├── Manage Jobs
├── Create Job
└── Pipeline (ATS Kanban)

INTERVIEWS
└── AI Interviews

SETTINGS
└── Settings
```

**This reduces 30+ items to 8 functional items.** Add items back as they're implemented.

---

## 9. State Management Strategy

### Current
- Auth: React Context (disabled)
- Onboarding draft: sessionStorage
- Sidebar: Zustand store
- Server data: React Query (TanStack)
- Kanban: Zustand store
- Dashboard onboarding: localStorage

### Target

```
┌─────────────────────────────────────────────┐
│           STATE MANAGEMENT LAYERS            │
├─────────────────────────────────────────────┤
│                                             │
│  Server State (React Query)                 │
│    ├── Queries: jobs, candidates, pipeline  │
│    ├── Mutations: create, update, delete    │
│    ├── Cache invalidation on mutations      │
│    └── Stale time: 30s for lists, 5m for    │
│        static data                          │
│                                             │
│  Auth State (React Context)                 │
│    ├── user, isAuthenticated, isLoading     │
│    ├── Token refresh logic                  │
│    └── Org context (role, permissions)      │
│                                             │
│  UI State (Zustand)                         │
│    ├── Sidebar collapse/expand              │
│    ├── Modal/drawer open states             │
│    └── Kanban drag state                    │
│                                             │
│  Form State (React Hook Form + local)       │
│    ├── Job creation wizard                  │
│    ├── Onboarding steps                     │
│    └── Application forms                    │
│                                             │
│  URL State (Next.js router)                 │
│    ├── Current page/tab                     │
│    ├── Filter params (?status=PUBLISHED)    │
│    └── Selected entity (?job=123)           │
│                                             │
└─────────────────────────────────────────────┘
```

### Key Principle
**No local state for server data.** Everything that comes from the API goes through React Query. This gives us:
- Automatic cache invalidation
- Optimistic updates
- Background refetching
- Deduplication of concurrent requests

---

## 10. Error Handling Architecture

### Backend

```
┌─────────────────────────────────────────────────────┐
│              ERROR HANDLING PIPELINE                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Route Handler                                      │
│    └── throws AppError.badRequest('...')             │
│                                                     │
│  Error Handler Middleware (global)                   │
│    ├── AppError → structured response               │
│    │   { success: false,                            │
│    │     error: { code, message, details } }        │
│    │                                                │
│    ├── ValidationError (Mongoose) → 400             │
│    │   { code: 'VALIDATION_ERROR', ... }            │
│    │                                                │
│    ├── CastError (bad ObjectId) → 400               │
│    │   { code: 'INVALID_ID', ... }                  │
│    │                                                │
│    ├── 11000 (duplicate key) → 409                  │
│    │   { code: 'CONFLICT', ... }                    │
│    │                                                │
│    └── Unknown → 500                                │
│        { code: 'INTERNAL_ERROR',                    │
│          message: 'An error occurred' }             │
│        + log full stack trace                        │
│        + NEVER expose stack to client                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Frontend

```typescript
// Centralized error handling in apiClient (already exists)
// Add: toast notifications for common errors

function handleApiError(error: ApiError) {
  switch (error.code) {
    case 'UNAUTHORIZED':
    case 'TOKEN_EXPIRED':
      // Handled by refresh logic
      break;
    case 'FORBIDDEN':
      toast.error('You don\'t have permission for this action');
      break;
    case 'NOT_FOUND':
      toast.error('Resource not found');
      break;
    case 'VALIDATION_ERROR':
      // Show field-level errors in form
      break;
    case 'CONFLICT':
      toast.error('This already exists');
      break;
    case 'RATE_LIMITED':
      toast.error('Too many requests. Please wait.');
      break;
    default:
      toast.error('Something went wrong. Please try again.');
  }
}
```

### Error Boundaries

```
App Layout
  └── ErrorBoundary (catches render errors, shows full-page fallback)
       └── Dashboard Layout
            └── ErrorBoundary (per-section, shows inline error with retry)
                 └── Page Content
```

---

## 11. Queue Architecture

### Current (Solid)

```
┌──────────────────────────────────────────────────────┐
│                BULLMQ QUEUE TOPOLOGY                  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Redis (localhost:6379)                               │
│    │                                                 │
│    ├── evaluation (concurrency: 5)                   │
│    │   Jobs: EVALUATE_MCQ, EVALUATE_DSA, EVALUATE_AI │
│    │   Retry: 3 attempts, 1s exponential             │
│    │                                                 │
│    ├── notification (concurrency: 3)                 │
│    │   Jobs: SEND_INVITE_EMAIL, SEND_RESULT_EMAIL    │
│    │                                                 │
│    ├── ai-interview (concurrency: 3)                 │
│    │   Jobs: PROCESS_AI_RESPONSE, SYNTHESIZE         │
│    │                                                 │
│    ├── resume-parsing (concurrency: 3)               │
│    │   Jobs: PARSE_RESUME                            │
│    │                                                 │
│    ├── email (concurrency: 5)                        │
│    │   Jobs: SEND_EMAIL (via Resend)                 │
│    │                                                 │
│    ├── analytics-aggregation (concurrency: 1)        │
│    │   Jobs: AGGREGATE_ANALYTICS (daily snapshots)   │
│    │                                                 │
│    ├── workflow (concurrency: 5)                     │
│    │   Jobs: EXECUTE_WORKFLOW                        │
│    │                                                 │
│    ├── ats-screening (concurrency: 5)                │
│    │   Jobs: CANDIDATE_APPLIED                       │
│    │   Retry: 5 attempts, 2s exponential             │
│    │                                                 │
│    ├── ats-rescoring (concurrency: 2)                │
│    │   Jobs: RESCORE_JOB_CANDIDATES                  │
│    │                                                 │
│    └── offer-expiry (concurrency: 1)                 │
│        Cron: hourly expired offer check              │
│                                                      │
│  Cron Jobs:                                          │
│    ├── Daily: Email/audit log cleanup (midnight)     │
│    ├── Hourly: Offer expiry check                    │
│    └── Hourly: Offer/onboarding reminders            │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Improvements Needed

1. **Dead Letter Queue monitoring**: Add a `/api/admin/queues` endpoint to view failed jobs
2. **Queue dashboard**: Integrate Bull Board for queue monitoring in dev/staging
3. **Job deduplication**: Prevent duplicate ATS screening jobs for same candidate+job
4. **Priority queues**: AI interview processing should be higher priority than analytics aggregation

---

## 12. Email Infrastructure

### Current
- Resend integration via `email` BullMQ queue
- `EmailTemplate` model for org-level templates
- `EmailLog` model with delivery tracking
- Tracking pixel for open detection

### What's Missing

1. **Verification emails on signup** — Must verify email before allowing login
2. **Password reset flow** — No forgot password endpoint visible
3. **Assessment invite emails** — Template exists but flow isn't connected in dashboard UI
4. **Offer notification emails** — Triggered on offer send, needs template
5. **Onboarding invite emails** — Triggered after offer acceptance

### Email Template Strategy

```
SYSTEM EMAILS (not customizable):
  - email_verification
  - password_reset
  - invite_to_org

RECRUITER EMAILS (customizable templates):
  - assessment_invite
  - interview_scheduled
  - interview_reminder
  - offer_letter
  - onboarding_welcome
  - application_received (auto-reply)
  - rejection_notice

INTERNAL NOTIFICATIONS:
  - new_application
  - assessment_completed
  - interview_scorecard_submitted
  - offer_accepted
  - offer_declined
```

---

## 13. Observability Architecture

### Phase 1 (Immediate)

```typescript
// Structured logging with pino
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty' } 
    : undefined,
});

// Every request gets a correlation ID (already exists via request-id middleware)
// Enhance: add orgId, userId to all log lines

logger.info({
  requestId: req.requestId,
  orgId: req.user?.organizationId,
  userId: req.user?.id,
  method: req.method,
  path: req.path,
  statusCode: res.statusCode,
  duration: `${Date.now() - startTime}ms`,
}, 'Request completed');
```

### Phase 2 (Pre-Launch)

```
Monitoring Stack:
  ├── Sentry (error tracking, frontend + backend)
  ├── BullMQ Dashboard (queue monitoring)
  ├── MongoDB Atlas monitoring (query performance)
  └── Uptime monitoring (external health checks)

Health Check Endpoint:
  GET /api/health → { status: 'ok', mongo: 'connected', redis: 'connected', uptime: 12345 }
```

---

## 14. Implementation Roadmap

### Sprint 0: Stabilization (Week 1)
**Goal: Make the existing product work end-to-end without auth bypass**

```
Day 1-2: Auth Restoration
  [ ] Debug why /signin and /signup show "Route not found" in UI
  [ ] Restore real auth-context.tsx (revert from mock)
  [ ] Restore real protected-route.tsx (revert from passthrough)
  [ ] Test signup → onboard → dashboard flow with real API
  [ ] Fix POST /api/onboarding/complete if it truly 404s
  [ ] Add Next.js middleware.ts for auth redirects

Day 3: Navigation Cleanup  
  [ ] Remove 20+ dead nav items from navigation config
  [ ] Reduce sidebar to 8 functional items
  [ ] Add "Coming Soon" page component for future features
  [ ] Verify every remaining nav item links to a working page

Day 4: Model Deduplication
  [ ] Remove duplicate models from index.ts
  [ ] Re-export from crm.models.ts
  [ ] Remove mongoose.models guard pattern
  [ ] Run full backend test suite

Day 5: Integration Testing
  [ ] Test: Landing → Signup → Onboard → Dashboard
  [ ] Test: Create Job → Publish → Public listing appears
  [ ] Test: Candidate applies → Appears in ATS pipeline
  [ ] Test: AI Interview → Evaluation report
  [ ] Document all remaining broken flows
```

### Sprint 1: Core Flows (Week 2-3)
**Goal: Connect the recruiter workflow end-to-end**

```
Week 2:
  [ ] Dashboard Home: Fix dashboardApi.summary() to return real data
  [ ] Job Create: Verify 5-step wizard submits to API correctly
  [ ] Job Manage: Verify publish/close/archive actions work
  [ ] Pipeline: Verify Kanban drag-drop moves stages via API
  [ ] Candidates: Build candidate detail drawer with timeline

Week 3:
  [ ] Assessment: Add "Send Assessment" button in candidate drawer
  [ ] Assessment: Connect invitation email flow
  [ ] AI Interview: Link AI interview results to candidate timeline
  [ ] Offer: Add "Generate Offer" action in pipeline
  [ ] Offer: Connect offer send → candidate email → accept flow
```

### Sprint 2: Event System + Inbox (Week 4)
**Goal: Every action creates a timeline event, Inbox shows real activity**

```
  [ ] Implement EventBus class
  [ ] Wire events into controllers (candidate.applied, stage_moved, etc.)
  [ ] Fix Inbox to query ActivityLog with proper filters
  [ ] Add real-time updates via polling (30s, already exists)
  [ ] Build candidate timeline view from ActivityLog
```

### Sprint 3: Polish + Security (Week 5)
**Goal: Production-safe**

```
  [ ] Add Sentry (frontend + backend)
  [ ] Add health check endpoint
  [ ] Add rate limiting to all public endpoints
  [ ] Audit all API endpoints for org-scoping
  [ ] Add input validation (Zod) to top 10 most-used endpoints
  [ ] CORS hardening for production domains
  [ ] Helmet CSP headers
  [ ] Add BullMQ Dashboard for queue monitoring
```

### Sprint 4: Team & Settings (Week 6)
**Goal: Multi-user support**

```
  [ ] Team invite flow (Settings → Invite → Email → Signup)
  [ ] Role-based sidebar filtering
  [ ] Settings page: org name, logo, team members list
  [ ] Audit log viewer (admin only)
```

---

## 15. Technical Debt Elimination Checklist

```
CODE QUALITY:
  [ ] Remove duplicate Mongoose models (index.ts vs crm.models.ts)
  [ ] Fix ai/intelligence/ import paths permanently (not just patched)
  [ ] Fix top-level await in ai-intelligence.controller.ts permanently
  [ ] Migrate questions.ts API to use apiClient instead of raw fetch
  [ ] Remove unused imports across all patched files
  [ ] Add TypeScript strict mode to frontend (if not already)

ARCHITECTURE:
  [ ] Remove mock auth-context.tsx and restore real implementation
  [ ] Remove passthrough protected-route.tsx and restore real implementation
  [ ] Consolidate sidebar components (components/dashboard/sidebar/ and features/dashboard/components/sidebar.tsx)
  [ ] Remove dead pages that have no implementation
  [ ] Standardize API response format (all controllers use res.success())

CONSISTENCY:
  [ ] Ensure all API modules use apiClient (not raw fetch)
  [ ] Standardize error codes across all controllers
  [ ] Ensure all timestamps use ISO 8601
  [ ] Ensure all IDs use consistent format (MongoDB ObjectId string)
  [ ] Product name: "Fluxberry AI" everywhere (already fixed)

PERFORMANCE:
  [ ] Add database indexes for common queries
  [ ] Add React Query staleTime configuration per query type
  [ ] Lazy-load heavy dashboard components (charts, AI interview)
  [ ] Image optimization for logos and avatars
```

---

## 16. Production Readiness Checklist

```
INFRASTRUCTURE:
  [ ] MongoDB Atlas (managed, with backups)
  [ ] Redis Cloud or Upstash (managed, HA)
  [ ] S3 bucket with proper IAM policies
  [ ] CDN for static assets
  [ ] SSL/TLS certificates
  [ ] Domain configuration (app.fluxberry.ai, api.fluxberry.ai)

DEPLOYMENT:
  [ ] Dockerize backend (server + worker)
  [ ] Dockerize frontend (Next.js standalone)
  [ ] CI/CD pipeline (GitHub Actions)
  [ ] Staging environment
  [ ] Blue/green or rolling deploys
  [ ] Database migration strategy
  [ ] Rollback procedure documented

MONITORING:
  [ ] Sentry error tracking
  [ ] Health check endpoint (/api/health)
  [ ] Uptime monitoring (external)
  [ ] Queue monitoring (Bull Board or BullMQ Dashboard)
  [ ] Log aggregation (structured JSON logs)
  [ ] Alert rules (5xx rate, queue depth, response time)

DATA:
  [ ] Automated MongoDB backups (daily)
  [ ] Point-in-time recovery capability
  [ ] Data retention policies enforced
  [ ] GDPR data deletion flow (soft delete → hard delete after 30d)
  [ ] Seed data script for fresh deployments

TESTING:
  [ ] Auth flow integration tests
  [ ] API endpoint smoke tests (top 20 endpoints)
  [ ] Queue processor unit tests
  [ ] Frontend E2E tests (signup, create job, apply)
```

---

## 17. Critical Security Checklist

```
AUTHENTICATION:
  [ ] Passwords hashed with bcrypt (cost factor ≥ 12) ← already uses bcryptjs
  [ ] JWT tokens expire (15min access, 7d refresh)
  [ ] Refresh token rotation (one-time use)
  [ ] Rate limit login attempts (100/15min ← already exists)
  [ ] Rate limit signup (stricter: 10/15min)
  [ ] Session invalidation on password change
  [ ] Google OAuth: verify token issuer and audience

AUTHORIZATION:
  [ ] Every API route has authGuard
  [ ] Every org-scoped query includes organizationId
  [ ] No horizontal privilege escalation (user A accessing user B's data)
  [ ] No vertical privilege escalation (VIEWER performing ADMIN actions)
  [ ] File uploads restricted by type and size
  [ ] S3 pre-signed URLs expire (15min max)

INPUT VALIDATION:
  [ ] All user input validated before processing
  [ ] No raw query injection (Mongoose parameterizes, but verify aggregations)
  [ ] File upload: validate MIME type server-side, not just extension
  [ ] Sanitize HTML in rich text fields (job descriptions)
  [ ] Limit request body size (already via express.json limit)

HEADERS & TRANSPORT:
  [ ] Helmet.js configured ← already exists
  [ ] CORS restricted to known origins in production
  [ ] HTTPS enforced in production
  [ ] Secure, HttpOnly, SameSite cookies for refresh tokens
  [ ] X-Request-ID for tracing ← already exists
  [ ] No sensitive data in URL query parameters

SECRETS:
  [ ] All secrets in environment variables (not committed)
  [ ] .env files in .gitignore
  [ ] Rotate JWT_SECRET periodically
  [ ] Separate secrets for staging vs production
  [ ] API keys (OpenAI, Resend, etc.) have minimal required permissions

DATA PROTECTION:
  [ ] PII fields identified and documented
  [ ] Resume files encrypted at rest (S3 SSE)
  [ ] Database encrypted at rest (MongoDB Atlas default)
  [ ] Audit log for all data access/modification
  [ ] Data export capability for GDPR subject access requests
  [ ] Data deletion capability for GDPR right to erasure
```

---

## Summary: Priority Matrix

```
                        HIGH IMPACT
                            │
    ┌───────────────────────┼───────────────────────┐
    │                       │                       │
    │   SPRINT 0            │   SPRINT 1            │
    │   ─────────           │   ─────────           │
    │   Auth restoration    │   Recruiter workflow   │
    │   Nav cleanup         │   Candidate lifecycle  │
    │   Model dedup         │   Assessment connect   │
    │   Route protection    │   Offer flow           │
    │                       │                       │
LOW ├───────────────────────┼───────────────────────┤ HIGH
EFFORT                      │                       EFFORT
    │                       │                       │
    │   SPRINT 3            │   SPRINT 2 + 4        │
    │   ─────────           │   ─────────           │
    │   Sentry setup        │   Event bus            │
    │   Health checks       │   Team management      │
    │   Input validation    │   RBAC UI              │
    │   Security hardening  │   Email templates      │
    │                       │                       │
    └───────────────────────┼───────────────────────┘
                            │
                        LOW IMPACT
```

**Start with Sprint 0. Ship stability before features.**

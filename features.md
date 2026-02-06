# FluxAI — Feature Documentation

## 1. Product Overview

**FluxAI** is a technical hiring assessment platform built for engineering teams that need to evaluate candidates at scale with high signal quality and minimal operational overhead.

### Who It's For
- Technical hiring teams at startups and enterprises
- Engineering managers screening candidates remotely
- Recruiters managing high-volume technical pipelines

### Core Problems Solved
| Problem | FluxAI Solution |
|---------|-----------------|
| **Time-to-hire is too long** | Async assessments eliminate scheduling bottlenecks |
| **Signal quality is low** | Multi-round format (MCQ → DSA → AI Interview) provides depth |
| **Cheating is rampant** | Browser-based proctoring with tab-switch detection, face tracking |
| **Manual grading doesn't scale** | Automated MCQ grading, async evaluation pipeline ready |

---

## 2. Frontend Features (IMPLEMENTED)

### Landing & Marketing Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, value propositions, CTA |
| `/signin` | Recruiter login |
| `/signup` | Recruiter registration |
| `/contact` | Contact form |

---

### User Onboarding ✅ NEW

| Route | Description |
|-------|-------------|
| `/onboard/step-1` | Personal & company info |
| `/onboard/step-2` | Product selection (ATS/Hire) |
| `/onboard/step-3` | Workspace creation |

**User Flows:**
- **New user:** Signup → Onboarding (step-1 → step-2 → step-3) → Dashboard
- **Returning user:** Sign in → Dashboard (if onboarding complete) or Onboarding (if not)

**Route Protection:**
- Onboarding routes require auth + incomplete onboarding
- Dashboard routes require auth + completed onboarding
- Unauthenticated users → redirect to `/signin`

**UX Behaviors:**
- Multi-step wizard with progress indicator
- Workspace name updates organization
- Onboarding status persisted (`onboardingCompleted` flag)

---

### Recruiter Dashboard

| Route | Description |
|-------|-------------|
| `/dashboard` | Overview with key metrics |
| `/dashboard/assessments` | List all assessments |
| `/dashboard/assessments/new` | Create new assessment wizard |
| `/dashboard/assessments/[id]` | Assessment detail + candidate list |
| `/dashboard/analytics` | Assessment performance analytics (✅ Integrated) |
| `/dashboard/candidate-pool` | Browse all candidates (✅ Integrated) |
| `/dashboard/manage-jobs` | Job listing management (✅ Integrated) |

**UX Behaviors:**
- Sidebar navigation with **dynamic workspace name** from user's organization
- **Workspace dropdown** with: + Invite, Settings, Logout
- Logout redirects to landing page `/`
- Data tables with search, filter, sort
- Quick actions (edit, delete, duplicate)
- Status badges (Draft, Active, Completed)

---

### Candidate Assessment Experience

| Route | Description |
|-------|-------------|
| `/assessment/[id]/start` | Assessment landing / instructions |
| `/assessment/[id]/system-check` | Browser + camera verification |
| `/assessment/[id]/identity-check` | Candidate identity verification |
| `/assessment/[id]/round` | Active round (MCQ, DSA, or AI) |
| `/assessment/[id]/transition` | Between-round transition screen |
| `/assessment/[id]/completed` | Submission confirmation |

**Guardrails:**
- Cannot proceed without system check pass
- Cannot skip rounds
- Cannot re-enter completed rounds

---

### Proctoring & Integrity Signals

**Implemented Signals:**
- Tab switch detection
- Fullscreen exit detection
- Face detection (single face required)
- Multiple face detection
- Microphone muting detection

---

## 3. Backend Features

### Tech Stack
- **Runtime:** Node.js 20+ with TypeScript
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM ✅ **(Migrated from PostgreSQL/Prisma)**
- **Auth:** JWT-based authentication
- **Queue:** BullMQ + Redis

---

### Auth & Organizations ✅

| Feature | Status |
|---------|--------|
| JWT-based authentication | ✅ Done |
| Password hashing (bcrypt) | ✅ Done |
| User signup with org creation | ✅ Done |
| Role-based access (OWNER, ADMIN, RECRUITER) | ✅ Done |
| Organization membership | ✅ Done |
| **User onboarding tracking** | ✅ Done |

**Endpoints:**
- `POST /api/auth/signup` — Returns `onboardingCompleted: false`
- `POST /api/auth/login` — Returns user with onboarding status
- `GET /api/auth/me`
- `POST /api/onboarding/complete` — Marks onboarding done, updates org

---

### Assessments & Question Banks ✅

| Feature | Status |
|---------|--------|
| CRUD assessments | ✅ Done |
| Round configuration (MCQ, DSA, AI) | ✅ Done |
| Question bank (embedded MCQ/DSA details) | ✅ Done |

---

### Candidate Attempts & Proctoring ✅

| Feature | Status |
|---------|--------|
| Start/resume attempts | ✅ Done |
| Round state machine (FSM) | ✅ Done |
| Proctoring event ingestion | ✅ Done |

---

### Evaluation & Results ✅

| Feature | Status |
|---------|--------|
| MCQ auto-grading | ✅ Done |
| DSA placeholder scoring | ✅ Done |
| AI interview placeholder | ✅ Done |
| Assessment-level results | ✅ Done |

---

### File Uploads ✅

| Feature | Status |
|---------|--------|
| S3-compatible pre-signed URLs | ✅ Done |
| Resume attachment (≤5MB PDF) | ✅ Done |
| Video attachment (≤500MB) | ✅ Done |

---

### Background Jobs ✅

| Feature | Status |
|---------|--------|
| BullMQ + Redis infrastructure | ✅ Done |
| Evaluation job queue | ✅ Done |

---

### Candidates & CRM ✅

| Feature | Status |
|---------|--------|
| Create & Update Candidates | ✅ Done |
| List with Filtering (Source, Search) | ✅ Done |
| Candidate History (Attempts timeline) | ✅ Done |

---

### Jobs & ATS ✅

| Feature | Status |
|---------|--------|
| Create Jobs | ✅ Done |
| List with Pagination & Status Filter | ✅ Done |
| Advanced Search | ✅ Done |

---

### Analytics & Dashboard ✅

| Feature | Status |
|---------|--------|
| Aggregate KPIs (Reach, ROI, etc.) | ✅ Done |
| Trend Analysis (Time-series) | ✅ Done |
| Demographic breakdowns | ✅ Done |
| Dashboard Overview Summary | ✅ Done |

---

### Public Career Pages ✅

| Feature | Status |
|---------|--------|
| Public Company Profile (`/companies/:slug`) | ✅ Done |
| Public Job Listing (`/companies/:slug/jobs`) | ✅ Done |
| Job Detail View (`/jobs/:id`) | ✅ Done |
| Application Form | ✅ Done (UI only, submit pending) |

---

## 4. MVP Completion Status

| Domain | Status |
|--------|--------|
| **Auth & Organizations** | ✅ Done |
| **User Onboarding Flow** | ✅ Done |
| **Assessments CRUD** | ✅ Done |
| **Question Bank** | ✅ Done |
| **Candidate Attempts** | ✅ Done |
| **Proctoring Ingestion** | ✅ Done |
| **MCQ Auto-Grading** | ✅ Done |
| **Results APIs** | ✅ Done |
| **File Storage** | ✅ Done |
| **Background Jobs** | ✅ Done |
| **MongoDB Migration** | ✅ Done |
| DSA Code Execution | 🚧 Stubbed |
| AI Interview Scoring | 🚧 Stubbed |
| Email Delivery | 🚧 Stubbed |
| Payments / Billing | ⏳ Post-MVP |
| ATS Integrations | ⏳ Post-MVP |

---

## 5. Out of Scope (Intentionally Not Built)

| Feature | Reason |
|---------|--------|
| **Resume parsing** | Requires ML/NLP integration |
| **AI scoring intelligence** | Requires LLM integration |
| **Code execution sandbox** | Requires isolated runtime |
| **Payment processing** | Requires Stripe integration |
| **Email delivery** | Requires SendGrid/SES |

---

*Last updated: February 2026*

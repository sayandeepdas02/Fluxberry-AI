# Fluxberry AI — Feature Documentation

## 1. Product Overview

**Fluxberry AI** is a technical hiring assessment platform built for engineering teams that need to evaluate candidates at scale with high signal quality and minimal operational overhead.

### Who It's For
- Technical hiring teams at startups and enterprises
- Engineering managers screening candidates remotely
- Recruiters managing high-volume technical pipelines

### Core Problems Solved
| Problem | Fluxberry AI Solution |
|---------|-----------------------|
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

### User Onboarding ✅

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
| `/dashboard/workflows` | Automation rules builder (✅ **New**) |
| `/dashboard/interviews` | Interview scheduler & calendar (✅ **New**) |
| `/dashboard/audit-logs` | Security & activity logs (✅ **New**) |
| `/dashboard/settings/email-templates` | Email template editor (✅ **New**) |

**UX Behaviors:**
- Sidebar navigation with **dynamic workspace name**
- **Workspace dropdown** with: + Invite, Settings, Audit Logs, Logout
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
- **Database:** MongoDB with Mongoose ODM
- **Auth:** JWT-based authentication
- **Queue:** BullMQ + Redis
- **Email:** Resend

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

---

### Automation & Workflows ✅ **(New)**

| Feature | Status |
|---------|--------|
| **Workflow Engine** | ✅ Done (Event-driven architecture) |
| **Rules Engine** | ✅ Done (If Condition -> Then Action) |
| **Triggers** | ✅ Done (Application Submitted, Stage Changed) |
| **Actions** | ✅ Done (Move Stage, Send Email) |
| **Visual Builder** | ✅ Done (Frontend UI) |

---

### Email Engine ✅ **(New)**

| Feature | Status |
|---------|--------|
| **Template Management** | ✅ Done (CRUD + Variable Injection) |
| **Sending Provider** | ✅ Done (Resend Integration) |
| **Open Tracking** | ✅ Done (Pixel + Webhook) |
| **Logs** | ✅ Done (Sent/Failed/Opened status) |
| **Visual Editor** | ✅ Done (Frontend UI) |

---

### Interview Management ✅ **(New)**

| Feature | Status |
|---------|--------|
| **Scheduling** | ✅ Done (Conflict detection) |
| **Google Calendar** | ✅ Done (OAuth + Event Sync) |
| **Scorecards** | ✅ Done (Feedback forms) |
| **Calendar UI** | ✅ Done (Frontend) |

---

### Security & Compliance ✅ **(New)**

| Feature | Status |
|---------|--------|
| **Audit Logs** | ✅ Done (Full activity tracking) |
| **GDPR Deletion** | ✅ Done (Self-serve account deletion) |
| **Data Retention** | ✅ Done (Automated cleanup via Cron) |
| **Rate Limiting** | ✅ Done (API + Auth protection) |

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

### Background Jobs ✅

| Feature | Status |
|---------|--------|
| BullMQ + Redis infrastructure | ✅ Done |
| Evaluation job queue | ✅ Done |
| Email job queue | ✅ Done |
| Workflow job queue | ✅ Done |

---

## 4. MVP Completion Status

| Domain | Status | Notes |
|--------|--------|-------|
| **Auth & Organizations** | ✅ Done | Production ready |
| **User Onboarding Flow** | ✅ Done | Production ready |
| **Assessments & Questions** | ✅ Done | Production ready |
| **Candidate Experience** | ✅ Done | Production ready |
| **Proctoring** | ✅ Done | Signals captured, no auto-ban |
| **Workflows & Automation** | ✅ Done | Backend engine + UI |
| **Email System** | ✅ Done | Resend integration complete |
| **Interviews & Scheduling** | ✅ Done | Google Cal integration complete |
| **Audit & Security** | ✅ Done | GDPR + Logs complete |
| **DSA Code Execution** | ⚠️ Partial | Runner works, grading is simplified |
| **AI Interview** | 🚧 Shell | UI works, backend is stubbed (no real AI agent) |
| **Payments** | ⏳ Post-MVP | UI placeholders only |

---

## 5. Known Limitations (What is NOT Working)

### 1. AI Interview (Round 3)
- **Status:** 🚧 **Disconnected UI Shell**
- **Description:** The UI allows candidates to record video, but it **does not** connect to an actual AI provider (like OpenAI Realtime or Ribbon).
- **Impact:** No conversation happens, no transcript is generated.

### 2. DSA Grading
- **Status:** ⚠️ **Basic Execution**
- **Description:** Code executes runs against basic test cases (if Judge0 is active), but deep semantic analysis or complexity grading is not implemented.
- **Impact:** Pass/Fail is based on simple output matching only.

### 3. Payment Processing
- **Status:** 🛑 **Stubbed**
- **Description:** "Upgrade Plan" buttons exist but do not trigger any Stripe flow.
- **Impact:** All users are effectively on a "Free Tier".

---

*Last updated: February 2026*

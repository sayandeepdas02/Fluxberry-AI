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

**UX Behaviors:**
- Clean, conversion-focused landing
- Form validation with inline errors
- Responsive design (mobile + desktop)

---

### Recruiter Dashboard

| Route | Description |
|-------|-------------|
| `/dashboard` | Overview with key metrics |
| `/dashboard/assessments` | List all assessments |
| `/dashboard/assessments/new` | Create new assessment wizard |
| `/dashboard/assessments/[id]` | Assessment detail + candidate list |
| `/dashboard/analytics` | Assessment performance analytics |
| `/dashboard/candidate-pool` | Browse all candidates |
| `/dashboard/manage-jobs` | Job listing management |

**UX Behaviors:**
- Sidebar navigation with workspace switcher
- Data tables with search, filter, sort
- Quick actions (edit, delete, duplicate)
- Status badges (Draft, Active, Completed)

**Guardrails:**
- Assessment must have at least one enabled round
- Time limits required for each round
- Assessment deletion requires confirmation

---

### Assessment Creation & Configuration

| Route | Description |
|-------|-------------|
| `/dashboard/assessments/new` | Multi-step assessment builder |
| `/dashboard/assessments/[id]/edit` | Edit existing assessment |

**Configuration Options:**
- Assessment title and description
- Round configuration (MCQ, DSA, AI Interview)
- Per-round time limits
- Question pool selection
- Enable/disable proctoring

**UX Behaviors:**
- Step-by-step wizard with progress indicator
- Live preview of candidate experience
- Save as draft at any step
- Publish requires all validations passed

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

**UX Behaviors:**
- Fullscreen enforcement during rounds
- Countdown timer with warnings (15min, 5min, 1min)
- Auto-save answers every 30 seconds
- Graceful disconnection handling
- No back navigation during active rounds

**Guardrails:**
- Cannot proceed without system check pass
- Cannot skip rounds
- Cannot re-enter completed rounds

---

### Proctoring & Integrity Signals

**Implemented Signals:**
- Tab switch detection (logged with timestamp)
- Fullscreen exit detection
- Face detection (single face required)
- Multiple face detection
- Microphone muting detection

**UI Indicators:**
- Warning toasts for violations
- Violation counter visible to candidate
- Violations logged and displayed in recruiter dashboard

---

### Results & Analytics UI

| Route | Description |
|-------|-------------|
| `/dashboard/assessments/[id]/results` | Candidate results table |
| `/dashboard/assessments/[id]/results/[attemptId]` | Individual attempt detail |

**Displayed Data:**
- Per-round scores and status
- Time spent per round
- Proctoring violation summary
- MCQ answer breakdown (correct/incorrect)
- DSA code submission (read-only)
- AI interview transcript reference

---

## 3. Backend Features

### Auth & Organizations ✅

| Feature | Status |
|---------|--------|
| JWT-based authentication | ✅ Done |
| Password hashing (bcrypt) | ✅ Done |
| User signup with org creation | ✅ Done |
| Role-based access (OWNER, ADMIN, RECRUITER) | ✅ Done |
| Organization membership | ✅ Done |
| Token refresh | ⏳ Planned |

**Endpoints:**
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/organizations`
- `GET /api/organizations/:id`

---

### Assessments & Question Banks ✅

| Feature | Status |
|---------|--------|
| CRUD assessments | ✅ Done |
| Round configuration (MCQ, DSA, AI) | ✅ Done |
| Question bank management | ✅ Done |
| Question pool queries | ✅ Done |
| Assessment publishing lifecycle | ✅ Done |

**Endpoints:**
- `POST /api/assessments`
- `GET /api/assessments`
- `GET /api/assessments/:id`
- `PATCH /api/assessments/:id`
- `DELETE /api/assessments/:id`
- `POST /api/questions`
- `GET /api/questions`

---

### Candidate Attempts & Proctoring ✅

| Feature | Status |
|---------|--------|
| Start/resume attempts | ✅ Done |
| Round state machine (FSM) | ✅ Done |
| Server-side timestamps | ✅ Done |
| One active attempt per candidate | ✅ Done |
| Proctoring event ingestion | ✅ Done |
| Proctoring summary aggregation | ✅ Done |

**Endpoints:**
- `POST /api/assessments/:id/attempts`
- `GET /api/attempts/:id`
- `POST /api/attempts/:id/rounds/:type/start`
- `POST /api/attempts/:id/rounds/:type/submit`
- `POST /api/attempts/:id/proctoring`
- `GET /api/attempts/:id/proctoring/summary`

---

### Evaluation & Results ✅

| Feature | Status |
|---------|--------|
| MCQ auto-grading (exact match) | ✅ Done |
| DSA placeholder scoring | ✅ Done |
| AI interview placeholder | ✅ Done |
| Immutable evaluation records | ✅ Done |
| Assessment-level results | ✅ Done |
| Attempt-level results | ✅ Done |

**Endpoints:**
- `GET /api/assessments/:id/results`
- `GET /api/attempts/:id/result`

**Note:** DSA test execution and AI scoring are async-ready but require integration with external services (code execution sandboxes, LLM APIs).

---

### File Uploads ✅

| Feature | Status |
|---------|--------|
| S3-compatible pre-signed URLs | ✅ Done |
| FileAsset metadata persistence | ✅ Done |
| Resume attachment (≤5MB PDF) | ✅ Done |
| Video attachment (≤500MB) | ✅ Done |
| Ownership validation | ✅ Done |

**Endpoints:**
- `POST /api/files/upload-url`
- `POST /api/attempts/:id/resume`
- `POST /api/attempts/:id/rounds/:type/video`

---

### Background Jobs ✅

| Feature | Status |
|---------|--------|
| BullMQ + Redis infrastructure | ✅ Done |
| Evaluation job queue | ✅ Done |
| Notification job queue | ✅ Done |
| Worker process | ✅ Done |
| Exponential backoff retry | ✅ Done |
| Dead-letter queue support | ✅ Done |

**Job Types:**
- `EVALUATE_MCQ` — Auto-grade MCQ submissions
- `EVALUATE_DSA` — Create placeholder (execution TBD)
- `EVALUATE_AI` — Create placeholder (LLM scoring TBD)
- `SEND_INVITE_EMAIL` — Placeholder for email delivery

---

## 4. MVP Completion Status

| Domain | Status |
|--------|--------|
| **Auth & Organizations** | ✅ Done |
| **Assessments CRUD** | ✅ Done |
| **Question Bank** | ✅ Done |
| **Candidate Attempts** | ✅ Done |
| **Proctoring Ingestion** | ✅ Done |
| **MCQ Auto-Grading** | ✅ Done |
| **Results APIs** | ✅ Done |
| **File Storage** | ✅ Done |
| **Background Jobs** | ✅ Done |
| **DSA Code Execution** | 🚧 Stubbed (needs sandbox) |
| **AI Interview Scoring** | 🚧 Stubbed (needs LLM) |
| **Email Delivery** | 🚧 Stubbed (needs provider) |
| **Payments / Billing** | ⏳ Post-MVP |
| **ATS Integrations** | ⏳ Post-MVP |

---

## 5. Out of Scope (Intentionally Not Built)

The following features are **not** part of the current MVP:

| Feature | Reason |
|---------|--------|
| **Resume parsing** | Requires ML/NLP integration |
| **AI scoring intelligence** | Requires LLM integration (OpenAI, etc.) |
| **Code execution sandbox** | Requires isolated runtime (Docker, Firecracker) |
| **Payment processing** | Requires Stripe/billing integration |
| **ATS integrations** | Requires Greenhouse/Lever webhooks |
| **Email delivery** | Requires SendGrid/SES integration |
| **Video recording storage** | S3 integration ready, delivery pipeline TBD |
| **Real-time collaboration** | Not a core requirement |
| **Mobile native apps** | Web-first approach |

These features have clear integration points in the codebase and can be added incrementally.

---

*Last updated: January 2026*

# Fluxberry AI — Feature Documentation

> **Last Updated:** March 2, 2026
> **Version:** Monorepo (FluxAI-frontend + FluxAI-backend)
> **Stack:** Next.js 15 · Express.js · MongoDB · BullMQ · Redis · Resend · LiveKit · Deepgram · ElevenLabs · OpenAI

---

## 1. Product Overview

**Fluxberry AI** is a full-stack B2B hiring operating system for modern engineering teams. It covers the complete recruitment lifecycle — from posting a job and screening candidates with AI, to automating interview scheduling, running technical assessments, extending offers, and onboarding new hires — in a single unified platform.

### Who It's For
| Persona | Value |
|---|---|
| **Founders / Hiring Managers** | Full hiring pipeline without stitching 5 tools together |
| **Recruiters** | AI-powered screening + calendar automation cuts manual work by 60%+ |
| **Engineering-focused teams** | Technical assessments (MCQ, DSA, Live AI Voice Interview) with blueprint-driven evaluation |
| **HR / Onboarding teams** | Digital offer letters, document collection, policy workflows |

### Core Products
1. **Job Board** — Create, publish, and manage job listings with a public careers page
2. **ATS (Applicant Tracking System)** — Pipeline management, application review, stage automation
3. **ATS Screening** — AI-powered resume parsing, scoring, and candidate ranking
4. **Interview Automation** — Scheduling, scorecards, Google Calendar sync
5. **Technical Assessments** — Multi-round tests: MCQ → DSA → AI Voice Interview
6. **AI Screening Engine** — Real-time voice interview with LLM orchestration, blueprint-driven questions, auto-scoring, and ATS pipeline integration
7. **Talent Onboarding** — Digital offer letters, document collection, policy workflows
8. **Automation / Workflows** — Event-driven rule engine (trigger → action)
9. **Email Engine** — Template management + Resend integration with open tracking
10. **Analytics** — Assessment performance, candidate funnel metrics
11. **Settings & Profile** — Workspace config, user management, plan/billing

---

## 2. Authentication & Organizations

### What's Working ✅

| Feature | Notes |
|---|---|
| **User Signup** | Collects firstName, lastName, email, password, company |
| **User Login** | JWT-based, HttpOnly cookie-stored auth token |
| **Password Hashing** | bcrypt (server-side) |
| **JWT Verification** | Token verified on every protected route (HTTP + Socket.IO) |
| **Role-Based Access Control** | Three roles: `OWNER`, `ADMIN`, `RECRUITER` |
| **Organization Creation** | Auto-created on signup; org name = workspace name |
| **Organization Membership** | Users belong to one org; OWNER auto-assigned |
| **Onboarding State Tracking** | `onboardingCompleted` flag on user; enforced by route guards |
| **Protected Routes (FE)** | `ProtectedRoute` wrapper: unauthenticated → `/signin` |
| **Auth Context** | `useAuth()` hook exposes `user`, `login`, `logout`, `isLoading` |
| **Logout** | Clears cookie + auth context, redirects to `/` |
| **GDPR Account Deletion** | Self-serve deletion via settings (wipes user + org data) |
| **Rate Limiting** | Auth endpoints rate-limited server-side |
| **Socket.IO Auth** | `/ai-interview` WebSocket namespace requires Bearer JWT in handshake |

### What's Not Working / Partially Done ⚠️

| Feature | Status | Gap |
|---|---|---|
| **Password Reset / Forgot Password** | 🚧 Not built | No `/forgot-password` flow or token-based reset email |
| **Email Verification** | 🚧 Not built | Signup doesn't verify email ownership |
| **Multi-org support** | 🚧 Not built | Users locked to one org; no org switching |
| **SSO / OAuth** | 🚧 Not built | No Google/GitHub SSO |
| **Session Management** | ⚠️ Basic | No active session list, no device/IP tracking |
| **Invite new members** | ⚠️ UI only | "Invite user" button in Settings has no backend flow |

### Improvement Opportunities
- Add magic-link / OTP login alongside password
- Email verification gate before dashboard access
- Multi-org switching (sidebar dropdown already has UI scaffold)
- Audit log entries for all auth events

---

## 3. User Onboarding Flow

### What's Working ✅

| Step | Route | Description |
|---|---|---|
| **Step 1** | `/onboard/step-1` | Collects full name, company name, role (Founder / Recruiter / HR / Hiring Manager) |
| **Step 2** | `/onboard/step-2` | Product selection: Flux ATS, Flux Hire (assessments), or Both |
| **Step 3** | `/onboard/step-3` | Workspace creation — sets workspace/org name, confirms setup |

- Route guard enforces completion: incomplete users redirected to current step
- `onboardingCompleted` written to DB on Step 3 finish
- Responsive, multi-step wizard UI with progress indicator

### What's Not Working ⚠️

| Feature | Status |
|---|---|
| **Invite flow onboarding** | 🚧 Invited users have no separate onboarding path |
| **Product-gated dashboard** | ⚠️ Product choice in Step 2 doesn't gate sidebar items |
| **Workspace logo upload** | 🚧 Not implemented — logo auto-generated from initials |

---

## 4. Job Board

### Frontend Routes
| Route | Description |
|---|---|
| `/dashboard/manage-jobs` | Job listing grid — all jobs (draft/active/closed) |
| `/dashboard/manage-jobs/new` | Create job form — full job post creation wizard |
| `/dashboard/manage-jobs/[id]` | View/edit a single job post |
| `/jobs/[slug]` (public) | Candidate-facing job description + Apply button |

### What's Working ✅

| Feature | Notes |
|---|---|
| **Create Job Post** | Title, description, location, job type, salary range, requirements |
| **Draft / Active / Closed states** | Status management with badge indicators |
| **Edit & Delete Job Post** | Full CRUD for job listings |
| **Public Careers Page** | `/jobs/[slug]` renders public job description for candidates |
| **Application Form (Public)** | Candidates apply with name, email, resume upload |
| **Application Submission** | Application stored in DB linked to job + org |
| **Job Status Filtering** | Filter by Active / Draft / Closed |
| **Search** | Search by title on manage-jobs list |

### What's Not Working ⚠️

| Feature | Status | Gap |
|---|---|---|
| **Public job board listing page** | 🚧 Not built | No `/careers` page listing all open roles for an org |
| **Custom careers portal domain** | 🚧 Not built | Enterprise feature |
| **Job post SEO / Open Graph** | ⚠️ Partial | No auto-generated meta tags per job |
| **Job expiry / auto-close** | 🚧 Not built | No scheduled expiry for jobs |
| **Resume parsing on apply** | ⚠️ Queued | Resume uploaded but async-parsed, not real-time |

### Improvement Opportunities
- Build `/[org-slug]/careers` public listing page
- Rich text editor for job descriptions
- Auto-fill JSON-LD for Google Jobs indexing
- Job templates (reuse past job configurations)

---

## 5. ATS — Applicant Tracking System

### Frontend Routes
| Route | Description |
|---|---|
| `/dashboard/assessments/[id]` | Candidate application table per assessment |
| `/dashboard/candidate-pool` | All candidates across all jobs |
| `/dashboard/candidates/[id]` | Individual candidate profile |

### What's Working ✅

| Feature | Notes |
|---|---|
| **Application Pipeline View** | Kanban-style or table view of candidates per job |
| **Stage Management** | Move candidates between stages (Applied → Screening → Interview → Offer → Hired / Rejected) |
| **AI Auto-Move** | HIRE recommendation (≥70) auto-moves to Interview stage; NO_HIRE (<50) auto-moves to Rejected |
| **Candidate Profile** | View resume, application data, stage history |
| **Candidate Pool** | Cross-job view of all candidates with search + filter |
| **Application Status Badges** | Color-coded status indicators |
| **Bulk Selection** | Select multiple candidates for bulk actions |
| **Search & Filter** | Filter by stage, job, date, keyword |
| **Notes / Comments** | Recruiters can leave internal notes on candidate profiles |
| **Activity Timeline** | Candidate activity log per application |
| **Quick Reject** | Reject candidate with optional reason |
| **Email Candidate** | Trigger email from candidate profile |

### What's Not Working ⚠️

| Feature | Status | Gap |
|---|---|---|
| **Custom pipeline stages** | ⚠️ Fixed stages | Stages are hardcoded; orgs can't define custom stages |
| **Candidate tagging** | 🚧 Not built | No tag/label system on candidate profiles |
| **Duplicate detection** | 🚧 Not built | Same candidate can apply multiple times |
| **Referral tracking** | 🚧 Not built | No UTM/source attribution on applications |
| **Interview feedback in ATS** | ⚠️ Partial | Scorecard exists but not surfaced in ATS pipeline view |

### Improvement Opportunities
- Allow custom stage creation per job pipeline
- Candidate source tracking (LinkedIn, referral, direct, job board)
- Merge duplicate candidates automatically based on email matching
- Kanban drag-and-drop between stages

---

## 6. ATS Screening (AI-Powered Resume Scoring)

### Frontend Routes
| Route | Description |
|---|---|
| `/dashboard/ats-screening` | ATS overview panel — AI scoring overview |
| `/dashboard/ats-screening/[jobId]` | Ranked candidates with AI scores |

### What's Working ✅

| Feature | Notes |
|---|---|
| **Resume Upload Processing** | Resumes uploaded on application → sent to parsing queue |
| **AI Scoring Engine** | Candidates scored 0–100 based on job-description match |
| **Score Histogram** | Visual distribution of scores across candidate pool |
| **Breakdown Modal** | Per-candidate breakdown: skills match, experience, education |
| **Candidate Table with Sort** | Sort by AI score, name, date; filter by score range |
| **ATS Settings Modal** | Configure scoring weights (skills vs experience vs education) |
| **Shortlist Action** | Mark high-scoring candidates for next steps |
| **Reject Below Threshold** | Bulk reject candidates below a set score threshold |

### What's Not Working ⚠️

| Feature | Status | Gap |
|---|---|---|
| **Real LLM-backed scoring** | ⚠️ Depends on config | Quality depends on AI service connectivity |
| **Bias / fairness guardrails** | 🚧 Not built | No blind-screening or protected-attribute filtering |
| **Bulk re-score** | 🚧 Not built | Changing weights doesn't auto-re-score existing candidates |
| **Score explanation in plain English** | ⚠️ Partial | Categories shown but no LLM natural language reasoning |

---

## 7. Interview Automation

### Frontend Routes
| Route | Description |
|---|---|
| `/dashboard/interviews` | All scheduled interviews |
| `/dashboard/interviews/schedule` | Schedule a new interview |
| `/dashboard/interviews/[id]/scorecard` | Post-interview feedback form |

### What's Working ✅

| Feature | Notes |
|---|---|
| **Interview Scheduling** | Date/time picker with conflict detection |
| **Google Calendar Integration** | OAuth sync — events created in interviewer's calendar |
| **Interview List View** | All scheduled interviews with status |
| **Scorecard / Feedback Form** | Structured feedback with rating scales per competency |
| **Interviewer Assignment** | Assign interviewers from the org to a slot |
| **Interview Types** | Phone / Video / On-site designation |
| **Calendar Event Details** | Meeting link, time, location in calendar event |

### What's Not Working ⚠️

| Feature | Status | Gap |
|---|---|---|
| **Calendar view UI** | ⚠️ List only | No weekly/monthly calendar grid |
| **Self-scheduling for candidates** | 🚧 Not built | Candidates can't pick their own slot from a link |
| **Zoom / Meet auto-create** | 🚧 Not built | Meeting link must be manually entered |
| **Reminder emails** | ⚠️ Partial | Email engine exists but reminder automation not wired |
| **Reschedule / Cancel flow** | ⚠️ Manual | No structured reschedule flow |

---

## 8. Technical Assessments

### Frontend Routes
| Route | Description |
|---|---|
| `/dashboard/assessments` | List all assessments (draft/active/archived) |
| `/dashboard/assessments/new` | Multi-step wizard: Create → Configure → Review → Invite |
| `/dashboard/assessments/[id]` | Assessment detail: candidate list, scores, proctoring events |
| `/dashboard/assessments/[id]/results` | Aggregate results dashboard |
| `/dashboard/assessments/[id]/results/candidate/[candidateId]` | Per-candidate detailed results |
| `/assessment/[id]/start` | Candidate-facing: pre-assessment landing |
| `/assessment/[id]/system-check` | Camera/mic/browser check |
| `/assessment/[id]/identity-check` | Face + ID verification |
| `/assessment/[id]/round` | Active round (dynamically renders MCQ / DSA / AI Voice) |
| `/assessment/[id]/transition` | Timed countdown between rounds |
| `/assessment/[id]/completed` | Post-submission confirmation |

### Assessment Builder — What's Working ✅

| Feature | Notes |
|---|---|
| **Create Assessment Wizard** | 4-step: Create → Configure Rounds → Review → Invite |
| **Round Configuration** | Per-round: type (MCQ/DSA/AI), time limit, question count |
| **MCQ Question Selector** | Browse + search question bank, select per-round |
| **DSA Question Selector** | Browse DSA problems, attach to round |
| **AI Round Config Form** | Chip selectors for role (FRONTEND/BACKEND/FULLSTACK/DEVOPS), difficulty (JUNIOR/MID/SENIOR), grilling intensity (LOW/MEDIUM/HIGH); range sliders for duration (20–90 min), fundamentals count (2–8), max follow-ups (1–4) |
| **Assessment Preview** | Live preview of candidate-facing view |
| **Invite Candidates** | Send invite via email or shareable link |
| **Bulk Invite** | CSV upload for bulk candidate invitations |
| **Status Management** | Draft → Active → Completed/Archived lifecycle |
| **Assessment Results Dashboard** | Per-candidate scores, time taken, proctoring flags |
| **Per-Round Scoring** | MCQ score, DSA pass/fail, AI screening score shown per candidate |

### Candidate Experience — What's Working ✅

| Feature | Notes |
|---|---|
| **System Check** | Verifies: browser compatibility, camera, microphone, screen share |
| **Identity Check** | Webcam capture for identity verification |
| **Secure Shell** | Fullscreen-locked test environment with overlay on exit attempt |
| **MCQ Interface** | Option selection, timer per question, auto-advance |
| **DSA (Code Editor) Interface** | Monaco editor, language selection, run code, view test results |
| **AI Voice Interview Interface** | `AIInterviewRoom` with phase bar, live transcript, TTS audio playback, 5-second silence gate, manual text fallback |
| **Round Transition Screen** | Countdown + instructions between rounds |
| **Proctoring Events** | Tab switch, fullscreen exit, face detection, multiple faces, mic mute |
| **Already-Completed Guard** | Redirect to "already submitted" if re-entered |
| **State Persistence** | Round state saved server-side (resume on refresh) |

### AI Results Tab — What's Working ✅

| Feature | Notes |
|---|---|
| **HIRE / FURTHER_REVIEW / NO_HIRE Badge** | Colour-coded recommendation from LLM score aggregation |
| **Overall AI Score** | 0–100 weighted final score, prominently displayed |
| **SVG Radar Chart** | Spider chart across 4 dimensions: Projects / Technical / Communication / Culture |
| **Score Bars** | Per-dimension bars with traffic-light colouring (green/yellow/red) |
| **Red Flags List** | Aggregates LLM-flagged issues per turn (e.g. "Contradicted earlier answer") |
| **Interview Transcript** | Full expandable transcript with AI/Candidate bubbles and timestamps |
| **Session Meta** | Duration, role, total exchanges |

### What's Not Working ⚠️

| Feature | Status | Gap |
|---|---|---|
| **DSA semantic grading** | ⚠️ Basic | Pass/fail by output match only; no time/space complexity analysis |
| **Code plagiarism detection** | 🚧 Not built | Two candidates can submit identical code without detection |
| **Proctoring auto-action** | 🚧 Not built | Flags recorded but no auto-submit or auto-flag-for-review |
| **Question bank management** | ⚠️ Read-only | Questions shown via seeded data; no recruiter-facing CRUD |
| **Assessment cloning** | 🚧 Not built | Can't duplicate an existing assessment as a template |
| **Time extension per candidate** | 🚧 Not built | No per-candidate time adjustment |
| **Live proctoring view** | 🚧 Not built | Recruiter can't watch a live session |
| **MCQ partial scoring** | 🚧 Not built | Multi-select MCQ treated as all-or-nothing |

---

## 9. AI Screening Engine (Core)

This is the central AI feature of Fluxberry — a real-time voice interview with LLM-orchestrated question selection, evaluation, and ATS pipeline integration.

### Architecture

```
Candidate mic → MediaRecorder (250ms chunks)
    → Socket.IO /ai-interview (with JWT auth)
    → Deepgram STT → transcript_chunk events
    → 5-second silence gate (useSilenceDetection)
    → candidateAnswerComplete event
    → InterviewOrchestrator.submitTurn()
    ├─ LLM eval call (6s timeout, Zod-validated)
    ├─ Deterministic state machine (phase transition)
    └─ LLM next-question call (blueprint-driven)
        → ElevenLabs TTS
        → ai_question event (text + base64 audio)
            → candidate hears AI voice
```

### Interview State Machine

| Phase | Trigger | Notes |
|---|---|---|
| `INTRO` | Session start | 1 open-ended background question |
| `PROJECT_DEEP_DIVE` | After INTRO | Architecture, tradeoffs, failures. Up to `maxProjectFollowUps` grilling turns |
| `FUNDAMENTALS` | After PROJECT | 4–6 blueprint questions drawn from weighted random bank, FIFO within session |
| `CULTURE_FIT` | After FUNDAMENTALS | Fixed 3 questions: why change? why us? what to improve? |
| `SUMMARY` | After CULTURE | 1 closing question |
| `COMPLETED` | After SUMMARY | Score agg → Evaluation write → Attempt mark complete → ATS auto-move |

### Blueprint System (Role-Driven)

Each of 4 roles has a dedicated blueprint:

| Blueprint | Role | Fundamentals Bank Size |
|---|---|---|
| `backend.blueprint.ts` | BACKEND | 17 questions (ACID, CAP theorem, indexing, rate limiting, event loop, saga, caching) |
| `frontend.blueprint.ts` | FRONTEND | 17 questions (event loop, React reconciliation, a11y, CSS, performance, design tokens) |
| `fullstack.blueprint.ts` | FULLSTACK | 14 questions (HTTP lifecycle, React+Node, state mgmt, deployment strategies) |
| `devops.blueprint.ts` | DEVOPS | 15 questions (Kubernetes, Linux, CI/CD, SLOs/SLIs, IaC, secrets rotation) |

Each blueprint exports:
- `personaPrompt` — tone, strictness, JSON enforcement, anti-hallucination instruction
- `fundamentalsBank[]` — questions with `difficulty[]` filter + `weight` for weighted random selection
- `projectDeepDive` — max 2 follow-ups, `ownershipScoreThreshold: 6`, `tradeoffScoreThreshold: 6`
- `cultureQuestions[3]` — fixed set with `redFlagSignals[]`
- `evaluationRubric` — Zod-validated output schema + `systemInstruction`
- `scoringWeights` — per-dimension role-specific weights

### Services

| Service | File | Purpose |
|---|---|---|
| **Gateway** | `gateway.ts` | Socket.IO `/ai-interview` namespace: JWT auth middleware, STT forwarding, turn processing |
| **Orchestrator** | `interviewOrchestrator.ts` | State machine: create/submit/complete sessions |
| **LLM Service** | `llm.service.ts` | OpenAI JSON-mode calls, 6s AbortController timeout, Zod validation, 1 retry |
| **STT Service** | `stt.service.ts` | Deepgram live transcription with retry on failure |
| **TTS Service** | `tts.service.ts` | ElevenLabs MP3 synthesis with graceful degradation |
| **LiveKit Service** | `livekit.service.ts` | Short-lived access tokens for WebRTC room connections |

### Score Aggregation

LLM evaluation scores (0–10 per dimension) are aggregated using role-specific weighted rubrics:

| Role | Project Depth | Fundamentals | Communication | Culture |
|---|---|---|---|---|
| BACKEND | 35% | 40% | 15% | 10% |
| FRONTEND | 30% | 35% | 20% | 15% |
| FULLSTACK | 30% | 38% | 17% | 15% |
| DEVOPS | 25% | 45% | 15% | 15% |

**Thresholds:** ≥70 → `HIRE`, 50–69 → `FURTHER_REVIEW`, <50 → `NO_HIRE`

### ATS Pipeline Auto-Move

On session completion:
- `HIRE` → finds candidate's latest `JobApplication` → moves `currentStageId` to first stage matching `/interview/i`
- `NO_HIRE` → moves to stage matching `/rejected/i`
- `FURTHER_REVIEW` → no auto-move (recruiter decides)
- Wrapped in try/catch — ATS failure never blocks interview completion

### Safety Guards

| Guard | Implementation |
|---|---|
| **Max LLM calls** | `MAX_LLM_CALLS = (maxFundamentals + maxFollowUps + 10) × 2`; force-completes if hit |
| **Duration timeout** | `submitTurn` checks elapsed minutes vs `aiConfig.maxDurationMinutes`; force-completes |
| **Session lock** | `isProcessingTurn` flag prevents double-processing simultaneous turn events |
| **STT retry** | 1 automatic Deepgram reconnect; falls back to manual text input |
| **Idempotent complete** | `completeSession` returns early if session already `COMPLETED` |
| **Socket JWT auth** | `nsp.use()` middleware verifies JWT on every socket connection |

### What's Working ✅

| Feature | Status |
|---|---|
| Real-time voice interview with LiveKit + Deepgram + ElevenLabs | ✅ |
| Blueprint-driven fundamentals question bank (weighted random, FIFO per session) | ✅ |
| Blueprint persona prompt in all LLM calls | ✅ |
| Blueprint evaluation rubric in eval LLM calls | ✅ |
| `aiConfig` auto-loaded from round config (role, difficulty, grilling set by recruiter) | ✅ |
| 5-second silence detection gate | ✅ |
| Manual text fallback when STT fails | ✅ |
| Red flags tracked per answer and surfaced in results viewer | ✅ |
| LLM spend bound by per-session call budget | ✅ |
| Duration enforcement server-side | ✅ |
| ATS pipeline auto-move (HIRE/NO_HIRE) | ✅ |
| Socket.IO JWT authentication | ✅ |
| SVG radar chart in `AIInterviewViewer` | ✅ |
| Evaluation record written to `Evaluation` collection on completion | ✅ |
| `AI_SCREENING_COMPLETED` workflow event emitted | ✅ |
| Attempt + AI round marked `COMPLETED` on session finish | ✅ |

### What's Not Working / Partially Done ⚠️

| Feature | Status | Gap |
|---|---|---|
| **Redis for session state** | ⚠️ In-memory Map | Gateway uses `Map<sessionId, SessionState>` — not durable across restarts or horizontal scale |
| **Transcript encryption at rest** | 🚧 Not built | Transcripts stored in plaintext in MongoDB |
| **One-time session token** | 🚧 Not built | No short-lived token for the candidate-facing join; relies on full JWT |
| **LiveKit room cleanup** | 🚧 Not built | No API call to delete LiveKit room on session end |
| **Candidate context from resume** | ⚠️ Manual | `candidateContext` (projects, tech stack, YoE) must be passed at session create — not auto-extracted from resume |
| **Culture fit red flag detection** | ⚠️ Basic | `redFlagSignals` in blueprints defined but not wired into eval prompt |
| **Proctoring during AI interview** | 🚧 Not built | No face/tab monitoring during voice interview |
| **Video recording** | 🚧 Not built | Audio-only; no video capture |

### Improvement Opportunities
- Replace in-memory Map with Redis for gateway session state (required for horizontal scaling)
- Auto-extract `candidateContext` from parsed resume at session create
- Wire `redFlagSignals` from blueprint into the culture fit evaluation prompt
- Add LiveKit room teardown on session complete
- Transcript encryption at rest (AES-256 or field-level MongoDB encryption)
- Proctoring events during AI interview (face detection, tab switch)

---

## 10. Talent Onboarding

### Frontend Routes
| Route | Description |
|---|---|
| `/dashboard/onboarding` | Onboarding admin list — all employees in onboarding |
| `/dashboard/onboarding/[id]` | Individual onboardee detail + document status |
| `/dashboard/onboarding/settings` | Configure onboarding form templates |
| `/dashboard/settings/onboarding` | Admin onboarding settings |
| `/onboarding/[token]` | Candidate-facing form wizard |

### What's Working ✅

| Feature | Notes |
|---|---|
| **Onboarding Lists** | Active + completed onboarding views |
| **Onboarding Form Wizard** | Multi-step: personal info, bank details, emergency contacts, documents |
| **Document Upload** | ID, tax docs, certificates stored in S3 |
| **Document Review Modal** | HR can approve, reject, or request re-upload |
| **Timeline View** | Visual progress tracker per step |
| **Template Manager** | Create/manage reusable onboarding form templates |
| **Offer Letter Generation** | PDF offer letter from template + candidate data |
| **Offer List** | All extended offers with status (Pending / Accepted / Declined) |
| **Signature Pad** | Candidate digitally signs offer letter in-browser |
| **Activity Timeline** | Per-candidate log within onboarding |
| **Email Notifications** | Onboarding invite email, document request emails |
| **Recruiter Activity Timeline** | HR-facing per-candidate activity log |
| **Form Rejection Feedback** | HR can send rejection reason on document rejection |

### What's Not Working ⚠️

| Feature | Status | Gap |
|---|---|---|
| **PDF preview of offer letter** | ⚠️ Shell | `pdf-preview.tsx` is a placeholder — no real PDF render |
| **E-signature legal validity** | ⚠️ Basic | Canvas pad present; no DocuSign/Hellosign binding |
| **Document verification (AI)** | 🚧 Not built | Uploaded documents not validated or cross-checked |
| **Background check integration** | 🚧 Not built | No Checkr / Sterling integration |
| **HRIS sync** | 🚧 Not built | No export to BambooHR, Rippling, etc. |
| **Recruiter completion notifications** | ⚠️ Partial | Candidate gets email; recruiter doesn't |
| **Re-trigger documents on reject** | 🚧 Not built | No auto-notification + retry flow |

---

## 11. Automation & Workflows

### What's Working ✅

| Feature | Notes |
|---|---|
| **Workflow Builder UI** | Visual rule canvas at `/dashboard/workflows` |
| **Event Triggers** | `Application Submitted`, `Stage Changed`, `AI_SCREENING_COMPLETED` |
| **Actions** | `Move Stage`, `Send Email` |
| **Condition System** | If/else conditions on trigger data |
| **Backend Rule Engine** | Event-driven execution via BullMQ |
| **Workflow Persistence** | Saved to DB; runs automatically on matching events |

### What's Not Working ⚠️

| Feature | Status | Gap |
|---|---|---|
| **Additional triggers** | ⚠️ 3 of planned 8 | No `Assessment Completed`, `Interview Scheduled`, `Offer Sent` |
| **Additional actions** | ⚠️ Only 2 | No `Assign Interviewer`, `Send Slack`, `Add Tag` |
| **Workflow dry-run** | 🚧 Not built | Can't test without a real event |
| **Execution logs (UI)** | ⚠️ Backend only | No recruiter-facing run history |
| **Delay / wait actions** | 🚧 Not built | Can't "wait 24h then send email" |

---

## 12. Email Engine

### What's Working ✅

| Feature | Notes |
|---|---|
| **Template CRUD** | Create, edit, delete email templates |
| **Variable Injection** | `{{candidate_name}}`, `{{job_title}}`, etc. |
| **Resend Integration** | All transactional emails via Resend API |
| **Open Tracking** | Pixel-based open tracking with webhook ingest |
| **Email Logs** | Per-email status: Sent / Failed / Opened |
| **Email Job Queue** | BullMQ for async sending |
| **Default Templates** | Pre-seeded: Assessment Invite, Rejection, Offer Letter |

### What's Not Working ⚠️

| Feature | Status | Gap |
|---|---|---|
| **Click tracking** | 🚧 Not built | Open tracking exists; click tracking not implemented |
| **Unsubscribe compliance** | 🚧 Not built | No List-Unsubscribe header |
| **Rich WYSIWYG editor** | ⚠️ Basic | Template editor is a textarea |
| **Attachment support** | ⚠️ Partial | Offer PDF should attach but pdf-preview is a stub |
| **Email preview (rendered)** | ⚠️ Basic | No live rendered HTML preview |

---

## 13. Analytics

### What's Working ✅

| Feature | Notes |
|---|---|
| **Assessment score distribution** | Histogram of candidate scores |
| **Round-level pass rates** | MCQ/DSA completion and pass rates |
| **Time-to-complete metrics** | Average time candidates take per round |
| **Candidate funnel** | Applied → Screened → Assessed → Interviewed → Offered |
| **AI screening conversion** | HIRE / FURTHER_REVIEW / NO_HIRE distribution chart |

### What's Not Working ⚠️

| Feature | Status | Gap |
|---|---|---|
| **Real-time data** | ⚠️ Polling only | No WebSocket/SSE; charts update only on refresh |
| **Date-range filtering** | ⚠️ Partial | Limited filter options |
| **Export to CSV / PDF** | 🚧 Not built | No data export |
| **Job Board funnel analytics** | 🚧 Not built | No job view → apply → hired funnel |
| **Recruiter activity metrics** | 🚧 Not built | No per-recruiter productivity stats |

---

## 14. Security & Audit

### What's Working ✅

| Feature | Notes |
|---|---|
| **Audit Logs** | All key actions logged: login, assessment create, stage change, email sent |
| **Audit Log UI** | `/dashboard/audit-logs` table with actor, action, timestamp, IP |
| **Data Retention (Cron)** | Automated cleanup of old logs/temp data |
| **Rate Limiting** | Auth + API endpoints rate-limited |
| **GDPR Deletion** | Account deletion wipes user + org data |
| **Proctoring Data Storage** | Proctoring events stored per attempt |
| **Socket.IO JWT Auth** | All AI interview WebSocket connections require valid JWT |

### What's Not Working ⚠️

| Feature | Status | Gap |
|---|---|---|
| **Proctoring video storage** | ⚠️ Events only | Face detection logged but no video recording server-side |
| **IP Allowlisting** | 🚧 Not built | Orgs can't restrict access by IP |
| **2FA / MFA** | 🚧 Not built | No TOTP or SMS 2FA |
| **Data export (GDPR right to access)** | 🚧 Not built | No "export all my data" button |
| **AI transcript encryption** | 🚧 Not built | Interview transcripts stored in plaintext |

---

## 15. Settings & Profile

### Frontend Routes
| Route | Description |
|---|---|
| `/dashboard/settings` | Main settings page (Profile/Setting section) |
| `/dashboard/settings/email-templates` | Email template manager |
| `/dashboard/settings/onboarding` | Onboarding form settings |
| `/dashboard/pricing` | In-dashboard plan & pricing page (Profile/Pricing section) |

### What's Working ✅

| Feature | Notes |
|---|---|
| **Profile Card** | Shows user avatar (initials), name, email |
| **Workspace Info** | Logo (initials), editable name, public link, current plan |
| **Workspace Users List** | Shows all members with role badge + invite button |
| **Pricing Page (in-dashboard)** | 4 plans with billing toggle, feature table, and cost calculator |
| **Sidebar Profile Dropdown** | Rich dropdown: user info, Settings shortcut, Upgrade, logout |

### What's Not Working ⚠️

| Feature | Status | Gap |
|---|---|---|
| **Workspace name save** | ⚠️ UI only | Input updates state but no API call to persist change |
| **Invite user** | ⚠️ UI only | "Invite user" button exists with no backend flow |
| **Payment / Stripe** | 🚧 Not built | Upgrade button links to pricing page; no Stripe integration |
| **Profile picture upload** | 🚧 Not built | Avatar is always initials |
| **Password / email change** | 🚧 Not built | No self-serve credential update |

---

## 16. Infrastructure & Backend Modules

### Tech Stack
| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Node.js 20+, Express.js, TypeScript |
| **Database** | MongoDB with Mongoose ODM |
| **Auth** | JWT (access token in HttpOnly cookie), verified on HTTP + Socket.IO |
| **Queue** | BullMQ + Redis (3 queues: evaluation, email, workflow) |
| **Email** | Resend (transactional + template) |
| **File Storage** | AWS S3 (resumes, documents, identity photos) |
| **AI (LLM)** | OpenAI GPT-4o-mini (JSON mode, 6s timeout, Zod-validated) |
| **AI Voice STT** | Deepgram live transcription |
| **AI Voice TTS** | ElevenLabs MP3 synthesis |
| **WebRTC** | LiveKit (room tokens, WebSocket mic streaming) |

### Backend Modules (all in `/src/modules/`)
| Module | API Status |
|---|---|
| `auth` | ✅ Full CRUD |
| `organizations` | ✅ Full CRUD |
| `jobs` | ✅ Full CRUD |
| `applications` | ✅ Full CRUD |
| `ats-screening` | ✅ Score + ranking |
| `assessments` | ✅ Full CRUD |
| `questions` | ✅ Read (seed-based) |
| `attempts` | ✅ State machine |
| `rounds` | ✅ Round management |
| `proctoring` | ✅ Event ingestion |
| `evaluation` | ✅ MCQ auto-grade; DSA partial; AI finalizeAIEvaluation |
| `results` | ✅ Score aggregation |
| `interviews` | ✅ Schedule + scorecard |
| `candidates` | ✅ Profile + pool |
| `onboarding` | ✅ Templates + flow |
| `offers` | ✅ Create + sign |
| `email` | ✅ Template + send |
| `workflow` | ✅ Rule engine |
| `audit` | ✅ Event logging |
| `analytics` | ✅ Metrics aggregation |
| `dashboard` | ✅ Summary stats |
| `files` | ✅ S3 upload/download |
| `ai-interview` | ✅ Full orchestrator: gateway, blueprints, LLM, STT, TTS, LiveKit |
| `storage` | ✅ S3 service wrapper |
| `webhooks` | ✅ Resend webhook handler |
| `public` | ✅ Public apply endpoints |
| `job-board` | 🚧 Empty (public listing page unimplemented) |

---

## 17. Master Feature Status Summary

| Product Area | Working | Partial / Needs Work | Not Built |
|---|---|---|---|
| **Auth & Org** | Signup/login, RBAC, JWT (HTTP + WS), GDPR delete | Session management | Password reset, email verify, SSO, multi-org |
| **User Onboarding** | 3-step wizard, route guards | Product gating from Step 2 | Workspace logo, invite-specific flow |
| **Job Board** | CRUD, public job page, apply form | SEO, salary details | Public careers index, domain, job expiry |
| **ATS Pipeline** | Stage management, candidate view, notes, timeline, AI auto-move | Custom stages | Tags, duplicate detection, referral source |
| **ATS AI Screening** | Resume scoring, histogram, breakdown, shortlist | Weight persistence | Bias guardrails, bulk re-score |
| **Interview Automation** | Scheduling, Google Cal, scorecards | Reschedule, reminder emails | Self-scheduling link, Zoom auto-create |
| **Technical Assessments** | MCQ + DSA + proctoring, AI Voice interview, builder, invite, results | DSA grading depth | Plagiarism, live proctor, time extension |
| **AI Screening Engine** | Voice interview, blueprint questions, LLM eval, ATS auto-move, radar chart, socket auth | Redis session state, transcript encryption | Candidate context from resume, proctoring during AI round |
| **Talent Onboarding** | Form wizard, doc upload, offer + signature, timeline, rejection feedback | PDF preview, recruiter notifications | E-sign legal binding, background checks, HRIS |
| **Workflows** | 3 triggers, 2 actions, rule engine | Execution logs (UI) | Delay, webhook, Slack action |
| **Email Engine** | Templates, Resend, open tracking, logs | Rich editor | Click tracking, unsubscribe |
| **Analytics** | Score distribution, funnel, pass rates, AI conversion | Date filters, export | Job board analytics, recruiter metrics |
| **Security / Audit** | Audit logs, rate limiting, data retention, Socket JWT | Video proctoring | 2FA, IP allowlist, transcript encryption |
| **Settings & Profile** | Profile card, workspace info, pricing page | Name persistence | Invite users (API), Stripe, avatar upload |

---

## 18. Prioritized Improvement Roadmap

### 🔴 Critical (before any GTM)
1. **Payment / Stripe integration** — upgrade flow must work
2. **Email verification on signup** — prevent fake accounts
3. **Password reset flow** — table-stakes auth feature
4. **Workspace name persistence** — Settings page currently doesn't save
5. **Redis for AI gateway session state** — required for production reliability

### 🟡 High Impact (0–3 months)
6. **Candidate self-scheduling** — saves significant recruiter time
7. **Public careers page per org** — `/[org-slug]/careers` with live job listings
8. **Custom pipeline stages** — every hiring team has different workflows
9. **PDF offer letter rendering** — currently a placeholder
10. **Candidate context auto-extraction from resume** — feeds AI interview with real project history
11. **LiveKit room cleanup on session end** — prevent stale rooms

### 🟢 Product Depth (3–6 months)
12. **Recruiter question bank CRUD** — orgs should own their question libraries
13. **AI transcript encryption at rest** — compliance requirement
14. **Slack / WhatsApp workflow actions** — meets candidates where they are
15. **Assessment cloning** — reuse successful assessment configs
16. **Job Board SEO (JSON-LD)** — auto-index jobs on Google
17. **Candidate source tracking** — understand which channels drive quality hires
18. **Proctoring during AI voice interview** — face detection while candidate speaks

---

*Last updated: March 2, 2026 · Maintained by the Fluxberry AI engineering team*

# Assessment Flow — Implementation Plan (FluxAI / Fluxberry)

**Audience:** Sayandeep (implementation) + product/CTO (guidance)  
**Scope:** Complete the Assessment Flow per shared flowchart: Email → Candidate Test Experience → Judge0 → Analytics Dashboard.  
**Status:** Gap analysis + phased implementation plan with file-level tasks.

---

## 1. Flow vs Code: Gap Analysis

### 1.1 Flowchart Steps Mapped to Repo

| Flow step | Backend | Frontend | Gap |
|-----------|---------|----------|-----|
| **Create Assessment** | ✅ `assessments.service` create, configureRounds, publish | ✅ Create wizard, configure, publish | None |
| **Choose Test Type (MCQ / MSQ / DSA / AI)** | ✅ Round types in model; config per round | ✅ Configure UI (MCQ/DSA/AI); **MSQ** not first-class in UI | MSQ as explicit type in UI if needed |
| **Select questions from library** | ✅ Questions API (auth); round config stores questionIds | ✅ MCQ/DSA selectors | Candidate-facing: **no API to fetch questions for a round** (questions API is auth-only) |
| **Select AI Interview Agent** | ✅ AI round config has `agentId` | ⚠️ Not wired in configure UI | Add agent dropdown (Frontend/Backend/DevOps/Full Stack) in assessment config |
| **Finalize → Preview → Publish** | ✅ publish() sets ACTIVE | ✅ Preview + Publish | None |
| **Add Candidate Emails** | ❌ No "invite" API; no model for invitation list | ⚠️ Invite UI only (textarea + CSV placeholder); **no submit** | **Backend:** invite API + store; **Frontend:** call API, then trigger email |
| **Send Test Link** | ❌ No enqueue of `SEND_INVITE_EMAIL` anywhere | ❌ "Launch Assessment" only navigates away | **Wire:** On "Send" → create attempts or invite records → **enqueueNotificationJob(SEND_INVITE_EMAIL)** per candidate |
| **Candidate Receives Email** | ❌ Notification processor is **placeholder** (console.log) | N/A | **Implement real email** (SendGrid/SES) in `notification.processor.ts` |
| **Candidate Logs In Using Same Email** | N/A (flow says login; current design is **no login** — attempt by link + email) | N/A | Clarify: **magic link** vs **assessment link + email** (no login). Current: start attempt with `candidateEmail` only |
| **Candidate Starts Test** | ✅ `POST /assessments/:id/attempts` startOrResume | ⚠️ Start step has **no API call**; link goes to system-check then identity then round | **Wire:** Before system-check (or at start), call **startOrResume**; persist **attemptId** in URL or session |
| **Test Environment: Camera / Voice / MCQ timer / DSA Judge / AI Round** | See below | See below | See Candidate Test Experience section |
| **Results & Proctoring on Dashboard** | ✅ `GET /assessments/:id/results`, `GET /attempts/:id/result`; proctoring summary in result | ❌ **Results list and candidate detail are mock data** | **Frontend:** Call real results API; candidate detail = attempt result + proctoring |

---

### 1.2 Critical Gaps Summary

1. **Email integration**  
   - Invite flow never calls backend or enqueues jobs.  
   - No real email sending (processor is stub).  
   - No "Send Test Link" API that creates invite + enqueues `SEND_INVITE_EMAIL`.

2. **Candidate test experience**  
   - **No attemptId in flow:** Start step doesn’t call `startOrResume`; round pages don’t receive or use `attemptId`.  
   - **No questions for candidate:** Questions API is auth-only; no public or attempt-scoped endpoint for "questions for this round".  
   - **Round UIs are mock:** MCQ/DSA/AI use local mock data; no `startRound`/`submitRound` with real `attemptId`.  
   - **Timer:** Flow says "20s per question" for MCQ/MSQ; not implemented.  
   - **Proctoring:** Frontend calls `POST .../proctoring` but backend route is `.../proctoring-events` → **wrong path**.  
   - **Evaluation not triggered:** Submitting MCQ round only saves answers; **no** call to `evaluationService.evaluateMCQ` and **no** `enqueueEvaluationJob` anywhere.

3. **Judge0 (DSA)**  
   - No Judge0 (or any sandbox) integration.  
   - DSA "Run Code" is UI only; no execute/judge API.

4. **Analytics / Results dashboard**  
   - Backend: results and attempt result (with proctoring summary) exist.  
   - Frontend: Assessment results list and candidate result detail use **hardcoded mock**; no API calls.

---

## 2. Implementation Plan (Phased)

### Phase 1 — Email Integration (Invite + Send Test Link)

**Goal:** Recruiter adds emails → sends test link → candidate receives real email with assessment link.

**1.1 Backend: Invite + enqueue email**

- **Optional but recommended:** Add an **Invitation** (or **AssessmentInvite**) model if you want to track "invited" vs "attempt started" (e.g. `assessmentId`, `candidateEmail`, `sentAt`, `openedAt`). For V1, you can skip and only create **Candidate** + **Attempt** when candidate hits the link and calls `startOrResume`.
- **New endpoint (e.g.):**  
  `POST /api/assessments/:assessmentId/invite`  
  Body: `{ emails: string[] }` (or `candidates: { email, firstName?, lastName? }[]`).  
  - Validate assessment is ACTIVE and belongs to org (authGuard + org).  
  - For each email: (1) ensure Candidate exists (find or create by email + org from assessment), (2) build invite link:  
    `{FRONTEND_ORIGIN}/assessment/{assessmentId}/start?email={encodeURIComponent(email)}`  
    (or a signed token if you add it later).  
  - Call `enqueueNotificationJob({ type: 'SEND_INVITE_EMAIL', candidateEmail, assessmentId, assessmentTitle, inviteLink })` per candidate.  
- **Wire worker:** Ensure `notification.processor.ts` is run by your BullMQ worker (already in `worker.ts`).

**1.2 Backend: Real email sending**

- Add dependency: e.g. `@sendgrid/mail` or `nodemailer` (with SES).  
- In `notification.processor.ts`, replace `sendInviteEmail` stub with real send: use template (or simple HTML) with `inviteLink`, `assessmentTitle`, candidate name if present.  
- Env: `SENDGRID_API_KEY` or `AWS_SES_*` (or similar).  
- Keep `SEND_RESULT_EMAIL` as TODO for Phase 4.

**1.3 Frontend: Invite screen**

- In `InviteCandidates` (or equivalent):  
  - On "Send Test Link" / "Launch Assessment": parse emails from textarea (and/or CSV upload), call `POST /api/assessments/:assessmentId/invite` with `{ emails }`.  
  - Show success/error; optionally list "Invited" and "Copy Test Link" (generic `/{assessmentId}/start`) for manual share.

**Deliverables:** Recruiter can send invites from UI; candidates get real email with link; link lands on assessment start page.

---

### Phase 2 — Candidate Test Experience (End-to-End)

**Goal:** Candidate opens link → starts attempt → system check → identity → rounds (MCQ/DSA/AI) with real questions, timer where needed, submit → backend stores answers and triggers evaluation.

**2.1 Attempt in the flow**

- **Start page** (`/assessment/[assessmentId]/start`):  
  - Read `email` from query (e.g. `?email=...`) or from a small form "Enter the email this invite was sent to".  
  - Call `attemptsApi.startOrResume(assessmentId, { candidateEmail: email, candidateFirstName?, candidateLastName? })`.  
  - On success, **redirect** to a URL that includes `attemptId`, e.g.  
    `/assessment/[assessmentId]/attempt/[attemptId]/system-check`  
    (or store `attemptId` in sessionStorage and use `/assessment/[assessmentId]/system-check` with attemptId from storage).  
- **All subsequent candidate pages** (system-check, identity-check, round, transition, completed) must receive **attemptId** (via route or context) and use it for all API calls.

**2.2 Questions for candidate (no recruiter auth)**

- **Option A (recommended):** New **public** (or attempt-scoped) endpoint:  
  `GET /api/attempts/:attemptId/rounds/:roundType/questions`  
  - Verify attempt exists and is IN_PROGRESS; verify round is started or allow "pre-load" when round is NOT_STARTED.  
  - Load assessment → round config (questionIds); fetch questions by IDs (strip correct answers for MCQ/MSQ).  
  - Return list of questions (title, options, type, etc.) so the frontend can render MCQ/MSQ/DSA.  
- **Option B:** When candidate calls `POST /attempts/:attemptId/rounds/:roundType/start`, return in response the **questions** for that round (same shape). Frontend then doesn’t need a second request.  
- Implement **one** of these and use it in the round UIs.

**2.3 Wire round flow to real API**

- **Round page** (e.g. `/assessment/[assessmentId]/round/[roundId]` or `/assessment/[assessmentId]/attempt/[attemptId]/round/[roundType]`):  
  - Resolve **attemptId** and **roundType** (from route or attempt rounds order).  
  - On mount: if round not started, call `attemptsApi.startRound(attemptId, roundType)`.  
  - Fetch questions for this round (via new endpoint or start-round response).  
  - Render **MCQInterface** / **DSAInterface** / **AIInterviewInterface** with **real** questions and **attemptId**/roundType.  
- **MCQInterface (and MSQ):**  
  - Replace mock array with props: `questions`, `attemptId`, `roundType`.  
  - Add **per-question timer** (e.g. 20s from flow; configurable later from round config).  
  - On "Submit Section", call `attemptsApi.submitRound(attemptId, roundType, { answers: { [questionId]: [selectedIndexes] } })`.  
- **DSAInterface:**  
  - Same idea: real problem from round config, language from config; on submit send `{ answers: { code, language } }` or equivalent. Run code (Phase 3) can be added separately.  
- **AIInterviewInterface:**  
  - Real questions from round; record video/audio; upload via existing `POST /attempts/:attemptId/rounds/:roundType/video` (or file upload); then submit round with refs.  
- **Proctoring:** Fix frontend path: `attemptsApi.logProctoringEvent` should call `POST /api/attempts/:attemptId/proctoring-events` (not `/proctoring`). Update `lib/api/attempts.ts`.  
- **SecureShell** (or equivalent): Start camera/voice and optional room scan; send proctoring events using the corrected API.

**2.4 Trigger evaluation on submit**

- When a round is submitted (MCQ/DSA/AI), backend must create **Evaluation** and, for async, optionally enqueue job.  
- **Recommended:** In `attempts.service.submitRound`, after saving the attempt:  
  - If roundType === 'MCQ': call `evaluationService.evaluateMCQ(attemptId, input.answers, assessmentId)` **synchronously** (you already have assessmentId from attempt).  
  - For DSA: call `evaluationService.createDSAPlaceholder(attemptId, submission)` (or enqueue `EVALUATE_DSA` for Judge0 in Phase 3).  
  - For AI: call `evaluationService.createAIPlaceholder(attemptId, refs)`.  
- Alternatively, enqueue `EVALUATE_MCQ` job in `submitRound` and let worker call `evaluationService.evaluateMCQ` so submission stays fast; then in worker ensure you have access to assessmentId (from attempt).  
- **Important:** Ensure round submit response returns updated attempt (with round COMPLETED); frontend can then navigate to next round or completed.

**2.5 Flowchart alignment**

- **Camera on / Voice recording:** Implement in SecureShell/test environment (getUserMedia); optional: upload short clips or only send proctoring events (current design).  
- **MCQ/MSQ timer 20s per question:** Implement in MCQ/MSQ UI; enforce auto-advance or disable after 20s if required.  
- **DSA LeetCode-like UI + Judge:** Phase 3 (Judge0).  
- **AI Screening round:** Real questions + record + submit; scoring can remain placeholder.

**Deliverables:** Candidate can complete full flow with real attempt, questions, submit; answers and proctoring stored; MCQ (and placeholders for DSA/AI) evaluations created.

---

### Phase 3 — Judge0 Integration (DSA)

**Goal:** DSA round: candidate runs code against sample tests; on submit, run against full test suite and store score.

**3.1 Backend**

- Add Judge0 client (REST): e.g. `POST /submissions?base64_encoded=false` with `source_code`, `language_id`, `stdin` (test input). Poll or webhook for result.  
- **Language mapping:** Map your frontend languages (e.g. Python, JS, Java) to Judge0 `language_id`.  
- **DSA problems:** Store in Question model (already have `dsaDetails`: prompt, starterCode, languages). Add **test_cases** (input/output pairs, possibly visible/hidden) in config or in Question.  
- **Run code (sample):** New endpoint e.g. `POST /api/attempts/:attemptId/rounds/DSA/run` with `{ questionId, code, language }` → call Judge0 with **sample** test cases only → return stdout/stderr/status to frontend (so candidate sees result).  
- **Submit solution:** On round submit, in backend (or in evaluation job): call Judge0 with **all** test cases, compute score (e.g. passed/total), then call `evaluationService` to create/update DSA evaluation with real score and metadata (e.g. test results).  
- **Time/memory limits:** Pass Judge0 `cpu_time_limit`, `memory_limit` from round config or default.

**3.2 Frontend**

- **DSAInterface:** "Run Code" calls `POST .../rounds/DSA/run` with current code and language; display output.  
- "Submit Solution" calls existing submit round with `{ answers: { code, language } }`; backend (or job) runs Judge0 and writes evaluation.

**Deliverables:** DSA round supports run + submit with real execution and scoring.

---

### Phase 4 — Analytics Dashboard (Results + Proctoring + Candidate Response)

**Goal:** Recruiter sees real assessment results, per-candidate scores, proctoring summary, and optionally candidate responses (MCQ answers, DSA code, AI media).

**4.1 Assessment results list**

- **Frontend:** In `AssessmentResults` (assessment results page), replace mock `candidates` with API:  
  `GET /api/assessments/:assessmentId/results` (auth).  
  Use existing type `AssessmentResultsResponse` (totalCandidates, completedCount, results[] with candidateId, attemptId, totalScore, maxScore, percentage, proctoringFlags, etc.).  
- Compute or get from backend: **Avg score**, **Pending** (invited – completed), **Avg time** (from startedAt/submittedAt). Backend can add these aggregates later if needed.

**4.2 Candidate result detail**

- **Frontend:** In candidate result page, call `GET /api/attempts/:attemptId/result` (use `attemptId` from list; route can stay `candidate/[candidateId]` but pass attemptId from list or resolve candidateId → attemptId for that assessment).  
  Backend already returns `AttemptResultResponse`: rounds (score, maxScore, percentage), proctoringSummary (totalEvents, bySeverity, byType).  
- Replace mock with this data; show **Proctoring Log** from `proctoringSummary` and, if you add it, list of events (e.g. from `GET /api/attempts/:attemptId/proctoring-summary` or events list endpoint).

**4.3 Candidate response view (optional for V1)**

- **MCQ:** Store in `roundAttempt.answers` as `{ [questionId]: number[] }`. Add endpoint e.g. `GET /api/attempts/:attemptId/rounds/MCQ/answers` (auth, org-scoped) returning question titles + candidate’s selected options (and correct/incorrect if you want).  
- **DSA:** Code is in evaluation metadata or in round answers; show in candidate detail.  
- **AI:** Links to video/transcript from evaluation metadata; show in candidate detail.  
- **Recording playback:** If you store proctoring video/audio URLs, add a "View recording" link in candidate detail.

**Deliverables:** Dashboard shows real results and proctoring; candidate detail shows real scores, proctoring summary, and optionally answers/recordings.

---

## 3. File-Level Checklist (Where to Change What)

### Phase 1 — Email

| Task | Location |
|------|----------|
| Invite API (create + enqueue) | New: `FluxAI-backend/src/modules/invites/` or under `assessments`: `assessments.controller` + `assessments.service` method `inviteCandidates(assessmentId, body)`; call `enqueueNotificationJob` from `jobs/queues/index.js`. |
| Real email in processor | `FluxAI-backend/src/jobs/processors/notification.processor.ts`: implement `sendInviteEmail` with SendGrid/SES. |
| Invite UI → API | `FluxAI-frontend/src/features/assessments/components/invite-candidates.tsx`: form submit → `POST /assessments/:id/invite`. |
| Frontend API helper | `FluxAI-frontend/src/lib/api/assessments.ts`: add `invite(assessmentId, { emails })`. |

### Phase 2 — Candidate test experience

| Task | Location |
|------|----------|
| Start page: startOrResume + redirect with attemptId | `FluxAI-frontend/src/features/candidate/components/test-taker/start-step.tsx` (and/or `app/assessment/[assessmentId]/start/page.tsx`). |
| Candidate round route with attemptId | Prefer `app/assessment/[assessmentId]/attempt/[attemptId]/...` or pass attemptId via context/session. |
| Backend: questions for attempt round | New endpoint in `attempts` or `questions`: e.g. `GET /attempts/:attemptId/rounds/:roundType/questions` in `attempts.routes` + controller + service; use assessment round config + Question.find by IDs; strip correct answers. |
| MCQ UI: real questions, timer, submitRound | `FluxAI-frontend/.../mcq-interface.tsx`: props (questions, attemptId, roundType); timer state; submit via `attemptsApi.submitRound`. |
| DSA/AI: real questions + submit | Same idea in `dsa-interface.tsx`, `ai-interview-interface.tsx`. |
| Fix proctoring API path | `FluxAI-frontend/src/lib/api/attempts.ts`: `proctoring` → `proctoring-events`. |
| Trigger evaluation on submit | `FluxAI-backend/src/modules/attempts/attempts.service.ts`: in `submitRound`, after `attempt.save()`, call `evaluationService.evaluateMCQ` (and placeholders for DSA/AI). |

### Phase 3 — Judge0

| Task | Location |
|------|----------|
| Judge0 client | New: `FluxAI-backend/src/modules/judge/` or `services/judge0.client.ts`; env `JUDGE0_URL`, `JUDGE0_API_KEY` if needed. |
| Run code endpoint | e.g. `POST /api/attempts/:attemptId/rounds/DSA/run` in attempts or new `rounds` controller. |
| DSA submit → Judge0 → evaluation | In `evaluation.processor.ts` (EVALUATE_DSA) or in `attempts.service` after DSA submit: run Judge0, then create/update Evaluation. |
| Frontend: Run Code button | `FluxAI-frontend/.../dsa-interface.tsx`: call run endpoint, show output. |

### Phase 4 — Analytics dashboard

| Task | Location |
|------|----------|
| Results list from API | `FluxAI-frontend/src/features/assessments/components/assessment-results.tsx`: fetch `GET /api/assessments/:id/results`; map to table; use real `assessmentId` in links. |
| Candidate detail from API | `FluxAI-frontend/src/app/dashboard/assessments/[id]/results/candidate/[candidateId]/page.tsx`: need attemptId (e.g. from list or from candidateId+assessmentId); fetch `GET /api/attempts/:attemptId/result`; render rounds + proctoring summary. |
| Results API types | Ensure frontend has types for `AssessmentResultsResponse`, `AttemptResultResponse` (from backend or define in `lib/api/types.ts`). |

---

## 4. Dependencies and Order

- **Phase 1** can be done first and unblocks "Send Test Link" and email.
- **Phase 2** depends on: (1) attemptId in the flow (start page), (2) questions endpoint for candidate, (3) evaluation trigger on submit. Do 2.1 → 2.2 → 2.3 → 2.4.
- **Phase 3** (Judge0) can start once DSA round submit exists (Phase 2); run endpoint can be added in parallel.
- **Phase 4** can be done as soon as real attempts and evaluations exist (after Phase 2); no dependency on Judge0 or email.

**Suggested order:** 1 (Email) → 2 (Full candidate flow + evaluation trigger) → 4 (Dashboard) → 3 (Judge0). That gives you a working "invite → take test → see results" loop before adding run-code and full DSA scoring.

---

## 5. Risks and Notes

- **Candidate identity:** Flow says "Candidate logs in using same email". Current design is link + email (no login). If you later add magic-link or recruiter login, keep attemptId tied to the same candidate record.  
- **Rate limiting:** Add rate limits on public endpoints (`/attempts`, `/assessments/:id/attempts`, invite) to avoid abuse.  
- **Proctoring storage:** Video/audio storage (S3) and retention policy: confirm with product; for V1, events-only may be enough if recordings are not required.  
- **MSQ:** Backend MCQ already supports multi-correct (`correctOptions`, `isMultiCorrect`). If PRD requires "MSQ" as separate round type, you can add roundType MSQ and reuse same config shape; otherwise treat as MCQ with multi-correct questions.

---

*Document generated from codebase audit and flowchart alignment. Update this plan as implementation progresses.*

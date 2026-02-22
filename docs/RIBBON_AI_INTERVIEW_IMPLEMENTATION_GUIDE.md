# Ribbon AI Interview – Implementation Guide

**Purpose:** Replace the current non-interactive “record then process” AI round with Ribbon’s interactive voice AI. This document is the single source of truth for implementation so it can be followed step-by-step without ambiguity.

**Product name:** Ribbon (Ribbon.ai). API base: `https://app.ribbon.ai/be-api`. Auth: `Authorization: Bearer <API_KEY>`.

---

## Part 1: Current vs New Flow (Senior Staff-Level Decisions)

### 1.1 Current round flow (unchanged for MCQ/DSA)

- **DSA round:** User submits last answer or time expires → backend may enqueue EVALUATE_DSA → frontend calls `submitRound(attemptId, 'DSA', { answers })` → `handleNextRound()` runs.
- **handleNextRound:** If more rounds remain: `router.push(\`/assessment/${assessmentId}/transition/${roundIndex}\`)`. So after DSA they go to the **transition** page (e.g. `/assessment/xyz/transition/1`).
- **Transition page:** Shows “Round 2 Complete” and “Up Next: AI Video Interview”. User clicks **“Start Round 3”** → `Link` to `/assessment/${assessmentId}/round/${nextRoundIndex}` (e.g. `/assessment/xyz/round/2`).
- **Round page:** Renders `RoundRenderer` with `roundId=2`, `roundType='AI'`. So **they land on our app** at `/assessment/[assessmentId]/round/2`, and we currently render `AIInterviewInterface` (pre-interview → recording UI → complete).

**Conclusion:** After DSA they do **not** go directly to the AI round. They go: DSA submit → **transition page** → click “Start Round X” → **our AI round page**. So the entry point for the AI round is always **our** page.

### 1.2 New flow with Ribbon (decisions)

- **Same entry point:** We keep `/assessment/[assessmentId]/round/[roundId]` for the AI round. No change to transition page or URL structure.
- **What we render for AI:** Instead of the current recording UI (`AIInterviewInterface` → `AIInterface` → `InterviewSession`), we render a **Ribbon gate**: one screen with short instructions and a single CTA **“Start AI voice interview”**. On click: call our backend to create a Ribbon interview and get `interview_link`, then **redirect the browser to Ribbon** (`window.location.href = interview_link`). The candidate takes the **entire** interview on Ribbon’s hosted page (real-time voice conversation).
- **Return flow:** Ribbon’s flow has a single `redirect_url`. When the candidate finishes, Ribbon sends them to that URL (e.g. our callback page). We need a **callback page** that: (1) identifies which attempt just finished, (2) marks the round complete if not already (webhook may have done it), (3) navigates the user to the next round or completed page. **Identifying the attempt:** Because `redirect_url` is per-flow (same for all interviews from that flow), we cannot put `attemptId` in the path. **Decision:** When we redirect the user to Ribbon, we set an **HTTP-only cookie** (or a short-lived signed token in a cookie) that stores the current `attemptId` (or a token that backend can resolve to `attemptId`). The callback page reads this cookie, calls backend “ribbon-callback” with that id, then redirects to next round or completed.
- **Results:** Ribbon sends a **webhook** when processing is done (`interview_processed`). We receive it, verify signature, map `interview_id` → our `attemptId`, fetch `GET /v1/interviews/{interview_id}` for transcript/summary/scores, persist into our DB, and mark round complete. So we **do not** depend on the user hitting the callback for storing results; the callback is for **UX** (taking them to the next screen). If they close the browser before redirect, we still have results from the webhook.

**Answer to “would they be redirected to Ribbon?”:** Yes. They still **first** land on our AI round page. We then **redirect** them to Ribbon for the actual interview. So we **do** need frontend changes: (1) replace the current AI round UI with the Ribbon gate, (2) add the callback page and cookie/token handling.

---

## Part 2: How Ribbon Handles Questions and Follow-ups (Tuning)

- **Script questions:** When creating an **interview flow** (POST `/v1/interview-flows`), we send `questions`: an array of strings. These are the **main questions** the AI is supposed to cover. Ribbon’s AI conducts a **conversation**: it uses these as the script and can ask **follow-ups** based on the candidate’s answers.
- **Follow-up behavior:** Ribbon’s docs describe a **Validation Level** (Challenging / Neutral / Validating). Challenging = more follow-ups and deeper probing; Validating = more affirming. This is configured in Ribbon’s **Interview Settings** (org/UI). The **API** does not expose validation level in the flow payload; it is an organization-level or flow-level setting in their dashboard. For API-only tuning we use:
  - **additional_instructions:** Free-text guidelines for the AI (e.g. “Ask follow-up questions when the candidate mentions a project”, “Keep responses concise”). Optional on POST `/v1/interview-flows`.
  - **additional_info:** Extra context (e.g. role description, company background). Optional on the same endpoint.
- **Intro / outro:** `intro` and `outro` on the flow let us set exactly what the AI says at start and end (up to 5000 chars each).
- **Summary:** We **can** tune what’s asked and how the AI behaves: (1) **questions[]** = our script from assessment config, (2) **additional_instructions** and **additional_info** for follow-up style and context, (3) **intro** / **outro** for bookends. Fine-grained validation/selling level is in Ribbon’s UI unless they add it to the API later.

---

## Part 3: Implementation Checklist (Follow in Order)

### Phase A: Backend – Ribbon client and config

| Step | Action | File(s) / Location |
|------|--------|--------------------|
| A1 | Add env vars. | Backend `.env` and `.env.example`: `RIBBON_API_KEY`, `RIBBON_BASE_URL` (default `https://app.ribbon.ai/be-api`), `RIBBON_WEBHOOK_SECRET` (for webhook signature verification). |
| A2 | Create Ribbon HTTP client. | New: `FluxAI-backend/src/services/ribbon/ribbon.client.ts`. Implement: `createFlow(body)`, `createInterview(interview_flow_id, candidateInfo?)`, `getInterview(interview_id)`. Use `RIBBON_API_KEY` and `RIBBON_BASE_URL`. Handle 4xx/5xx and return typed responses. |
| A3 | (Optional) Add types for Ribbon API. | New: `FluxAI-backend/src/services/ribbon/ribbon.types.ts`. Types for: CreateFlowRequest/Response, CreateInterviewRequest/Response (interview_id, interview_link), GetInterviewResponse (status, interview_data with transcript, summary, scores, etc.), WebhookPayload. |

### Phase B: Backend – Storage and mapping

| Step | Action | File(s) / Location |
|------|--------|--------------------|
| B1 | Store Ribbon IDs on attempt. | In `RoundAttempt` (or equivalent schema): add `ribbonInterviewId?: string` and, if you want to cache flow per assessment, `ribbonFlowId?: string` on the **Assessment** document for the AI round config (or a small table keyed by assessmentId). Schema: `FluxAI-backend/src/database/models/index.ts` (IRoundAttempt and RoundAttemptSchema). |
| B2 | Ensure flow exists for assessment. | When we need a flow for an assessment’s AI round: load Assessment → get AI round config → get questions array (from config or DEFAULT_QUESTIONS). If we have a stored `ribbonFlowId` for this assessment, reuse it (optional: GET flow from Ribbon to validate). If not: POST createFlow with title, questions, redirect_url, webhook_url, webhook_secret_key; store returned `interview_flow_id` on Assessment (or in ribbon_flows table). redirect_url must be our frontend callback URL (e.g. `https://<FRONTEND_ORIGIN>/assessment/ribbon-callback`). webhook_url = our backend URL (e.g. `https://<BACKEND>/api/webhooks/ribbon`). |

### Phase C: Backend – Start AI round (Ribbon path)

| Step | Action | File(s) / Location |
|------|--------|--------------------|
| C1 | New endpoint: “Start AI round (Ribbon)”. | e.g. `POST /attempts/:attemptId/ai/ribbon/start` or repurpose existing `POST /attempts/:attemptId/ai/start` for Ribbon. Handler should: (1) Load attempt and assessment; validate attempt has AI round and is in a valid state. (2) Ensure Ribbon flow exists for this assessment (B2); get `interview_flow_id`. (3) Call Ribbon `createInterview(interview_flow_id, { email, first_name, last_name } from attempt/candidate if desired). (4) Store `ribbonInterviewId` on the attempt’s AI round; set round status to IN_PROGRESS. (5) Return `{ interview_link, attemptId }` so frontend can redirect and set cookie. |
| C2 | Cookie/token for callback. | When returning `interview_link`, either: (A) backend sets an HTTP-only cookie `fluxai_ribbon_attempt=<attemptId>` (or a short-lived JWT/signed token that encodes attemptId) with path `/assessment/ribbon-callback` and same-site; or (B) return a one-time token in the JSON response; frontend stores it (e.g. in cookie or sessionStorage) and sends it to the callback page (e.g. as query param when redirecting to callback is not possible from Ribbon). **Recommended:** Backend sets HTTP-only cookie in the response of “start Ribbon” so that when the user lands on our callback domain after Ribbon redirect, the callback page can send the cookie (or we read it server-side if callback is a server-rendered page) and call backend “ribbon-callback” with attemptId. |

### Phase D: Backend – Webhook and results persistence

| Step | Action | File(s) / Location |
|------|--------|--------------------|
| D1 | Webhook route. | New route: `POST /api/webhooks/ribbon` (or under public attempts router). No auth; verify using `X-Ribbon-Signature` with `RIBBON_WEBHOOK_SECRET` (HMAC-SHA256 of raw body). Parse JSON. |
| D2 | Webhook handler. | On `event_type === 'interview_processed'`: extract `interview_id`. Look up attempt by `ribbonInterviewId === interview_id`. If not found, log and 200. If found: call Ribbon `getInterview(interview_id)`. Map response to our AI results shape (transcript, summary, scores, questions_to_transcript_mapping → our synthesis/responses). Persist to existing store (e.g. AIInterviewSynthesis + per-response docs, or a dedicated RibbonResult model keyed by attemptId). Mark round (and attempt if all rounds done) COMPLETED. Respond 200. Optionally handle `video_processed` the same way or only to update video_url. |
| D3 | Idempotency. | Before persisting, check if this attempt already has Ribbon results; if yes, skip or upsert so we don’t duplicate. |

### Phase E: Backend – Callback and cleanup

| Step | Action | File(s) / Location |
|------|--------|--------------------|
| E1 | Ribbon callback endpoint. | e.g. `GET /attempts/ribbon-callback` or `POST`. Reads attemptId from cookie (or token). Validates attempt exists and is AI round. If round not yet COMPLETED (e.g. webhook not yet received), optionally mark round COMPLETED with a “completed_via_redirect” flag or leave as-is and rely on webhook. Returns redirect URL for frontend (e.g. next round or completed page: `/assessment/:assessmentId/round/:nextIndex` or `/assessment/:assessmentId/completed`). Frontend callback page will call this and then redirect the user. Alternatively, callback can be a frontend-only page that reads cookie and calls this API to get “next URL” then redirects. |
| E2 | Remove or bypass old AI recording pipeline for this round. | Stop using: initUpload, completeUpload (per-question upload), completeSession (our version), PROCESS_AI_RESPONSE, SYNTHESIZE_AI_INTERVIEW for the Ribbon path. Either: (1) Remove these code paths when round is AI and we use Ribbon, or (2) Keep them behind a feature flag and disable for Ribbon. Recruiter “get AI results” should read from the new Ribbon-sourced data (same API, different source). |

### Phase F: Frontend – Ribbon gate and redirect

| Step | Action | File(s) / Location |
|------|--------|--------------------|
| F1 | Replace AI round content. | In `RoundRenderer`, for `roundType === 'AI'`: instead of rendering `<AIInterviewInterface onComplete={...} />`, render a new component, e.g. `<RibbonAIInterviewGate attemptId={attemptId} assessmentId={assessmentId} onComplete={handleAIComplete} />`. |
| F2 | RibbonAIInterviewGate component. | New: e.g. `FluxAI-frontend/src/features/candidate/components/test-taker/ribbon-ai-interview-gate.tsx`. UI: short copy (“You’ll have a live voice conversation with our AI interviewer.”), one button “Start AI voice interview”. On click: call backend `POST /attempts/:attemptId/ai/ribbon/start` (or whatever the start endpoint is). Backend returns `interview_link` and sets cookie. Then `window.location.href = interview_link`. No need to render anything after redirect. Handle errors (e.g. show “Failed to start; try again”). |
| F3 | API method. | In `FluxAI-frontend/src/lib/api/attempts.ts` (or equivalent): add `startRibbonAISession(attemptId)` that calls the new start endpoint and returns `{ interview_link }`. |

### Phase G: Frontend – Callback page

| Step | Action | File(s) / Location |
|------|--------|--------------------|
| G1 | Callback route. | New page: e.g. `FluxAI-frontend/src/app/assessment/ribbon-callback/page.tsx` (or `assessment/[assessmentId]/ribbon-callback` if you prefer). Route must match the `redirect_url` we registered with Ribbon (e.g. `https://<origin>/assessment/ribbon-callback`). |
| G2 | Callback page logic. | On load: read cookie (or token) that contains attemptId (or call backend with cookie to get attemptId). Call backend “ribbon-callback” (e.g. `POST /attempts/ribbon-callback` or `GET` with cookie) to get `nextUrl` (next round or completed). Then `router.replace(nextUrl)` or `window.location.href = nextUrl`. If no cookie/attemptId, redirect to a safe place (e.g. assessment start or a “session expired” page). Clear the Ribbon-attempt cookie after use. |

### Phase H: Recruiter results and evaluation

| Step | Action | File(s) / Location |
|------|--------|--------------------|
| H1 | Recruiter “get AI results”. | Existing endpoint that returns AI round results (e.g. transcript, synthesis) should now read from the Ribbon-sourced data (stored in D2). Same response shape if possible; map Ribbon’s transcript, summary, scores, questions_to_transcript_mapping into that shape. |
| H2 | submitRound for AI. | Today frontend calls `submitRound(attemptId, 'AI', { answers: {} })` when user clicks Continue after the interview. With Ribbon: round can be marked COMPLETED by webhook or by callback. Frontend callback page gets `nextUrl` which may point to “next round” or “completed”. If nextUrl is “completed”, we may still need to call `submitRound` for the AI round so that attempt status and round.answers are consistent, or backend “ribbon-callback” could trigger that. **Decision:** Backend “ribbon-callback” (or webhook) should set round status to COMPLETED and, if it’s the last round, set attempt status to COMPLETED. So when the user lands on the callback and we redirect to next round or completed, we don’t require an extra “Submit” click. If your product still expects a `submitRound` call for AI for analytics or idempotency, have the callback page call `submitRound(attemptId, 'AI', { answers: {} })` before redirecting, or have the backend do it when marking round complete. |

### Phase I: Remove or isolate old AI recording code (after Ribbon works)

| Step | Action | File(s) / Location |
|------|--------|--------------------|
| I1 | Remove unused UI. | After Ribbon flow is verified: remove or dead-code `AIInterviewInterface`, `AIInterface`, `InterviewSession`, `PreInterviewScreen`, `InterviewComplete`, `useMediaRecorder` usage for AI (or keep for a different product if needed). |
| I2 | Remove unused backend. | Remove or disable: ai-interview routes for initUpload, completeUpload, completeSession (old); job types PROCESS_AI_RESPONSE, SYNTHESIZE_AI_INTERVIEW; or keep behind “legacy AI” flag. Keep getResults and getSessionDetails if they’re repurposed to read Ribbon data. |
| I3 | Cleanup attempt round fields. | Optionally rename or repurpose `aiSessionId` to `ribbonInterviewId` and stop using `aiSessionId` for the old session; or add `ribbonInterviewId` and keep `aiSessionId` for backward compat with any in-flight old sessions. |

---

## Part 4: Exact Redirect and Cookie Behavior

- **redirect_url (Ribbon flow):** Must be the full URL of our **callback page**, e.g. `https://<FRONTEND_ORIGIN>/assessment/ribbon-callback`. No query params from us; Ribbon may append nothing. So we **must** identify the attempt via cookie (or equivalent).
- **When we send user to Ribbon:** Frontend calls start endpoint; backend creates Ribbon interview, sets cookie (e.g. `fluxai_ribbon_attempt=<attemptId>`, HttpOnly, Secure, SameSite=Lax, Path=/assessment/ribbon-callback), returns `interview_link`. Frontend does `window.location.href = interview_link`. Browser will send that cookie when the user later lands on our callback URL (same site).
- **Callback page:** Same site as the rest of the app. Page loads → read cookie (via API that reads cookie server-side, or if callback is client-only, we need a way to send the cookie to backend; e.g. callback page calls `GET /attempts/ribbon-callback` with credentials so the cookie is sent). Backend returns `nextUrl`. Frontend redirects to `nextUrl` and clears the cookie.

---

## Part 5: Questions and Tuning (Reference)

- **Where questions come from:** Assessment’s AI round config (e.g. `assessment.rounds[].config.questions` or existing DEFAULT_QUESTIONS). Map to string array for Ribbon `questions` in createFlow.
- **Follow-ups and behavior:** Use `additional_instructions` and `additional_info` in createFlow. For validation/selling level, use Ribbon dashboard if available.
- **intro / outro:** Set in createFlow from assessment config or constants.

---

## Part 6: File and Endpoint Summary

| Item | Location / Name |
|------|------------------|
| Ribbon client | `FluxAI-backend/src/services/ribbon/ribbon.client.ts` |
| Ribbon types | `FluxAI-backend/src/services/ribbon/ribbon.types.ts` |
| Start Ribbon AI | Backend: e.g. `POST /attempts/:attemptId/ai/ribbon/start` (or repurpose `.../ai/start`) |
| Webhook | Backend: `POST /api/webhooks/ribbon` |
| Callback API | Backend: e.g. `GET /attempts/ribbon-callback` (cookie-based) |
| Ribbon gate component | Frontend: e.g. `ribbon-ai-interview-gate.tsx` under test-taker |
| Callback page | Frontend: e.g. `app/assessment/ribbon-callback/page.tsx` |
| RoundRenderer AI branch | `round-renderer.tsx`: render Ribbon gate instead of AIInterviewInterface |

---

## Part 7: Testing Order

1. Backend: Ribbon client unit or integration (createFlow, createInterview, getInterview) with test key or mock.
2. Backend: Start endpoint returns link and sets cookie; webhook handler verifies signature and persists results (mock webhook).
3. Frontend: Gate redirects to link; callback page (with cookie) calls backend and redirects to next round or completed.
4. E2E: Start assessment → MCQ → DSA → transition → AI round → Start → Ribbon → complete interview on Ribbon → redirect to callback → next round or completed. Then verify recruiter sees Ribbon-sourced results.

Use this document as the single implementation guide; implement phases in order and tick off steps to avoid drift or hallucination.

---

## Part 8: Implementation review (post-implementation)

- **Start flow:** Candidate lands on our AI round page → clicks "Start AI voice interview" → `POST /attempts/:attemptId/ai/ribbon/start` → backend ensures Ribbon flow (create if no `ribbonFlowId` on assessment AI round config), creates interview via Ribbon API, stores `ribbonInterviewId` on attempt round, sets cookie `fluxai_ribbon_attempt`, returns `interview_link` → frontend redirects to Ribbon.
- **Questions:** Come from assessment AI round `config.questions` or backend `DEFAULT_QUESTIONS`; passed to Ribbon as `questions[]` when creating the flow. Optional: `additional_instructions`, `additional_info`, `intro`, `outro` on flow for tuning.
- **Redirect & webhook:** Flow is created with `redirect_url` = frontend `/assessment/ribbon-callback` and `webhook_url` = backend `/api/webhooks/ribbon`. When candidate finishes, Ribbon redirects to our callback; we identify attempt via cookie and return `nextUrl`. Ribbon also sends `interview_processed` webhook; we verify `X-Ribbon-Signature`, fetch `GET /v1/interviews/:id`, persist transcript/summary/scores into `AIInterviewSynthesis`, mark round (and attempt if last round) COMPLETED.
- **Callback:** Frontend callback page calls `GET /api/attempts/ribbon-callback` with credentials (sends cookie); backend returns `nextUrl` (next round or `/assessment/:id/completed`), clears cookie. If webhook hasn’t run yet, callback marks round COMPLETED so the user can proceed.
- **Recruiter results:** `GET /attempts/:attemptId/ai/results` uses `ribbonInterviewId` or `aiSessionId`, loads `AIInterviewSynthesis` by `sessionId`; for Ribbon, `responses` may be empty and synthesis holds transcript/summary/strengths.

### Tests

- **Ribbon API flow:** `npm run test:ribbon:flow` — with `RIBBON_API_KEY`, creates flow, creates interview, gets interview. Validates client and API contract.
- **Webhook:** `npm run test:ribbon:webhook` — backend must be running; with `RIBBON_WEBHOOK_SECRET` set (e.g. `test-secret-for-ci`), asserts 401 for bad/missing signature and 200 for valid payload with unknown `interview_id`.

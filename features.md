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
| DSA Code Execution | ✅ Implemented (Run Only) |
| AI Interview Scoring | 🚧 Stubbed |
| Email Delivery | 🚧 Stubbed (Logged) |
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

---

## 6. Round 3 (AI Interview) Status & Integration Guide

### Current Status: 🚧 Disconnected UI Shell

As of the latest update, **Round 3 (AI Interview) is currently partially implemented as a UI shell.**

- **Frontend:** The `InterviewSession` component renders the camera feed, microphone controls, and a placeholder for the AI avatar. It **does not** connect to any AI service (OpenAI, Ribbon, etc.).
- **Backend:** The `startSession` endpoint generates a local session ID but **does not** initiate a session with an external AI provider.
- **Data:** Transcripts are **not generated or saved**.

This state allows for the UI flow to be demonstrated (Round 1 -> Round 2 -> Round 3) without incurring costs or requiring valid API keys for a specific provider.

### Integration Guide: Adding an AI Agent (e.g., Ribbon AI)

To fully enable the AI Interview, you need to integrate a provider. Here is the recommended approach:

#### Backend Integration

1.  **Select a Provider Strategy**:
    - Decide if you will use a direct API (like OpenAI Realtime) or a managed platform (like Ribbon AI/Vapi).
    - Acquire necessary API keys and Webhook secrets.

2.  **Update `AIInterviewService`**:
    - Modify `src/modules/ai-interview/ai-interview.service.ts`.
    - **Implement `startSession`**: Call your provider's API to create a session token or URL.
      ```typescript
      // Example:
      const session = await ribbonApi.createSession({
          candidateName: candidate.name,
          resumeUrl: candidate.resumeUrl,
          questions: generatedQuestions
      });
      return { sessionId: session.id, token: session.clientToken, ... };
      ```
    - **Implement Webhooks** (Optional but recommended):
      - Create a new controller (e.g., `ai-interview.controller.ts`) to handle webhook events (transcripts, completion).
      - Verify signatures to ensure security.

3.  **Update Types**:
    - Update `StartAISessionResponse` in `src/modules/ai-interview/ai-interview.types.ts` to include any necessary client-side tokens or URLs.

#### Frontend Integration

1.  **Update `attempts.ts`**:
    - Sync `AISessionStartResponse` with the backend's new return type.

2.  **Modify `InterviewSession`**:
    - Update `src/features/candidate/components/test-taker/ai-interview/interview-session.tsx`.
    - **Add Provider SDK**: Install and import the provider's client SDK (e.g., `@ribbon-ai/react-sdk`).
    - **Initialize Connection**: Use the token/URL from `startAISession` response to connect.
    - **Handle Events**:
      - `onConnect`: Set status to "Live".
      - `onTranscript`: Update the transcript state.
      - `onDisconnect`: Handle end of interview.

3.  **Media Handling**:
    - Ensure your provider supports the browser's `MediaStream`. Most WebRTC-based providers (like OpenAI/Vapi) handle this automatically or require you to pass the stream track.

4.  **Testing**:
    - Use the `/assessment/[id]/round` route to test the full flow.
    - Verify that audio/video permissions are requested and that the AI responds to voice input.

---

## 7. System Limitations & Stubbed Features

This section explicitly lists features that are **Partially Implemented** or **Stubbed** to clarify the current system capabilities.

| Feature Area | Status | Description |
|--------------|--------|-------------|
| **AI Interview (Round 3)** | 🚧 **Disconnected** | The UI is fully functional (camera, mic, avatar), but it **does not** connect to an AI provider. No conversation happens, and no transcript is saved. |
| **DSA Round** | ⚠️ **Run Only** | Candidates can write code and click "Run" to execute it against Judge0 (if configured). However, **"Submit"** creates a placeholder score (0%) because test case execution logic is stubbed. |
| **Job Applications** | 🚧 **UI Only** | The public job application form exists (`/jobs/:id`), but the **"Submit Application"** button is not hooked up to the backend. No candidate or application record is created. |
| **Email Notifications** | 🛑 **Stubbed** | The system **does not send real emails**. Password resets, invite links, and notifications are logged to the backend console/logs for development purposes. |
| **Payments** | 🛑 **Placeholder** | The "Manage Billing" and "Upgrade" buttons are visual placeholders. No Stripe/payment integration exists. |

**What is Working (End-to-End):**
- ✅ Recruiter Auth (Signup, Login, Onboarding)
- ✅ Assessment Creation & Management
- ✅ Candidate Link Generation & System Check
- ✅ Round 1 (MCQ) taking & Auto-grading
- ✅ Round 2 (DSA) entering code & running it (output visible)
- ✅ Round 3 (AI) entering the room (video/audio works)
- ✅ Candidate Results Dashboard (scores and status updates)

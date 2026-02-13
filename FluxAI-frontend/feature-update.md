# Fluxberry AI Feature Update & Engineering Status

## 1. Overview

**Fluxberry AI** is a technical hiring assessment platform designed to automate and streamline the screening process for engineering roles. It competes with platforms like TestGorilla and HackerRank but focuses on a premium, recruiter-friendly experience with AI-enhanced capabilities.

**Core Value Proposition:**
- **Automated Screening:** Reduces time-to-hire by automating technical rounds (MCQ, Coding, AI Interview).
- **Recruiter Security:** Provides robust proctoring signals to ensure integrity.
- **Candidate Experience:** Offers a modern, stress-free, and clear assessment environment.

**High-Level Architecture:**
The current implementation is a **Frontend-First MVP** built with Next.js (App Router), Tailwind CSS, and Shadcn UI. It simulates a full-stack application using local state and mock data, ready for backend integration.

---

## 2. Frontend Pages & Features — IMPLEMENTED

The following frontend modules are fully implemented and visually polished.

### A. Landing & Marketing Pages
Public-facing pages for candidate attraction and employer branding.
- **Route:** `/` - Main Landing Page (Hero, Features, Pricing).
- **Route:** `/[companySlug]/careers` - Company Career Page (Job listings, branding).
- **Route:** `/[companySlug]/careers/alljobs` - All open positions with filtering.
- **Route:** `/[companySlug]/careers/[jobId]` - Job details and application form.

### B. Recruiter Dashboard (Assessment Engine)
The core workspace for recruiters to manage hiring.
- **Route:** `/dashboard/assessments` - List of active, draft, and closed assessments.
    - **Feature:** "Duplicate Assessment" action for quick cloning.
- **Route:** `/dashboard/assessments/new` - Wizard to create a new assessment (Step 1: Basics).
- **Route:** `/dashboard/assessments/[id]/configure` - Deep configuration of rounds.
    - **Feature:** **Question Banks:** Read-only bank for MCQs (30 questions selection).
    - **Feature:** **DSA Selector:** Picker for LeetCode-style problems (Easy/Medium/Hard).
    - **Feature:** **AI Agent:** Selector for Interviewer Persona (Frontend/Backend/DevOps).
- **Route:** `/dashboard/assessments/[id]/review` - **[NEW]** Read-only summary screen before publishing (Guardrail).
- **Route:** `/dashboard/assessments/[id]/invite` - Candidate invitation management.
- **Route:** `/dashboard/assessments/[id]/results` - Leaderboard of candidate results (Score, Status).
- **Route:** `/dashboard/assessments/[id]/results/candidate/[id]` - Detailed candidate report.
    - **Feature:** **Proctoring Logs:** Collapsible event list (Tab switches, etc.).
    - **Feature:** **Attempt Status:** Badges for Completed, Timed Out, Disqualified.

### C. Candidate Assessment Experience (Secure Shell)
A focused, distraction-free environment for taking tests.
- **Route:** `/assessment/[id]/start` - Assessment Welcome Page.
- **Route:** `/assessment/[id]/system-check` - Hardware verification (Camera/Mic).
- **Route:** `/assessment/[id]/identity-check` - **[NEW]** Verification step with Camera Preview and optional **Resume Upload**.
- **Route:** `/assessment/[id]/round/[roundId]` - The actual test interface.
    - **Round 1 (MCQ):** Sidebar navigation, flag for review, auto-save.
    - **Round 2 (DSA):** Monaco code editor, language selector, test case output.
    - **Round 3 (AI Interview):** Webcam recording interface for video responses.
- **Route:** `/assessment/[id]/transition/[nextRoundId]` - Interstitial "breather" screens between rounds.
- **Route:** `/assessment/[id]/state/resume` - Re-entry screen for interrupted sessions.
- **Route:** `/assessment/[id]/state/expired` - Timeout screen.

---

## 3. Backend Requirements — TO BE BUILT

The frontend is "mock-backed". The following backend systems are required to make it functional.

### A. Authentication & Users
- **Services:** User Service, Auth Provider (Clerk/Auth0/Custom).
- **Data Models:** `User` (Recruiter), `Organization`, `Candidate`.
- **Logic:** Role-based access control (RBAC) for Dashboard vs. Public pages.

### B. Assessment Management
- **Services:** Assessment Service.
- **Data Models:**
    - `Assessment` (Config, enabled rounds, deadlines).
    - `RoundConfig` (Specifics for MCQ, DSA, AI).
- **Logic:** Validation of configuration integrity (e.g., preventing publish if rounds are empty).

### C. Question Banks
- **Services:** Content Service.
- **Data Models:**
    - `Question` (Type: MCQ, DSA; Stats: Difficulty, Usage Count).
    - `QuestionSet` (Grouped questions for "Default" options).
- **Logic:** Randomization algorithms for serving questions to candidates.

### D. Candidate Attempt Tracking
- **Services:** Proctoring Service, Session Manager.
- **Data Models:**
    - `AssessmentAttempt` (Status, start_time, end_time).
    - `RoundAttempt` (Per-round progress).
    - `ProctoringEvent` (Type, timestamp, severity, screenshot_url).
- **Logic:** Strict server-side timer enforcement (handling disconnects/reloads).

### E. File Uploads
- **Services:** Storage Service (S3/GCS).
- **Logic:** Presigned URLs for Resume upload and Video response uploads.

### F. Evaluation Engine
- **Services:** Grading Service, AI Analysis Service.
- **Logic:**
    - Auto-grading MCQs.
    - Executing DSA code against test cases (Sandboxed Runner).
    - Transcribing and analyzing AI Interview video responses.

---

## 4. Candidate Flow — End-to-End Summary

1.  **Invitation:** Candidate receives unique link -> Clicks -> Landing on `/start`.
2.  **System Check:** Browser verifies Camera/Mic permissions.
3.  **Identity:** Candidate confirms name, takes a reference photo, and uploads Resume (optional).
4.  **Assessment Loop:**
    - **Round 1 (MCQ):** 30 questions, 45 mins. -> Submit -> Transition Screen.
    - **Round 2 (DSA):** 4 problems, 60 mins. -> Submit -> Transition Screen.
    - **Round 3 (AI):** 5 video questions. -> Submit -> Completion Screen.
5.  **Submission:** Final payload sent to backend. Status updates to `Completed`.
6.  **Results:** Recruiter sees candidate in dashboard with score and proctoring logs.

**Edge Cases Handled (Frontend):**
- **Refresh:** Redirects to `/state/resume` or current round (state persistence needed).
- **Timeout:** Auto-redirects to `/state/expired`.
- **Violation:** Proctoring feedback "toasts" warn the user (e.g., "Face not visible").

---

## 5. UX Gaps & Improvement Opportunities

### MVP-Safe Improvements (Low Effort)
- **Toast Notifications:** Add success toasts for "Draft Saved" or "Link Copied".
- **Empty States:** Better illustrations for empty dashboards or search results.
- **Mobile View:** While responsive, complex views like the Code Editor are desktop-first. Add specific "Mobile Not Supported" notices for deep technical rounds if needed.

### Post-MVP Enhancements (High Effort)
- **Collaborative Grading:** Allow multiple recruiters to score a candidate.
- **Dark Mode:** Fully support system-wide dark mode (currently partial).
- **Custom Branding:** Allow companies to inject their logo/colors into the assessment shell.
- **Advanced Analytics:** Hiring funnel visualization (Invited -> Started -> Completed -> Hired).

---

## 6. Out-of-Scope (Explicit)

The following features are **NOT** in the current scope:
- **Resume Parsing:** No extraction of skills/exp from uploaded PDFs.
- **Live Coding Pair:** This is an asynchronous assessment tool, not a live interview tool.
- **Payment Processing:** No billing/subscription UI.
- **Email Delivery:** No actual email sending (mocked in UI).
- **AI Proctoring Intelligence:** No active gaze tracking or ML-based cheat detection (UI signals only).

---

## 7. Next Engineering Phases (High-Level)

### Phase 1: Backend Foundations
- Set up DB schema and basic CRUD for Assessments and Questions.
- Implement Auth.

### Phase 2: Execution Engine
- Build the code execution sandbox (Judge0 or similar) for DSA.
- Implement video storage for AI responses.

### Phase 3: Intelligence Layer
- Implement AI grading for code quality.
- Implement transcription and keyword analysis for video interviews.

### Phase 4: Integrations
- ATS Connectors (Greenhouse/Lever) to sync candidates automatically.

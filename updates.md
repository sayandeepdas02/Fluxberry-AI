# Fluxberry AI: End-to-End Project Update

This document provides a highly detailed, comprehensive status update on the Fluxberry AI prototype. It covers the system architecture, feature completeness, working modules, and known issues across both the Frontend and Backend repositories.

---

## 🏗 System Architecture & Stack

### **Frontend (`FluxAI-frontend`)**
*   **Framework**: Next.js 15.1.6 (App Router) & React 19.
*   **Styling & UI**: Tailwind CSS, Radix UI primitives, Lucide React icons.
*   **State & Data**: SWR for data fetching, React Context for Auth.
*   **Real-time & Video**: `socket.io-client`, `@livekit/components-react` for live interviews.
*   **Charts**: Recharts.

### **Backend (`FluxAI-backend`)**
*   **Runtime & Framework**: Node.js & Express (TypeScript).
*   **Database**: MongoDB via Mongoose.
*   **Authentication**: Custom JWT with `bcryptjs` and `jsonwebtoken`.
*   **Background Jobs**: BullMQ and Redis (`ioredis`) for async tasks (worker runs on `src/jobs/worker.ts`).
*   **Integrations**: OpenAI (AI Evaluation), BullMQ, Resend (Emails), AWS S3 (Storage), Deepgram, LiveKit, Puppeteer.

---

## ✅ What is Built & Fully Working

### 1. **Authentication & Authorization**
*   **Working**: Standard email/password signup and login flows are fully functional. The `.env` startup crash and `jsonwebtoken` missing dependency issues on the backend have been permanently resolved. The Express server successfully spins up on port `5001`.
*   **Working**: Protected route middleware via Auth Context. The frontend checks if a user is authenticated, and if `onboardingCompleted` is false, it forces routing to `/onboard/step-1` before allowing dashboard access.

### 2. **Assessments & Question Bank (Redesigned)**
*   **Working**: The `Question Bank` page (`/dashboard/question-bank`) has been structurally completely overhauled into a modern, **Light Mode UI** to match the overarching design system.
*   **Round 1 (MCQ/MSQ)**: Full support for Single-Select and Multi-Select question types. Contains tabbed views for technical segments (System Design, Machine Learning, Data Science, Backend Engineer, Frontend Engineer, DevOps). Expanding accordion layout shows exact correct options. Custom creation modal allows full editing of properties.
*   **Round 2 (DSA)**: DSA coding questions populate with Problem Statements, Test Cases (Input/Output), and Reference Solutions.
*   **Working**: Custom "Global" vs "Yours" tags distinguish platform-seeded questions from organization-specific ones.

### 3. **Talent Onboarding System**
*   **Working**: End-to-end candidate onboarding workflows. The frontend integrates the new `TimelineView` which provides granular, timestamped audit logs (e.g., `ONBOARDING_INITIALIZED`, `DOCUMENT_UPLOADED`, `FORM_REJECTED`) of all candidate actions via intuitive icons.
*   **Working**: Recruiter approval/rejection forms. Recruiters can accept or reject candidate form items. The candidate view displays appropriate warnings/remediations depending on the status.

### 4. **ATS Screening & Kanban**
*   **Working**: Application Tracking System core UI is active. Recruiter Dashboard features robust sidebar navigation. "ATS Screening" stands as a top-level product tier in the left sidebar.
*   **Working**: Candidates can apply to public facing Job Boards, and they populate into the recruiter's Kanban board representation for stage-gated drag-and-drop screening. 

### 5. **Monorepo File Organization (Structural Clean up)**
*   **Working**: The separation of concerns between `FluxAI-frontend` and `FluxAI-backend` is strictly enforced. The frontend contains all UI (admin, applicant, driver, kitchen, demo logic). The environment variable injection links the frontend directly to `http://localhost:5001/api`.

### 6. **Visual & Branding**
*   **Working**: Project logos have been updated (including Vercel replaced with User Avatar for favicon). The Navbar uses the globally enforced `Arimo` font for clean UI consistency.

---

## 🛠 What Needs Work / Not Working Properly

### 1. **DSA Question Creation View**
*   **Issue**: In the newly overhauled `Question Bank`, clicking "New Coding Challenge" or attempting to edit a Custom DSA question triggers a JavaScript `alert("DSA Custom Question Creation coming soon!")`. The Form Modal currently only handles `MCQ` data inputs natively. A `DSAFormModal` component must be built to input test cases and reference code.

### 3. **OAuth 2.0 Identity Providers**
*   **Issue**: The `/signin` route contains a highly styled "Continue with Google" button. Clicking this button simply fires a console log: `console.log("Google sign-in clicked")`. OAuth integration via Google Auth Library or NextAuth/Better Auth is pending.

### 4. **AI Interview Stability Check**
*   **Pending Verification**: The LiveKit dependencies are installed and the backend includes `ai-interview` and `proctoring` modules. However, the exact state of concurrent AI voice interviews using `elevenlabs` and `@deepgram` inside the `worker.ts` queue should be load-tested before production, as BullMQ processes can stall if Redis drops connection on local setups.

---

## 🚀 Next Suggested Actions
1. **Implement `DSAFormModal.tsx`** to allow recruiters to author live-coding problems (Round 2) to replace the current placeholder alert.
2. **Wire Google OAuth** using `@react-oauth/google` or backend Passport strategy to eliminate the mock log on the sign-in screen and return the standard JWT payload.

# Missing Integrations & Static Frontend Audit

This document lists all frontend features that are currently static (using mock data) and the corresponding backend APIs that are missing or incomplete. This serves as a roadmap for the next development phase.

## 1. Dashboard Analytics
**Frontend Status:** ✅ Integrated
- **Page:** `/dashboard/analytics`
- **Component:** `AnalyticsView.tsx`
- **Data:** Uses `useAnalytics` hook connected to backend.
- **Backend:**
    - `GET /api/analytics/kpis` (Implemented)
    - `GET /api/analytics/trends` (Implemented)
    - `GET /api/analytics/demographics` (Implemented)

## 2. Job Management (ATS)
**Frontend Status:** ✅ Integrated
- **Page:** `/dashboard/manage-jobs`
- **Component:** `ManageJobsView.tsx`
- **Data:** Real data via `jobsService`.
- **Backend:**
    - `GET /api/jobs` (Implemented w/ pagination)
    - `POST /api/jobs` (Implemented)
    - `GET /api/jobs/:id` (Implemented)

## 3. Candidate Pool (CRM)
**Frontend Status:** ✅ Integrated
- **Page:** `/dashboard/candidate-pool`
- **Component:** `CandidatePoolView.tsx`
- **Data:** Real candidate data via `candidatesService`.
- **Backend:**
    - `GET /api/candidates` (Implemented w/ filtering)
    - `GET /api/candidates/:id` (Implemented w/ history)
    - **Entity:** `Candidate` model created and linked to attempts.

## 4. Public Career Pages
**Frontend Status:** ✅ Integrated
- **Page:** `/[companySlug]/careers` & `/[companySlug]/careers/[jobId]`
- **Data:** Fetched via `publicApi`.
- **Backend:**
    - `GET /api/public/companies/:slug` (Implemented)
    - `GET /api/public/companies/:slug/jobs` (Implemented)
    - `GET /api/public/companies/:slug/jobs/:id` (Implemented)

## 5. Test Taker Experience
**Frontend Status:** Partially Mocked
- **Camera/Proctoring:**
    - Components: `SystemCheckStep.tsx`, `IdentityCheckStep.tsx`, `AiInterviewInterface.tsx`
    - Status: Uses "Mock Camera Feed" placeholders.
    - **Missing Integration:** WebRTC / MediaStream implementation for real camera access and recording.
- **Round Execution:**
    - `RoundRenderer.tsx`: Relies on some mock logic for transition/state.

## 6. Dashboard Home
**Frontend Status:** ✅ Integrated
- **Page:** `/dashboard`
- **Component:** `DashboardOverview.tsx`
- **Data:** Connected via `useDashboard` hook.
- **Backend:**
    - `/api/dashboard/summary` (Implemented - aggregates KPIs & recent candidates)

## 7. Miscellaneous Static Elements
- **Invite Modal:** Code comment `// TODO: Open invite modal` in `Sidebar.tsx`. Needs implementation.
- **Settings:** `/dashboard/settings` is implemented but verify if it covers all Organization updates found in the backend (`OrganizationsController.update`).

## Summary of Priorities
1.  **Jobs API**: Critical for meaningful workflow.
2.  **Analytics API**: High value for dashboard utility.
3.  **Candidate Entity**: Needed to decouple candidates from specific test attempts.
4.  **Public Career Page API**: Essential for sharing links with candidates.

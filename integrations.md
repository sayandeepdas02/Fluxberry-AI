# Missing Integrations & Static Frontend Audit

This document lists all frontend features that are currently static (using mock data) and the corresponding backend APIs that are missing or incomplete. This serves as a roadmap for the next development phase.

## 1. Dashboard Analytics
**Frontend Status:** Fully Mocked
- **Page:** `/dashboard/analytics`
- **Component:** `AnalyticsView.tsx`
- **Data:** Uses `kpiData`, `engagementTrendData`, `campaignPerformanceData` from local constants.
- **Missing Backend:**
    - `GET /api/analytics/kpis` (Total Reach, Engaged Candidates, ROI)
    - `GET /api/analytics/trends` (Line charts for engagement)
    - `GET /api/analytics/demographics` (Device, Location data)

## 2. Job Management (ATS)
**Frontend Status:** Fully Mocked
- **Page:** `/dashboard/manage-jobs`
- **Component:** `ManageJobsView.tsx`, `JobCard.tsx`
- **Data:** Uses `SAMPLE_JOBS` from `@/features/jobs/mocks/jobs`.
- **Missing Backend:**
    - `GET /api/jobs` (List all jobs)
    - `POST /api/jobs` (Create new job)
    - `GET /api/jobs/:id` (Get details)
    - `PATCH /api/jobs/:id` (Update status/details)

## 3. Candidate Pool (CRM)
**Frontend Status:** Fully Mocked
- **Page:** `/dashboard/candidate-pool`
- **Component:** `CandidatePoolView.tsx`
- **Data:** Uses `candidates` array from `@/features/candidate/mocks/candidates`.
- **Missing Backend:**
    - `GET /api/candidates` (List all known candidates across assessments)
    - `GET /api/candidates/:id` (Candidate profile & history)
    - **Note:** Currently candidates might only exist as `Attempts`. A dedicated `Candidate` entity might be needed.

## 4. Public Career Pages
**Frontend Status:** Fully Mocked
- **Page:** `/[companySlug]/careers`
- **Data:** Hardcoded company info, testimonials, and job lists in `page.tsx`.
- **Missing Backend:**
    - `GET /api/public/companies/:slug` (Fetcher public company details)
    - `GET /api/public/companies/:slug/jobs` (List public jobs)

## 5. Test Taker Experience
**Frontend Status:** Partially Mocked
- **Camera/Proctoring:**
    - Components: `SystemCheckStep.tsx`, `IdentityCheckStep.tsx`, `AiInterviewInterface.tsx`
    - Status: Uses "Mock Camera Feed" placeholders.
    - **Missing Integration:** WebRTC / MediaStream implementation for real camera access and recording.
- **Round Execution:**
    - `RoundRenderer.tsx`: Relies on some mock logic for transition/state.

## 6. Dashboard Home
**Frontend Status:** Mocked
- **Page:** `/dashboard`
- **Component:** `DashboardOverview.tsx`
- **Data:** Mock KPI and recent activity data.
- **Missing Backend:**
    - Aggregated API for "Active Jobs", "Total Candidates", etc. (Likely same as Analytics but summarized).

## 7. Miscellaneous Static Elements
- **Invite Modal:** Code comment `// TODO: Open invite modal` in `Sidebar.tsx`. Needs implementation.
- **Settings:** `/dashboard/settings` is implemented but verify if it covers all Organization updates found in the backend (`OrganizationsController.update`).

## Summary of Priorities
1.  **Jobs API**: Critical for meaningful workflow.
2.  **Analytics API**: High value for dashboard utility.
3.  **Candidate Entity**: Needed to decouple candidates from specific test attempts.
4.  **Public Career Page API**: Essential for sharing links with candidates.

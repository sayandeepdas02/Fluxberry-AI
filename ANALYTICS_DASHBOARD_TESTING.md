# Analytics Dashboard – Testing Guide

Steps for testing the **recruiter analytics dashboard**: assessment results list (real data from API) and candidate result detail (round breakdown, proctoring summary). Replaces mock data with `GET /api/assessments/:id/results` and `GET /api/attempts/:attemptId/result`.

---

## Prerequisites

- **Backend:** Node, MongoDB. API running (e.g. `http://localhost:5001`).
- **Frontend:** Node, `NEXT_PUBLIC_API_URL` pointing at your backend (e.g. `http://localhost:5001/api`).
- **Auth:** You need to be signed in as a **recruiter** (dashboard and results are recruiter-only).
- **Data:** At least one **assessment** with **candidate attempts** (completed or in progress). If you have none, complete the candidate flow first (see [CANDIDATE_TEST_EXPERIENCE_TESTING.md](./CANDIDATE_TEST_EXPERIENCE_TESTING.md)).

---

## 1. Backend

1. `cd FluxAI-backend`
2. `.env`: `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`, `FRONTEND_URL`.
3. Start API: `npm run dev`.

No Redis or worker required for viewing results.

---

## 2. Frontend

1. `cd FluxAI-frontend`
2. `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:5001/api`
3. Start app: `npm run dev` (e.g. `http://localhost:3000`).

---

## 3. Get to the results page

1. Sign in as a recruiter.
2. Open **Dashboard** → **Assessments** (or go to `/dashboard/assessments`).
3. Open an assessment that has invited candidates and at least one attempt.
4. Go to the **Results** tab (or navigate to `/dashboard/assessments/<assessmentId>/results`).

---

## 4. Test the assessment results list

1. **Page load**
   - The page should show a loading spinner briefly, then real data (no mock list).
   - If the API fails, you should see an error message and a back link.

2. **Header**
   - Assessment title and an "Active" badge.
   - Subtitle: "X candidates" and "Y completed" (from the API).

3. **Stats cards (top row)**
   - **Avg Score:** Average percentage of completed attempts only; "—" if none completed.
   - **Top Tier (≥80%):** Count of completed attempts with percentage ≥ 80.
   - **Pending:** Total candidates minus completed count.
   - **Completed:** Same as "Y completed" in the header.

4. **Table**
   - One row per candidate/attempt: **Name** (or email if no name), **Status** (Strong Hire / Consider / Reject for completed; In Progress / Not Started otherwise), **Total Score** (bar + percentage), **Proctoring** (flag count or "—"), **Actions**.
   - **View** in Actions links to the candidate result detail (see below).

5. **Search**
   - Type in the search box: list filters by candidate name or email (client-side).

6. **Empty state**
   - If there are no candidates for the assessment, the table shows: "No candidates yet. Invite candidates to get started."

---

## 5. Test the candidate result detail page

1. **Open detail**
   - From the results list, click **View** on a row.  
   - URL format: `/dashboard/assessments/<assessmentId>/results/candidate/<attemptId>`  
   - The segment after `candidate/` is the **attempt ID** (not candidate ID); the page calls `GET /api/attempts/:attemptId/result`.

2. **Page load**
   - Loading spinner, then full result (or error if attempt not found / API failure).

3. **Header**
   - Candidate name (or email), email, assessment title, started date.
   - Status badge: Strong Hire / Consider / Reject (for completed) or In Progress / Not Started.
   - Share Report and PDF buttons (UI only for now).

4. **Score overview**
   - **Assessment Timeline:** One node per round (MCQ, DSA, AI) with icon, percentage, and status (e.g. "95% / Completed").
   - **Overall Score:** Large percentage and the same status badge.

5. **Round-wise breakdown**
   - One card per round from `result.rounds`: round type and label (e.g. "MCQ: Technical MCQ"), status, score (e.g. "85% (17 / 20)"), progress bar, and "Evaluated at" if present.

6. **Proctoring**
   - If `proctoringSummary.totalEvents === 0`: "No suspicious activity detected during the session."
   - If there are events: total count and breakdown by severity and by type (from `bySeverity` and `byType`).

7. **Back**
   - **Back** (arrow) returns to the assessment results list for that assessment.

---

## 6. Edge cases to check

| Scenario | Expected |
|----------|----------|
| Assessment with no candidates | Stats show 0; table shows "No candidates yet. Invite candidates to get started." |
| Invalid or deleted attemptId in URL | Detail page shows error (e.g. "Result not found" or API error message). |
| Unauthenticated / not recruiter | Results API may return 401; list or detail shows error. |
| All attempts in progress | Avg Score "—"; Top Tier 0; Pending > 0; table statuses "In Progress". |

---

## 7. Quick verification (API)

- **List:**  
  `GET /api/assessments/<assessmentId>/results`  
  Header: `Authorization: Bearer <recruiter_jwt>`  
  Response: `assessmentTitle`, `totalCandidates`, `completedCount`, `results[]` with `attemptId`, `candidateEmail`, `candidateName`, `status`, `percentage`, `proctoringFlags`, etc.

- **Detail:**  
  `GET /api/attempts/<attemptId>/result`  
  (No auth required in current backend; can be called without token for candidate-facing report.)  
  Response: candidate info, `rounds[]` (roundType, score, maxScore, percentage, status), `proctoringSummary` (totalEvents, bySeverity, byType).

---

## Summary

- **Results list:** Real data from `GET /api/assessments/:id/results`; stats, table, search, View → detail by **attemptId**.
- **Candidate detail:** Real data from `GET /api/attempts/:attemptId/result`; rounds and proctoring from API; URL segment is attemptId.

For end-to-end data, create an assessment, invite candidates, and have at least one candidate complete (or start) the assessment using [CANDIDATE_TEST_EXPERIENCE_TESTING.md](./CANDIDATE_TEST_EXPERIENCE_TESTING.md), then use this guide to verify the analytics dashboard.

# Candidate Test Experience – Testing Guide

Steps for testing the **candidate flow**: start assessment → system check → identity check → rounds (MCQ / DSA / AI) → submit → completed. No external services (Resend, etc.) required for this flow.

---

## Prerequisites

- **Backend:** Node, MongoDB (Redis not required for the candidate flow).
- **Frontend:** Node, `NEXT_PUBLIC_API_URL` pointing at your backend.
- An **assessment** that is **published** (ACTIVE) with at least one round configured (e.g. MCQ with questions selected in the question bank).

---

## 1. Backend

1. `cd FluxAI-backend`
2. `.env` must have at least: `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`, `FRONTEND_URL`.
3. Start API: `npm run dev` (e.g. `http://localhost:5001`).

No worker or Redis needed to test the candidate flow.

---

## 2. Frontend

1. `cd FluxAI-frontend`
2. `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:5001/api` (match your backend).
3. Start app: `npm run dev` (e.g. `http://localhost:3000`).

---

## 3. Prepare an assessment (recruiter)

1. Sign in as a recruiter and complete onboarding if needed.
2. Create an assessment and **configure at least the MCQ round**:
   - Add/select questions in the question bank (MCQ type).
   - In assessment configure rounds, set MCQ enabled and attach the question IDs (e.g. single correct + multi correct as per your backend schema).
3. **Publish** the assessment (status must be ACTIVE).
4. (Optional) Use **Invite** to send test links, or copy the start URL manually (see below).

---

## 4. Test the candidate flow

1. **Open the start URL**  
   - With email from invite:  
     `http://localhost:3000/assessment/<assessmentId>/start?email=candidate@example.com`  
   - Or without query:  
     `http://localhost:3000/assessment/<assessmentId>/start`  
   - Replace `<assessmentId>` with the real assessment ID (e.g. from the dashboard URL when you open an assessment).

2. **Start**  
   - Enter the email (pre-filled if `?email=` is present).  
   - Click **Start Assessment**.  
   - You should be redirected to **System check**.

3. **System check**  
   - Complete the checks and consent, then **Proceed to Identity Check**.

4. **Identity check**  
   - Click **Confirm & Start Round 1**.  
   - You should land on **Round 1** (e.g. MCQ).

5. **Round (MCQ)**  
   - Questions should load from the backend (no mock data).  
   - Select answers and click **Submit Section**.  
   - You should be taken to the next round or to **Completed**.

6. **Later rounds (DSA / AI)**  
   - If configured, DSA shows the first problem and a code editor; submit sends `code` and `language`.  
   - AI round can be submitted with placeholder payload.  
   - After the last round you should see **Assessment Submitted** (completed page).

7. **Verify in backend**  
   - In MongoDB (or via your API): the attempt should have `status: COMPLETED` (or IN_PROGRESS if you didn’t finish all rounds), and round(s) should have `answers` and `status: COMPLETED`.  
   - For MCQ, an **Evaluation** document should exist for that attempt (MCQ score).

---

## 5. Quick checklist

- [ ] Backend running with valid `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`, `FRONTEND_URL`
- [ ] Frontend running with `NEXT_PUBLIC_API_URL` set
- [ ] Assessment is **published** and has at least **MCQ round configured** with question IDs that exist in the question bank
- [ ] Open start URL (with or without `?email=`)
- [ ] Enter email → Start Assessment → System check → Identity check → Round 1
- [ ] MCQ: questions load, select answers, Submit Section → next round or completed
- [ ] Attempt and evaluations visible in DB / API

---

## 6. If something fails

- **“Assessment not found” / “Not active”:** Assessment must be **published** (ACTIVE). Only ACTIVE assessments accept start attempt.
- **“Round not configured” / no questions:** Configure the round in the assessment (e.g. MCQ) and attach question IDs that exist in the question bank.
- **Blank or “Invalid round”:** Ensure you went through Start (so attemptId and round order are stored). If you open `/assessment/.../round/0` without starting first, you’ll be redirected to start.
- **Network errors:** Check `NEXT_PUBLIC_API_URL` and CORS; ensure backend is running.

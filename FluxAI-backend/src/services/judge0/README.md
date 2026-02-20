# Judge0 integration (DSA / coding round)

## What the coding round does

1. **Candidate flow (frontend)**
   - Candidate is on a DSA round (`/assessment/:id/round/2` for round 2).
   - One problem at a time: problem text, code editor (textarea), language (default Python), **Run Code** and **Submit Solution**.
   - **Run Code**: sends `POST /api/public/run-code` with `{ code, language, stdin? }`. Response is shown in the output panel (stdout, stderr, compile error, status, time, memory). No auth.
   - **Submit Solution**: sends the current code + language to the attempts API (submit answer for that question). Backend saves the answer and, when the round is submitted, enqueues **DSA evaluation** (Judge0 test cases).

2. **Backend – live run (Run Code)**
   - `POST /api/public/run-code` → `public.service.runCode()` → `judge0.client.runCode()`.
   - Sends the code to Judge0 (POST /submissions with `wait=true` or, if the host disallows wait, `wait=false` + poll until done).
   - Returns stdout, stderr, statusDescription, timeSeconds, memoryKb, compileError, exitCode to the frontend.

3. **Backend – DSA evaluation (after submit)**
   - When the candidate submits the DSA round, `attempts.service.submitRound()` enqueues a job `EVALUATE_DSA` with `{ attemptId, submission: { code, language } }`.
   - Worker runs `evaluation.processor.processDSAEvaluation()`:
     - Loads attempt and assessment, finds the DSA round and its question IDs.
     - Loads questions that have **test cases** (stdin + expectedStdout) from the question bank.
     - For each test case, calls `judge0.client.runTestCase(code, languageId, stdin, expectedStdout)`.
     - Aggregates passed/failed and writes the result into the Evaluation document (score, test results, judge0Error if Judge0 failed).

## Judge0 client behaviour

- **Sync first**: POST `/submissions?base64_encoded=false&wait=true`. If the host returns the full result, we return it.
- **Async fallback**: If the host returns 400 with "wait not allowed" (or we get a token and pending status), we POST with `wait=false`, then **poll** `GET /submissions/{token}` every 800ms until status is not "In Queue" or "Processing", then return the same result shape.
- **Auth**: Supports `X-Auth-Token` (Judge0 CE) or RapidAPI headers (`X-RapidAPI-Key`, `X-RapidAPI-Host`).

## Do I need to run Judge0 locally?

**No.** The app always uses Judge0 **via our backend API** (frontend → our API → Judge0). You can use any of these:

| Option | JUDGE0_BASE_URL | When to use |
|--------|------------------|-------------|
| **Judge0 CE (hosted)** | `https://ce.judge0.com` | **Default.** No Docker. Set `JUDGE0_AUTH_TOKEN` if the instance requires it. |
| **Self-hosted (Docker)** | `http://localhost:2358` | Dev: no account, no rate limits, works offline. |
| **RapidAPI** | (use RapidAPI host) | Use Judge0 via RapidAPI; set `JUDGE0_RAPIDAPI_KEY` and `JUDGE0_RAPIDAPI_HOST`. |

## Env configuration

- `JUDGE0_BASE_URL`: default `https://ce.judge0.com` (hosted). Override with `http://localhost:2358` for self-hosted.
- `JUDGE0_AUTH_TOKEN`: if the Judge0 instance requires auth.
- For RapidAPI: `JUDGE0_RAPIDAPI_KEY`, `JUDGE0_RAPIDAPI_HOST`.

See `.env.example` in the backend root.

## Language IDs

The client maps our language slugs (e.g. `python`, `javascript`, `cpp`) to Judge0 `language_id` (e.g. 71, 63, 54). See `JUDGE0_LANGUAGE_IDS` in `judge0.client.ts`.

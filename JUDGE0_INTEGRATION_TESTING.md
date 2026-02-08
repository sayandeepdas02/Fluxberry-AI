# Judge0 Integration – Testing Guide

Steps for testing **DSA round code execution and grading** via [Judge0 CE](https://github.com/judge0/judge0). Candidate code is run in a sandbox against test cases; the evaluation job updates the DSA score and metadata.

---

## Prerequisites

- **Backend:** Node, MongoDB, Redis (for BullMQ).
- **Judge0:** Either:
  - **Self-hosted Judge0 CE** (Docker), or
  - **Judge0 on RapidAPI** ([Judge0 CE](https://rapidapi.com/judge0-official/api/judge0-ce)) or Judge0 Cloud (with base URL + auth token).
- **DSA question** with **test cases** (see below). Without test cases, the job leaves the evaluation as placeholder (score 0, status PENDING).

---

## 1. Judge0 setup

### Option A – Self-hosted Judge0 CE (Docker)

1. Clone and run Judge0 CE per [official deployment](https://github.com/judge0/judge0/blob/master/CHANGELOG.md#deployment-procedure):
   ```bash
   git clone https://github.com/judge0/judge0.git
   cd judge0
   # Follow their docker-compose / install steps so API is on e.g. http://localhost:2358
   ```
2. In backend `.env`:
   ```env
   JUDGE0_BASE_URL=http://localhost:2358
   JUDGE0_AUTH_TOKEN=
   ```
   (Leave `JUDGE0_AUTH_TOKEN` empty if your instance has auth disabled.)

### Option B – Judge0 on RapidAPI

1. Subscribe to [Judge0 CE on RapidAPI](https://rapidapi.com/judge0-official/api/judge0-ce).
2. Set the base URL and RapidAPI headers (the backend sends `X-RapidAPI-Key` and optionally `X-RapidAPI-Host`):
   ```env
   JUDGE0_BASE_URL=https://judge0-ce.p.rapidapi.com
   JUDGE0_RAPIDAPI_KEY=your_rapidapi_key
   JUDGE0_RAPIDAPI_HOST=judge0-ce.p.rapidapi.com
   ```
   Use the host value shown in the RapidAPI dashboard for the Judge0 CE API.

### Option C – No Judge0 (placeholder only)

If you do not set `JUDGE0_BASE_URL` or Judge0 is unreachable, the worker still runs but will not call Judge0. When there are no test cases or Judge0 fails, the DSA evaluation stays or is set to placeholder (score 0, status PENDING or EVALUATED with `judge0Error`).

---

## 2. Backend env and run

1. `cd FluxAI-backend`
2. `.env`: ensure `MONGODB_URI`, `JWT_SECRET`, `REDIS_URL`, and Judge0 vars (see above).
3. Start API: `npm run dev`
4. Start **worker**: `npm run worker` (so `EVALUATE_DSA` jobs are processed).

---

## 3. Add test cases to a DSA question

Test cases are stored on the **question** and are **not** sent to the candidate. Each test case has `stdin` and `expectedStdout`. The worker runs the candidate’s code with each `stdin` and compares stdout (trimmed) to `expectedStdout`.

- **Via API (recommended):** Use **POST /api/questions** to create a DSA question or **PATCH /api/questions/:id** to add/update test cases (recruiter auth required). Example create body:
  ```json
  {
    "type": "DSA",
    "title": "Hello name",
    "difficulty": "EASY",
    "topics": ["io"],
    "dsaDetails": {
      "prompt": "Read a name from stdin and print 'Hello, <name>'.",
      "starterCode": { "python": "name = input()\n# your code" },
      "languagesSupported": ["python"],
      "testCases": [
        { "stdin": "Alice", "expectedStdout": "Hello, Alice" },
        { "stdin": "Bob", "expectedStdout": "Hello, Bob" }
      ]
    }
  }
  ```
  For PATCH, send only the fields to update (e.g. `{ "dsaDetails": { "testCases": [...] } }`); other DSA fields are merged.
- **Via DB:** In MongoDB, update the DSA question document:
  ```javascript
  db.questions.updateOne(
    { _id: ObjectId("YOUR_DSA_QUESTION_ID"), type: "DSA" },
    { $set: { "dsaDetails.testCases": [
      { stdin: "Alice", expectedStdout: "Hello, Alice\n" },
      { stdin: "Bob", expectedStdout: "Hello, Bob\n" }
    ] } }
  )
  ```
  Use newlines in `expectedStdout` if the program prints with a newline.

---

## 4. Run the candidate flow and trigger DSA evaluation

1. Create an assessment with the **DSA round** enabled and the DSA question (with test cases) in the round config.
2. As a candidate, start the assessment, complete system/identity checks, and open the DSA round.
3. **Run Code** (optional): The **Run Code** button sends the current code to **POST /api/public/run-code**; the backend runs it via Judge0 with empty stdin and returns stdout/stderr/status. Output is shown in a collapsible panel below the editor.
4. Submit code in a **supported language** (e.g. `python`, `javascript`, `java`, `cpp`, `c`).
5. Click **Submit**. The round is saved and a **placeholder** DSA evaluation is created immediately (score 0). An **EVALUATE_DSA** job is enqueued.
6. The **worker** picks up the job, loads the first DSA question that has test cases, maps the submission language to Judge0 `language_id`, and runs the code against each test case via Judge0 (`wait=true`). It then updates the **Evaluation** document: `score`, `maxScore`, `metadata` (status `EVALUATED`, `testCasesRun`, `testCasesPassed`, `testResults`).

---

## 5. Verify results

- **Dashboard:** Open the assessment **Results** list and open the candidate’s result. The DSA round should show a **score** and **percentage** (e.g. 2/2 → 100%) once the job has run.
- **Candidate result detail:** The round-wise breakdown should show the DSA score and percentage.
- **DB:** Check the `evaluations` collection for the attempt and `roundType: 'DSA'`: `score`, `maxScore`, and `metadata.testCasesPassed`, `metadata.testResults`, `metadata.status: 'EVALUATED'`.
- **Worker logs:** You should see “Processing EVALUATE_DSA job” and “Completed EVALUATE_DSA job”. If Judge0 is down or the language is unsupported, `metadata.judge0Error` will be set and score can remain 0.

---

## 6. Edge cases

| Scenario | Expected behavior |
|----------|-------------------|
| No test cases on any DSA question in the round | Evaluation stays placeholder (PENDING), score 0. |
| Judge0 base URL not set or unreachable | Job may throw; we catch and set `metadata.judge0Error`, score 0. |
| Unsupported language (e.g. `haskell`) | `judge0Error: Unsupported language: haskell`, score 0. |
| Code compiles but fails some tests | `testCasesPassed` &lt; `testCasesRun`; score = passed count, maxScore = total tests. |
| Code has runtime error / TLE | Judge0 returns non-Accepted status; that test case is failed, others may still pass. |

---

## 7. Supported languages (Judge0 CE)

The backend maps these (case-insensitive) to Judge0 CE language IDs: `python`, `javascript`, `node`, `java`, `cpp`, `c`, `csharp`, `go`, `ruby`, `php`, `rust`, `kotlin`, `swift`. Add more in `services/judge0/judge0.client.ts` (`JUDGE0_LANGUAGE_IDS`) if your Judge0 instance supports them.

---

## Summary

- **Test cases** live on DSA questions (`dsaDetails.testCases`: `stdin`, `expectedStdout`); they are not exposed to the candidate.
- **On DSA submit:** Placeholder evaluation is created and **EVALUATE_DSA** is enqueued.
- **Worker:** Loads attempt → assessment → DSA round → first question with test cases; runs code via Judge0 for each test case; updates Evaluation with score and metadata.
- **Env:** `JUDGE0_BASE_URL` (required for real grading), `JUDGE0_AUTH_TOKEN` (if your Judge0 instance requires it).

For full candidate flow (start → rounds → submit), see [CANDIDATE_TEST_EXPERIENCE_TESTING.md](./CANDIDATE_TEST_EXPERIENCE_TESTING.md). For results UI, see [ANALYTICS_DASHBOARD_TESTING.md](./ANALYTICS_DASHBOARD_TESTING.md).

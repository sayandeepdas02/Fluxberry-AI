# Email Integration – Tester Steps

Steps for testing the **invite candidates + send test link** feature (email integration).

---

## Prerequisites

- **Node.js** (v16+; v18+ preferred)
- **MongoDB** running (e.g. `mongodb://localhost:27017`)
- **Redis** running (e.g. `localhost:6379`) — required for invite email jobs
- **(Optional)** **Resend account** — only if you want real emails; without it, jobs still run and links are logged in the worker

---

## Resend Setup (For Real Emails)

If you want invite emails to be **actually sent** to candidates (or a test inbox), do the following on [Resend](https://resend.com). If you skip this, the app still works and the invite link is printed in the worker terminal.

### 1. Create a Resend account

1. Go to **[resend.com](https://resend.com)**.
2. Click **Sign up** (or **Get started**).
3. Sign up with email or Google/GitHub.
4. Verify your email if prompted.

### 2. Get an API key

1. Log in to the [Resend dashboard](https://resend.com/overview).
2. Go to **API Keys**: click **API Keys** in the left sidebar, or open **[resend.com/api-keys](https://resend.com/api-keys)**.
3. Click **Create API Key**.
4. Give it a name (e.g. `FluxAI dev` or `FluxAI production`).
5. Choose permissions: **Sending access** is enough (full access also works).
6. Click **Add**.
7. **Copy the API key** — it is shown only once. If you lose it, create a new key.
8. In your backend `.env` file, add:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
   ```
   (Use your actual key; no quotes unless your key has spaces.)

### 3. Sender address (who the email is “from”)

Resend needs a verified **from** address. Two options:

**Option A — Use Resend’s test sender (easiest for testing)**

- New accounts get a test sender: **`onboarding@resend.dev`**.
- You can send **only to the email address of your Resend account** (the one you signed up with). Other addresses will not receive the email.
- In backend `.env` you can set (optional; this is the default in code):
  ```env
  RESEND_FROM_EMAIL="FluxAI <onboarding@resend.dev>"
  ```
- To test: invite the **same email you used to sign up for Resend**; the email will arrive in that inbox.

**Option B — Use your own domain (for real candidates)**

1. In Resend dashboard, go to **Domains**.
2. Click **Add Domain** and enter your domain (e.g. `yourcompany.com`).
3. Add the DNS records Resend shows (MX, TXT, etc.) in your domain’s DNS settings.
4. Wait until Resend shows the domain as **Verified**.
5. Then set in backend `.env`:
   ```env
   RESEND_FROM_EMAIL="FluxAI <noreply@yourcompany.com>"
   ```
   (Use a real mailbox or alias on that domain.)

### 4. Free tier limits (Resend)

- **Free tier:** 100 emails per day, 3,000 per month.
- No credit card required for the free tier.
- Enough for development and light testing.

### 5. Environment variables summary (backend)

| Variable            | Required | Description |
|---------------------|----------|-------------|
| `RESEND_API_KEY`    | Yes*     | API key from Resend dashboard. *Required only for real sending; if missing, invites are only logged. |
| `RESEND_FROM_EMAIL` | No       | Sender shown in the email. Default in code: `FluxAI <onboarding@resend.dev>`. Use your verified domain for production. |

### 6. After changing Resend settings

- Restart the **worker** (`npm run worker`) so it picks up the new `RESEND_API_KEY` or `RESEND_FROM_EMAIL`.
- The API server does not send emails; only the worker does.

### 7. Verify in Resend dashboard

- Go to **Emails** (or **Logs**) in the Resend dashboard.
- After sending an invite, you should see the email listed (sent, delivered, or failed).
- Use this to debug if the candidate does not receive the email.

---

## 1. Backend

1. **Go to backend folder**
   - `cd FluxAI-backend`

2. **Install dependencies** (if not already done)
   - `npm install`

3. **Environment**
   - Copy: `cp .env.example .env` (Windows: `copy .env.example .env`)
   - Edit `.env` and set at least:
     - `MONGODB_URI` — e.g. `mongodb://localhost:27017/fluxai`
     - `JWT_SECRET` — any long random string
     - `CORS_ORIGIN` — e.g. `http://localhost:3000`
     - `FRONTEND_URL` — e.g. `http://localhost:3000` (used to build invite links)
   - **Optional (real email):** Add `RESEND_API_KEY` (and optionally `RESEND_FROM_EMAIL`).  
     See **Resend Setup** above for step-by-step Resend account and API key.  
     If **not** set, invite emails are only logged in the worker (no error).

4. **Start the API**
   - `npm run dev`
   - You should see the server on `http://localhost:5001` (or your `PORT`).

5. **Start the worker** (separate terminal, same folder)
   - `npm run worker`
   - This processes “send invite email” jobs. Without it, invites are queued but never sent/logged.

---

## 2. Frontend

1. **Go to frontend folder**
   - `cd FluxAI-frontend`

2. **Install dependencies** (if not already done)
   - `npm install`

3. **Environment**
   - Create `.env.local` (or copy from example) and set:
     - `NEXT_PUBLIC_API_URL=http://localhost:5001/api` (match your backend port)

4. **Start the app**
   - `npm run dev`
   - You should see the app on `http://localhost:3000`.

---

## 3. Test the Flow

1. **Sign up / sign in**
   - Open `http://localhost:3000`, sign up or sign in as a recruiter.
   - Complete onboarding if prompted (steps 1–3).

2. **Create and publish an assessment**
   - Go to Dashboard → Assessments → create a new assessment.
   - Configure at least one round (e.g. MCQ) and save.
   - **Publish** the assessment (it must be **Active** to invite).

3. **Invite candidates**
   - Open the **Invite** step for that assessment (e.g. “Invite candidates” or step 3).
   - In the textarea, enter one or more emails (comma or newline), e.g.  
     `test@example.com` or `a@b.com, c@d.com`.
   - Click **“Send Test Link”**.
   - You should see:
     - Loading, then a green message: **“Invite emails queued for N candidates.”**
     - If validation fails (e.g. invalid email), a red error message.

4. **Verify on the backend**
   - **Worker terminal:**  
     Without Resend: you should see logs like  
     `[DEV] No RESEND_API_KEY — would send invite to test@example.com` and the **invite link**.  
     With Resend: no such log; email is sent.
   - **API:** No need to call the API manually; the UI does it.

5. **Verify the invite link (optional)**
   - Copy the invite link from the worker log (or from the email if Resend is configured).
   - Format: `http://localhost:3000/assessment/<assessmentId>/start?email=<email>`
   - Open it in a browser: the assessment start page should load (candidate flow can be tested later).

---

## 4. Quick Checklist for Tester

- [ ] MongoDB running, `MONGODB_URI` in backend `.env`
- [ ] Redis running
- [ ] Backend `.env`: `JWT_SECRET`, `CORS_ORIGIN`, `FRONTEND_URL` set
- [ ] Backend: `npm run dev` (API up)
- [ ] Backend: `npm run worker` in a second terminal (worker up)
- [ ] Frontend: `.env.local` has `NEXT_PUBLIC_API_URL`
- [ ] Frontend: `npm run dev` (app up)
- [ ] Sign in, create assessment, **publish** it
- [ ] Invite screen: enter emails → “Send Test Link” → green success
- [ ] Worker terminal: see log with invite link (or receive email if Resend is set)

---

## 5. If Something Doesn’t Work

- **“Assessment not found” / 404:** Ensure the assessment is **published** (Active). Only published assessments can be invited to.
- **No success message / network error:** Check `NEXT_PUBLIC_API_URL` and that the backend is running on that port; check browser devtools Network tab.
- **Invites “stuck” / no email and no log:** Worker must be running (`npm run worker`) and Redis must be up.
- **Real email not received:** Add `RESEND_API_KEY` (and optionally `RESEND_FROM_EMAIL`) in backend `.env`, restart the worker, and check Resend dashboard for delivery.

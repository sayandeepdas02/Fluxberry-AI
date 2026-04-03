✅ 1. Frontend ↔ Backend DISCONNECTED (FIXED)
*Status: Fixed! All core hooks audited and wired to backend endpoints.*

Resolved issues:
- Jobs no longer using mock data (public endpoints wired).
- Pipeline drag-drop properly hitting `/stage_transition` API.
- Offers successfully hitting backend hooks.
- No mock imports remaining in application hooks.
✅ 2. Job Creation Flow Not Fully Persisting (FIXED)
*Status: Fixed! Mapped `requirements` field correctly, removed generic type bypassing.*

Resolved issues:
- Replaced missing payload parameters natively matching backend's `createJobSchema` constraints.
- Eliminated type coercion `as any` from POST queries to prevent silent desyncs.


✅ 3. ATS Pipeline Drag-Drop Not Saving (FIXED)
*Status: Fixed! Endpoints meticulously wired and confirmed executing live.*

Resolved issues:
- Switched the target URL in `onDragEnd` hook flow to accurately hit `/applications/{id}/move-stage` where the backend expects the JSON `{ stageId }` structure.
✅ 4. Copilot (AI Chat) Not Connected (FIXED)
*Status: Fixed! Developed entire Chat infrastructure and wired end-to-end to RAG backend.*

Resolved issues:
- Added `chatWithCopilot` to backend `CopilotService` initializing dynamic context from Top-10 ATS ranked candidates array and Job settings for rich `gpt-4o-mini` RAG query ingestion.
- Implemented `POST /api/ats-screening/:jobId/copilot/chat` handler to manage history persistence and message forwarding.
- Built a native `CopilotChatPanel` slide-out sheet on the ATS Dashboard allowing Recruiters to instantly evaluate candidates via conversation.

✅ 5. AI Interview Not Connected to Backend Socket (FIXED)
*Status: Fixed! Wired socket correctly to use LocalStorage token standard and dynamic workspace URLs.*

Resolved issues:
- Fixed `useInterviewSocket.ts` to construct the WebSocket URL gracefully from standard environment variables parsing the trailing paths correctly.
- Switched the authorization pipeline in `useInterviewSocket.ts` to `getStoredToken()` from `@/lib/api/client` instead of incorrectly checking for non-existent `document.cookie` tokens, ensuring the WS gateway actually authenticates real-time streams gracefully.

✅ 6. Offer System Not Actually Generating PDFs (FIXED)
*Status: Fixed! Wired candidate signature acceptance correctly to generate PDFs dynamically.*

Resolved issues:
- Found a payload mismatch where the frontend's `acceptOffer` submitted flat `{ name, data }` while the backend PDF generator strictly required it scoped under `signature: { type: 'DRAWN' }`.
- Fixed the API payload, unlocking the existing backend flow (`Backend → generate PDF → Upload → S3 → Return signed URL`) when candidates accept the offer inside the public `/offer/:token` page.
✅ 7. Signature Not Persisted (FIXED)
*Status: Fixed! Canvas strokes now accurately persist to MongoDB and S3 embedded inside the PDF via PDF-Lib.*

Resolved issues:
- Since the payload crashed before reaching the DB, the valid drawn signatures from Canvas were evaporating into thin air.
- Now securely extracted via `pdfDoc.embedPng()`, anchored into the A4 coordinates, saved to S3 and explicitly pushed to the `OfferSignature` MongoDB collection natively.
✅ 8. Subscription System FAKE (FIXED)
*Status: Fixed! Subscription state now lives in MongoDB — localStorage fully removed.*

Resolved issues:
- Expanded `OrganizationSchema` with `trialActive`, `trialEndsAt`, and `installedApps` (Mixed field). A Mongoose async `pre('save')` hook auto-stamps a 14-day trial and enables all apps for every new organization.
- Created `GET /api/billing/status`, `POST /api/billing/apps/:id/install`, and `POST /api/billing/apps/:id/uninstall` endpoints backed by `BillingService`.
- Rewrote `subscription-context.tsx` to fetch live state from `billingApi.getStatus()` on mount. Removed all `localStorage.getItem/setItem` calls. Install/Uninstall mutations now hit the backend and update React state from the response.
- Added `src/lib/api/billing.ts` frontend API client with full TypeScript types.
🔴 9. No SWR / React Query Standardization
Problem:
Custom hooks
No caching
Manual state updates
Fix:
Move ALL to:
React Query (preferred)
🔴 10. Some UI Still Falls Back to Mock Data
Problem:
Hybrid system (API + mock)
Fix:

👉 ZERO tolerance rule:

Delete all:
/mocks/*
🔴 11. WebSocket Auth + CORS Not Fully Configured
Problem:
Real-time features need:
JWT auth
secure WSS
CORS handling
Fix:
Secure socket connection
Add auth middleware
🔴 12. No Proper Error Handling Layer
Problem:
UI assumes success everywhere
Fix:
Add:
toast errors
retry logic
fallback UI
🔴 13. No Loading States for Real APIs
Problem:
Will break UX once API latency exists
Fix:
Add skeleton loaders everywhere
🔴 14. Resume Upload Flow Not Fully Connected
Problem:
Backend parsing exists
Frontend not fully wired
Fix:
Upload → API → parse → store → link to candidate
🔴 15. Email System Not Triggered from UI
Problem:
Backend queue exists
UI not calling it
Fix:
Trigger:
POST /email/send
🔴 16. RBAC Not Enforced
Problem:
Roles exist
No real permission control
Fix:
Backend permission checks
Hide UI actions conditionally
⚠️ THINGS THAT STILL NEED TO BE BUILT (NOT JUST FIXED)
🧩 1. Billing System (Stripe)

Not built yet.

You need:

subscription plans
webhooks
enforcement
🧩 2. Production Infra for AI Interview

You have logic, but need:

STUN/TURN servers
scaling infra
audio reliability
🧩 3. Candidate Data Source (Talent Prospect)

Still a hard unsolved problem

Options:

APIs (Apollo, etc.)
CSV import
scraping infra
🧩 4. Monitoring & Observability

Missing:

logs
error tracking
metrics
🧩 5. Security Hardening

Need:

rate limiting
API validation
file security
🟢 WHAT IS ACTUALLY DONE (Important Reality)

You already have:

✔ Backend:
Auth ✅
Jobs system ✅
ATS engine ✅
AI scoring engine ✅
AI interview pipeline ✅
Email queue ✅
PDF service ✅
✔ Frontend:
Complete UX ✅
Complex flows ✅
High-quality UI ✅
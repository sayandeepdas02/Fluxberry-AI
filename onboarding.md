# Talent Onboarding Module - Fluxberry AI

## Overview
The Talent Onboarding Module is designed to streamline the post-interview process by automating document collection, dynamic form completion, offer generation, and candidate status updates. It bridges the gap between extending an offer and officially marking a candidate as hired.

## 1. Product POV

### Core Objectives
- **Centralized Onboarding**: Eliminate email back-and-forth by providing a secure portal for candidates to review offers, complete multi-step forms, and upload required onboarding documents.
- **Offer Generation Engine**: Allow recruiters to create dynamic offer templates, generate PDFs with variables, and securely collect candidate signatures.
- **Dynamic Form Builder**: Collect structured data from candidates using customizable, multi-step forms integrated directly into the onboarding workflow.
- **Automated Verification & Workflows**: Enable recruiters to review documents and forms with actionable feedback. Automate reminders for stalled candidates and enforce expiration deadlines on offers.
- **Advanced Analytics**: Track pipeline performance, acceptance rates, and average time-to-sign/complete in real time without impacting core system performance.
- **State Synchronization**: Automatically transition a candidate's ATS application status seamlessly from `OFFER_SENT` to `ONBOARDING` to `HIRED` as they progress through milestones.

### Key Features
- **Public Candidate Portal & Wizard**: Secure, token-based public pages acting as a step-by-step wizard for candidates to sign offers, fill forms, and upload documents.
- **Recruiter Dashboard**: Dedicated views for Offers, Templates, Active/Completed Onboardings, and detailed Analytics located in the ATS sidebar `/dashboard/onboarding/*`.
- **Workflow Automation (Cron Engine)**: Automated background services to chase pending signatures and stalled document uploads.

---

## 2. User Journey POV

### The Candidate Journey (In Detail)
1. **Offer Extended**: Following a successful interview, the recruiter changes the ATS stage to `OFFER_SENT`. The system generates an Offer Draft using a pre-defined template and candidate data. The candidate receives an email link containing a secure token to view their auto-generated PDF Offer Letter.
2. **Offer Acceptance & Signature**: The candidate accesses the public portal (`/offer/[token]`) where they can preview the Offer PDF. They can either accept the offer by signing it using a built-in digital signature pad (`react-signature-canvas`), or reject it.
3. **Onboarding Auto-Trigger**: Upon successful signature, a background process embeds the signature into the PDF for compliance. It automatically kicks off the onboarding checklist, sending the candidate a new invitation to the onboarding portal (`/onboarding/[token]`).
4. **Form Wizard Data Collection**: Before uploading files, the candidate faces a multi-step form wizard generated from the recruiter's `OnboardingFormTemplate`. Here they provide necessary structured data (e.g., emergency contacts, T-shirt sizing, start dates).
5. **Document Submission**: After the form, the portal displays a checklist of required documents (e.g., ID Proof, Tax Forms). The candidate drops and uploads the relevant files line by line securely.
6. **Reminders & Deadlines (Automated)**: 
   - If an offer is sent but not signed within 48 hours, they receive an automated nudge. 
   - If they miss the strictly enforced offer expiration date, their access link is revoked automatically.
   - If they have started onboarding but stalled on document uploads for >72 hours, they receive another targeted email reminder.
7. **Feedback Loop (Rejection)**: If a recruiter reviews an uploaded document and marks it as `REJECTED` (e.g., blurry ID), the candidate sees the rejection reason/feedback directly in their portal and is prompted to re-upload.
8. **Completion & Hired**: Once all required forms are submitted and all documents are `APPROVED` by the recruiter, the candidate receives final confirmation, and their ATS pipeline status is moved to `HIRED`.

### The Recruiter Journey (In Detail)
1. **Template Building**: The recruiter designs rich-text HTML `OfferTemplates` (using variables like `{{salary}}`) and dynamic `OnboardingFormTemplates` (specifying text, date, and dropdown fields).
2. **Offer Drafting & Sending**: The recruiter accesses a candidate, generates a new offer draft from a template, injects specific variables (salary, title, start date), and fires it to the candidate's email.
3. **Monitoring Pipeline**: The recruiter accesses `/dashboard/onboarding/*` to view an aggregate pipeline of all candidates, tracking their granular statuses from `DRAFT` to `SENT` to `SIGNED`, and eventually to the document review phase.
4. **Document & Form Review**: Clicking into an active onboarding candidate, the recruiter reviews submitted form data (JSON) and uploaded files side-by-side. They mark individual documents as `APPROVED` or `REJECTED` (including specific typed feedback for the candidate).
5. **Auto-Hiring**: The recruiter does *not* need to manually move the candidate to the `HIRED` stage. Once the recruiter approves the final required document AND the candidate has formally submitted the paired form, the background service auto-updates the job application status to `HIRED`.
6. **Analytics Insights**: Leadership/Recruiters view the `/dashboard/onboarding/analytics` page. This provides a visual breakdown (pie charts, funnels) tracking conversion rates, drop-off rates, and average time-to-hire metrics, powered by fast cached MongoDB pipelines.

---

## 3. Current Status: What is Working vs What is Not Working

### ✅ What is Working (Implemented & Verified)
- **Offer Generation**: End-to-end PDF generation using template variables works. Storing unsigned and signed PDFs in local/S3 uploads works.
- **Candidate Public Routes**: Token-based unauthenticated access routes for Offer Signing (`/offer/[token]`) and Onboarding Wizard (`/onboarding/[token]`) are fully functional and secure.
- **Digital Signatures**: The React Canvas signature component successfully captures candidate signatures and the backend validates the state transition to `SIGNED`.
- **Dynamic Forms**: Models for `OnboardingFormTemplate` and `OnboardingFormResponse` are operational. The Candidate UI steps through fields correctly.
- **Automated Cron Jobs (`ReminderEngine`)**: The background `node-cron` worker is correctly bound to server startup. It successfully scans for:
  - Expired offers (and revokes access).
  - Offers pending >48 hours (and dispatches reminder emails via `enqueueEmailJob`).
  - Stalled onboardings pending >72 hours (and dispatches reminder emails).
- **Recruiter Document Review**: Recruiters can successfully view, approve, and reject candidate documents with feedback via the dashboard modals.
- **System Automation**: The system accurately detects when all requirements (`APPROVED` documents + `SUBMITTED` forms) are met and automatically transitions the ATS status to `HIRED`.
- **Analytics Dashboards**: The aggregation pipelines (`onboardingAnalyticsService`) and frontend `recharts` visualizations accurately display acceptance rates and average onboarding times.
- **Feature Flags**: Environment variables (`ENABLE_OFFER_ENGINE`, `ENABLE_FORM_ENGINE`, `ENABLE_REMINDER_ENGINE`, `ENABLE_ANALYTICS`) correctly toggle these modules.

### ⚠️ What is Not Working (Pending / Future Enhancements)
- **PDF Signature Stamping**: While we generate the PDF and collect the signature image, the *visual stamping* of the signature image onto the final flattened PDF using a binary PDF manipulator (like `pdf-lib`) is currently bypassed or simplified in development; it requires strict coordinate mapping.
- **Complex Conditional Form Logic**: While `OnboardingFormTemplate` models support the `conditionalLogic` field (e.g., "If Yes, show Field B"), the frontend form wizard currently renders all fields linearly and does not fully evaluate complex branching paths dynamically yet.
- **Custom Reminder Cron Intervals**: The Reminder Engine explicitly checks hardcoded 48-hour and 72-hour intervals. Recruiters cannot currently configure these thresholds per-organization via the dashboard.
- **Activity Log Visualization**: The `ActivityLog` model accurately captures all events internally for the cron engine, but the frontend recruiter UI does not yet possess a "Timeline View" to display these raw audit logs to the user.
- **Extensive Unit Test Coverage**: End-to-end simulation scripts (`verify-offer-flow.ts`) work, but comprehensive Jest unit tests mocking individual service behaviors for edge cases (e.g., race conditions on document approvals) are pending.

---

## 4. Tech POV

### Architecture & Data Models
The module leverages the following core MongoDB models:
- **`OfferTemplate` & `OnboardingFormTemplate`**: Blueprints for document generation and structured data collection.
- **`Offer` & `OfferSignature`**: Tracks the granular lifecycle state of a drafted offer (`DRAFT`, `SENT`, `VIEWED`, `SIGNED`, `REJECTED`, `EXPIRED`), embedding IP data and generated PDF bucket URLs.
- **`Onboarding`**: Extended to track `workflowState`, `expiresAt`, `reminderCount`, and `lastReminderSentAt`.
- **`OnboardingFormResponse`**: Attaches a candidate's structured JSON data submission to an `Onboarding` parent.
- **`OnboardingDocument`**: Individual required files. Statuses: `PENDING`, `UPLOADED`, `APPROVED`, `REJECTED`.
- **`ActivityLog`**: A generic audit tracking system mapping entity transitions to fuel the reminder cron engine.

### Backend Implementation (`FluxAI-backend`)
- **Service Layer**:
  - `offerService`: Handles PDF generation, drafting, signature application, expiration tracking, and triggers `candidateOnboardingService` upon acceptance.
  - `onboardingFormService`: Fetches templates, mutates draft JSON responses, and validates payload sizes.
  - `candidateOnboardingService`: Extended `checkCompletion` to strictly enforce that the connected `formResponse` is formally `SUBMITTED` prior to transitioning state to `HIRED`.
  - `onboardingAnalyticsService`: Employs powerful `$group` and `$cond` aggregations to deliver pipeline KPIs. Uses a Redis layer to cache heavy queries.
- **Background Jobs (`reminder.engine.ts`)**:
  - A singleton class initialized via `node-cron` alongside the central Express `server.ts`. Automatically prunes expired offers, emails reminders for 48hr stalled offers, and chases stalled 72hr document tasks using the `bullmq` `enqueueEmailJob`.
- **Feature Flags**: Controlled via `src/config/env.ts`.

### Frontend Implementation (`FluxAI-frontend`)
- **API Client Layer**: Handled via typed proxies in `/lib/api/offers.ts` and `/lib/api/ats-onboarding.ts`.
- **UI Structure & Routing**:
  - Nested Next.js layouts powering `/app/dashboard/onboarding/`.
  - Separated public boundaries (`/app/offer/[token]` and `/app/onboarding/[token]`) protected strictly by non-guessable hash strings instead of Auth Tokens to permit candidate access.
- **Advanced Components**:
  - Integrates `react-signature-canvas` for candidate-facing offer acceptance.
  - Uses `react-pdf` or custom iframe strategies for Offer viewing.
  - Custom `OnboardingFormWizard` stepping through dynamic fields and document drops.
  - Integrates `recharts` for rich pie and funnel charting in the Admin Analytics route.

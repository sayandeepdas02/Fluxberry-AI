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

### The Candidate Journey
1. **Offer Extended**: The candidate receives an email link containing a secure token to view their auto-generated PDF Offer Letter.
2. **Offer Acceptance**: The candidate reviews the offer and signs it using a built-in digital signature pad (`/offer/[token]`).
3. **Onboarding Auto-Trigger**: Upon signing, a background process embeds the signature into the PDF and automatically kicks off the onboarding checklist, inviting the candidate to the portal (`/onboarding/[token]`).
4. **Form Wizard**: The candidate faces a multi-step form wizard to provide necessary structured data (e.g., emergency contacts, sizing, dates).
5. **Document Submission**: The portal displays a checklist of required documents. The candidate drops and uploads the relevant files line by line.
6. **Reminders & Deadlines**: If the candidate stalls for >72 hours, they receive an automated email nudge. If they miss strictly enforced offer expiration dates, access is revoked.
7. **Feedback Loop**: If a recruiter rejects a document, the candidate sees the rejection reason/feedback and is prompted to re-upload.
8. **Completion**: Once all forms are submitted and documents are approved, the candidate receives final confirmation.

### The Recruiter Journey
1. **Template Building**: The recruiter designs rich-text HTML `OfferTemplates` and dynamic `OnboardingFormTemplates`.
2. **Offer Drafting & Sending**: The recruiter generates a candidate-specific offer draft, injects salary/title variables, and fires it off.
3. **Monitoring Pipeline**: The recruiter accesses `/dashboard/onboarding/*` to view candidates navigating the pipeline from `DRAFT` to `SENT` to `SIGNED`.
4. **Document & Form Review**: Clicking into an onboarding candidate, the recruiter reviews submitted form data and uploaded files side-by-side. They mark documents as `APPROVED` or `REJECTED` (with feedback).
5. **Auto-Hiring**: Once the recruiter approves the final required document AND the candidate has submitted the paired form, the system auto-updates the candidate's job application status to `HIRED`.
6. **Analytics Insights**: Leadership views the `/dashboard/onboarding/analytics` page to track the conversion funnel, drop-off rates, and average time-to-hire metrics powered by cached MongoDB pipelines.

---

## 3. Tech POV

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
  - A singleton class initialized via `node-cron` alongside the central Express `server.ts`. Automatically prunes expired offers, emails reminders for 48hr stalled offers, and chases stalled 72hr document tasks.
- **Feature Flags**: Controlled via `src/config/env.ts` (`ENABLE_OFFER_ENGINE`, `ENABLE_FORM_ENGINE`, `ENABLE_REMINDER_ENGINE`, `ENABLE_ANALYTICS`).

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

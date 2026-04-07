# Fluxberry AI 🍓 

**Fluxberry AI** is an advanced, end-to-end Technical Hiring Assessment Platform designed to automate and streamline the recruitment lifecycle. From AI-driven technical screenings and interactive voice interviews to talent CRM and onboarding, Fluxberry provides a unified operating system for modern hiring teams.

---

## 🚀 Key Features

* **Intelligent ATS & Screening**: Automated parsing and scoring of resumes, matching candidates to job descriptions instantly. Includes a recruiter AI Copilot for deep-dive candidate analysis.
* **AI Voice Interviews**: Simulated real-time, conversational technical and behavioral interviews powered by state-of-the-art LLMs, TTS, and STT engines.
* **Technical Assessments**: Dynamic coding rounds with execution environments (via Judge0) and automated test case evaluation.
* **Talent Prospecting (CRM)**: Manage cold leads, organize talent pipelines, and automate multi-stage email outreach campaigns.
* **Offer & Onboarding Pipeline**: Automated offer letter generation (PDFs), e-signatures, and structured pre-onboarding workflows.
* **Analytics & Real-time Dashboards**: Track pipeline health, source-of-hire metrics, and campaign success rates.

---

## 🏗️ Architecture & Tech Stack

Fluxberry AI is built as a modern, decoupled monorepo consisting of a robust backend service and a highly interactive frontend web application.

### Frontend (`FluxAI-frontend`)
A blazing-fast, responsive dashboard and landing page built for recruiter efficiency and candidate experience.
* **Framework**: [Next.js 15](https://nextjs.org/) (App Router) & React 19
* **Styling**: Tailwind CSS v4, Framer Motion, Radix UI & Aceternity UI
* **State & Data Handling**: Zustand, React Query, SWR
* **Real-time & Video**: LiveKit Components, Socket.io-client
* **3D/Graphics**: Three.js & React Three Fiber

### Backend (`FluxAI-backend`)
A scalable, event-driven API engine orchestrating background jobs, LLM generation, and data relationships.
* **Framework**: Node.js & Express / TypeScript
* **Database**: MongoDB (Mongoose) & Redis for caching/sessions
* **Message Queue**: BullMQ (handling async tasks like Resume Parsing, Email Campaigns, AI Generation)
* **AI & Media**: OpenAI API, Deepgram SDK (Speech-to-Text), ElevenLabs (Text-to-Speech), LiveKit Server SDK
* **Integrations**: AWS S3 (Storage), Resend (Transactional Emails), Judge0 (Code Execution)

---

## 📂 Project Structure

```text
.
├── FluxAI-backend/                 # Node.js Express API & Workers
│   ├── src/
│   │   ├── ai/                     # Interactive AI flow & context memory
│   │   ├── database/               # Mongoose models & migrations
│   │   ├── jobs/                   # BullMQ processors and Redis setup
│   │   ├── modules/                # Core domain controllers & services (ATS, Analytics, Webhooks)
│   │   ├── services/               # Integrations (Judge0, Deepgram, S3, Resend)
│   │   └── server.ts               # Main application entry point
│   └── package.json
│
└── FluxAI-frontend/                # Next.js Application
    ├── src/
    │   ├── app/                    # Next.js App Router (Dashboard, Landing, Candidate portals)
    │   ├── components/             # Reusable UI components & Layouts
    │   ├── features/               # Feature-sliced domain boundaries (ATS, Assessments, Prospecting)
    │   └── config/                 # Navigation & site configurations
    └── package.json
```

---

## 🛠️ Getting Started

### Prerequisites

* **Node.js** v20+
* **MongoDB** (Local or Atlas)
* **Redis** (Local instance or Cloud up and running)
* Valid API Keys for OpenAI, Resend, LiveKit, Judge0 (optional)

### 1. Backend Setup

```bash
cd FluxAI-backend
npm install

# Set up your environment variables
cp .env.example .env
# Edit .env and supply required API keys and database URLs

# Run the API and background workers concurrently
npm run dev
```

### 2. Frontend Setup

```bash
cd FluxAI-frontend
npm install

# Set up environment variables
cp .env.example .env.local

# Run the Next.js development server
npm run dev
```
The application will be available at `http://localhost:3000` (frontend) and `http://localhost:5001` (API).

---

## 🤝 Contribution Guidelines
This repository is currently maintained by the internal team at Fluxberry AI. For internal contributions, please create feature branches stemming off `main` and submit PRs requiring code-owner review. Ensure `npm run lint` and `npm run test` pass before requesting a review.

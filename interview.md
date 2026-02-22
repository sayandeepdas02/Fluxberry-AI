# Interview Automation (Flux Hire)

## Overview
The **Interview Automation** feature (formerly "Flux Hire") is an AI-native screening and interview platform designed to scale hiring without sacrificing quality. It allows recruiters to create multi-stage assessments that include technical quizzes (MCQ), hands-on coding challenges (DSA), and autonomous AI video interviews.

## Core Features
-   **Multi-Modal Assessments**: Combine MCQs, Coding, and AI Video interviews in a single pipeline.
-   **Autonomous AI Interviewer**: Conducts structured video interviews, asks follow-up questions (planned), and records responses.
-   **Proctoring**: Full-screen enforcement, camera/mic monitoring, and identity verification.
-   **Automated Scoring**: Instant grading for MCQs and Test Cases; AI synthesis for video responses.

---

## 👥 Recruiter Journey

### 1. Create Assessment
*   **Navigation**: Dashboard -> Interview Automation -> Assessments -> New
*   **Action**: Enter a title (e.g., "Senior Frontend Engineer"), link it to a Job Post, and select the Role Type (Engineering, Product, etc.).

### 2. Configure Rounds
The recruiter configures up to 3 rounds for the assessment:
*   **Round 1: Technical Screening (MCQ)**
    *   **Default Set**: Auto-generated balanced mix of questions.
    *   **Custom Selection**: Manually select 30 questions from the question bank.
*   **Round 2: Hands-on Coding (DSA)**
    *   **Judge0 Integration**: Fully integrated with Judge0 CE for sandboxed code execution.
    *   **Problem Set**: Select 4 coding problems (e.g., Arrays, Trees, DP) with automated test cases.
    *   **Supported Languages**: Python, JavaScript, Java, C++, and more.
*   **Round 3: AI Video Interview**
    *   **Select Persona**: Choose an AI Agent to conduct the interview (e.g., "Sarah - Engineering Lead", "Mike - Product Manager").
    *   **Configuration**: The agent comes with a specific focus and question set tailored to the role.
    *   **Tech Stack**:
        *   **Video Storage**: AWS S3 (Presigned URLs).
        *   **STT (Speech-to-Text)**: Currently using a **Stub Provider** (Placeholder). Needs integration with Whisper or Deepgram.
        *   **Analysis Engine**: Currently using a **Stub Provider** (Keyword matching). Needs integration as an LLM Provider (OpenAI GPT-4).
        *   **Agent Logic**: Defined prompts (`agent-prompts.ts`) for structured interviews, but dynamic follow-up logic is currently mocked.

### 3. Invite Candidates
*   **Publish**: Switch the assessment status from `DRAFT` to `ACTIVE`.
*   **Share**:
    *   **Direct Link**: Copy the unique test link to share personally.
    *   **Email Invite**: Enter candidate email addresses to send system-generated invites.

### 4. Review Results
*   **Dashboard**: View a list of candidates and their status (Started, Completed).
*   **Deep Dive**: Click on a candidate to view:
    *   MCQ Score
    *   Code Execution Results (Pass/Fail constraints)
    *   **AI Synthesis**: Summary of video responses, key strengths, gaps, and an automated "Hire/No Hire" signal.

---

## 👤 Candidate Journey

### 1. Start Assessment
*   **Landing Page**: Candidate clicks the invite link and lands on a branded welcome page.
*   **Registration**: Enters Full Name and Email to begin.

### 2. System Check & Consent
*   **Hardware Check**: Automated verification of Camera, Microphone, Internet, and Fullscreen support.
*   **Consent**: Agrees to proctoring (video/audio recording) and screen monitoring.

### 3. Identity Verification
*   **Photo Capture**: Candidate takes a snapshot of themselves for identity proof.

### 4. Taking the Assessment
*   **Round 1 (MCQ)**: Timed multiple-choice questions.
*   **Round 2 (Coding)**: Integrated IDE with syntax highlighting to solve algorithms. Runs test cases against their code.
*   **Round 3 (AI Interview)**:
    *   **Interface**: Video capability with the AI Agent.
    *   **Flow**: Agent asks a question -> Candidate gets prep time -> Candidate records video answer -> Uploads to cloud.

### 5. Completion
*   **Submit**: Assessment is finalized.
*   **Feedback**: Candidate sees a "Thank You" screen.

---

## ✅ What is Working
*   **Assessment Creation**: Full CRUD flow for assessments.
*   **Configuration**: Ability to toggle and configure all 3 round types.
*   **Invite System**: Email parsing, validation, and sending invites.
*   **Candidate Access**: Unique link generation and authentication via email.
*   **System Checks**: robust hardware and network verification.
*   **AI Interview Backend**:
    *   Session management (Start/Resume/End).
    *   Pre-signed S3 URL generation for secure video uploads.
    *   Asynchronous processing queue (`PROCESS_AI_RESPONSE`).
    *   Result storage (Transcript, Analysis, Synthesis).

## 🚧 What is Missing / In Progress
*   **CSV Upload**: Bulk invite via CSV is UI-only ("Coming Soon").
*   **Real-time AI Interaction**: Currently, the AI interview is asynchronous (Prompt -> Record). Real-time conversational video (WebRTC stream with low latency) is a future enhancement.
*   **AI Intelligence**: The Speech-to-Text and Analysis modules are currently using **Stub Providers**. You must implement `ISpeechToTextProvider` (e.g., Whisper) and `IAnalysisProvider` (e.g., OpenAI) for the AI to actually "hear" and "grade" candidates.
*   **Advanced Proctoring**: Gaze tracking and tabs-out detection are basic; more advanced anti-cheat features are planned.
*   **Custom Question Sets for AI**: Recruiters can currently select *Agents* but cannot yet fully customize the specific list of questions for the AI round in the UI (backend supports it).

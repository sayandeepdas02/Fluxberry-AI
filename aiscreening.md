# Fluxberry AI: Round 3 (AI Screening) Progress Report

This document provides a highly detailed, end-to-end breakdown of the progress on **Round 3: AI Screening (Live Voice Interviews)**. It outlines the current state of both the frontend and backend architectures, third-party dependencies, and remaining implementation gaps.

---

## 🏗 System Architecture Overview

The AI Screening module is designed as a real-time speech conversation between a candidate and an LLM-driven avatar. 

*   **Audio/Video Transport:** LiveKit (WebRTC)
*   **Speech-to-Text (STT):** Deepgram
*   **Text-to-Speech (TTS):** ElevenLabs
*   **Intelligence:** OpenAI (GPT-4o/GPT-4-turbo)
*   **Orchestration Engine:** Custom Node.js State Machine (`InterviewOrchestrator.ts`)
*   **Asynchronous Queues:** BullMQ via Redis

---

## ✅ What is Built (Backend / Core Infrastructure)

The **Backend Infrastructure (`FluxAI-backend`) is extremely mature** and entirely built out to support complex AI interviews.

### 1. The Interview Orchestrator (`interviewOrchestrator.ts`)
A deterministic, 5-phase state machine has been successfully implemented to handle the lifecycle of an interview:
1.  **INTRO:** Warm-up and open-ended background questions.
2.  **PROJECT_DEEP_DIVE:** Candidate discusses past projects. *Includes "Grilling" logic: if correctness is < 6/10, the AI generates challenging follow-up questions.*
3.  **FUNDAMENTALS:** Role-specific technical questions (Backend, Frontend, Fullstack, DevOps).
4.  **CULTURE_FIT:** Behavioral questions.
5.  **SUMMARY:** Closing remarks and candidate questions.

### 2. Live WebSockets & Streaming (`gateway.ts` & Services)
*   **LiveKit Service:** Generates tokens and creates isolated WebRTC rooms for candidates to join.
*   **Deepgram STT:** Real-time transcription is wired in to parse candidate speech.
*   **ElevenLabs TTS:** Text is streamed into ElevenLabs for ultra-low latency conversational AI voice generation.
*   **LLM Service:** A rubric-based evaluation system scores candidates instantly on a dimensions scale (`projectDepth`, `fundamentals`, `communication`, `culture`).

### 3. Proctoring Engine (`proctoring.service.ts`)
An append-only security ledger exists. It listens to events like `TAB_SWITCH`, `MULTIPLE_FACES_DETECTED`, or `NO_FACE_DETECTED` and attaches severity rankings (`LOW`, `HIGH`, `CRITICAL`) to the candidate's attempt lifecycle.

### 4. Background Workers (`worker.ts`)
A robust concurrent `ai-interview` queue runs via **BullMQ/Redis** to handle final evaluations and orchestrator offloading so the main Express thread is not blocked by heavy LLM grading.

---

## 🚧 What is NOT Built (Frontend gaps)

### 1. The Candidate "Test-Taker" Experience
*   **Status:** Missing.
*   **Location:** The directory `FluxAI-frontend/src/features/interview-assessment/components/test-taker/ai-interview` is completely empty.
*   **Impact:** While the backend is ready to generate LiveKit tokens and host WebRTC sessions, there is no React component for the candidate to actually click "Join Interview", grant microphone/camera permissions, and see the AI avatar / wave form.

### 2. Recruiter UI to review AI Interviews
*   **Status:** Partially missing.
*   **Impact:** The backend generates exhaustive evaluations, scores out of 100, and lists "Red Flags" (e.g., "Candidate contradicted themselves"), but the recruiter UI needs a dedicated view to playback the transcript entirely and see the aggregated `scoreBreakdown`.

---

## 🔗 External Dependencies & Risks

To successfully run Round 3 in production, the following environment variables and paid accounts must be active and funded:

1.  **LiveKit Cloud / Self-Hosted:** `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`. Without this, the WebRTC room completely fails to generate.
2.  **ElevenLabs:** `ELEVENLABS_API_KEY`. The most latency-sensitive piece. If text-to-speech quotas are hit, the interview crashes.
3.  **Deepgram:** `DEEPGRAM_API_KEY`. Required for instant speech transcription.
4.  **OpenAI:** `OPENAI_API_KEY`. The brain behind the orchestrator rubric.
5.  **Redis:** Requires a stable Redis instance (`REDIS_URL`) because BullMQ handles the final asynchronous aggregation. Local testing requires `redis-server` running concurrently.

---

## 🚀 Recommendation for Next Steps

The immediate priority must be the Frontend integration. 

1.  **Build the `AIInterviewRoom.tsx`** component inside the empty `test-taker/ai-interview` directory using `@livekit/components-react`. 
2.  **Mount the LiveKit `<LiveKitRoom />`** context provider, handle microphone/camera permissions, and connect via the token provided by the backend.
3.  **Implement Proctoring Triggers:** Write simple front-end event listeners (e.g. `document.addEventListener("visibilitychange")`) to send WebSockets triggers back to the `proctoring.service.ts` when a candidate switches tabs.

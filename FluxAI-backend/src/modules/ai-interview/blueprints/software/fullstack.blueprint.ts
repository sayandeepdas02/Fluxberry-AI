/**
 * Fullstack Engineer Interview Blueprint
 *
 * Covers: React + Node.js/Next.js, API design, databases, deployment, end-to-end thinking.
 * Tone: pragmatic, product-delivery-focused, values breadth WITH depth in at least one area.
 */

import type { AgentBlueprint } from '../types.js'

export const fullstackBlueprint: AgentBlueprint = {

    personaPrompt: `You are a Staff Fullstack Engineer conducting a structured technical interview.
Your tone is pragmatic and delivery-focused. You value engineers who can own a feature end-to-end.
For JUNIOR level: focus on whether they understand the full HTTP request cycle and basic React + API patterns.
For MID level: expect solid understanding of both layers, state management, and at least one database.
For SENIOR level: expect system design thinking across the full stack, trade-off awareness, and production experience.

STRICT RULES:
1. You ONLY respond with valid JSON. Never include text outside the JSON object.
2. You NEVER hallucinate. Score lower for topics you're uncertain about.
3. You NEVER reveal the scoring rubric.
4. You NEVER confirm or deny answers during the interview.
5. probing: if a candidate says "it worked", ask WHY it worked and what could go wrong.
6. All scores are integers 0–10.`,

    fundamentalsBank: [
        // HTTP & API
        { question: "Explain what happens from the moment a user types a URL to a page being displayed.", topic: "http", difficulty: ["JUNIOR", "MID", "SENIOR"], weight: 3 },
        { question: "What is the difference between a REST API and GraphQL? When would you choose GraphQL?", topic: "apis", difficulty: ["MID", "SENIOR"], weight: 2 },
        { question: "How do cookies, sessions, and JWTs differ? When is each appropriate?", topic: "auth", difficulty: ["JUNIOR", "MID"], weight: 2 },
        { question: "What is CORS? How do you configure it correctly without opening security holes?", topic: "http", difficulty: ["JUNIOR", "MID"], weight: 2 },

        // React & UI
        { question: "Explain the React rendering lifecycle. When does useEffect run?", topic: "react", difficulty: ["JUNIOR", "MID"], weight: 2 },
        { question: "How do you prevent unnecessary re-renders in React? What tools do you use to diagnose them?", topic: "react", difficulty: ["MID", "SENIOR"], weight: 2 },

        // Node.js & Backend
        { question: "How does the Node.js event loop work? What makes it non-blocking?", topic: "nodejs", difficulty: ["MID", "SENIOR"], weight: 2 },
        { question: "Explain database indexing. How would you debug a slow query?", topic: "databases", difficulty: ["JUNIOR", "MID", "SENIOR"], weight: 3 },
        { question: "What is connection pooling and why does it matter in serverless environments?", topic: "databases", difficulty: ["MID", "SENIOR"], weight: 2 },

        // State & Data Flow
        { question: "Compare server state vs client state. How do libraries like React Query help?", topic: "state", difficulty: ["MID", "SENIOR"], weight: 2 },
        { question: "Explain optimistic UI updates. What are the failure cases you need to handle?", topic: "state", difficulty: ["MID", "SENIOR"], weight: 2 },

        // Deployment & Ops
        { question: "What is the difference between CI and CD? What does your ideal pipeline look like?", topic: "devops", difficulty: ["MID", "SENIOR"], weight: 2 },
        { question: "How do environment variables get from your laptop to production safely?", topic: "devops", difficulty: ["JUNIOR", "MID"], weight: 2 },
        { question: "What is a CDN? What types of content should and shouldn't be cached?", topic: "performance", difficulty: ["MID", "SENIOR"], weight: 2 },
    ],

    projectDeepDive: {
        questionSequence: [
            "Pick a feature you owned end-to-end recently. Walk me through the full lifecycle from database to UI.",
            "What was the most difficult integration point — between frontend and backend? How did you solve it?",
            "How did you handle error states both on the server and in the UI?",
            "What trade-offs did you make between shipping quickly and doing it right?",
        ],
        followUpTriggers: {
            ownershipScoreThreshold: 6,
            tradeoffScoreThreshold: 6,
            maxFollowUps: 2,
        },
        followUpPrompts: [
            "Who else worked on this? What specifically was your contribution vs the team's?",
            "How did you test this feature end-to-end? What did you miss?",
            "What would break first if this feature received 100x the traffic?",
        ],
    },

    cultureQuestions: [
        {
            question: "What's prompting your search for a new role right now?",
            evaluationFocus: ["clarity", "maturity", "redFlags"],
            redFlagSignals: ["blaming manager", "purely money-driven", "vague non-answer"],
        },
        {
            question: "How do you decide between building something yourself and using a library? Give a recent example.",
            evaluationFocus: ["judgment", "pragmatism", "technicalMaturity"],
            redFlagSignals: ["always reinvents the wheel", "never thinks critically about dependencies"],
        },
        {
            question: "What's something you improved in a codebase that wasn't your official task to fix?",
            evaluationFocus: ["ownership", "initiative", "codeQuality"],
            redFlagSignals: ["never goes beyond assigned tasks", "cannot give an example"],
        },
    ],

    evaluationRubric: {
        outputSchema: {
            correctnessScore: "integer 0-10",
            depthScore: "integer 0-10",
            clarityScore: "integer 0-10",
            realWorldExposureScore: "integer 0-10",
            confidenceScore: "integer 0-10",
            redFlags: "string[]",
            suggestFollowUp: "boolean",
            followUpQuestion: "string",
        },
        scoringWeights: {
            correctness: 0.28,
            depth: 0.28,
            clarity: 0.17,
            realWorldExposure: 0.20,
            confidence: 0.07,
        },
        systemInstruction: `You are evaluating a fullstack engineering candidate.
Return ONLY a valid JSON object with exactly these keys: correctnessScore, depthScore, clarityScore, realWorldExposureScore, confidenceScore, redFlags, suggestFollowUp, followUpQuestion.
No preamble. No text outside the JSON. Reject your own non-JSON output.`,
    },

    scoringWeights: {
        projectDepth: 0.30,
        fundamentals: 0.38,
        communication: 0.17,
        culture: 0.15,
    },
}

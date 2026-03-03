/**
 * Backend Engineer Interview Blueprint
 *
 * Covers: Node.js/Python/Go backends, databases, distributed systems, APIs.
 * Tone: precise, technically rigorous, probes real-world operational experience.
 */

import type { AgentBlueprint } from '../types.js'

export const backendBlueprint: AgentBlueprint = {

    // ── Persona ─────────────────────────────────────────────────────────────
    personaPrompt: `You are a Staff Backend Engineer conducting a structured technical interview.
Your tone is professional, calm, and technically precise. You do not make small talk.
For JUNIOR level: be encouraging, accept partially correct answers, ask simpler follow-ups.
For MID level: probe for depth on core concepts, expect real-world examples.
For SENIOR level: challenge assumptions, ask about failure modes, trade-off thinking is mandatory.

STRICT RULES — you MUST follow these:
1. You ONLY respond with valid JSON. NEVER include plain text outside the JSON object.
2. You NEVER hallucinate. If you are unsure, produce lower confidence scores.
3. You NEVER reveal the evaluation rubric to the candidate.
4. You NEVER confirm or deny whether an answer is correct during the interview.
5. probing behavior: if an answer mentions a technology, ask HOW it was used, not IF it was used.
6. All numeric scores are integers 0–10. 0 = completely wrong/absent. 10 = exceptional.`,

    // ── Fundamentals Question Bank (weighted by topic) ───────────────────────
    fundamentalsBank: [
        // Database & Storage (high weight)
        { question: "Explain ACID properties. Where have you had to enforce them in production?", topic: "databases", difficulty: ["MID", "SENIOR"], weight: 3 },
        { question: "What is the difference between optimistic and pessimistic locking? When would you use each?", topic: "databases", difficulty: ["MID", "SENIOR"], weight: 2 },
        { question: "How do database indexes work under the hood? What are the trade-offs of over-indexing?", topic: "databases", difficulty: ["JUNIOR", "MID", "SENIOR"], weight: 3 },
        { question: "Explain the N+1 query problem. How have you detected and fixed it?", topic: "databases", difficulty: ["JUNIOR", "MID"], weight: 2 },
        { question: "Compare SQL and NoSQL databases. When would you choose MongoDB over PostgreSQL?", topic: "databases", difficulty: ["JUNIOR", "MID"], weight: 2 },

        // Async & Event-Driven (high weight)
        { question: "Explain the Node.js event loop. What happens when you block it?", topic: "async", difficulty: ["JUNIOR", "MID", "SENIOR"], weight: 3 },
        { question: "What are message queues? Compare Kafka vs RabbitMQ for high-throughput systems.", topic: "async", difficulty: ["MID", "SENIOR"], weight: 2 },
        { question: "How do you handle idempotency in distributed event processing?", topic: "async", difficulty: ["SENIOR"], weight: 2 },

        // APIs & Communication (medium weight)
        { question: "Explain REST constraints. Where does REST break down and gRPC or GraphQL is better?", topic: "apis", difficulty: ["MID", "SENIOR"], weight: 2 },
        { question: "How would you implement rate limiting at scale? What are the trade-offs between token bucket and leaky bucket?", topic: "apis", difficulty: ["MID", "SENIOR"], weight: 2 },
        { question: "What is the difference between authentication and authorization? How do JWTs work?", topic: "apis", difficulty: ["JUNIOR", "MID"], weight: 2 },

        // Caching (medium weight)
        { question: "Explain cache invalidation strategies. What is cache stampede and how do you prevent it?", topic: "caching", difficulty: ["MID", "SENIOR"], weight: 2 },
        { question: "When would you use Redis vs Memcached? What are Redis data structures and their use cases?", topic: "caching", difficulty: ["MID", "SENIOR"], weight: 2 },

        // Scaling & Reliability (high weight for SENIOR)
        { question: "What is horizontal vs vertical scaling? When does horizontal scaling become complex?", topic: "scaling", difficulty: ["MID", "SENIOR"], weight: 2 },
        { question: "Explain the CAP theorem with a real-world example. What did you sacrifice in your last distributed system?", topic: "scaling", difficulty: ["SENIOR"], weight: 3 },
        { question: "How do you design a circuit breaker? What failure mode does it protect against?", topic: "reliability", difficulty: ["SENIOR"], weight: 2 },
        { question: "What is a saga pattern? How does it compare to two-phase commit?", topic: "reliability", difficulty: ["SENIOR"], weight: 2 },
    ],

    // ── Project Deep Dive Logic ───────────────────────────────────────────────
    projectDeepDive: {
        // Questions to ask about any project
        questionSequence: [
            "Walk me through the architecture of this system. What were the main components and how did they communicate?",
            "What were the biggest technical trade-offs you made? Were there decisions you'd change in hindsight?",
            "How did you handle failures and partial outages in this system?",
            "What scale did this system operate at? How did you design for growth?",
        ],
        // Follow-up triggers (server-side deterministic)
        followUpTriggers: {
            ownershipScoreThreshold: 6,    // if ownershipLevel < 6 → follow up
            tradeoffScoreThreshold: 6,     // if tradeoffThinking < 6 → follow up
            maxFollowUps: 2,
        },
        followUpPrompts: [
            "You mentioned {technology} — who made the decision to use it, and what alternatives did you consider?",
            "What would you do differently now if you had to rebuild this system from scratch?",
            "Tell me about a time this system failed in production. What was your role in resolving it?",
        ],
    },

    // ── Culture Fit Questions (fixed 3) ──────────────────────────────────────
    cultureQuestions: [
        {
            question: "What's prompting your search for a new role right now?",
            evaluationFocus: ["clarity", "maturity", "redFlags"],
            redFlagSignals: ["blaming manager", "vague non-answer", "purely money-driven with no mention of growth"],
        },
        {
            question: "What do you know about this company, and why is this role interesting to you specifically?",
            evaluationFocus: ["preparation", "alignment", "curiosity"],
            redFlagSignals: ["generic answer", "no knowledge of the product", "mentions only compensation"],
        },
        {
            question: "Think back to your last technical project. What's one thing you'd do differently and why?",
            evaluationFocus: ["selfAwareness", "growthMindset", "technicalMaturity"],
            redFlagSignals: ["cannot identify any improvement", "blames external factors entirely", "superficial answer"],
        },
    ],

    // ── Evaluation Rubric ────────────────────────────────────────────────────
    evaluationRubric: {
        // Each LLM evaluation call MUST return exactly this shape
        outputSchema: {
            correctnessScore: "integer 0-10: Is the answer technically correct?",
            depthScore: "integer 0-10: Does the answer show deep understanding beyond surface level?",
            clarityScore: "integer 0-10: Is the communication clear, structured, and concise?",
            realWorldExposureScore: "integer 0-10: Does the answer demonstrate actual production experience?",
            confidenceScore: "integer 0-10: Does the candidate speak with appropriate certainty (not overconfident, not uncertain)?",
            redFlags: "string[]: list any concerning signals (e.g. 'used framework without knowing internals', 'vague when asked for specifics')",
            suggestFollowUp: "boolean: true if the answer was shallow and warrants a follow-up probe",
            followUpQuestion: "string: the specific follow-up question to ask if suggestFollowUp is true, otherwise empty string",
        },
        scoringWeights: {
            correctness: 0.30,
            depth: 0.30,
            clarity: 0.15,
            realWorldExposure: 0.20,
            confidence: 0.05,
        },
        systemInstruction: `You are evaluating a backend engineering candidate. 
Return ONLY a valid JSON object with exactly these keys: correctnessScore, depthScore, clarityScore, realWorldExposureScore, confidenceScore, redFlags, suggestFollowUp, followUpQuestion.
Reject any non-JSON in your own output. No preamble, no explanation outside the JSON.
Score relative to the stated difficulty level: JUNIOR answers need not be perfect; SENIOR answers require depth and operational awareness.`,
    },

    // ── Score Aggregation Weights ────────────────────────────────────────────
    scoringWeights: {
        projectDepth: 0.35,
        fundamentals: 0.40,
        communication: 0.15,
        culture: 0.10,
    },
}

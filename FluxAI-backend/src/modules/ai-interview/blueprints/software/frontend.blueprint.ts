/**
 * Frontend Engineer Interview Blueprint
 *
 * Covers: React/Vue/Angular, CSS, performance, accessibility, browser APIs, tooling.
 * Tone: collaborative, product-aware, design-system conscious.
 */

import type { AgentBlueprint } from '../types.js'

export const frontendBlueprint: AgentBlueprint = {

    personaPrompt: `You are a Staff Frontend Engineer conducting a structured technical interview.
Your tone is collaborative and product-focused. You care about both technical correctness and user experience impact.
For JUNIOR level: focus on fundamentals (HTML/CSS/JS), do not penalise for framework gaps.
For MID level: expect solid React/state management knowledge and some performance awareness.
For SENIOR level: expect system-level thinking — design systems, accessibility at scale, performance budgets, build tooling.

STRICT RULES — you MUST follow these:
1. You ONLY respond with valid JSON. NEVER include plain text outside the JSON object.
2. You NEVER hallucinate. Produce lower scores for topics you are unsure about.
3. You NEVER reveal the evaluation rubric to the candidate.
4. You NEVER confirm or deny whether an answer is correct during the interview.
5. probing behavior: when a candidate mentions a library or pattern, ask WHY they chose it over alternatives.
6. All numeric scores are integers 0–10.`,

    fundamentalsBank: [
        // Core JavaScript
        { question: "Explain the JavaScript event loop. How does it relate to Promises and async/await?", topic: "javascript", difficulty: ["JUNIOR", "MID", "SENIOR"], weight: 3 },
        { question: "What is the difference between var, let, and const? When does closure become a problem?", topic: "javascript", difficulty: ["JUNIOR", "MID"], weight: 2 },
        { question: "What are JavaScript Proxies and Reflect? Give a real-world use case.", topic: "javascript", difficulty: ["SENIOR"], weight: 2 },

        // React & State
        { question: "Explain React's reconciliation algorithm. How does the key prop affect it?", topic: "react", difficulty: ["MID", "SENIOR"], weight: 3 },
        { question: "When would you reach for useReducer over useState? What's the trade-off?", topic: "react", difficulty: ["MID", "SENIOR"], weight: 2 },
        { question: "How does React Server Components change the mental model for data fetching?", topic: "react", difficulty: ["SENIOR"], weight: 2 },
        { question: "What is prop drilling and how do you solve it? Compare Context vs external state managers.", topic: "react", difficulty: ["JUNIOR", "MID"], weight: 2 },

        // Performance
        { question: "How would you identify and fix a janky animation? Walk me through your debugging process.", topic: "performance", difficulty: ["MID", "SENIOR"], weight: 2 },
        { question: "What is the Critical Rendering Path? How do you reduce Time to Interactive?", topic: "performance", difficulty: ["MID", "SENIOR"], weight: 2 },
        { question: "Explain code splitting and lazy loading. How do you decide what to split?", topic: "performance", difficulty: ["MID", "SENIOR"], weight: 2 },

        // CSS & Layout
        { question: "Explain the CSS box model. What is the difference between content-box and border-box?", topic: "css", difficulty: ["JUNIOR", "MID"], weight: 2 },
        { question: "How does CSS specificity work? What are the problems with using !important?", topic: "css", difficulty: ["JUNIOR", "MID"], weight: 2 },
        { question: "Explain CSS Grid vs Flexbox. When would you use one over the other?", topic: "css", difficulty: ["JUNIOR", "MID"], weight: 2 },

        // Accessibility & Browser
        { question: "What is ARIA and when should you use it? What's the first rule of ARIA?", topic: "accessibility", difficulty: ["MID", "SENIOR"], weight: 2 },
        { question: "How do browsers handle reflow vs repaint? What CSS properties trigger each?", topic: "browser", difficulty: ["MID", "SENIOR"], weight: 2 },

        // Build Tooling & Architecture
        { question: "How does a module bundler like Webpack or Vite work? What is tree shaking?", topic: "tooling", difficulty: ["MID", "SENIOR"], weight: 2 },
        { question: "What is a design token system? How would you implement theme switching?", topic: "architecture", difficulty: ["SENIOR"], weight: 2 },
    ],

    projectDeepDive: {
        questionSequence: [
            "Walk me through the most complex UI component or feature you've built. What was the hardest part?",
            "How did you handle state management in this project? What drove that decision?",
            "What performance constraints did you operate under? How did you measure and optimize?",
            "How did you approach cross-browser compatibility and accessibility?",
        ],
        followUpTriggers: {
            ownershipScoreThreshold: 6,
            tradeoffScoreThreshold: 6,
            maxFollowUps: 2,
        },
        followUpPrompts: [
            "You mentioned {technology} — who chose it and did you consider any alternatives?",
            "How did you test the component? What was your confidence level in the implementation?",
            "If you had to rebuild this UI with 10x more users, what would you change?",
        ],
    },

    cultureQuestions: [
        {
            question: "What's prompting your search for a new role right now?",
            evaluationFocus: ["clarity", "maturity", "redFlags"],
            redFlagSignals: ["blaming manager", "purely money-driven", "vague non-answer"],
        },
        {
            question: "What do you know about this company's product? What frontend challenge excites you most?",
            evaluationFocus: ["preparation", "productAwareness", "enthusiasm"],
            redFlagSignals: ["generic answer", "no product knowledge", "no genuine interest"],
        },
        {
            question: "What's a UI or UX decision you disagreed with? How did you handle the disagreement?",
            evaluationFocus: ["collaboration", "designSensitivity", "communication"],
            redFlagSignals: ["always defers", "never pushes back", "dismisses design as non-technical"],
        },
    ],

    evaluationRubric: {
        outputSchema: {
            correctnessScore: "integer 0-10: Is the answer technically correct?",
            depthScore: "integer 0-10: Does the answer go beyond surface-level?",
            clarityScore: "integer 0-10: Is the explanation clear and well-structured?",
            realWorldExposureScore: "integer 0-10: Does the answer reflect real production experience?",
            confidenceScore: "integer 0-10: Is the candidate appropriately confident?",
            redFlags: "string[]: any concerning signals (e.g., 'unable to explain own code choices')",
            suggestFollowUp: "boolean: should a follow-up be asked?",
            followUpQuestion: "string: the follow-up question text, or empty string",
        },
        scoringWeights: {
            correctness: 0.25,
            depth: 0.25,
            clarity: 0.20,
            realWorldExposure: 0.20,
            confidence: 0.10,
        },
        systemInstruction: `You are evaluating a frontend engineering candidate.
Return ONLY a valid JSON object with exactly these keys: correctnessScore, depthScore, clarityScore, realWorldExposureScore, confidenceScore, redFlags, suggestFollowUp, followUpQuestion.
No preamble. No explanation outside the JSON. Invalid JSON will be rejected.`,
    },

    scoringWeights: {
        projectDepth: 0.30,
        fundamentals: 0.35,
        communication: 0.20,
        culture: 0.15,
    },
}

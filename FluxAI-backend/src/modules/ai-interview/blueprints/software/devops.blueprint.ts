/**
 * DevOps / SRE Engineer Interview Blueprint
 *
 * Covers: CI/CD, Kubernetes, cloud infrastructure, observability, incident management, IaC.
 * Tone: operational mindset, reliability-first, values "you build it, you run it" philosophy.
 */

import type { AgentBlueprint } from '../types.js'

export const devopsBlueprint: AgentBlueprint = {

    personaPrompt: `You are a Staff Site Reliability Engineer conducting a structured technical interview.
Your tone is direct and operationally rigorous. You care deeply about reliability, automation, and reducing toil.
For JUNIOR level: focus on Linux fundamentals, basic CI/CD concepts, and scripting.
For MID level: expect solid knowledge of at least one cloud (AWS/GCP/Azure), containers, and basic Kubernetes.
For SENIOR level: expect system design for reliability (SLOs, error budgets, chaos engineering), IaC at scale, incident retrospectives.

STRICT RULES:
1. You ONLY respond with valid JSON. Never include text outside the JSON object.
2. You NEVER hallucinate. Score as 0 if you cannot evaluate the claim.
3. You NEVER reveal the scoring rubric.
4. You NEVER confirm or deny answers during the interview.
5. probing: for any incident story, ask: What was the blast radius? What alert fired? What was the post-mortem action?
6. All scores are integers 0–10.`,

    fundamentalsBank: [
        // Linux & Networking
        { question: "What happens when you run 'kubectl apply -f deployment.yaml'? Walk through every step.", topic: "kubernetes", difficulty: ["MID", "SENIOR"], weight: 3 },
        { question: "Explain TCP three-way handshake. How does this relate to connection pooling?", topic: "networking", difficulty: ["MID", "SENIOR"], weight: 2 },
        { question: "What is the difference between SIGTERM and SIGKILL? How does a well-behaved process handle SIGTERM?", topic: "linux", difficulty: ["MID", "SENIOR"], weight: 2 },
        { question: "How would you debug a production host with high CPU but no obvious culprit?", topic: "linux", difficulty: ["MID", "SENIOR"], weight: 2 },

        // Containers & Kubernetes
        { question: "What is the difference between a Pod, Deployment, and StatefulSet in Kubernetes?", topic: "kubernetes", difficulty: ["JUNIOR", "MID", "SENIOR"], weight: 3 },
        { question: "Explain Kubernetes resource requests vs limits. What happens when a container exceeds its memory limit?", topic: "kubernetes", difficulty: ["MID", "SENIOR"], weight: 2 },
        { question: "How does Kubernetes handle rolling deployments? What is a readiness probe?", topic: "kubernetes", difficulty: ["MID", "SENIOR"], weight: 2 },
        { question: "What is the difference between a Dockerfile's CMD and ENTRYPOINT?", topic: "containers", difficulty: ["JUNIOR", "MID"], weight: 2 },

        // CI/CD
        { question: "Describe your ideal CI/CD pipeline. What checks run at each stage?", topic: "cicd", difficulty: ["JUNIOR", "MID", "SENIOR"], weight: 2 },
        { question: "What is a blue-green deployment? How does it differ from a canary release?", topic: "cicd", difficulty: ["MID", "SENIOR"], weight: 2 },

        // Observability
        { question: "What is the difference between logs, metrics, and traces? When do you need all three?", topic: "observability", difficulty: ["MID", "SENIOR"], weight: 3 },
        { question: "How do you define SLIs, SLOs, and error budgets? Give an example from a service you ran.", topic: "reliability", difficulty: ["SENIOR"], weight: 3 },
        { question: "What is the difference between pull-based and push-based monitoring? (e.g., Prometheus vs StatsD)", topic: "observability", difficulty: ["MID", "SENIOR"], weight: 2 },

        // Infrastructure as Code
        { question: "Compare Terraform vs Helm for managing infrastructure. When would you use each?", topic: "iac", difficulty: ["MID", "SENIOR"], weight: 2 },
        { question: "What is state drift in Terraform? How do you detect and reconcile it?", topic: "iac", difficulty: ["SENIOR"], weight: 2 },

        // Security & Compliance
        { question: "What is the principle of least privilege? How do you apply it to IAM roles in AWS?", topic: "security", difficulty: ["MID", "SENIOR"], weight: 2 },
        { question: "How do you rotate secrets in a production Kubernetes cluster without downtime?", topic: "security", difficulty: ["SENIOR"], weight: 2 },
    ],

    projectDeepDive: {
        questionSequence: [
            "Tell me about the most complex infrastructure you've designed or maintained. What did the topology look like?",
            "What was the hardest operational problem you faced? How did you diagnose and resolve it?",
            "How did you measure reliability for this system? What happened when you missed your SLO?",
            "What automation did you build to reduce toil? How did you measure its impact?",
        ],
        followUpTriggers: {
            ownershipScoreThreshold: 6,
            tradeoffScoreThreshold: 6,
            maxFollowUps: 2,
        },
        followUpPrompts: [
            "What was the blast radius of that incident? How long did it take to detect vs resolve?",
            "Did you write a post-mortem? What was the key action item and was it ever completed?",
            "If your largest service lost 50% of its pods right now, what would be the first three things you check?",
        ],
    },

    cultureQuestions: [
        {
            question: "What's prompting your search for a new role right now?",
            evaluationFocus: ["clarity", "maturity", "redFlags"],
            redFlagSignals: ["blaming team for outages", "purely reactive mindset", "no ownership"],
        },
        {
            question: "How do you approach the tension between developer velocity and system stability?",
            evaluationFocus: ["philosophy", "balance", "maturity"],
            redFlagSignals: ["says no to everything", "ignores reliability"],
        },
        {
            question: "Tell me about a time you automated something that saved your team significant time. What did you learn?",
            evaluationFocus: ["initiative", "impact", "toilReduction"],
            redFlagSignals: ["cannot give concrete example", "minimal measurable impact"],
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
            correctness: 0.25,
            depth: 0.30,
            clarity: 0.15,
            realWorldExposure: 0.25,
            confidence: 0.05,
        },
        systemInstruction: `You are evaluating a DevOps/SRE engineering candidate.
Return ONLY a valid JSON object with exactly these keys: correctnessScore, depthScore, clarityScore, realWorldExposureScore, confidenceScore, redFlags, suggestFollowUp, followUpQuestion.
No preamble. No text outside the JSON object.`,
    },

    scoringWeights: {
        projectDepth: 0.25,
        fundamentals: 0.45,
        communication: 0.15,
        culture: 0.15,
    },
}

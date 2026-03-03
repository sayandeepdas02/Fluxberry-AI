/**
 * Interview Orchestrator — AI Screening Engine
 *
 * Deterministic 5-phase state machine for LLM-orchestrated technical interviews.
 *
 * Design principles:
 * - LLM generates question text and evaluates answers; it NEVER controls state transitions
 * - Phase transitions are deterministic rules executed server-side
 * - Grilling logic: correctnessScore < 6 AND followUpCount < maxProjectFollowUps → follow-up
 * - Score aggregation uses role-based weighted rubrics (computed server-side)
 * - On completion: writes Evaluation record, marks attempt COMPLETED, emits AI_SCREENING_COMPLETED
 */

import { z } from 'zod'
import { Types } from 'mongoose'
import {
    AIInterviewSession,
    AssessmentAttempt,
    InterviewPhase,
    OrchestratorSessionStatus,
    RoundStatus,
    AttemptStatus,
    type InterviewPhaseValue,
    type IOrchestratorAIConfig,
    type ICandidateContext,
    type IOrchestratorEvaluation,
} from '../../../database/models/index.js'
import { llmService } from './llm.service.js'
import { evaluationService } from '../../evaluation/evaluation.service.js'
import { fluxEvents } from '../../../common/services/events.service.js'
import { WorkflowTrigger } from '../../../database/models/workflow.models.js'
import { getBlueprint, selectFundamentalsQuestions } from '../blueprints/index.js'
import { JobApplication, PipelineStage } from '../../../database/models/index.js'

// ─── Role-based weighted rubrics ──────────────────────────────────────────────

type RubricDimension = 'projectDepth' | 'fundamentals' | 'communication' | 'culture'

// Role-based scoring weights now come from the blueprint registry
// (kept as fallback for when blueprint is unavailable)
const RUBRICS: Record<IOrchestratorAIConfig['role'], Record<RubricDimension, number>> = {
    BACKEND: { projectDepth: 0.35, fundamentals: 0.40, communication: 0.15, culture: 0.10 },
    FRONTEND: { projectDepth: 0.30, fundamentals: 0.35, communication: 0.20, culture: 0.15 },
    FULLSTACK: { projectDepth: 0.30, fundamentals: 0.38, communication: 0.17, culture: 0.15 },
    DEVOPS: { projectDepth: 0.25, fundamentals: 0.45, communication: 0.15, culture: 0.15 },
}


// Map interview phases → rubric dimensions
const PHASE_TO_DIMENSION: Partial<Record<InterviewPhaseValue, RubricDimension>> = {
    [InterviewPhase.PROJECT_DEEP_DIVE]: 'projectDepth',
    [InterviewPhase.FUNDAMENTALS]: 'fundamentals',
    [InterviewPhase.INTRO]: 'communication',
    [InterviewPhase.CULTURE_FIT]: 'culture',
    [InterviewPhase.SUMMARY]: 'communication',
}

// ─── Zod schemas for LLM responses ────────────────────────────────────────────

const questionSchema = z.object({
    question: z.string().min(10),
    questionType: z.enum(['OPEN', 'FOLLOW_UP', 'CHALLENGE']).default('OPEN'),
    hint: z.string().optional(), // internal only, never sent to candidate
})

const evaluationSchema = z.object({
    correctnessScore: z.number().min(0).max(10),
    depthScore: z.number().min(0).max(10),
    communicationScore: z.number().min(0).max(10),
    relevanceScore: z.number().min(0).max(10),
    feedback: z.string().optional(),
    suggestedFollowUp: z.string().optional(),
    redFlags: z.array(z.string()).optional(),  // e.g. ["Candidate contradicted themselves", "Unable to explain own code"]
})

// ─── System prompts ───────────────────────────────────────────────────────────

function buildSystemPrompt(aiConfig: IOrchestratorAIConfig, candidateContext: ICandidateContext): string {
    // Use the blueprint persona prompt — it's role-specific and enforces JSON output
    const blueprint = getBlueprint(aiConfig.role)
    const yoe = candidateContext.yearsOfExperience
        ? `${candidateContext.yearsOfExperience} years of experience`
        : 'unknown experience level'
    const techStack = candidateContext.techStack?.join(', ') || 'not specified'
    const projects = candidateContext.projects?.join('; ') || 'not specified'
    const intensityNote = {
        LOW: 'Ask friendly, straightforward follow-ups. Be encouraging.',
        MEDIUM: 'Probe for depth and challenge vague answers. Be professional.',
        HIGH: 'Challenge answers directly. Ask about edge cases and failure modes. Be rigorous.',
    }[aiConfig.grillingIntensity]

    return `${blueprint.personaPrompt}

Candidate profile: ${yoe}, tech stack: [${techStack}], notable projects: [${projects}].
Difficulty level: ${aiConfig.difficulty}. Interviewing style: ${intensityNote}`
}


function buildQuestionPrompt(
    phase: InterviewPhaseValue,
    aiConfig: IOrchestratorAIConfig,
    candidateContext: ICandidateContext,
    transcript: Array<{ speaker: 'AI' | 'CANDIDATE'; text: string }>,
    isFollowUp: boolean,
    previousAnswer?: string,
    blueprintFundamentalsQuestion?: string  // pre-selected from weighted bank
): string {
    const recentTranscript = transcript
        .slice(-6)
        .map(t => `${t.speaker}: ${t.text}`)
        .join('\n')

    const phaseInstructions: Record<InterviewPhaseValue, string> = {
        INTRO: 'Generate a warm, open-ended question for the introduction phase. Ask about their background or recent work.',
        PROJECT_DEEP_DIVE: isFollowUp
            ? `Generate a follow-up question to probe deeper into their project experience. Previous answer: "${previousAnswer}". Challenge them to go deeper on architecture, tradeoffs, or failures.`
            : 'Generate a question asking them to walk through a significant project they built. Focus on architecture and decisions.',
        FUNDAMENTALS: blueprintFundamentalsQuestion
            ? `Ask this specific fundamentals question: "${blueprintFundamentalsQuestion}". Do not alter the core question but you may add a brief contextual intro.`
            : `Generate a ${aiConfig.role}-specific technical fundamentals question at ${aiConfig.difficulty} level. Focus on core concepts, not trivia.`,
        CULTURE_FIT: 'Generate a behavioral/culture-fit question. Focus on teamwork, conflict resolution, or growth mindset.',
        SUMMARY: 'Generate a closing question. Ask what they would improve in their most recent project or what they want to learn next.',
        COMPLETED: 'Interview is complete.',
    }

    return `Phase: ${phase}
${phaseInstructions[phase]}

Recent conversation:
${recentTranscript || '(no prior conversation)'}

Return JSON: { "question": string, "questionType": "OPEN"|"FOLLOW_UP"|"CHALLENGE", "hint": string (optional, internal only) }`
}


function buildEvaluationPrompt(
    phase: InterviewPhaseValue,
    question: string,
    answer: string,
    aiConfig: IOrchestratorAIConfig
): string {
    // Use blueprint's evaluation rubric system instruction for richer scoring context
    const blueprint = getBlueprint(aiConfig.role)
    const baseInstruction = blueprint.evaluationRubric.systemInstruction

    return `${baseInstruction}

Phase: ${phase} | Difficulty: ${aiConfig.difficulty} | Role: ${aiConfig.role}
Question: "${question}"
Candidate Answer: "${answer}"

Return JSON: { "correctnessScore": int, "depthScore": int, "communicationScore": int, "relevanceScore": int, "feedback": string, "suggestedFollowUp": string }`
}


// ─── Phase transitions (fully deterministic) ──────────────────────────────────

function getNextPhase(currentPhase: InterviewPhaseValue): InterviewPhaseValue {
    const transitions: Record<InterviewPhaseValue, InterviewPhaseValue> = {
        [InterviewPhase.INTRO]: InterviewPhase.PROJECT_DEEP_DIVE,
        [InterviewPhase.PROJECT_DEEP_DIVE]: InterviewPhase.FUNDAMENTALS,
        [InterviewPhase.FUNDAMENTALS]: InterviewPhase.CULTURE_FIT,
        [InterviewPhase.CULTURE_FIT]: InterviewPhase.SUMMARY,
        [InterviewPhase.SUMMARY]: InterviewPhase.COMPLETED,
        [InterviewPhase.COMPLETED]: InterviewPhase.COMPLETED,
    }
    return transitions[currentPhase]
}

function shouldTransitionPhase(
    currentPhase: InterviewPhaseValue,
    questionIndex: number,
    followUpCount: number,
    projectFollowUpCount: number,
    aiConfig: IOrchestratorAIConfig,
    lastEvalScore: number
): boolean {
    switch (currentPhase) {
        case InterviewPhase.INTRO:
            return questionIndex >= 1  // one intro question is enough

        case InterviewPhase.PROJECT_DEEP_DIVE:
            // Transition if: exhausted follow-ups OR candidate scored very well
            return projectFollowUpCount >= aiConfig.maxProjectFollowUps || lastEvalScore >= 8

        case InterviewPhase.FUNDAMENTALS:
            return questionIndex >= aiConfig.maxFundamentalQuestions

        case InterviewPhase.CULTURE_FIT:
            return questionIndex >= 2  // max 2 culture questions

        case InterviewPhase.SUMMARY:
            return questionIndex >= 1  // one summary question

        default:
            return false
    }
}

function shouldGrill(
    correctnessScore: number,
    followUpCount: number,
    aiConfig: IOrchestratorAIConfig
): boolean {
    // Only grill in PROJECT_DEEP_DIVE — the expensive phase
    if (correctnessScore < 6 && followUpCount < aiConfig.maxProjectFollowUps) {
        return true
    }
    return false
}

// ─── Score aggregation ────────────────────────────────────────────────────────

function aggregateScores(
    evaluations: IOrchestratorEvaluation[],
    role: IOrchestratorAIConfig['role']
): { overallScore: number; breakdown: Record<string, number>; recommendation: 'HIRE' | 'NO_HIRE' | 'FURTHER_REVIEW' } {
    const rubric = RUBRICS[role]

    // Group evaluations by dimension
    const dimensionScores: Record<RubricDimension, number[]> = {
        projectDepth: [],
        fundamentals: [],
        communication: [],
        culture: [],
    }

    for (const ev of evaluations) {
        const dim = PHASE_TO_DIMENSION[ev.phase]
        if (!dim) continue
        // Use correctnessScore as primary, averaged with depthScore for technical phases
        const score = dim === 'fundamentals' || dim === 'projectDepth'
            ? (ev.metrics.correctnessScore + ev.metrics.depthScore) / 2
            : (ev.metrics.communicationScore + ev.metrics.relevanceScore) / 2
        dimensionScores[dim].push(score)
    }

    // Average per dimension (out of 10), then apply weights
    const breakdown: Record<string, number> = {}
    let weightedTotal = 0

    for (const [dim, weight] of Object.entries(rubric) as [RubricDimension, number][]) {
        const scores = dimensionScores[dim]
        const avg = scores.length > 0
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : 5 // neutral default if no data
        breakdown[dim] = Math.round(avg * 10) // convert to 0-100 scale
        weightedTotal += (avg / 10) * weight * 100
    }

    const overallScore = Math.round(weightedTotal)

    let recommendation: 'HIRE' | 'NO_HIRE' | 'FURTHER_REVIEW'
    if (overallScore >= 70) recommendation = 'HIRE'
    else if (overallScore >= 50) recommendation = 'FURTHER_REVIEW'
    else recommendation = 'NO_HIRE'

    return { overallScore, breakdown, recommendation }
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

class InterviewOrchestrator {

    /**
     * Create a new orchestrator session.
     * Marks the AI round on the attempt as IN_PROGRESS.
     * Returns the sessionId and the first AI message.
     */
    async createSession(
        attemptId: string,
        candidateContext: ICandidateContext,
        aiConfigOverride?: Partial<IOrchestratorAIConfig>
    ): Promise<{ sessionId: string; firstMessage: string }> {
        const attempt = await AssessmentAttempt.findById(attemptId)
        if (!attempt) throw this.err('Attempt not found', 404)

        const aiRound = attempt.rounds.find(r => r.roundType === 'AI')
        if (!aiRound) throw this.err('No AI round in this assessment', 400)
        if (aiRound.status === RoundStatus.COMPLETED) throw this.err('AI round already completed', 409)

        // Resolve aiConfig: load from the round document if recruiter stored one, then apply overrides
        const roundConfig = (aiRound as any).config ?? {}
        const aiConfig: IOrchestratorAIConfig = {
            role: aiConfigOverride?.role ?? roundConfig.role ?? 'BACKEND',
            difficulty: aiConfigOverride?.difficulty ?? roundConfig.difficulty ?? 'MID',
            maxDurationMinutes: aiConfigOverride?.maxDurationMinutes ?? roundConfig.maxDurationMinutes ?? 45,
            maxFundamentalQuestions: aiConfigOverride?.maxFundamentalQuestions ?? roundConfig.maxFundamentalQuestions ?? 5,
            maxProjectFollowUps: aiConfigOverride?.maxProjectFollowUps ?? roundConfig.maxProjectFollowUps ?? 2,
            grillingIntensity: aiConfigOverride?.grillingIntensity ?? roundConfig.grillingIntensity ?? 'MEDIUM',
        }

        // Pre-select fundamentals questions from blueprint at session creation time
        // so we get consistent, weighted-random questions and never repeat within a session
        const blueprint = getBlueprint(aiConfig.role)
        const fundamentalsQueue = selectFundamentalsQuestions(
            blueprint,
            aiConfig.difficulty,
            aiConfig.maxFundamentalQuestions
        ).map(q => q.question)

        // Resolve candidateId / organizationId from attempt
        const candidateId = attempt.candidateId as Types.ObjectId
        // organizationId lives on the Assessment; fall back to attempt-level lookup
        const AssessmentModel = (await import('../../../database/models/index.js')).Assessment
        const assessment = await AssessmentModel.findById(attempt.assessmentId).lean()
        const organizationId = (assessment as { organizationId: Types.ObjectId } | null)?.organizationId
            ?? new Types.ObjectId()

        // Generate the INTRO question from LLM
        const systemPrompt = buildSystemPrompt(aiConfig, candidateContext)
        const questionResult = await llmService.call({
            systemPrompt,
            userMessage: buildQuestionPrompt(
                InterviewPhase.INTRO,
                aiConfig,
                candidateContext,
                [],
                false,
            ),
            schema: questionSchema,
        })

        const firstMessage = questionResult.data.question

        // Persist session with fundamentals queue
        const session = await AIInterviewSession.create({
            attemptId: attempt._id,
            candidateId,
            organizationId,
            status: OrchestratorSessionStatus.ACTIVE,
            currentPhase: InterviewPhase.INTRO,
            followUpCount: 0,
            projectFollowUpCount: 0,
            questionIndex: 0,
            llmCallCount: 1,  // count the INTRO question call
            transcript: [{ speaker: 'AI', text: firstMessage, timestamp: new Date() }],
            evaluations: [],
            aiConfig,
            candidateContext,
            fundamentalsQueue,  // pre-selected blueprint questions
            startedAt: new Date(),
        })

        // Mark attempt round as IN_PROGRESS
        aiRound.status = RoundStatus.IN_PROGRESS
        if (!attempt.startedAt) {
            attempt.status = AttemptStatus.IN_PROGRESS
            attempt.startedAt = new Date()
        }
        await attempt.save()

        return { sessionId: session._id.toString(), firstMessage }
    }

    /**
     * Submit a candidate turn (their answer to the last AI question).
     * Evaluates the answer, applies grilling/transition logic, and returns the next AI message.
     */
    async submitTurn(
        sessionId: string,
        candidateAnswer: string
    ): Promise<{
        nextMessage: string
        currentPhase: InterviewPhaseValue
        isComplete: boolean
    }> {
        const session = await AIInterviewSession.findById(sessionId)
        if (!session) throw this.err('Session not found', 404)
        if (session.status !== OrchestratorSessionStatus.ACTIVE) {
            throw this.err('Session is not active', 409)
        }

        const { aiConfig, candidateContext, currentPhase, transcript, fundamentalsQueue } = session

        // ── Max LLM calls guard ──────────────────────────────────────────────
        // Each turn = 2 LLM calls (eval + next question). Budget = phases × maxQ + grilling buffer.
        const MAX_LLM_CALLS = (aiConfig.maxFundamentalQuestions + aiConfig.maxProjectFollowUps + 10) * 2
        const currentCallCount = (session as any).llmCallCount ?? 0
        if (currentCallCount >= MAX_LLM_CALLS) {
            console.warn(`[Orchestrator] Max LLM calls reached for session=${sessionId}, forcing completion`)
            await session.save()
            const result = await this.completeSession(sessionId)
            return {
                nextMessage: `You've reached the interview time limit. Thank you for your responses!`,
                currentPhase: InterviewPhase.COMPLETED,
                isComplete: true,
            }
        }

        // ── Duration timeout guard ───────────────────────────────────────────
        const elapsedMinutes = (Date.now() - session.startedAt.getTime()) / 60000
        if (elapsedMinutes > aiConfig.maxDurationMinutes) {
            console.warn(`[Orchestrator] Duration exceeded for session=${sessionId}, forcing completion`)
            await session.save()
            const result = await this.completeSession(sessionId)
            return {
                nextMessage: `The interview time limit has been reached. Thank you for your time!`,
                currentPhase: InterviewPhase.COMPLETED,
                isComplete: true,
            }
        }

        // Get the last AI question from transcript
        const lastAIMessage = [...transcript].reverse().find(t => t.speaker === 'AI')?.text ?? ''

        // Record candidate answer
        session.transcript.push({ speaker: 'CANDIDATE', text: candidateAnswer, timestamp: new Date() })

        // Evaluate the candidate answer via LLM
        const evalResult = await llmService.call({
            systemPrompt: buildSystemPrompt(aiConfig, candidateContext),
            userMessage: buildEvaluationPrompt(currentPhase, lastAIMessage, candidateAnswer, aiConfig),
            schema: evaluationSchema,
        })

        const evaluation: IOrchestratorEvaluation = {
            phase: currentPhase,
            question: lastAIMessage,
            answer: candidateAnswer,
            metrics: {
                correctnessScore: evalResult.data.correctnessScore,
                depthScore: evalResult.data.depthScore,
                communicationScore: evalResult.data.communicationScore,
                relevanceScore: evalResult.data.relevanceScore,
                feedback: evalResult.data.feedback,
                redFlags: evalResult.data.redFlags ?? [],
            },
        }
        session.evaluations.push(evaluation)
            ; (session as any).llmCallCount = currentCallCount + 1  // eval call

        // ── Deterministic state machine ──────────────────────────────────────

        const correctness = evalResult.data.correctnessScore
        let shouldFollowUp = false
        let newPhase = currentPhase

        if (currentPhase === InterviewPhase.PROJECT_DEEP_DIVE) {
            shouldFollowUp = shouldGrill(correctness, session.projectFollowUpCount, aiConfig)
            if (shouldFollowUp) {
                session.projectFollowUpCount += 1
                session.followUpCount += 1
            }
        }

        if (!shouldFollowUp) {
            session.questionIndex += 1
            session.followUpCount = 0

            if (shouldTransitionPhase(
                currentPhase,
                session.questionIndex,
                session.followUpCount,
                session.projectFollowUpCount,
                aiConfig,
                correctness,
            )) {
                newPhase = getNextPhase(currentPhase)
                session.currentPhase = newPhase
                session.questionIndex = 0
                session.followUpCount = 0
            }
        }

        // ── Check for completion ─────────────────────────────────────────────

        if (newPhase === InterviewPhase.COMPLETED) {
            await session.save()
            const result = await this.completeSession(sessionId)
            return {
                nextMessage: `Thank you for your time! This concludes our interview. Your performance score is ${result.overallScore}/100. We will be in touch soon.`,
                currentPhase: InterviewPhase.COMPLETED,
                isComplete: true,
            }
        }

        // ── Generate next AI question ────────────────────────────────────────

        // For FUNDAMENTALS phase, draw the next pre-selected question from the queue
        const blueprintFundamentalsQ = newPhase === InterviewPhase.FUNDAMENTALS
            ? (fundamentalsQueue ?? [])[session.questionIndex] ?? undefined
            : undefined

        const nextQuestionResult = await llmService.call({
            systemPrompt: buildSystemPrompt(aiConfig, candidateContext),
            userMessage: buildQuestionPrompt(
                newPhase,
                aiConfig,
                candidateContext,
                session.transcript.map(t => ({ speaker: t.speaker, text: t.text })),
                shouldFollowUp,
                shouldFollowUp ? candidateAnswer : undefined,
                blueprintFundamentalsQ,
            ),
            schema: questionSchema,
        })

        const nextMessage = nextQuestionResult.data.question
        session.transcript.push({ speaker: 'AI', text: nextMessage, timestamp: new Date() })
            ; (session as any).llmCallCount = ((session as any).llmCallCount ?? 1) + 1  // question call

        await session.save()

        return {
            nextMessage,
            currentPhase: newPhase,
            isComplete: false,
        }
    }

    /**
     * Get current session state (for reconnection or frontend polling).
     */
    async getSessionState(sessionId: string) {
        const session = await AIInterviewSession.findById(sessionId).lean()
        if (!session) throw this.err('Session not found', 404)

        const lastAIMessage = [...session.transcript]
            .reverse()
            .find(t => t.speaker === 'AI')?.text ?? ''

        return {
            sessionId: session._id.toString(),
            status: session.status,
            currentPhase: session.currentPhase,
            questionIndex: session.questionIndex,
            followUpCount: session.followUpCount,
            projectFollowUpCount: session.projectFollowUpCount,
            transcript: session.transcript,
            lastAIMessage,
            startedAt: session.startedAt,
            endedAt: session.endedAt,
            overallScore: session.overallScore,
            recommendation: session.recommendation,
            scoreBreakdown: session.scoreBreakdown,
        }
    }

    /**
     * Finalize interview:
     * 1. Aggregates weighted scores
     * 2. Writes/upserts Evaluation record
     * 3. Marks attempt as COMPLETED
     * 4. Emits AI_SCREENING_COMPLETED workflow event
     */
    async completeSession(sessionId: string): Promise<{
        overallScore: number
        recommendation: 'HIRE' | 'NO_HIRE' | 'FURTHER_REVIEW'
        breakdown: Record<string, number>
    }> {
        const session = await AIInterviewSession.findById(sessionId)
        if (!session) throw this.err('Session not found', 404)

        if (session.status === OrchestratorSessionStatus.COMPLETED) {
            // Idempotent
            return {
                overallScore: session.overallScore ?? 0,
                recommendation: session.recommendation ?? 'FURTHER_REVIEW',
                breakdown: (session.scoreBreakdown as Record<string, number>) ?? {},
            }
        }

        const now = new Date()

        // Compute scores
        const { overallScore, breakdown, recommendation } = aggregateScores(
            session.evaluations,
            session.aiConfig.role,
        )

        // Persist to session
        session.status = OrchestratorSessionStatus.COMPLETED
        session.currentPhase = InterviewPhase.COMPLETED
        session.endedAt = now
        session.overallScore = overallScore
        session.recommendation = recommendation
        session.scoreBreakdown = breakdown
        await session.save()

        // Write Evaluation record (upsert replaces placeholder if created earlier)
        await evaluationService.finalizeAIEvaluation(
            session.attemptId.toString(),
            overallScore,
            {
                source: 'ORCHESTRATOR',
                sessionId: session._id.toString(),
                role: session.aiConfig.role,
                difficulty: session.aiConfig.difficulty,
                recommendation,
                scoreBreakdown: breakdown,
                totalEvaluations: session.evaluations.length,
            }
        )

        // Mark attempt round as COMPLETED and attempt as COMPLETED
        const attempt = await AssessmentAttempt.findById(session.attemptId)
        if (attempt) {
            const aiRound = attempt.rounds.find(r => r.roundType === 'AI')
            if (aiRound) {
                aiRound.status = RoundStatus.COMPLETED
                aiRound.endedAt = now
            }
            // Check if all rounds are done
            const allComplete = attempt.rounds.every(r =>
                r.status === RoundStatus.COMPLETED || r.status === RoundStatus.SKIPPED
            )
            if (allComplete) {
                attempt.status = AttemptStatus.COMPLETED
                attempt.submittedAt = now
            }
            await attempt.save()
        }

        // Emit workflow domain event
        fluxEvents.emitDomainEvent(WorkflowTrigger.AI_SCREENING_COMPLETED as any, {
            organizationId: session.organizationId.toString(),
            entityId: session._id.toString(),
            entityType: 'AIInterviewSession',
            attemptId: session.attemptId.toString(),
            candidateId: session.candidateId.toString(),
            overallScore,
            recommendation,
        })

        // ── ATS Pipeline Auto-Move ───────────────────────────────────────
        // Thresholds: HIRE (>=70) → move to Interview stage; NO_HIRE (<50) → move to Rejected stage
        // FURTHER_REVIEW (50-69) → no auto-move, recruiter decides
        try {
            if (recommendation !== 'FURTHER_REVIEW') {
                const targetStageName = recommendation === 'HIRE' ? 'Interview' : 'Rejected'
                // Find the candidate's most recent open job application
                const application = await JobApplication.findOne({
                    candidateId: session.candidateId,
                    deletedAt: null,
                }).sort({ createdAt: -1 }).lean()

                if (application) {
                    // Find the target stage in this job's pipeline
                    const targetStage = await PipelineStage.findOne({
                        jobId: application.jobId,
                        name: { $regex: new RegExp(targetStageName, 'i') },
                    }).lean()

                    if (targetStage) {
                        await JobApplication.updateOne(
                            { _id: application._id },
                            { currentStageId: targetStage._id }
                        )
                        console.log(`📦 [ATS] Moved candidate=${session.candidateId} to stage=${targetStage.name} (${recommendation})`)
                    }
                }
            }
        } catch (atsErr) {
            // Non-fatal: ATS move failure should never block interview completion
            console.error('[ATS] Failed to auto-move pipeline stage:', atsErr)
        }

        console.log(`✅ AI Screening completed: session=${sessionId} score=${overallScore} recommendation=${recommendation}`)

        return { overallScore, recommendation, breakdown }
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private err(message: string, statusCode: number, code?: string) {
        const err = new Error(message) as Error & { statusCode: number; code: string }
        err.statusCode = statusCode
        err.code = code ?? `ERR_${statusCode}`
        return err
    }
}

export const interviewOrchestrator = new InterviewOrchestrator()

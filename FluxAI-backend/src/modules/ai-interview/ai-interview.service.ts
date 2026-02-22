/**
 * AI Interview Service — V2 (Async Recording + Processing)
 * 
 * Handles:
 * - Session lifecycle (start → upload → complete)
 * - Per-question video upload (pre-signed URLs)
 * - Post-upload processing enqueue
 * - Results retrieval for recruiter dashboard
 */

import { v4 as uuidv4 } from 'uuid'
import {
    AssessmentAttempt,
    Assessment,
    Candidate,
    AISessionStatus,
    AIResponseStatus,
    AgentType,
    RoundStatus,
    AIInterviewResponse,
    AIInterviewSynthesis,
    type AgentTypeValue,
} from '../../database/models/index.js'
import {
    generateUploadUrl,
    generateStorageKey,
    generateDownloadUrl,
} from '../storage/s3.client.js'
import { enqueueAIInterviewJob } from '../../jobs/queues/index.js'
import { createFlow, createInterview, isRibbonConfigured } from '../../services/ribbon/ribbon.client.js'
import type {
    StartAISessionInput,
    EndAISessionInput,
    InitUploadInput,
    CompleteUploadInput,
    CompleteSessionInput,
    StartAISessionResponse,
    EndAISessionResponse,
    InitUploadResponse,
    CompleteUploadResponse,
    CompleteSessionResponse,
    AIInterviewResultsResponse,
    AIQuestionConfig,
} from './ai-interview.types.js'

const AI_DISCLOSURE_TEXT = 'This interview was recorded and processed using AI-assisted tools. All outputs are informational signals and do not constitute hiring decisions. A human reviewer must evaluate all results before taking any action.'

// Default questions if none configured in assessment
const DEFAULT_QUESTIONS: AIQuestionConfig[] = [
    { id: 'q1', text: 'Tell me about yourself and your relevant experience.', prepSeconds: 30, answerSeconds: 180 },
    { id: 'q2', text: 'Describe a challenging technical problem you solved recently.', prepSeconds: 30, answerSeconds: 180 },
    { id: 'q3', text: 'How do you approach debugging a complex production issue?', prepSeconds: 30, answerSeconds: 180 },
    { id: 'q4', text: 'Tell me about a project you are most proud of and why.', prepSeconds: 30, answerSeconds: 180 },
    { id: 'q5', text: 'Where do you see your career heading in the next few years?', prepSeconds: 30, answerSeconds: 120 },
]

class AIInterviewService {
    // ────── SESSION LIFECYCLE ──────

    /**
     * Start AI interview session
     * - Loads or generates questions
     * - Records consent timestamp
     * - Returns questions for frontend
     */
    async startSession(
        attemptId: string,
        input: StartAISessionInput
    ): Promise<StartAISessionResponse> {
        const attempt = await AssessmentAttempt.findById(attemptId)
        if (!attempt) {
            throw this.createError('Attempt not found', 404, 'NOT_FOUND')
        }

        const aiRoundIndex = attempt.rounds.findIndex(r => r.roundType === 'AI')
        if (aiRoundIndex === -1) {
            throw this.createError('No AI round in this assessment', 400, 'INVALID_CONFIG')
        }

        const aiRound = attempt.rounds[aiRoundIndex]

        // Check if session already in progress (idempotent)
        if (aiRound.aiSessionId && aiRound.aiSessionStatus === AISessionStatus.IN_PROGRESS) {
            const sessionAge = aiRound.startedAt
                ? (Date.now() - new Date(aiRound.startedAt).getTime()) / 1000
                : 0
            const MAX_SESSION_DURATION = 30 * 60 // 30 minutes

            if (sessionAge > MAX_SESSION_DURATION) {
                // Auto-expire stale session
                aiRound.aiSessionStatus = AISessionStatus.TIMEOUT
                aiRound.status = RoundStatus.COMPLETED
                aiRound.endedAt = new Date()
                aiRound.aiDurationSeconds = Math.floor(sessionAge)
                await attempt.save()
                // Fall through to create new session
            } else {
                // Return existing session (reconnection/resume)
                const questions = aiRound.aiQuestions || DEFAULT_QUESTIONS
                const totalDuration = questions.reduce((sum, q) => sum + q.prepSeconds + q.answerSeconds, 0)

                // Ensure response docs exist (they may be missing if a previous startSession crashed)
                const existingCount = await AIInterviewResponse.countDocuments({ sessionId: aiRound.aiSessionId })
                if (existingCount === 0) {
                    const responseDocs = questions.map((q, idx) => ({
                        attemptId: attempt._id,
                        sessionId: aiRound.aiSessionId,
                        questionId: q.id,
                        questionIndex: idx,
                        questionText: q.text,
                        storageKey: '',
                        durationSeconds: 0,
                        status: AIResponseStatus.PENDING_UPLOAD,
                    }))
                    await AIInterviewResponse.insertMany(responseDocs)
                }

                return {
                    sessionId: aiRound.aiSessionId,
                    questions,
                    consentRecordedAt: aiRound.aiConsentRecordedAt?.toISOString() || new Date().toISOString(),
                    totalDurationEstimate: totalDuration,
                }
            }
        }

        // Load questions from assessment config or use defaults
        const assessment = await Assessment.findById(attempt.assessmentId)
        const aiRoundConfig = assessment?.rounds.find(r => r.roundType === 'AI')?.config as
            { questions?: AIQuestionConfig[] } | undefined

        const questions = aiRoundConfig?.questions?.length
            ? aiRoundConfig.questions
            : DEFAULT_QUESTIONS

        // Generate session
        const sessionId = `ai_sess_${uuidv4()}`
        const now = new Date()

        // Update round
        aiRound.aiSessionId = sessionId
        aiRound.aiSessionStatus = AISessionStatus.IN_PROGRESS
        aiRound.agentType = (input.agentType as AgentTypeValue) || AgentType.HR_GENERAL
        aiRound.status = RoundStatus.IN_PROGRESS
        aiRound.startedAt = now
        aiRound.aiConsentRecordedAt = now
        aiRound.aiQuestions = questions
        aiRound.aiRestartUsed = false
        aiRound.transcript = []

        // Start attempt if not started
        if (attempt.status === 'NOT_STARTED') {
            attempt.status = 'IN_PROGRESS'
            attempt.startedAt = now
        }

        await attempt.save()

        // Create AIInterviewResponse placeholders for each question
        const responseDocs = questions.map((q, idx) => ({
            attemptId: attempt._id,
            sessionId,
            questionId: q.id,
            questionIndex: idx,
            questionText: q.text,
            storageKey: '', // Will be set on upload init
            durationSeconds: 0,
            status: AIResponseStatus.PENDING_UPLOAD,
        }))
        await AIInterviewResponse.insertMany(responseDocs)

        const totalDuration = questions.reduce((sum, q) => sum + q.prepSeconds + q.answerSeconds, 0)

        return {
            sessionId,
            questions,
            consentRecordedAt: now.toISOString(),
            totalDurationEstimate: totalDuration,
        }
    }

    /**
     * Start Ribbon AI interview (interactive voice).
     * Ensures a flow exists for this assessment, creates a one-use interview, returns link.
     */
    async startRibbonSession(attemptId: string): Promise<{ interview_link: string; attemptId: string }> {
        if (!isRibbonConfigured()) {
            throw this.createError('Ribbon AI is not configured (RIBBON_API_KEY)', 503, 'SERVICE_UNAVAILABLE')
        }

        const attempt = await AssessmentAttempt.findById(attemptId)
        if (!attempt) throw this.createError('Attempt not found', 404, 'NOT_FOUND')

        const aiRoundIndex = attempt.rounds.findIndex(r => r.roundType === 'AI')
        if (aiRoundIndex === -1) throw this.createError('No AI round in this assessment', 400, 'INVALID_CONFIG')

        const aiRound = attempt.rounds[aiRoundIndex]
        if (aiRound.status === RoundStatus.COMPLETED) {
            throw this.createError('AI round already completed', 400, 'ALREADY_SUBMITTED')
        }
        if (aiRound.ribbonInterviewId) {
            // Already started Ribbon; could return existing link but Ribbon links are one-use, so create new
            // Option: throw so frontend shows "already started" or create new and overwrite. We create new.
        }

        const assessment = await Assessment.findById(attempt.assessmentId)
        if (!assessment) throw this.createError('Assessment not found', 404, 'NOT_FOUND')

        const aiRoundConfig = assessment.rounds.find(r => r.roundType === 'AI')
        const config = (aiRoundConfig?.config || {}) as { questions?: AIQuestionConfig[]; ribbonFlowId?: string }
        const questions = config?.questions?.length ? config.questions : DEFAULT_QUESTIONS
        const questionStrings = questions.map(q => q.text)

        const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000'
        const backendPublic = process.env.BACKEND_PUBLIC_URL || process.env.FRONTEND_URL?.replace('3000', '5001') || 'http://localhost:5001'
        const redirectUrl = `${frontendOrigin.replace(/\/$/, '')}/assessment/ribbon-callback`
        const webhookUrl = `${backendPublic.replace(/\/$/, '')}/api/webhooks/ribbon`
        const webhookSecret = process.env.RIBBON_WEBHOOK_SECRET || ''

        let flowId = config.ribbonFlowId
        if (!flowId) {
            const flowRes = await createFlow({
                org_name: assessment.title || 'FluxAI',
                title: `${assessment.title || 'Interview'} – AI Round`,
                questions: questionStrings,
                redirect_url: redirectUrl,
                webhook_url: webhookUrl,
                webhook_secret_key: webhookSecret || undefined,
                interview_type: 'general',
            })
            flowId = flowRes.interview_flow_id
            if (assessment.rounds) {
                const roundIndex = assessment.rounds.findIndex(r => r.roundType === 'AI')
                if (roundIndex >= 0 && assessment.rounds[roundIndex]) {
                    const round = assessment.rounds[roundIndex] as { config?: Record<string, unknown> }
                    round.config = { ...(round.config || {}), ribbonFlowId: flowId }
                    assessment.markModified(`rounds.${roundIndex}.config`)
                    await assessment.save()
                }
            }
        }

        const candidate = await Candidate.findById(attempt.candidateId).lean()
        const candidateInfo = candidate
            ? {
                interviewee_email_address: (candidate as { email?: string }).email,
                interviewee_first_name: (candidate as { firstName?: string }).firstName,
                interviewee_last_name: (candidate as { lastName?: string }).lastName,
            }
            : undefined

        const { interview_id, interview_link } = await createInterview(flowId, candidateInfo)

        const now = new Date()
        aiRound.ribbonInterviewId = interview_id
        aiRound.status = RoundStatus.IN_PROGRESS
        aiRound.startedAt = now
        aiRound.aiConsentRecordedAt = now
        aiRound.aiQuestions = questions
        if (attempt.status === 'NOT_STARTED') {
            attempt.status = 'IN_PROGRESS'
            attempt.startedAt = now
        }
        await attempt.save()

        return { interview_link, attemptId: attemptId.toString() }
    }

    // ────── UPLOAD ──────

    /**
     * Initialize upload for a question response
     * Returns pre-signed S3 URL
     */
    async initUpload(
        attemptId: string,
        input: InitUploadInput
    ): Promise<InitUploadResponse> {
        const { sessionId, questionId, mimeType } = input

        // Verify session ownership
        const attempt = await AssessmentAttempt.findById(attemptId)
        if (!attempt) throw this.createError('Attempt not found', 404, 'NOT_FOUND')

        const aiRound = attempt.rounds.find(r => r.roundType === 'AI')
        if (!aiRound || aiRound.aiSessionId !== sessionId) {
            throw this.createError('Invalid session', 400, 'INVALID_SESSION')
        }

        // Find or create response doc (self-healing if startSession didn't create docs)
        let response = await AIInterviewResponse.findOne({ sessionId, questionId })
        if (!response) {
            // Look up question from round config to create the doc
            const questionConfig = aiRound.aiQuestions?.find(q => q.id === questionId)
            const questionIndex = aiRound.aiQuestions?.findIndex(q => q.id === questionId) ?? 0
            response = await AIInterviewResponse.create({
                attemptId: attempt._id,
                sessionId,
                questionId,
                questionIndex,
                questionText: questionConfig?.text || `Question ${questionIndex + 1}`,
                storageKey: '',
                durationSeconds: 0,
                status: AIResponseStatus.PENDING_UPLOAD,
            })
        }
        if (response.status !== AIResponseStatus.PENDING_UPLOAD) {
            throw this.createError('Upload already completed for this question', 409, 'ALREADY_UPLOADED')
        }

        // Generate storage key
        const extension = mimeType.includes('mp4') ? 'mp4' : 'webm'
        const candidateId = attempt.candidateId.toString()
        const storageKey = generateStorageKey('CANDIDATE', candidateId, 'AI_RECORDING', extension)

        // Update response with storage key
        response.storageKey = storageKey
        await response.save()

        // Generate pre-signed URL
        const size = 500 * 1024 * 1024 // Allow up to 500MB
        const { uploadUrl } = await generateUploadUrl(storageKey, mimeType, size)

        return {
            uploadUrl,
            uploadId: response._id.toString(),
            storageKey,
            expiresIn: 15 * 60,
        }
    }

    /**
     * Mark upload as complete and enqueue processing
     */
    async completeUpload(
        attemptId: string,
        input: CompleteUploadInput
    ): Promise<CompleteUploadResponse> {
        const { sessionId, questionId, durationSeconds } = input

        const response = await AIInterviewResponse.findOne({ sessionId, questionId })
        if (!response) throw this.createError('Response not found', 404, 'NOT_FOUND')
        if (!response.storageKey) throw this.createError('Upload not initialized', 400, 'INVALID_STATE')

        // Idempotent: if already uploaded/processing, return success
        if (response.status !== AIResponseStatus.PENDING_UPLOAD) {
            return { questionId, status: response.status }
        }

        response.status = AIResponseStatus.UPLOADED
        response.durationSeconds = durationSeconds
        await response.save()

        // Enqueue processing job
        await enqueueAIInterviewJob({
            type: 'PROCESS_AI_RESPONSE',
            attemptId: attemptId,
            sessionId,
            questionId,
            storageKey: response.storageKey,
        })

        return { questionId, status: response.status }
    }

    // ────── SESSION COMPLETION ──────

    /**
     * Mark session as complete — called after all questions uploaded
     */
    async completeSession(
        attemptId: string,
        input: CompleteSessionInput
    ): Promise<CompleteSessionResponse> {
        const { sessionId } = input

        const attempt = await AssessmentAttempt.findById(attemptId)
        if (!attempt) throw this.createError('Attempt not found', 404, 'NOT_FOUND')

        const aiRound = attempt.rounds.find(r => r.roundType === 'AI')
        if (!aiRound || aiRound.aiSessionId !== sessionId) {
            throw this.createError('Invalid session', 400, 'INVALID_SESSION')
        }

        // Count responses
        const responses = await AIInterviewResponse.find({ sessionId })
        const uploadedCount = responses.filter(r =>
            r.status !== AIResponseStatus.PENDING_UPLOAD
        ).length

        // Update round status
        const now = new Date()
        aiRound.aiSessionStatus = AISessionStatus.COMPLETED
        aiRound.status = RoundStatus.COMPLETED
        aiRound.endedAt = now
        aiRound.aiDurationSeconds = aiRound.startedAt
            ? Math.floor((now.getTime() - new Date(aiRound.startedAt).getTime()) / 1000)
            : 0

        await attempt.save()

        // Create synthesis placeholder
        await AIInterviewSynthesis.findOneAndUpdate(
            { sessionId },
            {
                attemptId: attempt._id,
                sessionId,
                totalQuestions: responses.length,
                processedQuestions: 0,
                status: 'PENDING',
            },
            { upsert: true, new: true }
        )

        return {
            sessionId,
            status: 'COMPLETED',
            totalResponses: uploadedCount,
        }
    }

    /**
     * End AI session (legacy compat + candidate exit)
     */
    async endSession(
        attemptId: string,
        input: EndAISessionInput
    ): Promise<EndAISessionResponse> {
        const attempt = await AssessmentAttempt.findById(attemptId)
        if (!attempt) throw this.createError('Attempt not found', 404, 'NOT_FOUND')

        const aiRound = attempt.rounds.find(r => r.roundType === 'AI')
        if (!aiRound || !aiRound.aiSessionId) {
            throw this.createError('No active AI session', 400, 'INVALID_STATE')
        }

        const now = new Date()
        const statusMap: Record<string, string> = {
            COMPLETED: AISessionStatus.COMPLETED,
            TIMEOUT: AISessionStatus.TIMEOUT,
            CANDIDATE_EXIT: AISessionStatus.CANDIDATE_EXIT,
            ERROR: AISessionStatus.FAILED,
        }

        aiRound.aiSessionStatus = (statusMap[input.reason] || AISessionStatus.COMPLETED) as typeof aiRound.aiSessionStatus
        aiRound.status = RoundStatus.COMPLETED
        aiRound.endedAt = now
        aiRound.aiDurationSeconds = aiRound.startedAt
            ? Math.floor((now.getTime() - new Date(aiRound.startedAt).getTime()) / 1000)
            : 0

        await attempt.save()

        // Also complete the session if reason is COMPLETED
        if (input.reason === 'COMPLETED') {
            try {
                await this.completeSession(attemptId, { sessionId: input.sessionId })
            } catch {
                // Swallow — may already be completed
            }
        }

        return {
            sessionId: input.sessionId,
            status: aiRound.aiSessionStatus || AISessionStatus.COMPLETED,
            duration: aiRound.aiDurationSeconds || 0,
            endedAt: now.toISOString(),
        }
    }

    // ────── RESULTS (RECRUITER) ──────

    /**
     * Get full AI interview results for recruiter dashboard.
     * Supports both legacy (aiSessionId + AIInterviewResponse) and Ribbon (ribbonInterviewId + synthesis only).
     */
    async getInterviewResults(attemptId: string): Promise<AIInterviewResultsResponse> {
        const attempt = await AssessmentAttempt.findById(attemptId)
        if (!attempt) throw this.createError('Attempt not found', 404, 'NOT_FOUND')

        const aiRound = attempt.rounds.find(r => r.roundType === 'AI')
        const sessionId = aiRound?.ribbonInterviewId || aiRound?.aiSessionId
        if (!aiRound || !sessionId) {
            return {
                sessionId: '',
                status: 'NOT_STARTED',
                synthesis: null,
                responses: [],
                consent: null,
                aiDisclosure: AI_DISCLOSURE_TEXT,
            }
        }

        const synthesis = await AIInterviewSynthesis.findOne({ sessionId })
        const responses = await AIInterviewResponse.find({ sessionId }).sort({ questionIndex: 1 })

        return {
            sessionId,
            status: aiRound.aiSessionStatus || aiRound.status || 'NOT_STARTED',
            synthesis: synthesis && synthesis.status === 'COMPLETED'
                ? {
                    overallSummary: synthesis.overallSummary,
                    strengths: synthesis.strengths,
                    gaps: synthesis.gaps,
                    suggestedFollowUps: synthesis.suggestedFollowUps,
                }
                : null,
            responses: responses.map(r => ({
                questionId: r.questionId,
                questionText: r.questionText,
                questionIndex: r.questionIndex,
                durationSeconds: r.durationSeconds,
                status: r.status,
                transcript: r.transcript || null,
                analysis: r.analysis
                    ? {
                        summary: r.analysis.summary,
                        keyPoints: r.analysis.keyPoints,
                        skillsObserved: r.analysis.skillsObserved,
                        relevance: r.analysis.relevance,
                    }
                    : null,
            })),
            consent: aiRound.aiConsentRecordedAt
                ? { recordedAt: aiRound.aiConsentRecordedAt.toISOString() }
                : null,
            aiDisclosure: AI_DISCLOSURE_TEXT,
        }
    }

    /**
     * Get signed download URL for a response video
     */
    async getResponseVideoUrl(attemptId: string, questionId: string): Promise<{ downloadUrl: string }> {
        const attempt = await AssessmentAttempt.findById(attemptId)
        if (!attempt) throw this.createError('Attempt not found', 404, 'NOT_FOUND')

        const aiRound = attempt.rounds.find(r => r.roundType === 'AI')
        if (!aiRound?.aiSessionId) throw this.createError('No AI session', 400, 'INVALID_STATE')

        const response = await AIInterviewResponse.findOne({
            sessionId: aiRound.aiSessionId,
            questionId,
        })
        if (!response || !response.storageKey) {
            throw this.createError('Video not found', 404, 'NOT_FOUND')
        }

        const { downloadUrl } = await generateDownloadUrl(response.storageKey)
        return { downloadUrl }
    }

    /**
     * Get session details (legacy compat)
     */
    async getSessionDetails(attemptId: string) {
        const attempt = await AssessmentAttempt.findById(attemptId)
        if (!attempt) throw this.createError('Attempt not found', 404, 'NOT_FOUND')

        const aiRound = attempt.rounds.find(r => r.roundType === 'AI')

        return {
            sessionId: aiRound?.aiSessionId || null,
            status: aiRound?.aiSessionStatus || null,
            agentType: aiRound?.agentType || null,
            transcript: aiRound?.transcript || [],
            mediaAssets: aiRound?.aiMediaAssets || null,
            duration: aiRound?.aiDurationSeconds || null,
            startedAt: aiRound?.startedAt?.toISOString() || null,
            endedAt: aiRound?.endedAt?.toISOString() || null,
            questions: aiRound?.aiQuestions || [],
            consentRecordedAt: aiRound?.aiConsentRecordedAt?.toISOString() || null,
        }
    }

    // ────── HELPERS ──────

    private createError(message: string, statusCode: number, code: string) {
        const error = new Error(message) as Error & { statusCode: number; code: string }
        error.statusCode = statusCode
        error.code = code
        return error
    }
}

export const aiInterviewService = new AIInterviewService()

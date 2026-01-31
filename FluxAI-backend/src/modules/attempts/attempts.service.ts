import prisma from '../../database/prisma.js'
import { RoundType, AttemptStatus, RoundStatus } from '@prisma/client'
import {
    StartAttemptInput,
    SubmitRoundInput,
    AttemptResponse,
    RoundAttemptResponse,
} from './attempts.types.js'
import { evaluationService } from '../evaluation/evaluation.service.js'

export class AttemptsService {
    /**
     * Start or resume an attempt
     * - Only one active attempt per candidate per assessment
     * - Resume existing if already started
     */
    async startOrResume(assessmentId: string, input: StartAttemptInput): Promise<AttemptResponse> {
        // Verify assessment is ACTIVE
        const assessment = await prisma.assessment.findUnique({
            where: { id: assessmentId },
            include: { rounds: { where: { enabled: true }, orderBy: { order: 'asc' } } },
        })

        if (!assessment) {
            const error = new Error('Assessment not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        if (assessment.status !== 'ACTIVE') {
            const error = new Error('Assessment is not active') as Error & { statusCode: number; code: string }
            error.statusCode = 422
            error.code = 'INVALID_STATUS'
            throw error
        }

        // Find or create candidate
        let candidate = await prisma.candidate.findUnique({
            where: { email: input.candidateEmail },
        })

        if (!candidate) {
            candidate = await prisma.candidate.create({
                data: {
                    email: input.candidateEmail,
                    firstName: input.candidateFirstName,
                    lastName: input.candidateLastName,
                },
            })
        }

        // Check for existing attempt (resume)
        const existingAttempt = await prisma.assessmentAttempt.findUnique({
            where: {
                assessmentId_candidateId: { assessmentId, candidateId: candidate.id },
            },
            include: {
                assessment: { select: { title: true } },
                rounds: { orderBy: { roundType: 'asc' } },
            },
        })

        if (existingAttempt) {
            // Resume existing attempt
            return this.formatAttempt(existingAttempt)
        }

        // Create new attempt with round attempts for enabled rounds
        const attempt = await prisma.assessmentAttempt.create({
            data: {
                assessmentId,
                candidateId: candidate.id,
                status: 'NOT_STARTED',
                rounds: {
                    create: assessment.rounds.map((r) => ({
                        roundType: r.roundType,
                        status: 'NOT_STARTED',
                    })),
                },
            },
            include: {
                assessment: { select: { title: true } },
                rounds: { orderBy: { roundType: 'asc' } },
            },
        })

        return this.formatAttempt(attempt)
    }

    /**
     * Get attempt by ID
     */
    async getById(attemptId: string): Promise<AttemptResponse> {
        const attempt = await prisma.assessmentAttempt.findUnique({
            where: { id: attemptId },
            include: {
                assessment: { select: { title: true } },
                rounds: { orderBy: { roundType: 'asc' } },
            },
        })

        if (!attempt) {
            const error = new Error('Attempt not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        return this.formatAttempt(attempt)
    }

    /**
     * Start a specific round
     * - Server timestamp only
     * - FSM: NOT_STARTED → IN_PROGRESS
     */
    async startRound(attemptId: string, roundType: RoundType): Promise<AttemptResponse> {
        const attempt = await prisma.assessmentAttempt.findUnique({
            where: { id: attemptId },
            include: { rounds: true },
        })

        if (!attempt) {
            const error = new Error('Attempt not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        // Check attempt is active or not started
        if (attempt.status === 'COMPLETED' || attempt.status === 'TIMED_OUT' || attempt.status === 'DISQUALIFIED') {
            const error = new Error('Attempt is already finished') as Error & { statusCode: number; code: string }
            error.statusCode = 422
            error.code = 'INVALID_STATUS'
            throw error
        }

        const roundAttempt = attempt.rounds.find((r) => r.roundType === roundType)
        if (!roundAttempt) {
            const error = new Error('Round not found in this attempt') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        if (roundAttempt.status !== 'NOT_STARTED') {
            const error = new Error('Round already started') as Error & { statusCode: number; code: string }
            error.statusCode = 422
            error.code = 'INVALID_STATUS'
            throw error
        }

        // Start round with server timestamp
        await prisma.roundAttempt.update({
            where: { id: roundAttempt.id },
            data: {
                status: 'IN_PROGRESS',
                startedAt: new Date(), // Server timestamp only
            },
        })

        // If attempt was NOT_STARTED, transition to IN_PROGRESS
        if (attempt.status === 'NOT_STARTED') {
            await prisma.assessmentAttempt.update({
                where: { id: attemptId },
                data: {
                    status: 'IN_PROGRESS',
                    startedAt: new Date(), // Server timestamp only
                },
            })
        }

        return this.getById(attemptId)
    }

    /**
     * Submit a round
     * - Cannot submit twice
     * - Server timestamp only
     * - Auto-advance state
     */
    async submitRound(attemptId: string, roundType: RoundType, input: SubmitRoundInput): Promise<AttemptResponse> {
        const attempt = await prisma.assessmentAttempt.findUnique({
            where: { id: attemptId },
            include: { rounds: true },
        })

        if (!attempt) {
            const error = new Error('Attempt not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        if (attempt.status !== 'IN_PROGRESS') {
            const error = new Error('Attempt is not in progress') as Error & { statusCode: number; code: string }
            error.statusCode = 422
            error.code = 'INVALID_STATUS'
            throw error
        }

        const roundAttempt = attempt.rounds.find((r) => r.roundType === roundType)
        if (!roundAttempt) {
            const error = new Error('Round not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        // Cannot submit twice
        if (roundAttempt.status === 'COMPLETED') {
            const error = new Error('Round already submitted') as Error & { statusCode: number; code: string }
            error.statusCode = 422
            error.code = 'ALREADY_SUBMITTED'
            throw error
        }

        if (roundAttempt.status !== 'IN_PROGRESS') {
            const error = new Error('Round not started') as Error & { statusCode: number; code: string }
            error.statusCode = 422
            error.code = 'INVALID_STATUS'
            throw error
        }

        // Submit round with server timestamp
        await prisma.roundAttempt.update({
            where: { id: roundAttempt.id },
            data: {
                status: 'COMPLETED',
                endedAt: new Date(), // Server timestamp only
                answers: input.answers as object,
            },
        })

        // Check if all rounds completed → auto-advance to COMPLETED
        const allRounds = await prisma.roundAttempt.findMany({
            where: { attemptId },
        })

        const allCompleted = allRounds.every(
            (r) => r.id === roundAttempt.id || r.status === 'COMPLETED' || r.status === 'SKIPPED'
        )

        if (allCompleted) {
            await prisma.assessmentAttempt.update({
                where: { id: attemptId },
                data: {
                    status: 'COMPLETED',
                    submittedAt: new Date(),
                },
            })
        }

        return this.getById(attemptId)
    }

    /**
     * Format attempt for response
     */
    private formatAttempt(attempt: {
        id: string
        assessmentId: string
        assessment: { title: string }
        candidateId: string
        status: AttemptStatus
        startedAt: Date | null
        submittedAt: Date | null
        rounds: Array<{
            id: string
            roundType: RoundType
            status: RoundStatus
            startedAt: Date | null
            endedAt: Date | null
        }>
        createdAt: Date
    }): AttemptResponse {
        return {
            id: attempt.id,
            assessmentId: attempt.assessmentId,
            assessmentTitle: attempt.assessment.title,
            candidateId: attempt.candidateId,
            status: attempt.status,
            startedAt: attempt.startedAt,
            submittedAt: attempt.submittedAt,
            rounds: attempt.rounds.map((r): RoundAttemptResponse => ({
                id: r.id,
                roundType: r.roundType,
                status: r.status,
                startedAt: r.startedAt,
                endedAt: r.endedAt,
            })),
            createdAt: attempt.createdAt,
        }
    }
}

export const attemptsService = new AttemptsService()

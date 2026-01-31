import prisma from '../../database/prisma.js'
import { Prisma } from '@prisma/client'
import {
    CreateAssessmentInput,
    UpdateAssessmentInput,
    RoundConfigInput,
    AssessmentResponse,
    AssessmentListResponse,
    RoundResponse,
} from './assessments.types.js'
import { validateRoundsForPublish } from '../rounds/rounds.validators.js'

export class AssessmentsService {
    /**
     * Create a new assessment in DRAFT status
     */
    async create(organizationId: string, input: CreateAssessmentInput): Promise<AssessmentResponse> {
        // Create assessment with default rounds (all disabled)
        const assessment = await prisma.assessment.create({
            data: {
                organizationId,
                title: input.title,
                jobId: input.jobId,
                status: 'DRAFT',
                rounds: {
                    create: [
                        { roundType: 'MCQ', enabled: false, order: 1 },
                        { roundType: 'DSA', enabled: false, order: 2 },
                        { roundType: 'AI', enabled: false, order: 3 },
                    ],
                },
            },
            include: { rounds: { orderBy: { order: 'asc' } } },
        })

        return this.formatAssessment(assessment)
    }

    /**
     * List assessments for an organization
     */
    async list(organizationId: string): Promise<AssessmentListResponse> {
        const [assessments, total] = await Promise.all([
            prisma.assessment.findMany({
                where: { organizationId },
                include: { rounds: { orderBy: { order: 'asc' } } },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.assessment.count({ where: { organizationId } }),
        ])

        return {
            data: assessments.map((a) => this.formatAssessment(a)),
            total,
        }
    }

    /**
     * Get assessment by ID (with org check)
     */
    async getById(id: string, organizationId: string): Promise<AssessmentResponse> {
        const assessment = await prisma.assessment.findFirst({
            where: { id, organizationId },
            include: { rounds: { orderBy: { order: 'asc' } } },
        })

        if (!assessment) {
            const error = new Error('Assessment not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        return this.formatAssessment(assessment)
    }

    /**
     * Update assessment metadata
     */
    async update(id: string, organizationId: string, input: UpdateAssessmentInput): Promise<AssessmentResponse> {
        // Verify assessment exists and belongs to org
        await this.getById(id, organizationId)

        const assessment = await prisma.assessment.update({
            where: { id },
            data: input,
            include: { rounds: { orderBy: { order: 'asc' } } },
        })

        return this.formatAssessment(assessment)
    }

    /**
     * Configure all rounds for an assessment
     */
    async configureRounds(id: string, organizationId: string, input: RoundConfigInput): Promise<AssessmentResponse> {
        // Verify assessment exists and is in DRAFT status
        const assessment = await this.getById(id, organizationId)

        if (assessment.status !== 'DRAFT') {
            const error = new Error('Cannot modify rounds of a published assessment') as Error & { statusCode: number; code: string }
            error.statusCode = 422
            error.code = 'INVALID_STATUS'
            throw error
        }

        // Update each round
        const roundTypes: ('MCQ' | 'DSA' | 'AI')[] = ['MCQ', 'DSA', 'AI']

        for (const roundType of roundTypes) {
            const roundConfig = input[roundType]
            if (roundConfig) {
                await prisma.assessmentRound.update({
                    where: {
                        assessmentId_roundType: { assessmentId: id, roundType },
                    },
                    data: {
                        enabled: roundConfig.enabled,
                        order: roundConfig.order,
                        config: roundConfig.config as unknown as Prisma.InputJsonValue,
                    },
                })
            }
        }

        return this.getById(id, organizationId)
    }

    /**
     * Publish an assessment
     * - Status must be DRAFT
     * - At least one round enabled
     * - All enabled rounds must have valid config
     * - Idempotent: if already ACTIVE, return success
     */
    async publish(id: string, organizationId: string): Promise<AssessmentResponse> {
        const assessment = await this.getById(id, organizationId)

        // Idempotent: already published
        if (assessment.status === 'ACTIVE') {
            return assessment
        }

        // Must be DRAFT to publish
        if (assessment.status !== 'DRAFT') {
            const error = new Error('Only DRAFT assessments can be published') as Error & { statusCode: number; code: string }
            error.statusCode = 422
            error.code = 'INVALID_STATUS'
            throw error
        }

        // Build round config for validation
        const roundsConfig: RoundConfigInput = {}
        for (const round of assessment.rounds) {
            roundsConfig[round.roundType] = {
                enabled: round.enabled,
                order: round.order,
                config: round.config as never,
            }
        }

        // Validate all enabled rounds
        const validation = await validateRoundsForPublish(roundsConfig)
        if (!validation.valid) {
            const error = new Error('Invalid round configuration') as Error & {
                statusCode: number
                code: string
                details: typeof validation.errors
            }
            error.statusCode = 422
            error.code = 'VALIDATION_ERROR'
            error.details = validation.errors
            throw error
        }

        // Transition to ACTIVE
        const updated = await prisma.assessment.update({
            where: { id },
            data: { status: 'ACTIVE' },
            include: { rounds: { orderBy: { order: 'asc' } } },
        })

        return this.formatAssessment(updated)
    }

    /**
     * Format assessment for response
     */
    private formatAssessment(assessment: {
        id: string
        organizationId: string
        jobId: string | null
        title: string
        status: string
        rounds: Array<{
            id: string
            roundType: string
            enabled: boolean
            order: number
            config: Prisma.JsonValue
        }>
        createdAt: Date
        updatedAt: Date
    }): AssessmentResponse {
        return {
            id: assessment.id,
            organizationId: assessment.organizationId,
            jobId: assessment.jobId,
            title: assessment.title,
            status: assessment.status as 'DRAFT' | 'ACTIVE' | 'CLOSED',
            rounds: assessment.rounds.map((r): RoundResponse => ({
                id: r.id,
                roundType: r.roundType as 'MCQ' | 'DSA' | 'AI',
                enabled: r.enabled,
                order: r.order,
                config: r.config as RoundResponse['config'],
            })),
            createdAt: assessment.createdAt,
            updatedAt: assessment.updatedAt,
        }
    }
}

export const assessmentsService = new AssessmentsService()

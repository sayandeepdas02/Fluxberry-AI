import {
    Assessment,
    IAssessment,
    IAssessmentRound,
    RoundType,
    RoundTypeValue,
} from '../../database/models/index.js'
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
        const assessment = await Assessment.create({
            organizationId,
            title: input.title,
            jobId: input.jobId,
            rounds: [
                { roundType: 'MCQ', enabled: false, order: 1, config: {} },
                { roundType: 'DSA', enabled: false, order: 2, config: {} },
                { roundType: 'AI', enabled: false, order: 3, config: {} },
            ],
        })

        return this.formatAssessment(assessment)
    }

    /**
     * List assessments for an organization
     */
    async list(organizationId: string): Promise<AssessmentListResponse> {
        const [assessments, total] = await Promise.all([
            Assessment.find({ organizationId })
                .sort({ createdAt: -1 }),
            Assessment.countDocuments({ organizationId }),
        ])

        return {
            data: assessments.map(this.formatAssessment.bind(this)),
            total,
        }
    }

    /**
     * Get assessment by ID (with org check)
     */
    async getById(id: string, organizationId: string): Promise<AssessmentResponse> {
        const assessment = await Assessment.findOne({ _id: id, organizationId })

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

        const assessment = await Assessment.findByIdAndUpdate(
            id,
            { $set: input },
            { new: true }
        )

        if (!assessment) {
            const error = new Error('Assessment not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

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
        const roundTypes: RoundTypeValue[] = ['MCQ', 'DSA', 'AI']

        const assessmentDoc = await Assessment.findById(id)
        if (!assessmentDoc) {
            const error = new Error('Assessment not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        for (const roundType of roundTypes) {
            const roundConfig = input[roundType]
            if (roundConfig) {
                const roundIndex = assessmentDoc.rounds.findIndex(r => r.roundType === roundType)
                if (roundIndex !== -1) {
                    assessmentDoc.rounds[roundIndex].enabled = roundConfig.enabled
                    assessmentDoc.rounds[roundIndex].order = roundConfig.order
                    assessmentDoc.rounds[roundIndex].config = roundConfig.config as Record<string, unknown>
                }
            }
        }

        await assessmentDoc.save()

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
        await Assessment.findByIdAndUpdate(id, { $set: { status: 'ACTIVE' } })

        return this.getById(id, organizationId)
    }

    /**
     * Format assessment for response
     */
    private formatAssessment(assessment: IAssessment): AssessmentResponse {
        // Sort rounds by order
        const sortedRounds = [...assessment.rounds].sort((a, b) => a.order - b.order)

        return {
            id: assessment._id.toString(),
            organizationId: assessment.organizationId.toString(),
            jobId: assessment.jobId ?? null,
            title: assessment.title,
            status: assessment.status as 'DRAFT' | 'ACTIVE' | 'CLOSED',
            rounds: sortedRounds.map((r): RoundResponse => ({
                id: r._id?.toString() ?? '',
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

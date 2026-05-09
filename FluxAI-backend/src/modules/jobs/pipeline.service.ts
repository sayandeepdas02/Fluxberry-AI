import { AppError } from '../../common/errors/index.js'
import {
    PipelineStage, IPipelineStage, PipelineStageType,
    PipelineStageTypeValue
} from '../../database/models/index.js'

// Default pipeline stages for new jobs
const DEFAULT_STAGES: { name: string; type: PipelineStageTypeValue; order: number; color: string }[] = [
    { name: 'Applied', type: PipelineStageType.APPLIED, order: 0, color: '#6B7280' },
    { name: 'Screening', type: PipelineStageType.SCREENING, order: 1, color: '#3B82F6' },
    { name: 'Interview', type: PipelineStageType.INTERVIEW, order: 2, color: '#8B5CF6' },
    { name: 'Offer', type: PipelineStageType.OFFER, order: 3, color: '#F59E0B' },
    { name: 'Hired', type: PipelineStageType.HIRED, order: 4, color: '#10B981' },
    { name: 'Rejected', type: PipelineStageType.REJECTED, order: 5, color: '#EF4444' },
]

class PipelineService {
    /**
     * Create default pipeline stages for a new job
     */
    async createDefaultStages(jobId: string, organizationId: string): Promise<IPipelineStage[]> {
        const stages = DEFAULT_STAGES.map(stage => ({
            jobId,
            organizationId,
            name: stage.name,
            type: stage.type,
            order: stage.order,
            color: stage.color,
            isDefault: true,
        }))

        return PipelineStage.insertMany(stages) as unknown as IPipelineStage[]
    }

    /**
     * Get all pipeline stages for a job, ordered
     */
    async getStages(jobId: string, organizationId: string): Promise<IPipelineStage[]> {
        return PipelineStage.find({ jobId, organizationId }).sort({ order: 1 }).lean()
    }

    /**
     * Add a custom stage to a job's pipeline
     */
    async addStage(
        jobId: string,
        organizationId: string,
        input: { name: string; color?: string; afterOrder?: number }
    ): Promise<IPipelineStage> {
        // Find the max order
        const existing = await PipelineStage.find({ jobId, organizationId }).sort({ order: -1 }).limit(1)
        const maxOrder = existing.length > 0 ? existing[0].order : -1

        // Determine insertion order
        let insertOrder: number
        if (input.afterOrder !== undefined && input.afterOrder < maxOrder) {
            insertOrder = input.afterOrder + 1
            // Shift all stages after this order up by 1
            await PipelineStage.updateMany(
                { jobId, organizationId, order: { $gte: insertOrder } },
                { $inc: { order: 1 } }
            )
        } else {
            insertOrder = maxOrder + 1
        }

        return PipelineStage.create({
            jobId,
            organizationId,
            name: input.name,
            type: PipelineStageType.CUSTOM,
            order: insertOrder,
            color: input.color || '#6B7280',
            isDefault: false,
        })
    }

    /**
     * Reorder stages by providing ordered array of stage IDs
     */
    async reorderStages(
        jobId: string,
        organizationId: string,
        stageIds: string[]
    ): Promise<IPipelineStage[]> {
        // Validate all IDs belong to this job
        const stages = await PipelineStage.find({ jobId, organizationId })
        const stageMap = new Map(stages.map(s => [s._id.toString(), s]))

        for (const id of stageIds) {
            if (!stageMap.has(id)) {
                throw AppError.badRequest(`Stage ${id} does not belong to this job`)
            }
        }

        // Update orders
        const updates = stageIds.map((id, index) =>
            PipelineStage.findByIdAndUpdate(id, { order: index }, { new: true })
        )

        await Promise.all(updates)
        return this.getStages(jobId, organizationId)
    }

    /**
     * Remove a custom stage. Cannot remove default stages.
     */
    async removeStage(jobId: string, organizationId: string, stageId: string): Promise<void> {
        const stage = await PipelineStage.findOne({ _id: stageId, jobId, organizationId })
        if (!stage) {
            throw AppError.notFound('Stage')
        }
        if (stage.isDefault) {
            throw AppError.validation('Cannot remove default pipeline stages')
        }

        await stage.deleteOne()

        // Re-order remaining stages
        const remaining = await PipelineStage.find({ jobId, organizationId }).sort({ order: 1 })
        const updates = remaining.map((s, index) =>
            PipelineStage.findByIdAndUpdate(s._id, { order: index })
        )
        await Promise.all(updates)
    }

    /**
     * Get a single stage by ID
     */
    async getStageById(stageId: string): Promise<IPipelineStage> {
        const stage = await PipelineStage.findById(stageId)
        if (!stage) {
            throw AppError.notFound('Pipeline stage')
        }
        return stage
    }
}

export const pipelineService = new PipelineService()

import {
    JobApplication, IJobApplication, Candidate, StageHistory, AuditLog,
    ApplicationStatus, ApplicationStatusType
} from '../../database/models/index.js'
import { ListApplicationsQuery, UpdateStageInput, BulkUpdateInput } from './applications.types.js'

class ApplicationsService {
    async list(
        jobId: string,
        organizationId: string,
        query: ListApplicationsQuery
    ): Promise<{ applications: any[]; total: number; page: number; limit: number }> {
        const { page = 1, limit = 20, stage, search, sort = '-appliedAt' } = query
        const skip = (page - 1) * limit

        const filter: any = { jobId, organizationId }

        if (stage) {
            filter.status = stage
        }

        // If search is provided, we need to find matching candidate IDs first
        let candidateIds: string[] | null = null
        if (search) {
            const matchingCandidates = await Candidate.find({
                organizationId,
                $or: [
                    { email: { $regex: search, $options: 'i' } },
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                ],
            }).select('_id')
            candidateIds = matchingCandidates.map((c) => c._id.toString())
            filter.candidateId = { $in: candidateIds }
        }

        // Build sort object
        let sortObj: Record<string, 1 | -1> = { submittedAt: -1 }
        if (sort === 'appliedAt') sortObj = { submittedAt: 1 }
        else if (sort === '-appliedAt') sortObj = { submittedAt: -1 }

        const [applications, total] = await Promise.all([
            JobApplication.find(filter)
                .populate('candidateId', 'firstName lastName email phone resumeUrl')
                .populate('jobId', 'title')
                .sort(sortObj)
                .skip(skip)
                .limit(limit)
                .lean(),
            JobApplication.countDocuments(filter),
        ])

        return { applications, total, page, limit }
    }

    async getById(id: string, organizationId: string): Promise<IJobApplication> {
        const application = await JobApplication.findOne({ _id: id, organizationId })
            .populate('candidateId', 'firstName lastName email phone resumeUrl')
            .populate('jobId', 'title status')
        if (!application) {
            throw { code: 'NOT_FOUND', message: 'Application not found' }
        }
        return application
    }

    async updateStage(
        id: string,
        organizationId: string,
        input: UpdateStageInput,
        userId: string
    ): Promise<IJobApplication> {
        const application = await JobApplication.findOne({ _id: id, organizationId })
        if (!application) {
            throw { code: 'NOT_FOUND', message: 'Application not found' }
        }

        const previousStage = application.status
        const newStage = input.stage as ApplicationStatusType

        if (previousStage === newStage) {
            throw { code: 'VALIDATION_ERROR', message: 'Application is already in this stage' }
        }

        // Update application status
        application.status = newStage
        await application.save()

        // Create stage history entry
        await StageHistory.create({
            applicationId: application._id,
            organizationId,
            fromStage: previousStage,
            toStage: newStage,
            changedBy: userId,
        })

        // Create audit log
        await AuditLog.create({
            organizationId,
            entityType: 'JobApplication',
            entityId: application._id,
            action: 'STAGE_CHANGE',
            previousValue: { status: previousStage },
            newValue: { status: newStage },
            performedBy: userId,
        })

        return application
    }

    async bulkUpdate(
        organizationId: string,
        input: BulkUpdateInput,
        userId: string
    ): Promise<{ updated: number; errors: string[] }> {
        const { applicationIds, action, stage } = input
        const errors: string[] = []
        let updated = 0

        // Validate all applications belong to this org
        const applications = await JobApplication.find({
            _id: { $in: applicationIds },
            organizationId,
        })

        if (applications.length !== applicationIds.length) {
            const foundIds = new Set(applications.map((a) => a._id.toString()))
            const missing = applicationIds.filter((id) => !foundIds.has(id))
            throw {
                code: 'VALIDATION_ERROR',
                message: `Applications not found or not in org: ${missing.join(', ')}`,
            }
        }

        const targetStage: ApplicationStatusType =
            action === 'REJECT'
                ? ApplicationStatus.REJECTED
                : (stage as ApplicationStatusType)

        // Process each application
        for (const app of applications) {
            try {
                if (app.status === targetStage) {
                    errors.push(`${app._id}: already in stage ${targetStage}`)
                    continue
                }

                const previousStage = app.status

                app.status = targetStage
                await app.save()

                // Create stage history
                await StageHistory.create({
                    applicationId: app._id,
                    organizationId,
                    fromStage: previousStage,
                    toStage: targetStage,
                    changedBy: userId,
                })

                // Create audit log
                await AuditLog.create({
                    organizationId,
                    entityType: 'JobApplication',
                    entityId: app._id,
                    action: action === 'REJECT' ? 'BULK_REJECT' : 'BULK_STAGE_CHANGE',
                    previousValue: { status: previousStage },
                    newValue: { status: targetStage },
                    performedBy: userId,
                })

                updated++
            } catch (err) {
                errors.push(`${app._id}: failed to update`)
            }
        }

        return { updated, errors }
    }

    async getStageDistribution(
        jobId: string,
        organizationId: string
    ): Promise<Record<string, number>> {
        const pipeline = await JobApplication.aggregate([
            { $match: { jobId: { $exists: true }, organizationId: { $exists: true } } },
            {
                $match: {
                    jobId: new (await import('mongoose')).default.Types.ObjectId(jobId),
                    organizationId: new (await import('mongoose')).default.Types.ObjectId(organizationId),
                },
            },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ])

        const distribution: Record<string, number> = {}
        for (const stage of Object.values(ApplicationStatus)) {
            distribution[stage] = 0
        }
        for (const item of pipeline) {
            distribution[item._id] = item.count
        }
        return distribution
    }
}

export const applicationsService = new ApplicationsService()

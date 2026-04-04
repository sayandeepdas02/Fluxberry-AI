import { Candidate, ICandidate, AssessmentAttempt, JobApplication, StageHistory, CandidateNote, FileAsset } from '../../database/models/index.js'
import { ScreeningResult } from '../ats-screening/models/screening-result.model.js'
import { CreateCandidateInput, UpdateCandidateInput, ListCandidatesQuery, CreateNoteInput } from './candidates.types.js'
import { eventBus, DomainEvent } from '../../common/services/event-bus.service.js'
import { activityService } from '../activity/activity.service.js'

class CandidatesService {
    async create(organizationId: string, input: CreateCandidateInput, userId: string): Promise<ICandidate> {
        // Check if candidate exists in this org
        const existing = await Candidate.findOne({ organizationId, email: input.email })
        if (existing) {
            throw { code: 'CONFLICT', message: 'Candidate with this email already exists in this organization' }
        }

        const candidate = await Candidate.create({
            organizationId,
            ...input
        })

        eventBus.emit(DomainEvent.CANDIDATE_CREATED, {
            organizationId,
            entityId: candidate._id.toString(),
            entityType: 'CANDIDATE'
        })

        await activityService.log({
            organizationId,
            entityType: 'candidate',
            entityId: candidate._id.toString(),
            eventType: 'CANDIDATE_CREATED',
            actorType: 'user',
            performedBy: userId,
            metadata: { source: input.source }
        })

        return candidate
    }

    async list(organizationId: string, query: ListCandidatesQuery): Promise<{ candidates: ICandidate[], total: number, page: number, totalPages: number }> {
        const { page = 1, limit = 20, search, source, jobId, stage, dateFrom, dateTo, tags } = query
        const skip = (page - 1) * limit

        const filter: any = { organizationId, isDeleted: false, deletedAt: null }

        if (source) {
            filter.source = source
        }

        if (tags) {
            const tagArray = tags.split(',').map(t => t.trim())
            if (tagArray.length > 0) {
                filter.tags = { $in: tagArray }
            }
        }

        if (search) {
            // Use text search if text index is available
            filter.$text = { $search: search }
            // sort by relevance score if searching
        }

        // Filter by job and/or stage via JobApplication lookup
        if (jobId || stage) {
            const appFilter: any = { organizationId }
            if (jobId) appFilter.jobId = jobId
            if (stage) appFilter.status = stage

            const matchingApps = await JobApplication.find(appFilter).select('candidateId').lean()
            const candidateIds = [...new Set(matchingApps.map(a => a.candidateId.toString()))]

            // If we already have ids from another filter, we need intersection
            if (filter._id) {
                const existingIds = filter._id.$in
                const intersection = existingIds.filter((id: string) => candidateIds.includes(id))
                filter._id = { $in: intersection }
            } else {
                filter._id = { $in: candidateIds }
            }
        }

        // Date range filter
        if (dateFrom || dateTo) {
            filter.createdAt = {}
            if (dateFrom) filter.createdAt.$gte = new Date(dateFrom)
            if (dateTo) filter.createdAt.$lte = new Date(dateTo)
        }

        const sortOptions: any = search ? { score: { $meta: 'textScore' } } : { createdAt: -1 }

        const [candidates, total] = await Promise.all([
            Candidate.find(filter, search ? { score: { $meta: 'textScore' } } : undefined)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit),
            Candidate.countDocuments(filter)
        ])

        return {
            candidates,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        }
    }

    async getById(id: string, organizationId: string): Promise<ICandidate> {
        const candidate = await Candidate.findOne({ _id: id, organizationId })
        if (!candidate) {
            throw { code: 'NOT_FOUND', message: 'Candidate not found' }
        }
        return candidate
    }

    /**
     * Full candidate detail: candidate + applications + stage history + notes
     */
    async getDetail(id: string, organizationId: string) {
        const candidate = await this.getById(id, organizationId)

        const [applications, notes, history] = await Promise.all([
            JobApplication.find({ candidateId: id, organizationId })
                .populate('jobId', 'title status department location')
                .sort({ submittedAt: -1 })
                .lean(),
            CandidateNote.find({ candidateId: id, organizationId })
                .populate('authorId', 'firstName lastName email')
                .sort({ createdAt: -1 })
                .lean(),
            StageHistory.find({ organizationId })
                .where('applicationId')
                .in(
                    (await JobApplication.find({ candidateId: id, organizationId }).select('_id').lean())
                        .map(a => a._id)
                )
                .populate('changedBy', 'firstName lastName')
                .sort({ changedAt: -1 })
                .lean(),
        ])

        // Also get assessment attempt history
        const attempts = await AssessmentAttempt.find({ candidateId: id })
            .populate('assessmentId', 'title status')
            .sort({ createdAt: -1 })

        // Get best screening result for AI Summary tab
        const screeningResults = await ScreeningResult.find({
            candidateId: id,
            organizationId,
            status: { $in: ['SCORED', 'PASSED', 'FAILED_GATE'] }
        })
            .sort({ finalScore: -1 })
            .limit(1)
            .lean()

        const bestScreening = screeningResults[0] || null

        return {
            candidate,
            applications,
            notes,
            stageHistory: history,
            assessmentHistory: attempts,
            screening: bestScreening,
        }
    }

    async getHistory(id: string, organizationId: string): Promise<any> {
        // Verify candidate exists
        await this.getById(id, organizationId)

        // Fetch attempts
        const attempts = await AssessmentAttempt.find({ candidateId: id })
            .populate('assessmentId', 'title status')
            .sort({ createdAt: -1 })

        return attempts
    }

    async update(id: string, organizationId: string, input: UpdateCandidateInput, userId: string): Promise<ICandidate> {
        const candidate = await Candidate.findOneAndUpdate(
            { _id: id, organizationId },
            { $set: input },
            { new: true }
        )
        if (!candidate) {
            throw { code: 'NOT_FOUND', message: 'Candidate not found' }
        }

        eventBus.emit(DomainEvent.CANDIDATE_UPDATED, {
            organizationId,
            entityId: candidate._id.toString(),
            entityType: 'CANDIDATE'
        })

        await activityService.log({
            organizationId,
            entityType: 'candidate',
            entityId: candidate._id.toString(),
            eventType: 'CANDIDATE_UPDATED',
            actorType: 'user',
            performedBy: userId,
            metadata: { changes: Object.keys(input) }
        })

        return candidate
    }

    async addNote(candidateId: string, organizationId: string, authorId: string, input: CreateNoteInput) {
        // Verify candidate exists in org
        await this.getById(candidateId, organizationId)

        const note = await CandidateNote.create({
            candidateId,
            organizationId,
            authorId,
            content: input.content,
        })

        // Populate author for response
        return CandidateNote.findById(note._id)
            .populate('authorId', 'firstName lastName email')
            .lean()
    }

    /**
     * Attach a resume FileAsset to a candidate profile
     * Resolves the storage key to a URL and stores on the candidate
     */
    async attachResume(candidateId: string, organizationId: string, fileId: string): Promise<ICandidate> {
        // Verify candidate exists
        await this.getById(candidateId, organizationId)

        // Verify FileAsset belongs to this candidate
        const file = await FileAsset.findById(fileId)
        if (!file || file.ownerType !== 'CANDIDATE' || file.ownerId !== candidateId || file.fileType !== 'RESUME') {
            throw { statusCode: 400, code: 'INVALID_FILE', message: 'Invalid or mismatched file asset' }
        }

        // Build the resume URL — use S3 if configured, local fallback otherwise
        const isS3 = !!process.env.AWS_S3_BUCKET
        const resumeUrl = isS3
            ? `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${file.storageKey}`
            : `/api/uploads/local/${encodeURIComponent(file.storageKey)}`

        const updated = await Candidate.findOneAndUpdate(
            { _id: candidateId, organizationId },
            { $set: { resumeUrl } },
            { new: true }
        )
        if (!updated) throw { code: 'NOT_FOUND', message: 'Candidate not found' }
        return updated
    }
}

export const candidatesService = new CandidatesService()

import { Candidate, ICandidate, AssessmentAttempt, JobApplication, StageHistory, CandidateNote } from '../../database/models/index.js'
import { CreateCandidateInput, UpdateCandidateInput, ListCandidatesQuery, CreateNoteInput } from './candidates.types.js'

class CandidatesService {
    async create(organizationId: string, input: CreateCandidateInput): Promise<ICandidate> {
        // Check if candidate exists in this org
        const existing = await Candidate.findOne({ organizationId, email: input.email })
        if (existing) {
            throw { code: 'CONFLICT', message: 'Candidate with this email already exists in this organization' }
        }

        return Candidate.create({
            organizationId,
            ...input
        })
    }

    async list(organizationId: string, query: ListCandidatesQuery): Promise<{ candidates: ICandidate[], total: number, page: number, totalPages: number }> {
        const { page = 1, limit = 20, search, source, jobId, stage, dateFrom, dateTo } = query
        const skip = (page - 1) * limit

        const filter: any = { organizationId }

        if (source) {
            filter.source = source
        }

        if (search) {
            filter.$or = [
                { email: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } }
            ]
        }

        // Filter by job and/or stage via JobApplication lookup
        if (jobId || stage) {
            const appFilter: any = { organizationId }
            if (jobId) appFilter.jobId = jobId
            if (stage) appFilter.status = stage

            const matchingApps = await JobApplication.find(appFilter).select('candidateId').lean()
            const candidateIds = [...new Set(matchingApps.map(a => a.candidateId.toString()))]
            filter._id = { $in: candidateIds }
        }

        // Date range filter
        if (dateFrom || dateTo) {
            filter.createdAt = {}
            if (dateFrom) filter.createdAt.$gte = new Date(dateFrom)
            if (dateTo) filter.createdAt.$lte = new Date(dateTo)
        }

        const [candidates, total] = await Promise.all([
            Candidate.find(filter)
                .sort({ createdAt: -1 })
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

        return {
            candidate,
            applications,
            notes,
            stageHistory: history,
            assessmentHistory: attempts,
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

    async update(id: string, organizationId: string, input: UpdateCandidateInput): Promise<ICandidate> {
        const candidate = await Candidate.findOneAndUpdate(
            { _id: id, organizationId },
            { $set: input },
            { new: true }
        )
        if (!candidate) {
            throw { code: 'NOT_FOUND', message: 'Candidate not found' }
        }
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
}

export const candidatesService = new CandidatesService()

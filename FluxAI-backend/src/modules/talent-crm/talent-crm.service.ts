import mongoose, { Types } from 'mongoose'
import {
    TalentPool, SavedSearch, FollowUpReminder, CandidateBookmark,
    Candidate, ITalentPool, ISavedSearch, IFollowUpReminder, ICandidateBookmark,
} from '../../database/models/index.js'
import { AppError } from '../../common/errors/index.js'
import { createPaginatedResponse } from '../../common/dto/pagination.dto.js'

// ── Talent Pools ──────────────────────────────────────────────

export interface CreatePoolInput {
    name: string
    description?: string
    color?: string
    isSmartList?: boolean
    smartListQuery?: ITalentPool['smartListQuery']
}

export interface ListPoolsQuery {
    page?: number
    limit?: number
    search?: string
}

class TalentCRMService {

    // ─────────────────────────────── Pools ───────────────────

    async createPool(organizationId: string, userId: string, input: CreatePoolInput): Promise<ITalentPool> {
        const pool = await TalentPool.create({
            organizationId: new Types.ObjectId(organizationId),
            createdBy: new Types.ObjectId(userId),
            name: input.name,
            description: input.description,
            color: input.color || '#3b82f6',
            isSmartList: input.isSmartList || false,
            smartListQuery: input.smartListQuery,
            candidateIds: [],
        })
        return pool
    }

    async listPools(organizationId: string, query: ListPoolsQuery) {
        const { page = 1, limit = 20, search } = query
        const filter: Record<string, unknown> = { organizationId: new Types.ObjectId(organizationId) }
        if (search) filter.name = { $regex: search, $options: 'i' }

        const [pools, total] = await Promise.all([
            TalentPool.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            TalentPool.countDocuments(filter),
        ])

        // Attach candidateCount to each pool
        const enriched = pools.map(p => ({ ...p, candidateCount: p.candidateIds?.length || 0 }))
        return createPaginatedResponse(enriched, total, page, limit)
    }

    async getPool(id: string, organizationId: string): Promise<ITalentPool> {
        const pool = await TalentPool.findOne({ _id: id, organizationId }).lean()
        if (!pool) throw AppError.notFound('Talent pool')
        return pool
    }

    async updatePool(id: string, organizationId: string, patch: Partial<CreatePoolInput>): Promise<ITalentPool> {
        const pool = await TalentPool.findOneAndUpdate(
            { _id: id, organizationId },
            { $set: patch },
            { new: true }
        ).lean()
        if (!pool) throw AppError.notFound('Talent pool')
        return pool
    }

    async deletePool(id: string, organizationId: string): Promise<void> {
        const result = await TalentPool.deleteOne({ _id: id, organizationId })
        if (result.deletedCount === 0) throw AppError.notFound('Talent pool')
    }

    async addCandidatesToPool(id: string, organizationId: string, candidateIds: string[]): Promise<ITalentPool> {
        const objectIds = candidateIds.map(c => new Types.ObjectId(c))
        const pool = await TalentPool.findOneAndUpdate(
            { _id: id, organizationId },
            { $addToSet: { candidateIds: { $each: objectIds } } },
            { new: true }
        ).lean()
        if (!pool) throw AppError.notFound('Talent pool')
        return pool
    }

    async removeCandidatesFromPool(id: string, organizationId: string, candidateIds: string[]): Promise<ITalentPool> {
        const objectIds = candidateIds.map(c => new Types.ObjectId(c))
        const pool = await TalentPool.findOneAndUpdate(
            { _id: id, organizationId },
            { $pull: { candidateIds: { $in: objectIds } } },
            { new: true }
        ).lean()
        if (!pool) throw AppError.notFound('Talent pool')
        return pool
    }

    async getPoolCandidates(id: string, organizationId: string, page = 1, limit = 30) {
        const pool = await TalentPool.findOne({ _id: id, organizationId }).lean()
        if (!pool) throw AppError.notFound('Talent pool')

        let candidateIds = pool.candidateIds || []

        // For smart lists, resolve the dynamic query
        if (pool.isSmartList && pool.smartListQuery) {
            const resolved = await this.resolveSmartList(organizationId, pool.smartListQuery)
            candidateIds = resolved
        }

        const total = candidateIds.length
        const slice = candidateIds.slice((page - 1) * limit, page * limit)

        const candidates = await Candidate.find({
            _id: { $in: slice },
            organizationId,
            deletedAt: null,
        }).select('firstName lastName email tags source createdAt').lean()

        return createPaginatedResponse(candidates, total, page, limit)
    }

    private async resolveSmartList(organizationId: string, query: ITalentPool['smartListQuery']): Promise<Types.ObjectId[]> {
        if (!query) return []
        const filter: Record<string, unknown> = { organizationId: new Types.ObjectId(organizationId), deletedAt: null }

        if (query.search) {
            filter.$text = { $search: query.search }
        }
        if (query.tags?.length) {
            filter.tags = { $in: query.tags }
        }
        if (query.source) {
            filter.source = query.source
        }
        if (query.dateFrom || query.dateTo) {
            filter.createdAt = {}
            if (query.dateFrom) (filter.createdAt as any).$gte = new Date(query.dateFrom)
            if (query.dateTo) (filter.createdAt as any).$lte = new Date(query.dateTo)
        }

        const candidates = await Candidate.find(filter).select('_id').lean()
        return candidates.map(c => c._id as Types.ObjectId)
    }

    // ─────────────────────────────── Saved Searches ──────────

    async createSavedSearch(organizationId: string, userId: string, data: { name: string; query: ISavedSearch['query']; alertEnabled?: boolean }): Promise<ISavedSearch> {
        const saved = await SavedSearch.create({
            organizationId: new Types.ObjectId(organizationId),
            createdBy: new Types.ObjectId(userId),
            name: data.name,
            query: data.query,
            alertEnabled: data.alertEnabled || false,
        })
        return saved
    }

    async listSavedSearches(organizationId: string): Promise<ISavedSearch[]> {
        return SavedSearch.find({ organizationId: new Types.ObjectId(organizationId) }).sort({ createdAt: -1 }).lean()
    }

    async deleteSavedSearch(id: string, organizationId: string): Promise<void> {
        const result = await SavedSearch.deleteOne({ _id: id, organizationId })
        if (result.deletedCount === 0) throw AppError.notFound('Saved search')
    }

    async runSavedSearch(id: string, organizationId: string, page = 1, limit = 20) {
        const saved = await SavedSearch.findOneAndUpdate(
            { _id: id, organizationId },
            { $set: { lastRunAt: new Date() } },
            { new: true }
        ).lean()
        if (!saved) throw AppError.notFound('Saved search')

        const { query } = saved
        const filter: Record<string, unknown> = { organizationId: new Types.ObjectId(organizationId), deletedAt: null }

        if (query.search) filter.$text = { $search: query.search }
        if (query.tags?.length) filter.tags = { $in: query.tags }
        if (query.source) filter.source = query.source
        if (query.dateFrom || query.dateTo) {
            filter.createdAt = {}
            if (query.dateFrom) (filter.createdAt as any).$gte = new Date(query.dateFrom)
            if (query.dateTo) (filter.createdAt as any).$lte = new Date(query.dateTo)
        }

        const [candidates, total] = await Promise.all([
            Candidate.find(filter).select('firstName lastName email tags source createdAt').skip((page - 1) * limit).limit(limit).lean(),
            Candidate.countDocuments(filter),
        ])

        return createPaginatedResponse(candidates, total, page, limit)
    }

    // ─────────────────────────────── Follow-up Reminders ─────

    async createReminder(organizationId: string, userId: string, data: {
        candidateId: string
        applicationId?: string
        note: string
        dueAt: string
    }): Promise<IFollowUpReminder> {
        const reminder = await FollowUpReminder.create({
            organizationId: new Types.ObjectId(organizationId),
            createdBy: new Types.ObjectId(userId),
            candidateId: new Types.ObjectId(data.candidateId),
            applicationId: data.applicationId ? new Types.ObjectId(data.applicationId) : undefined,
            note: data.note,
            dueAt: new Date(data.dueAt),
            done: false,
        })
        return reminder
    }

    async listReminders(organizationId: string, userId: string, filter?: 'overdue' | 'upcoming' | 'done') {
        const q: Record<string, unknown> = {
            organizationId: new Types.ObjectId(organizationId),
            createdBy: new Types.ObjectId(userId),
        }
        const now = new Date()

        if (filter === 'overdue') {
            q.done = false
            q.dueAt = { $lt: now }
        } else if (filter === 'upcoming') {
            q.done = false
            q.dueAt = { $gte: now }
        } else if (filter === 'done') {
            q.done = true
        } else {
            q.done = false
        }

        return FollowUpReminder.find(q)
            .populate('candidateId', 'firstName lastName email')
            .sort({ dueAt: 1 })
            .lean()
    }

    async completeReminder(id: string, organizationId: string, userId: string): Promise<IFollowUpReminder> {
        const reminder = await FollowUpReminder.findOneAndUpdate(
            { _id: id, organizationId, createdBy: new Types.ObjectId(userId) },
            { $set: { done: true, completedAt: new Date() } },
            { new: true }
        ).lean()
        if (!reminder) throw AppError.notFound('Reminder')
        return reminder
    }

    async deleteReminder(id: string, organizationId: string, userId: string): Promise<void> {
        const result = await FollowUpReminder.deleteOne({ _id: id, organizationId, createdBy: new Types.ObjectId(userId) })
        if (result.deletedCount === 0) throw AppError.notFound('Reminder')
    }

    // ─────────────────────────────── Bookmarks ────────────────

    async bookmarkCandidate(organizationId: string, userId: string, candidateId: string, note?: string): Promise<ICandidateBookmark> {
        const bookmark = await CandidateBookmark.findOneAndUpdate(
            { organizationId: new Types.ObjectId(organizationId), userId: new Types.ObjectId(userId), candidateId: new Types.ObjectId(candidateId) },
            { $set: { note } },
            { upsert: true, new: true }
        ).lean()
        return bookmark!
    }

    async removeBookmark(organizationId: string, userId: string, candidateId: string): Promise<void> {
        await CandidateBookmark.deleteOne({
            organizationId: new Types.ObjectId(organizationId),
            userId: new Types.ObjectId(userId),
            candidateId: new Types.ObjectId(candidateId),
        })
    }

    async listBookmarks(organizationId: string, userId: string) {
        return CandidateBookmark.find({ organizationId: new Types.ObjectId(organizationId), userId: new Types.ObjectId(userId) })
            .populate('candidateId', 'firstName lastName email tags source')
            .sort({ createdAt: -1 })
            .lean()
    }

    async isBookmarked(organizationId: string, userId: string, candidateId: string): Promise<boolean> {
        const count = await CandidateBookmark.countDocuments({
            organizationId: new Types.ObjectId(organizationId),
            userId: new Types.ObjectId(userId),
            candidateId: new Types.ObjectId(candidateId),
        })
        return count > 0
    }
}

export const talentCRMService = new TalentCRMService()

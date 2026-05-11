import { Types } from 'mongoose'
import {
    TalentPool, ITalentPool, TalentPoolType,
    SavedSearch, ISavedSearch,
    CandidateBookmark, ICandidateBookmark,
    FollowUpReminder, IFollowUpReminder, ReminderStatus,
    RelationshipLog, IRelationshipLog,
} from '../../database/models/crm.models.js'
import { Candidate } from '../../database/models/index.js'

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

interface PaginationQuery {
    page?: number
    limit?: number
}

interface SegmentQuery extends PaginationQuery {
    search?: string
    tags?: string
    skills?: string
    location?: string
    source?: string
    minExperience?: number
    maxExperience?: number
    minScore?: number
}

// ──────────────────────────────────────────────────────────────
// CRM Service
// ──────────────────────────────────────────────────────────────

class CRMService {

    // ── Talent Pools ─────────────────────────────────────────

    async listTalentPools(organizationId: string, userId?: string) {
        const filter: any = { organizationId: new Types.ObjectId(organizationId) }
        if (userId) filter.ownerId = new Types.ObjectId(userId)

        return TalentPool.find(filter)
            .sort({ updatedAt: -1 })
            .populate('ownerId', 'firstName lastName email')
            .lean()
    }

    async createTalentPool(organizationId: string, data: {
        name: string; description?: string; type?: string; smartQuery?: Record<string, unknown>; tags?: string[]
    }, userId: string) {
        return TalentPool.create({
            ...data,
            organizationId: new Types.ObjectId(organizationId),
            ownerId: new Types.ObjectId(userId),
            candidateIds: [],
            candidateCount: 0,
        })
    }

    async getTalentPoolById(poolId: string, organizationId: string) {
        return TalentPool.findOne({ _id: poolId, organizationId })
            .populate('candidateIds', 'firstName lastName email tags source')
            .populate('ownerId', 'firstName lastName email')
            .lean()
    }

    async updateTalentPool(poolId: string, organizationId: string, data: Partial<ITalentPool>) {
        return TalentPool.findOneAndUpdate(
            { _id: poolId, organizationId },
            { $set: data },
            { new: true }
        )
    }

    async deleteTalentPool(poolId: string, organizationId: string) {
        return TalentPool.findOneAndDelete({ _id: poolId, organizationId })
    }

    async addToPool(poolId: string, organizationId: string, candidateIds: string[]) {
        const objectIds = candidateIds.map(id => new Types.ObjectId(id))
        const pool = await TalentPool.findOneAndUpdate(
            { _id: poolId, organizationId },
            {
                $addToSet: { candidateIds: { $each: objectIds } },
            },
            { new: true }
        )
        if (pool) {
            pool.candidateCount = pool.candidateIds.length
            await pool.save()
        }
        return pool
    }

    async removeFromPool(poolId: string, organizationId: string, candidateIds: string[]) {
        const objectIds = candidateIds.map(id => new Types.ObjectId(id))
        const pool = await TalentPool.findOneAndUpdate(
            { _id: poolId, organizationId },
            {
                $pull: { candidateIds: { $in: objectIds } },
            },
            { new: true }
        )
        if (pool) {
            pool.candidateCount = pool.candidateIds.length
            await pool.save()
        }
        return pool
    }

    async refreshSmartPool(poolId: string, organizationId: string) {
        const pool = await TalentPool.findOne({ _id: poolId, organizationId, type: TalentPoolType.SMART })
        if (!pool || !pool.smartQuery) return null

        const query = { ...pool.smartQuery, organizationId: new Types.ObjectId(organizationId), isDeleted: false }
        const candidates = await Candidate.find(query).select('_id').lean()
        const candidateIds = candidates.map(c => c._id)

        pool.candidateIds = candidateIds
        pool.candidateCount = candidateIds.length
        pool.lastRefreshedAt = new Date()
        await pool.save()
        return pool
    }

    // ── Saved Searches ───────────────────────────────────────

    async listSavedSearches(organizationId: string, userId: string) {
        return SavedSearch.find({
            organizationId: new Types.ObjectId(organizationId),
            createdBy: new Types.ObjectId(userId),
        })
            .sort({ updatedAt: -1 })
            .lean()
    }

    async createSavedSearch(organizationId: string, data: {
        name: string; query: Record<string, unknown>; filters: Record<string, unknown>
    }, userId: string) {
        return SavedSearch.create({
            ...data,
            organizationId: new Types.ObjectId(organizationId),
            createdBy: new Types.ObjectId(userId),
            resultCount: 0,
        })
    }

    async executeSavedSearch(searchId: string, organizationId: string, pagination: PaginationQuery = {}) {
        const search = await SavedSearch.findOne({ _id: searchId, organizationId })
        if (!search) return null

        const { page = 1, limit = 20 } = pagination
        const skip = (page - 1) * limit

        const query = { ...search.query, organizationId: new Types.ObjectId(organizationId), isDeleted: false }
        const [candidates, total] = await Promise.all([
            Candidate.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Candidate.countDocuments(query),
        ])

        // Update result count and last run
        search.resultCount = total
        search.lastRunAt = new Date()
        await search.save()

        return { candidates, total, page, limit, totalPages: Math.ceil(total / limit) }
    }

    async deleteSavedSearch(searchId: string, organizationId: string) {
        return SavedSearch.findOneAndDelete({ _id: searchId, organizationId })
    }

    // ── Candidate Segmentation ───────────────────────────────

    async segmentCandidates(organizationId: string, query: SegmentQuery) {
        const { page = 1, limit = 20, search, tags, skills, location, source, minExperience, maxExperience, minScore } = query
        const skip = (page - 1) * limit
        const filter: any = { organizationId: new Types.ObjectId(organizationId), isDeleted: false }

        if (tags) filter.tags = { $in: tags.split(',').map(t => t.trim()) }
        if (skills) filter['parsedResumeData.skills'] = { $in: skills.split(',').map(s => s.trim()) }
        if (location) filter['parsedResumeData.location'] = { $regex: location, $options: 'i' }
        if (source) filter.source = source
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ]
        }

        const [candidates, total] = await Promise.all([
            Candidate.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Candidate.countDocuments(filter),
        ])

        return { candidates, total, page, limit, totalPages: Math.ceil(total / limit) }
    }

    // ── Bookmarks ────────────────────────────────────────────

    async createBookmark(organizationId: string, candidateId: string, userId: string, notes?: string) {
        return CandidateBookmark.findOneAndUpdate(
            {
                organizationId: new Types.ObjectId(organizationId),
                candidateId: new Types.ObjectId(candidateId),
                userId: new Types.ObjectId(userId),
            },
            {
                $setOnInsert: {
                    organizationId: new Types.ObjectId(organizationId),
                    candidateId: new Types.ObjectId(candidateId),
                    userId: new Types.ObjectId(userId),
                },
                $set: { notes },
            },
            { upsert: true, new: true }
        )
    }

    async listBookmarks(organizationId: string, userId: string) {
        return CandidateBookmark.find({
            organizationId: new Types.ObjectId(organizationId),
            userId: new Types.ObjectId(userId),
        })
            .populate('candidateId', 'firstName lastName email tags source')
            .sort({ createdAt: -1 })
            .lean()
    }

    async removeBookmark(organizationId: string, candidateId: string, userId: string) {
        return CandidateBookmark.findOneAndDelete({
            organizationId: new Types.ObjectId(organizationId),
            candidateId: new Types.ObjectId(candidateId),
            userId: new Types.ObjectId(userId),
        })
    }

    // ── Follow-Up Reminders ──────────────────────────────────

    async createReminder(organizationId: string, data: {
        candidateId: string; userId: string; dueAt: Date; note?: string; type?: string
    }) {
        return FollowUpReminder.create({
            organizationId: new Types.ObjectId(organizationId),
            candidateId: new Types.ObjectId(data.candidateId),
            userId: new Types.ObjectId(data.userId),
            dueAt: data.dueAt,
            note: data.note,
            type: data.type || 'followup',
        })
    }

    async listReminders(organizationId: string, userId: string, status?: string) {
        const filter: any = {
            organizationId: new Types.ObjectId(organizationId),
            userId: new Types.ObjectId(userId),
        }
        if (status) filter.status = status

        return FollowUpReminder.find(filter)
            .populate('candidateId', 'firstName lastName email')
            .sort({ dueAt: 1 })
            .lean()
    }

    async listDueReminders(organizationId: string) {
        return FollowUpReminder.find({
            organizationId: new Types.ObjectId(organizationId),
            status: ReminderStatus.PENDING,
            dueAt: { $lte: new Date() },
        })
            .populate('candidateId', 'firstName lastName email')
            .populate('userId', 'firstName lastName email')
            .sort({ dueAt: 1 })
            .lean()
    }

    async completeReminder(reminderId: string, organizationId: string) {
        return FollowUpReminder.findOneAndUpdate(
            { _id: reminderId, organizationId },
            { $set: { status: ReminderStatus.COMPLETED, completedAt: new Date() } },
            { new: true }
        )
    }

    async dismissReminder(reminderId: string, organizationId: string) {
        return FollowUpReminder.findOneAndUpdate(
            { _id: reminderId, organizationId },
            { $set: { status: ReminderStatus.DISMISSED } },
            { new: true }
        )
    }

    // ── Relationship Tracking ────────────────────────────────

    async logRelationship(organizationId: string, data: {
        candidateId: string; userId: string; interactionType: string; summary: string; metadata?: Record<string, unknown>; occurredAt?: Date
    }) {
        return RelationshipLog.create({
            organizationId: new Types.ObjectId(organizationId),
            candidateId: new Types.ObjectId(data.candidateId),
            userId: new Types.ObjectId(data.userId),
            interactionType: data.interactionType,
            summary: data.summary,
            metadata: data.metadata,
            occurredAt: data.occurredAt || new Date(),
        })
    }

    async getRelationshipTimeline(organizationId: string, candidateId: string, pagination: PaginationQuery = {}) {
        const { page = 1, limit = 50 } = pagination
        const skip = (page - 1) * limit

        const [logs, total] = await Promise.all([
            RelationshipLog.find({
                organizationId: new Types.ObjectId(organizationId),
                candidateId: new Types.ObjectId(candidateId),
            })
                .populate('userId', 'firstName lastName email')
                .sort({ occurredAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            RelationshipLog.countDocuments({
                organizationId: new Types.ObjectId(organizationId),
                candidateId: new Types.ObjectId(candidateId),
            }),
        ])

        return { logs, total, page, limit, totalPages: Math.ceil(total / limit) }
    }

    // ── Candidate Tags ───────────────────────────────────────

    async addCandidateTags(organizationId: string, candidateId: string, tags: string[]) {
        return Candidate.findOneAndUpdate(
            { _id: candidateId, organizationId, isDeleted: false },
            { $addToSet: { tags: { $each: tags } } },
            { new: true }
        )
    }

    async removeCandidateTags(organizationId: string, candidateId: string, tags: string[]) {
        return Candidate.findOneAndUpdate(
            { _id: candidateId, organizationId, isDeleted: false },
            { $pull: { tags: { $in: tags } } },
            { new: true }
        )
    }

    async listCandidatesByTags(organizationId: string, tags: string[], pagination: PaginationQuery = {}) {
        const { page = 1, limit = 20 } = pagination
        const skip = (page - 1) * limit

        const filter = {
            organizationId: new Types.ObjectId(organizationId),
            tags: { $in: tags },
            isDeleted: false,
        }

        const [candidates, total] = await Promise.all([
            Candidate.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Candidate.countDocuments(filter),
        ])

        return { candidates, total, page, limit, totalPages: Math.ceil(total / limit) }
    }
}

export const crmService = new CRMService()

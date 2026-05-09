import { Types } from 'mongoose'
import { AppError } from '../../common/errors/index.js'
import { createPaginatedResponse } from '../../common/dto/pagination.dto.js'
import { Prospect, IProspect, ProspectList, IProspectList, Campaign, ICampaign, Message, IMessage } from '../../database/models/prospect.models.js'
import { Candidate } from '../../database/models/index.js'
import { eventBus, DomainEvent } from '../../common/services/event-bus.service.js'
import { activityService } from '../activity/activity.service.js'
import { campaignQueue } from './workers/campaign.worker.js'

interface ListProspectsQuery {
    page?: number
    limit?: number
    search?: string
    status?: string
    company?: string
    role?: string
    location?: string
    skills?: string
}

class ProspectService {
    // ── Prospects ────────────────────────────────────────────────
    async list(organizationId: string, query: ListProspectsQuery) {
        const { page = 1, limit = 20, search, status, company, role, location, skills } = query
        const skip = (page - 1) * limit
        const filter: any = { organizationId, isDeleted: false }

        if (status) filter.status = status
        if (company) filter.company = { $regex: company, $options: 'i' }
        if (role) filter.role = { $regex: role, $options: 'i' }
        if (location) filter.location = { $regex: location, $options: 'i' }
        if (skills) filter.skills = { $in: skills.split(',').map(s => s.trim()) }
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
            ]
        }

        const [prospects, total] = await Promise.all([
            Prospect.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Prospect.countDocuments(filter),
        ])

        return createPaginatedResponse(prospects, total, page, limit)
    }

    async getById(id: string, organizationId: string) {
        return Prospect.findOne({ _id: id, organizationId, isDeleted: false }).lean()
    }

    async create(organizationId: string, data: Partial<IProspect>, userId: string) {
        const prospect = await Prospect.create({
            ...data,
            organizationId: new Types.ObjectId(organizationId),
        })

        await activityService.log({
            organizationId,
            entityType: 'prospect',
            entityId: prospect._id.toString(),
            eventType: 'PROSPECT_CREATED',
            actorType: 'user',
            performedBy: userId,
            metadata: { source: data.source },
        })

        return prospect
    }

    async createBulk(organizationId: string, prospects: Partial<IProspect>[], userId: string) {
        const docs = prospects.map(p => ({
            ...p,
            organizationId: new Types.ObjectId(organizationId),
        }))
        const result = await Prospect.insertMany(docs, { ordered: false }).catch(err => {
            // Handle duplicate key errors gracefully
            if (err.insertedDocs) return err.insertedDocs
            return []
        })
        return { inserted: Array.isArray(result) ? result.length : 0 }
    }

    async update(id: string, organizationId: string, data: Partial<IProspect>) {
        return Prospect.findOneAndUpdate(
            { _id: id, organizationId },
            { $set: data },
            { new: true }
        )
    }

    // ── Convert to ATS Candidate ─────────────────────────────────
    async convertToCandidate(prospectId: string, organizationId: string, userId: string) {
        const prospect = await Prospect.findOne({ _id: prospectId, organizationId })
        if (!prospect) throw AppError.notFound('Prospect')
        if (prospect.status === 'converted') throw AppError.conflict('Already converted')

        // Check if candidate already exists
        const existing = await Candidate.findOne({ organizationId, email: prospect.email })
        if (existing) {
            // Link and mark converted
            prospect.status = 'converted'
            prospect.convertedCandidateId = existing._id as Types.ObjectId
            await prospect.save()
            return { candidate: existing, alreadyExisted: true }
        }

        const candidate = await Candidate.create({
            organizationId: new Types.ObjectId(organizationId),
            firstName: prospect.firstName,
            lastName: prospect.lastName,
            email: prospect.email,
            phone: prospect.phone,
            source: `outbound:${prospect.source}`,
        })

        prospect.status = 'converted'
        prospect.convertedCandidateId = candidate._id as Types.ObjectId
        await prospect.save()

        await activityService.log({
            organizationId,
            entityType: 'prospect',
            entityId: prospectId,
            eventType: 'PROSPECT_CONVERTED',
            actorType: 'user',
            performedBy: userId,
            metadata: { candidateId: candidate._id.toString() },
        })

        return { candidate, alreadyExisted: false }
    }

    // ── Lists ────────────────────────────────────────────────────
    async listLists(organizationId: string) {
        return ProspectList.find({ organizationId })
            .sort({ createdAt: -1 })
            .populate('prospectIds', 'firstName lastName email status')
            .lean()
    }

    async createList(organizationId: string, data: { name: string; description?: string }, userId: string) {
        return ProspectList.create({
            ...data,
            organizationId: new Types.ObjectId(organizationId),
            createdBy: new Types.ObjectId(userId),
            prospectIds: [],
        })
    }

    async addToList(listId: string, organizationId: string, prospectIds: string[]) {
        return ProspectList.findOneAndUpdate(
            { _id: listId, organizationId },
            { $addToSet: { prospectIds: { $each: prospectIds.map(id => new Types.ObjectId(id)) } } },
            { new: true }
        )
    }

    async removeFromList(listId: string, organizationId: string, prospectIds: string[]) {
        return ProspectList.findOneAndUpdate(
            { _id: listId, organizationId },
            { $pull: { prospectIds: { $in: prospectIds.map(id => new Types.ObjectId(id)) } } },
            { new: true }
        )
    }

    async getListById(listId: string, organizationId: string) {
        return ProspectList.findOne({ _id: listId, organizationId })
            .populate('prospectIds')
            .lean()
    }

    // ── Campaigns ────────────────────────────────────────────────
    async listCampaigns(organizationId: string) {
        return Campaign.find({ organizationId })
            .sort({ createdAt: -1 })
            .populate('listId', 'name')
            .populate('templateId', 'name subject')
            .lean()
    }

    async createCampaign(organizationId: string, data: { name: string; listId: string; templateId: string }, userId: string) {
        return Campaign.create({
            ...data,
            organizationId: new Types.ObjectId(organizationId),
            listId: new Types.ObjectId(data.listId),
            templateId: new Types.ObjectId(data.templateId),
            createdBy: new Types.ObjectId(userId),
        })
    }

    async sendCampaign(campaignId: string, organizationId: string, userId: string) {
        const campaign = await Campaign.findOne({ _id: campaignId, organizationId })
            .populate('listId')
            .populate('templateId')
        if (!campaign) throw AppError.notFound('Campaign')

        const list = await ProspectList.findById(campaign.listId).populate('prospectIds')
        if (!list) throw AppError.notFound('List')

        campaign.status = 'sending'
        await campaign.save()

        let sent = 0
        const prospects = list.prospectIds as unknown as IProspect[]
        
        const jobs = prospects.map(prospect => ({
            name: 'send-email',
            data: {
                campaignId: campaign._id.toString(),
                prospectId: prospect._id.toString(),
                organizationId,
                templateId: campaign.templateId.toString(),
                prospectEmail: prospect.email,
                firstName: prospect.firstName,
                lastName: prospect.lastName,
                company: prospect.company || '',
                role: prospect.role || ''
            },
            opts: {
                jobId: `${campaign._id}-${prospect._id}`,
                attempts: 3,
                backoff: { type: 'exponential', delay: 2000 }
            }
        }))

        await campaignQueue.addBulk(jobs)

        // Pre-create pending messages for UI state
        const messageDocs = prospects.map(p => ({
            campaignId: campaign._id,
            prospectId: p._id,
            status: 'queued'
        }))
        await Message.insertMany(messageDocs, { ordered: false }).catch(() => {})

        campaign.status = 'sending' // Will remain sending. A separate cron can mark completed.
        await campaign.save()

        await activityService.log({
            organizationId,
            entityType: 'campaign',
            entityId: campaignId,
            eventType: 'CAMPAIGN_SENT',
            actorType: 'user',
            performedBy: userId,
            metadata: { enqueued: prospects.length },
        })

        return { enqueued: prospects.length, total: prospects.length }
    }

    async getCampaignById(campaignId: string, organizationId: string) {
        return Campaign.findOne({ _id: campaignId, organizationId })
            .populate('listId', 'name')
            .populate('templateId', 'name subject')
            .lean()
    }

    async getCampaignMessages(campaignId: string) {
        return Message.find({ campaignId })
            .populate('prospectId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .lean()
    }
}

export const prospectService = new ProspectService()

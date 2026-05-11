import { Types } from 'mongoose'
import { EmailSequence, OutreachCampaign, OutreachMessage, RecruiterTemplate } from '../../database/models/outreach.models.js'
import { ProspectList } from '../../database/models/prospect.models.js'
import { v4 as uuidv4 } from 'uuid'

class OutreachService {
    // ── Sequences ────────────────────────────────────────────
    async listSequences(orgId: string) {
        return EmailSequence.find({ organizationId: new Types.ObjectId(orgId) }).sort({ updatedAt: -1 }).lean()
    }

    async createSequence(orgId: string, data: { name: string; steps: any[] }, userId: string) {
        return EmailSequence.create({
            organizationId: new Types.ObjectId(orgId),
            name: data.name,
            steps: data.steps,
            createdBy: new Types.ObjectId(userId),
        })
    }

    async updateSequence(seqId: string, orgId: string, data: any) {
        return EmailSequence.findOneAndUpdate({ _id: seqId, organizationId: orgId }, { $set: data }, { new: true })
    }

    // ── Campaigns ────────────────────────────────────────────
    async listCampaigns(orgId: string) {
        return OutreachCampaign.find({ organizationId: new Types.ObjectId(orgId) })
            .populate('sequenceId', 'name steps')
            .populate('prospectListId', 'name')
            .sort({ createdAt: -1 }).lean()
    }

    async createCampaign(orgId: string, data: { name: string; sequenceId: string; prospectListId: string; scheduledAt?: Date }, userId: string) {
        return OutreachCampaign.create({
            organizationId: new Types.ObjectId(orgId),
            name: data.name,
            sequenceId: new Types.ObjectId(data.sequenceId),
            prospectListId: new Types.ObjectId(data.prospectListId),
            scheduledAt: data.scheduledAt,
            createdBy: new Types.ObjectId(userId),
        })
    }

    async launchCampaign(campaignId: string, orgId: string) {
        const campaign = await OutreachCampaign.findOne({ _id: campaignId, organizationId: orgId })
        if (!campaign) throw { code: 'NOT_FOUND', message: 'Campaign not found' }

        const sequence = await EmailSequence.findById(campaign.sequenceId).lean()
        if (!sequence) throw { code: 'NOT_FOUND', message: 'Sequence not found' }

        const list = await ProspectList.findById(campaign.prospectListId).populate('prospectIds').lean()
        if (!list) throw { code: 'NOT_FOUND', message: 'List not found' }

        const prospects = list.prospectIds as any[]
        const firstStep = sequence.steps.find(s => s.order === 1) || sequence.steps[0]

        // Create messages for the first step
        const messages = prospects.map(p => ({
            campaignId: campaign._id,
            prospectId: p._id || p,
            sequenceStep: 1,
            status: 'queued' as const,
            trackingPixelId: uuidv4(),
        }))

        await OutreachMessage.insertMany(messages, { ordered: false }).catch(() => {})

        campaign.status = 'active'
        await campaign.save()

        return { launched: true, enqueuedCount: messages.length }
    }

    async getCampaignAnalytics(campaignId: string, orgId: string) {
        const campaign = await OutreachCampaign.findOne({ _id: campaignId, organizationId: orgId }).lean()
        if (!campaign) throw { code: 'NOT_FOUND', message: 'Campaign not found' }

        const statusAgg = await OutreachMessage.aggregate([
            { $match: { campaignId: new Types.ObjectId(campaignId) } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ])

        const stats: Record<string, number> = {}
        statusAgg.forEach(s => { stats[s._id] = s.count })

        const total = Object.values(stats).reduce((a, b) => a + b, 0)
        return {
            total,
            sent: stats.sent || 0,
            opened: stats.opened || 0,
            replied: stats.replied || 0,
            bounced: stats.bounced || 0,
            queued: stats.queued || 0,
            openRate: total > 0 ? Math.round(((stats.opened || 0) / total) * 100) : 0,
            replyRate: total > 0 ? Math.round(((stats.replied || 0) / total) * 100) : 0,
        }
    }

    // ── Tracking ─────────────────────────────────────────────
    async recordOpen(trackingPixelId: string) {
        const message = await OutreachMessage.findOne({ trackingPixelId })
        if (!message || message.openedAt) return // Already recorded
        message.status = 'opened'
        message.openedAt = new Date()
        await message.save()

        // Update campaign stats
        await OutreachCampaign.findByIdAndUpdate(message.campaignId, { $inc: { 'stats.opened': 1 } })
    }

    async recordReply(campaignId: string, prospectId: string) {
        const message = await OutreachMessage.findOne({ campaignId, prospectId, repliedAt: null })
        if (!message) return
        message.status = 'replied'
        message.repliedAt = new Date()
        await message.save()

        await OutreachCampaign.findByIdAndUpdate(campaignId, { $inc: { 'stats.replied': 1 } })
    }

    // ── Templates ────────────────────────────────────────────
    async listTemplates(orgId: string, type?: string) {
        const filter: any = { organizationId: new Types.ObjectId(orgId) }
        if (type) filter.type = type
        return RecruiterTemplate.find(filter).sort({ updatedAt: -1 }).lean()
    }

    async createTemplate(orgId: string, data: { name: string; subject: string; body: string; type?: string; variables?: string[] }, userId: string) {
        return RecruiterTemplate.create({
            organizationId: new Types.ObjectId(orgId),
            ...data,
            createdBy: new Types.ObjectId(userId),
        })
    }

    async updateTemplate(templateId: string, orgId: string, data: any) {
        return RecruiterTemplate.findOneAndUpdate({ _id: templateId, organizationId: orgId }, { $set: data }, { new: true })
    }

    async deleteTemplate(templateId: string, orgId: string) {
        return RecruiterTemplate.findOneAndDelete({ _id: templateId, organizationId: orgId })
    }
}

export const outreachService = new OutreachService()

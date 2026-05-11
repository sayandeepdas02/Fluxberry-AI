import { Types } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { ReferralProgram, Referral, ReferralReward, ReferralStatus } from '../../database/models/referral.models.js'
import { Candidate, JobApplication } from '../../database/models/index.js'

class ReferralService {
    // ── Programs ─────────────────────────────────────────────
    async listPrograms(orgId: string) {
        return ReferralProgram.find({ organizationId: new Types.ObjectId(orgId) }).sort({ createdAt: -1 }).lean()
    }

    async createProgram(orgId: string, data: any, userId: string) {
        return ReferralProgram.create({ ...data, organizationId: new Types.ObjectId(orgId), createdBy: new Types.ObjectId(userId) })
    }

    async updateProgram(programId: string, orgId: string, data: any) {
        return ReferralProgram.findOneAndUpdate({ _id: programId, organizationId: orgId }, { $set: data }, { new: true })
    }

    // ── Referral Submissions ─────────────────────────────────
    async submitReferral(orgId: string, data: {
        programId: string; referrerId: string; referredName: string; referredEmail: string;
        referredPhone?: string; referralNote?: string; jobId?: string
    }) {
        const referralLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/referral/${uuidv4()}`

        const referral = await Referral.create({
            organizationId: new Types.ObjectId(orgId),
            programId: new Types.ObjectId(data.programId),
            referrerId: new Types.ObjectId(data.referrerId),
            jobId: data.jobId ? new Types.ObjectId(data.jobId) : undefined,
            referredName: data.referredName,
            referredEmail: data.referredEmail,
            referredPhone: data.referredPhone,
            referralNote: data.referralNote,
            referralLink,
            submittedAt: new Date(),
        })

        // Auto-create candidate if they don't exist
        const nameParts = data.referredName.split(' ')
        await Candidate.findOneAndUpdate(
            { organizationId: new Types.ObjectId(orgId), email: data.referredEmail.toLowerCase() },
            {
                $setOnInsert: {
                    organizationId: new Types.ObjectId(orgId),
                    firstName: nameParts[0] || '',
                    lastName: nameParts.slice(1).join(' ') || '',
                    email: data.referredEmail.toLowerCase(),
                    phone: data.referredPhone,
                    source: 'referral',
                    tags: ['referral'],
                },
            },
            { upsert: true, new: true }
        ).then((candidate) => {
            Referral.findByIdAndUpdate(referral._id, { referredCandidateId: candidate._id }).exec()
        })

        return referral
    }

    async listReferrals(orgId: string, filters: { referrerId?: string; status?: string; page?: number; limit?: number } = {}) {
        const { referrerId, status, page = 1, limit = 20 } = filters
        const filter: any = { organizationId: new Types.ObjectId(orgId) }
        if (referrerId) filter.referrerId = new Types.ObjectId(referrerId)
        if (status) filter.status = status

        const [referrals, total] = await Promise.all([
            Referral.find(filter)
                .populate('referrerId', 'firstName lastName email')
                .populate('referredCandidateId', 'firstName lastName email')
                .populate('jobId', 'title')
                .sort({ submittedAt: -1 })
                .skip((page - 1) * limit).limit(limit).lean(),
            Referral.countDocuments(filter),
        ])

        return { referrals, total, page, limit }
    }

    async updateReferralStatus(referralId: string, orgId: string, status: string) {
        const update: any = { status }
        if (status === ReferralStatus.HIRED) update.hiredAt = new Date()

        const referral = await Referral.findOneAndUpdate(
            { _id: referralId, organizationId: orgId },
            { $set: update },
            { new: true }
        )

        // Auto-create reward on hire
        if (status === ReferralStatus.HIRED && referral) {
            const program = await ReferralProgram.findById(referral.programId).lean()
            if (program && program.rewardAmount > 0) {
                await ReferralReward.create({
                    referralId: referral._id,
                    referrerId: referral.referrerId,
                    organizationId: referral.organizationId,
                    amount: program.rewardAmount,
                    type: program.rewardType,
                })
            }
        }

        return referral
    }

    // ── Leaderboard ──────────────────────────────────────────
    async getLeaderboard(orgId: string) {
        const leaderboard = await Referral.aggregate([
            { $match: { organizationId: new Types.ObjectId(orgId) } },
            { $group: {
                _id: '$referrerId',
                total: { $sum: 1 },
                hired: { $sum: { $cond: [{ $eq: ['$status', ReferralStatus.HIRED] }, 1, 0] } },
                rewarded: { $sum: { $cond: [{ $eq: ['$status', ReferralStatus.REWARDED] }, 1, 0] } },
            }},
            { $sort: { hired: -1, total: -1 } },
            { $limit: 20 },
        ])

        // Populate referrer names
        const User = (await import('../../database/models/index.js')).User
        const enriched = await Promise.all(leaderboard.map(async (entry) => {
            const user = await User.findById(entry._id).select('firstName lastName email').lean()
            return { ...entry, referrer: user }
        }))

        return enriched
    }

    // ── Rewards ──────────────────────────────────────────────
    async listRewards(orgId: string, status?: string) {
        const filter: any = { organizationId: new Types.ObjectId(orgId) }
        if (status) filter.status = status
        return ReferralReward.find(filter)
            .populate('referrerId', 'firstName lastName email')
            .populate('referralId', 'referredName referredEmail')
            .sort({ createdAt: -1 }).lean()
    }

    async approveReward(rewardId: string, orgId: string, approvedBy: string) {
        return ReferralReward.findOneAndUpdate(
            { _id: rewardId, organizationId: orgId, status: 'pending' },
            { $set: { status: 'approved', approvedBy: new Types.ObjectId(approvedBy), approvedAt: new Date() } },
            { new: true }
        )
    }

    // ── Analytics ────────────────────────────────────────────
    async getReferralAnalytics(orgId: string) {
        const orgObjectId = new Types.ObjectId(orgId)
        const [total, hired, pending] = await Promise.all([
            Referral.countDocuments({ organizationId: orgObjectId }),
            Referral.countDocuments({ organizationId: orgObjectId, status: ReferralStatus.HIRED }),
            Referral.countDocuments({ organizationId: orgObjectId, status: ReferralStatus.SUBMITTED }),
        ])

        const conversionRate = total > 0 ? Math.round((hired / total) * 100) : 0

        // Avg time-to-hire for referrals
        const avgTimeResult = await Referral.aggregate([
            { $match: { organizationId: orgObjectId, status: ReferralStatus.HIRED, hiredAt: { $exists: true } } },
            { $project: { days: { $divide: [{ $subtract: ['$hiredAt', '$submittedAt'] }, 86400000] } } },
            { $group: { _id: null, avg: { $avg: '$days' } } },
        ])

        return {
            totalReferrals: total,
            hired,
            pending,
            conversionRate,
            avgDaysToHire: Math.round(avgTimeResult[0]?.avg || 0),
        }
    }
}

export const referralService = new ReferralService()

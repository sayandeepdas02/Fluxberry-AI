import { Types } from 'mongoose'
import {
    InterviewFeedback, ApprovalChain, DiscussionThread, HiringCommittee,
} from '../../database/models/collaboration.models.js'

class CollaborationService {
    // ── Interview Feedback ───────────────────────────────────

    async submitFeedback(orgId: string, data: {
        applicationId: string; interviewId?: string; reviewerId: string;
        scores: { dimension: string; score: number; maxScore?: number; notes?: string }[];
        recommendation: string; strengths?: string; concerns?: string; notes?: string;
    }) {
        const overallScore = data.scores.length > 0
            ? Math.round((data.scores.reduce((s, d) => s + d.score, 0) / data.scores.reduce((s, d) => s + (d.maxScore || 5), 0)) * 100)
            : 0

        return InterviewFeedback.findOneAndUpdate(
            { organizationId: new Types.ObjectId(orgId), applicationId: new Types.ObjectId(data.applicationId), reviewerId: new Types.ObjectId(data.reviewerId) },
            {
                $set: {
                    organizationId: new Types.ObjectId(orgId),
                    applicationId: new Types.ObjectId(data.applicationId),
                    interviewId: data.interviewId ? new Types.ObjectId(data.interviewId) : undefined,
                    reviewerId: new Types.ObjectId(data.reviewerId),
                    scores: data.scores,
                    overallScore,
                    recommendation: data.recommendation,
                    strengths: data.strengths,
                    concerns: data.concerns,
                    notes: data.notes,
                    submittedAt: new Date(),
                },
            },
            { upsert: true, new: true }
        )
    }

    async getFeedbackForApplication(orgId: string, applicationId: string) {
        return InterviewFeedback.find({ organizationId: new Types.ObjectId(orgId), applicationId: new Types.ObjectId(applicationId) })
            .populate('reviewerId', 'firstName lastName email')
            .sort({ submittedAt: -1 })
            .lean()
    }

    async getCalibrationView(orgId: string, applicationId: string) {
        const feedbacks = await this.getFeedbackForApplication(orgId, applicationId)
        if (feedbacks.length === 0) return { feedbacks: [], consensus: null }

        const recCounts: Record<string, number> = {}
        let totalScore = 0
        feedbacks.forEach(f => {
            recCounts[f.recommendation] = (recCounts[f.recommendation] || 0) + 1
            totalScore += f.overallScore
        })

        const topRec = Object.entries(recCounts).sort((a, b) => b[1] - a[1])[0]
        return {
            feedbacks,
            consensus: {
                recommendation: topRec?.[0],
                agreement: topRec ? Math.round((topRec[1] / feedbacks.length) * 100) : 0,
                avgScore: Math.round(totalScore / feedbacks.length),
                totalReviews: feedbacks.length,
            },
        }
    }

    // ── Approval Chains ──────────────────────────────────────

    async createApprovalChain(orgId: string, data: {
        entityType: string; entityId: string; jobId?: string;
        approverIds: string[]; initiatedBy: string;
    }) {
        return ApprovalChain.create({
            organizationId: new Types.ObjectId(orgId),
            entityType: data.entityType,
            entityId: new Types.ObjectId(data.entityId),
            jobId: data.jobId ? new Types.ObjectId(data.jobId) : undefined,
            steps: data.approverIds.map(id => ({ approverId: new Types.ObjectId(id) })),
            currentStep: 0,
            initiatedBy: new Types.ObjectId(data.initiatedBy),
        })
    }

    async getApprovalChain(orgId: string, entityType: string, entityId: string) {
        return ApprovalChain.findOne({ organizationId: new Types.ObjectId(orgId), entityType, entityId: new Types.ObjectId(entityId) })
            .populate('steps.approverId', 'firstName lastName email')
            .populate('initiatedBy', 'firstName lastName email')
            .lean()
    }

    async processApprovalDecision(orgId: string, chainId: string, approverId: string, decision: 'approved' | 'rejected', notes?: string) {
        const chain = await ApprovalChain.findOne({ _id: chainId, organizationId: new Types.ObjectId(orgId) })
        if (!chain) throw { code: 'NOT_FOUND', message: 'Approval chain not found' }

        const step = chain.steps[chain.currentStep]
        if (!step || step.approverId.toString() !== approverId) {
            throw { code: 'FORBIDDEN', message: 'Not your turn to approve' }
        }

        step.status = decision
        step.decidedAt = new Date()
        if (notes) step.notes = notes

        if (decision === 'rejected') {
            chain.status = 'rejected'
        } else if (chain.currentStep >= chain.steps.length - 1) {
            chain.status = 'approved'
        } else {
            chain.currentStep += 1
        }

        await chain.save()
        return chain
    }

    // ── Discussion Threads ───────────────────────────────────

    async getOrCreateThread(orgId: string, entityType: string, entityId: string) {
        return DiscussionThread.findOneAndUpdate(
            { organizationId: new Types.ObjectId(orgId), entityType, entityId: new Types.ObjectId(entityId) },
            { $setOnInsert: { organizationId: new Types.ObjectId(orgId), entityType, entityId: new Types.ObjectId(entityId), messages: [], status: 'open' } },
            { upsert: true, new: true }
        )
    }

    async addMessage(orgId: string, threadId: string, userId: string, content: string) {
        return DiscussionThread.findOneAndUpdate(
            { _id: threadId, organizationId: new Types.ObjectId(orgId) },
            { $push: { messages: { userId: new Types.ObjectId(userId), content, createdAt: new Date() } } },
            { new: true }
        ).then(t => t?.populate('messages.userId', 'firstName lastName email'))
    }

    async resolveThread(orgId: string, threadId: string) {
        return DiscussionThread.findOneAndUpdate(
            { _id: threadId, organizationId: new Types.ObjectId(orgId) },
            { $set: { status: 'resolved' } },
            { new: true }
        )
    }

    // ── Hiring Committees ────────────────────────────────────

    async getOrCreateCommittee(orgId: string, jobId: string) {
        return HiringCommittee.findOneAndUpdate(
            { organizationId: new Types.ObjectId(orgId), jobId: new Types.ObjectId(jobId) },
            { $setOnInsert: { organizationId: new Types.ObjectId(orgId), jobId: new Types.ObjectId(jobId), memberIds: [] } },
            { upsert: true, new: true }
        )
    }

    async updateCommittee(orgId: string, jobId: string, memberIds: string[], decisionPolicy: string) {
        return HiringCommittee.findOneAndUpdate(
            { organizationId: new Types.ObjectId(orgId), jobId: new Types.ObjectId(jobId) },
            { $set: { memberIds: memberIds.map(id => new Types.ObjectId(id)), decisionPolicy } },
            { new: true, upsert: true }
        )
    }
}

export const collaborationService = new CollaborationService()

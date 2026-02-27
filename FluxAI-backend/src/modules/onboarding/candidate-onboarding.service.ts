import {
    Onboarding, OnboardingStatus, OnboardingDocument, OnboardingDocumentStatus,
    OrganizationOnboardingConfig, JobApplication, ApplicationStatus, Candidate
} from '../../database/models/index.js'
import mongoose from 'mongoose'

export class CandidateOnboardingService {

    async initializeOnboarding(applicationId: string, organizationId: string) {
        // 1. Check if onboarding already exists
        const existing = await Onboarding.findOne({ applicationId })
        if (existing) return existing

        const app = await JobApplication.findOne({ _id: applicationId, organizationId })
        if (!app) throw new Error('Application not found')

        // 2. Create Onboarding Record
        const onboarding = await Onboarding.create({
            organizationId,
            applicationId,
            candidateId: app.candidateId,
            status: OnboardingStatus.IN_PROGRESS,
            startDate: new Date()
        })

        // 3. Create Required Documents placeholders based on Org Config
        const config = await OrganizationOnboardingConfig.findOne({ organizationId })
        const requiredDocs = config?.requiredDocuments || ['ID Proof', 'Signed Offer Letter'] // Default

        const docPromises = requiredDocs.map(title => OnboardingDocument.create({
            organizationId,
            onboardingId: onboarding._id,
            title,
            status: OnboardingDocumentStatus.PENDING
        }))

        await Promise.all(docPromises)

        // 4. Update Application Status
        await JobApplication.updateOne(
            { _id: applicationId },
            { status: ApplicationStatus.ONBOARDING }
        )

        return onboarding
    }

    async getOnboardingStatus(applicationId: string) {
        const onboarding = await Onboarding.findOne({ applicationId })
        if (!onboarding) return null

        const documents = await OnboardingDocument.find({ onboardingId: onboarding._id })
        return { ...onboarding.toObject(), documents }
    }

    async updateDocumentStatus(
        documentId: string,
        status: string,
        feedback?: string,
        reviewerId?: string,
        fileAssetId?: string // If uploading
    ) {
        const session = await mongoose.startSession()
        let isCompleted = false
        let updatedDoc = null

        try {
            session.startTransaction()

            const doc = await OnboardingDocument.findById(documentId).session(session)
            if (!doc) throw new Error('Document not found')

            if (status) doc.status = status as any
            if (feedback) doc.feedback = feedback
            if (reviewerId) doc.reviewedBy = reviewerId as any

            if (fileAssetId) {
                doc.fileAssetId = fileAssetId as any
                doc.status = OnboardingDocumentStatus.UPLOADED // Auto-set to uploaded if file provided
            }

            if (reviewerId) {
                doc.reviewedAt = new Date()
            }

            await doc.save({ session })
            updatedDoc = doc

            // Auto check completion within the SAME transaction
            const documents = await OnboardingDocument.find({ onboardingId: doc.onboardingId }).session(session)
            const allApproved = documents.every(d => d.status === OnboardingDocumentStatus.APPROVED)

            const { OnboardingFormResponse } = await import('../../database/models/index.js')
            const formResponse = await OnboardingFormResponse.findOne({ onboardingId: doc.onboardingId }).session(session)
            const formCompleted = formResponse ? formResponse.status === 'SUBMITTED' : true

            if (allApproved && formCompleted && documents.length > 0) {
                const onboarding = await Onboarding.findOneAndUpdate(
                    { _id: doc.onboardingId, status: { $ne: OnboardingStatus.COMPLETED } },
                    { $set: { status: OnboardingStatus.COMPLETED, completedAt: new Date() } },
                    { session, new: true }
                )

                if (onboarding) {
                    await JobApplication.updateOne(
                        { _id: onboarding.applicationId },
                        { $set: { status: ApplicationStatus.HIRED } },
                        { session }
                    )
                    isCompleted = true
                }
            }

            await session.commitTransaction()
        } catch (error) {
            await session.abortTransaction()
            throw error
        } finally {
            session.endSession()
        }

        return { doc: updatedDoc, isCompleted }
    }

    async checkCompletion(onboardingId: string) {
        // Kept for manual/external triggers if needed, but primary logic runs inside updateDocumentStatus transaction.
        const documents = await OnboardingDocument.find({ onboardingId })
        const allApproved = documents.every(d => d.status === OnboardingDocumentStatus.APPROVED)

        const { OnboardingFormResponse } = await import('../../database/models/index.js')
        const formResponse = await OnboardingFormResponse.findOne({ onboardingId })
        const formCompleted = formResponse ? formResponse.status === 'SUBMITTED' : true

        if (allApproved && formCompleted && documents.length > 0) {
            const onboarding = await Onboarding.findOneAndUpdate(
                { _id: onboardingId, status: { $ne: OnboardingStatus.COMPLETED } },
                { $set: { status: OnboardingStatus.COMPLETED, completedAt: new Date() } },
                { new: true }
            )

            if (onboarding) {
                await JobApplication.updateOne(
                    { _id: onboarding.applicationId },
                    { status: ApplicationStatus.HIRED }
                )
                return true
            }
        }
        return false
    }

    async getActivityTimeline(onboardingId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit
        const { ActivityLog } = await import('../../database/models/index.js')

        const logs = await ActivityLog.find({
            entityType: 'ONBOARDING',
            entityId: new mongoose.Types.ObjectId(onboardingId)
        })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)

        const total = await ActivityLog.countDocuments({
            entityType: 'ONBOARDING',
            entityId: new mongoose.Types.ObjectId(onboardingId)
        })

        return {
            timeline: logs,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        }
    }
}

export const candidateOnboardingService = new CandidateOnboardingService()

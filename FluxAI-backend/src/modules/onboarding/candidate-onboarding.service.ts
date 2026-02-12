import {
    Onboarding, OnboardingStatus, OnboardingDocument, OnboardingDocumentStatus,
    OrganizationOnboardingConfig, JobApplication, ApplicationStatus, Candidate
} from '../../database/models'

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
        const doc = await OnboardingDocument.findById(documentId)
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

        await doc.save()
        return doc
    }

    async checkCompletion(onboardingId: string) {
        const documents = await OnboardingDocument.find({ onboardingId })
        const allApproved = documents.every(d => d.status === OnboardingDocumentStatus.APPROVED)

        if (allApproved && documents.length > 0) {
            await Onboarding.updateOne(
                { _id: onboardingId },
                { status: OnboardingStatus.COMPLETED, completedAt: new Date() }
            )

            // Find App and update to HIRED
            const onboarding = await Onboarding.findById(onboardingId)
            if (onboarding) {
                await JobApplication.updateOne(
                    { _id: onboarding.applicationId },
                    { status: ApplicationStatus.HIRED }
                )
            }
            return true
        }
        return false
    }
}

export const candidateOnboardingService = new CandidateOnboardingService()

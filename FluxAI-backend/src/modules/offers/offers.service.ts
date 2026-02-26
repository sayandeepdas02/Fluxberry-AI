import { Types } from 'mongoose'
import { Offer, JobApplication, OfferStatus, ApplicationStatus, OfferTemplate, OfferSignature, ActivityLog } from '../../database/models/index.js'
import crypto from 'crypto'
import { templateService } from './template.service.js'
import { pdfService } from './pdf.service.js'
import { candidateOnboardingService } from '../onboarding/candidate-onboarding.service.js'

export class OffersService {

    async createOfferDraft(
        organizationId: string,
        applicationId: string,
        templateId: string,
        filledVariables: Record<string, any>,
        expiresInDays: number = 7
    ) {
        const app = await JobApplication.findOne({
            _id: applicationId,
            organizationId
        })
        if (!app) throw new Error('Application not found')

        const template = await OfferTemplate.findOne({ _id: templateId, organizationId })
        if (!template) throw new Error('Template not found')
        if (!template.isActive) throw new Error('Template is not active')

        const offerId = new Types.ObjectId()

        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + expiresInDays)

        const offer = await Offer.create({
            _id: offerId,
            organizationId,
            applicationId,
            candidateId: app.candidateId,
            templateId: template._id,
            filledVariables,
            status: OfferStatus.DRAFT,
            expiresAt,
            auditLog: [{
                event: 'Offer Draft Created',
                timestamp: new Date(),
                ipAddress: 'sys'
            }]
        })

        return offer
    }

    async generateOfferPdf(offerId: string, organizationId: string) {
        const offer = await Offer.findOne({ _id: offerId, organizationId }).populate('templateId')
        if (!offer || !offer.templateId) throw new Error('Offer or Template not found')

        const template = await OfferTemplate.findById(offer.templateId)
        if (!template) throw new Error('Template not found')

        const content = templateService.render(template.htmlContent, offer.filledVariables || {})
        const pdfBuffer = await pdfService.generatePdf(content)
        const pdfUrl = await pdfService.uploadPdf(pdfBuffer, organizationId, offer._id.toString(), 'unsigned')

        offer.generatedPdfUrl = pdfUrl
        await offer.save()

        return offer
    }

    async sendOfferEmail(offerId: string, organizationId: string) {
        const offer = await Offer.findOne({ _id: offerId, organizationId })
        if (!offer) throw new Error('Offer not found')
        if (offer.status !== OfferStatus.DRAFT) throw new Error('Offer must be in DRAFT to send')
        if (!offer.generatedPdfUrl) throw new Error('Cannot send offer without generated PDF')

        const token = crypto.randomBytes(32).toString('hex')
        offer.publicToken = token
        offer.status = OfferStatus.SENT

        if (offer.auditLog) {
            offer.auditLog.push({ event: 'Offer Sent', timestamp: new Date(), ipAddress: 'sys' })
        }

        await offer.save()

        await JobApplication.updateOne(
            { _id: offer.applicationId },
            { status: ApplicationStatus.OFFER_SENT }
        )

        // Track globally in ActivityLog
        await ActivityLog.create({
            entityType: 'OFFER',
            entityId: offer._id,
            eventType: 'OFFER_SENT',
            timestamp: new Date()
        })

        console.log(`[Email] Sending Offer Link to Candidate: /offers/${token}`)
        return offer
    }

    async getOffer(offerId: string, organizationId: string) {
        return Offer.findOne({ _id: offerId, organizationId })
    }

    async getOffers(organizationId: string) {
        return Offer.find({ organizationId })
            .sort({ createdAt: -1 })
            .populate('applicationId', 'jobId candidateId')
    }

    async getOffersByApplication(applicationId: string, organizationId: string) {
        return Offer.find({ applicationId, organizationId }).sort({ createdAt: -1 })
    }

    // Public Routes
    async getOfferByToken(publicToken: string) {
        const offer = await Offer.findOne({ publicToken })
        if (!offer) throw new Error('Invalid offer token')

        if (offer.status === OfferStatus.SENT) {
            offer.status = OfferStatus.VIEWED
            if (!offer.viewedAt) offer.viewedAt = new Date()

            if (offer.auditLog) {
                offer.auditLog.push({ event: 'Offer Viewed', timestamp: new Date(), ipAddress: 'candidate' }) // Needs req ip ideally
            }
            await offer.save()

            await ActivityLog.create({
                entityType: 'OFFER',
                entityId: offer._id,
                eventType: 'OFFER_VIEWED',
                timestamp: new Date()
            })
        }

        if (offer.expiresAt && new Date() > offer.expiresAt) {
            if (offer.status !== OfferStatus.SIGNED && offer.status !== OfferStatus.REJECTED) {
                offer.status = OfferStatus.EXPIRED
                await offer.save()
            }
        }

        return offer
    }

    async recordSignature(publicToken: string, signatureData: { name: string, data: string, type: 'DRAWN' | 'TYPED' }, ipAddress: string = '0.0.0.0') {
        const offer = await Offer.findOne({ publicToken }).populate('templateId')
        if (!offer) throw new Error('Invalid offer token')
        if (!offer.templateId) throw new Error('Offer has no linked template')

        if (offer.status !== OfferStatus.SENT && offer.status !== OfferStatus.VIEWED) {
            throw new Error('Offer is not in a valid state to accept')
        }

        if (offer.expiresAt && new Date() > offer.expiresAt) {
            offer.status = OfferStatus.EXPIRED
            await offer.save()
            throw new Error('Offer has expired')
        }

        const template = await OfferTemplate.findById(offer.templateId)
        if (!template) throw new Error('Template not found')

        const signedAt = new Date()
        const content = templateService.render(template.htmlContent, offer.filledVariables || {})
        const documentHash = crypto.createHash('sha256').update(content).digest('hex')

        const signatureHtml = `
            <div class="signature-section">
                <h3>Agreed and Accepted</h3>
                <p><strong>Signed By:</strong> ${signatureData.name}</p>
                <p><strong>Date:</strong> ${signedAt.toLocaleString()}</p>
                <img src="${signatureData.data}" class="signature-img" alt="Signature" />
                <p><small>Document Hash: ${documentHash}</small></p>
            </div>
        `
        const finalContent = content + signatureHtml

        const pdfBuffer = await pdfService.generatePdf(finalContent)
        const signedPdfUrl = await pdfService.uploadPdf(pdfBuffer, offer.organizationId.toString(), offer._id.toString(), 'signed')

        offer.status = OfferStatus.SIGNED
        offer.signedAt = signedAt
        offer.signedPdfUrl = signedPdfUrl

        if (offer.auditLog) {
            offer.auditLog.push({ event: 'Offer Signed', timestamp: signedAt, ipAddress })
        }
        await offer.save()

        await OfferSignature.create({
            offerId: offer._id,
            signatureType: signatureData.type,
            signatureImageUrl: signatureData.data,
            documentHash,
            signedAt,
            ipAddress
        })

        await ActivityLog.create({
            entityType: 'OFFER',
            entityId: offer._id,
            eventType: 'OFFER_SIGNED',
            timestamp: signedAt
        })

        await JobApplication.updateOne(
            { _id: offer.applicationId },
            { status: ApplicationStatus.OFFER_ACCEPTED }
        )

        // Auto Trigger Onboarding (Without Replacing / Breaking Existing Logic)
        await this.checkAndTriggerOnboarding(offer.applicationId.toString(), offer.organizationId.toString())

        return offer
    }

    async rejectOffer(publicToken: string, reason: string, ipAddress: string = '0.0.0.0') {
        const offer = await Offer.findOne({ publicToken })
        if (!offer) throw new Error('Invalid offer token')

        offer.status = OfferStatus.REJECTED
        offer.rejectedReason = reason

        if (offer.auditLog) {
            offer.auditLog.push({ event: 'Offer Rejected', timestamp: new Date(), ipAddress })
        }
        await offer.save()

        await JobApplication.updateOne(
            { _id: offer.applicationId },
            { status: ApplicationStatus.OFFER_DECLINED }
        )

        return offer
    }

    async expireOffer(offerId: string, organizationId: string) {
        const offer = await Offer.findOne({ _id: offerId, organizationId })
        if (!offer) throw new Error('Offer not found')

        offer.status = OfferStatus.EXPIRED
        if (offer.auditLog) {
            offer.auditLog.push({ event: 'Offer Expired Automatically', timestamp: new Date(), ipAddress: 'sys' })
        }
        await offer.save()

        return offer
    }

    async checkAndTriggerOnboarding(applicationId: string, organizationId: string) {
        await candidateOnboardingService.initializeOnboarding(applicationId, organizationId)
    }
}

export const offersService = new OffersService()

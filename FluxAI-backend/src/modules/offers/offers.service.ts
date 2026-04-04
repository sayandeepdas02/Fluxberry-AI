import { Types } from 'mongoose'
import { Offer, JobApplication, OfferStatus, ApplicationStatus, OfferTemplate, OfferSignature, ActivityLog } from '../../database/models/index.js'
import crypto from 'crypto'
import { templateService } from './template.service.js'
import { pdfService } from './pdf.service.js'
import { candidateOnboardingService } from '../onboarding/candidate-onboarding.service.js'
import { activityService } from '../activity/activity.service.js'
import { PDFDocument } from 'pdf-lib'

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
            snapshotHtml: template.htmlContent,
            snapshotVariables: template.variables,
            snapshotTemplateVersion: template.version,
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
        if (!template && !offer.snapshotHtml) throw new Error('Template not found')

        const htmlToRender = offer.snapshotHtml || template?.htmlContent
        if (!htmlToRender) throw new Error('Template content not found')

        const content = templateService.render(htmlToRender, offer.filledVariables || {})
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

        const rawToken = crypto.randomBytes(32).toString('hex')
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
        offer.publicToken = tokenHash

        const tokenExpires = new Date()
        tokenExpires.setDate(tokenExpires.getDate() + 7) // Configured 7 days by default, configurable via settings later
        offer.tokenExpiresAt = tokenExpires

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
        await activityService.log({
            organizationId: offer.organizationId.toString(),
            entityType: 'offer',
            entityId: offer._id.toString(),
            eventType: 'OFFER_SENT',
            actorType: 'user',
            metadata: { applicationId: offer.applicationId.toString() }
        })

        console.log(`[Email] Sending Offer Link to Candidate: /offer/${rawToken}`)

        const responseData = offer.toObject()
        return { ...responseData, rawToken }
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
    async getOfferByToken(rawToken: string) {
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
        const offer = await Offer.findOne({ publicToken: tokenHash })
        if (!offer) throw new Error('Invalid offer token')

        // 410 Gone if token expired
        if (offer.tokenExpiresAt && new Date() > offer.tokenExpiresAt) {
            throw new Error('410 Gone: Token has expired')
        }

        if (offer.tokenUsedAt) {
            throw new Error('Token has already been consumed')
        }

        if (offer.status === OfferStatus.SENT) {
            offer.status = OfferStatus.VIEWED
            if (!offer.viewedAt) offer.viewedAt = new Date()

            if (offer.auditLog) {
                offer.auditLog.push({ event: 'Offer Viewed', timestamp: new Date(), ipAddress: 'candidate' }) // Needs req ip ideally
            }
            await offer.save()

            await activityService.log({
                organizationId: offer.organizationId.toString(),
                entityType: 'offer',
                entityId: offer._id.toString(),
                eventType: 'OFFER_VIEWED',
                actorType: 'system',
                metadata: {}
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

    async recordSignature(rawToken: string, signatureData: { name: string, data: string, type: 'DRAWN' | 'TYPED' }, ipAddress: string = '0.0.0.0') {
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
        const offer = await Offer.findOne({ publicToken: tokenHash }).populate('templateId')

        if (!offer) throw new Error('Invalid offer token')
        if (offer.status === OfferStatus.SIGNED) throw new Error('Offer has already been signed')

        if (offer.tokenExpiresAt && new Date() > offer.tokenExpiresAt) {
            offer.status = OfferStatus.EXPIRED
            await offer.save()
            throw new Error('Offer has expired')
        }

        const htmlToRender = offer.snapshotHtml || (await OfferTemplate.findById(offer.templateId))?.htmlContent
        if (!htmlToRender) throw new Error('Template not found')

        const signedAt = new Date()
        const content = templateService.render(htmlToRender, offer.filledVariables || {})
        const unsignedPdfBuffer = await pdfService.generatePdf(content)

        // Load PDF using pdf-lib
        const pdfDoc = await PDFDocument.load(unsignedPdfBuffer)

        // Insert signature image at fixed coordinates
        let imgBytes;
        if (signatureData.data.includes('base64,')) {
            imgBytes = Buffer.from(signatureData.data.split('base64,')[1], 'base64');
        } else {
            imgBytes = Buffer.from(signatureData.data, 'base64');
        }

        let signatureImage;
        try {
            signatureImage = await pdfDoc.embedPng(imgBytes)
        } catch {
            signatureImage = await pdfDoc.embedJpg(imgBytes)
        }

        // Draw onto the last page
        const pages = pdfDoc.getPages()
        const lastPage = pages[pages.length - 1]

        const dims = signatureImage.scale(0.5)
        lastPage.drawImage(signatureImage, {
            x: 50,
            y: 50,
            width: dims.width,
            height: dims.height,
        })

        const form = pdfDoc.getForm()
        try { form.flatten() } catch (err) { }

        const signedPdfBytes = await pdfDoc.save()
        const signedPdfBuffer = Buffer.from(signedPdfBytes)
        const documentHash = crypto.createHash('sha256').update(signedPdfBuffer).digest('hex')

        const signedPdfUrl = await pdfService.uploadPdf(signedPdfBuffer, offer.organizationId.toString(), offer._id.toString(), 'signed')

        // Atomic lock to SIGNED using Conditional Guard
        const updatedOffer = await Offer.findOneAndUpdate(
            { _id: offer._id, status: { $ne: OfferStatus.SIGNED } },
            {
                $set: {
                    status: OfferStatus.SIGNED,
                    signedAt,
                    signedPdfUrl,
                    signedPdfHash: documentHash,
                    tokenUsedAt: new Date(),
                }
            },
            { new: true }
        )

        if (!updatedOffer) {
            throw new Error('Offer was modified concurrently or already signed')
        }

        if (updatedOffer.auditLog) {
            updatedOffer.auditLog.push({ event: 'Offer Signed', timestamp: signedAt, ipAddress })
            await updatedOffer.save()
        }

        await OfferSignature.create({
            offerId: offer._id,
            signatureType: signatureData.type,
            signatureImageUrl: signatureData.data,
            documentHash,
            signedAt,
            ipAddress
        })

        await activityService.log({
            organizationId: offer.organizationId.toString(),
            entityType: 'offer',
            entityId: offer._id.toString(),
            eventType: 'OFFER_SIGNED',
            actorType: 'system',
            metadata: { signedAt: signedAt.toISOString() }
        })

        await JobApplication.updateOne(
            { _id: offer.applicationId },
            { status: ApplicationStatus.OFFER_ACCEPTED }
        )

        // Auto Trigger Onboarding (Without Replacing / Breaking Existing Logic)
        await this.checkAndTriggerOnboarding(offer.applicationId.toString(), offer.organizationId.toString())

        return offer
    }

    async rejectOffer(rawToken: string, reason: string, ipAddress: string = '0.0.0.0') {
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
        const offer = await Offer.findOne({ publicToken: tokenHash })
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

        // Activity Log for Inbox
        await activityService.log({
            organizationId: offer.organizationId.toString(),
            entityType: 'offer',
            entityId: offer._id.toString(),
            eventType: 'OFFER_REJECTED',
            actorType: 'system',
            metadata: { reason }
        })

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

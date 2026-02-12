import { Types } from 'mongoose'
import { Offer, JobApplication, OfferStatus, ApplicationStatus, OfferTemplate } from '../../database/models/index.js'
import crypto from 'crypto'
import { templateService } from './template.service.js'
import { pdfService } from './pdf.service.js'
import { v4 as uuidv4 } from 'uuid'

export class OffersService {

    // Updated: Create Offer from Template
    async createOffer(
        organizationId: string,
        applicationId: string,
        templateId: string,
        variables: Record<string, any>,
        expiresInDays: number = 7
    ) {
        // 1. Validate Application Status
        const app = await JobApplication.findOne({
            _id: applicationId,
            organizationId
        })
        if (!app) throw new Error('Application not found')

        // 2. Fetch Template
        const template = await OfferTemplate.findOne({ _id: templateId, organizationId })
        if (!template) throw new Error('Template not found')
        if (!template.isActive) throw new Error('Template is not active')

        // 3. Validate Variables
        /* 
           Using template.schema (Map) requires conversion to JS object if we want to iterate easily,
           or we can just skip strict validation for MVP and rely on render checking.
           Ideally: templateService.validateVariables(template.schema, variables)
        */

        // 4. Render Content
        const content = templateService.render(template.content, variables)

        // 5. Generate Unsigned PDF
        // We generate it now so it's ready for preview/sending
        const pdfBuffer = await pdfService.generatePdf(content)

        // 6. Create Offer Record (DRAFT)
        // We need an ID for the PDF path, so we might need to create object first or use UUID
        const offerId = new Types.ObjectId()
        const pdfUrl = await pdfService.uploadPdf(pdfBuffer, organizationId, offerId.toString(), 'unsigned')

        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + expiresInDays)

        const offer = await Offer.create({
            _id: offerId,
            organizationId,
            applicationId,
            candidateId: app.candidateId,
            templateId: template._id,
            templateSnapshot: template.content,
            variables,
            content,
            status: OfferStatus.DRAFT,
            pdfUrl,
            expiresAt
        })

        return offer
    }

    async sendOffer(offerId: string, organizationId: string) {
        const offer = await Offer.findOne({ _id: offerId, organizationId })
        if (!offer) throw new Error('Offer not found')
        if (offer.status !== OfferStatus.DRAFT) throw new Error('Offer must be in DRAFT to send')

        // Generate Secure Token
        const token = crypto.randomBytes(32).toString('hex')
        offer.token = token
        offer.status = OfferStatus.SENT
        // offer.sentAt = new Date() // If I added this field
        await offer.save()

        // Update Application Status
        await JobApplication.updateOne(
            { _id: offer.applicationId },
            { status: ApplicationStatus.OFFER_SENT }
        )

        // TODO: Send Email (Mocked)
        console.log(`[Email] Sending Offer Link to Candidate: /offers/${token}`)

        return offer
    }

    async getOffer(offerId: string, organizationId: string) {
        return Offer.findOne({ _id: offerId, organizationId })
    }

    async getOffers(organizationId: string) {
        return Offer.find({ organizationId })
            .sort({ createdAt: -1 })
            .populate('applicationId', 'jobId candidateId') // accurate population might need Virtuals or deep populate if Schema is complex
    }

    async getOffersByApplication(applicationId: string, organizationId: string) {
        return Offer.find({ applicationId, organizationId }).sort({ createdAt: -1 })
    }

    // Public Access
    async getOfferByToken(token: string) {
        const offer = await Offer.findOne({ token })
        if (!offer) throw new Error('Invalid offer token')

        // Mark as Viewed if not already
        if (offer.status === OfferStatus.SENT) {
            offer.status = OfferStatus.VIEWED
            if (!offer.openedAt) offer.openedAt = new Date()
            await offer.save()
        }

        // Check Expiry
        if (offer.expiresAt && new Date() > offer.expiresAt) {
            // We allow viewing but maybe indicate expiry?
            // Or update status if not updated yet
            if (offer.status !== OfferStatus.ACCEPTED && offer.status !== OfferStatus.DECLINED) {
                offer.status = OfferStatus.EXPIRED
                await offer.save()
            }
        }

        return offer
    }

    async acceptOffer(token: string, signatureData: { name: string, data: string }) {
        const offer = await Offer.findOne({ token })
        if (!offer) throw new Error('Invalid offer token')

        if (offer.status !== OfferStatus.SENT && offer.status !== OfferStatus.VIEWED) {
            throw new Error('Offer is not in a valid state to accept')
        }

        if (offer.expiresAt && new Date() > offer.expiresAt) {
            offer.status = OfferStatus.EXPIRED
            await offer.save()
            throw new Error('Offer has expired')
        }

        // 1. Append Signature to Content
        const signedAt = new Date()
        const signatureHtml = `
            <div class="signature-section">
                <h3>Agreed and Accepted</h3>
                <p><strong>Signed By:</strong> ${signatureData.name}</p>
                <p><strong>Date:</strong> ${signedAt.toLocaleString()}</p>
                <img src="${signatureData.data}" class="signature-img" alt="Signature" />
            </div>
        `
        const finalContent = offer.content + signatureHtml

        // 2. Generate Signed PDF
        const pdfBuffer = await pdfService.generatePdf(finalContent)
        const signedPdfUrl = await pdfService.uploadPdf(pdfBuffer, offer.organizationId.toString(), offer._id.toString(), 'signed')

        // 3. Update Offer
        offer.status = OfferStatus.ACCEPTED
        offer.acceptedAt = signedAt
        offer.signedPdfUrl = signedPdfUrl
        offer.signature = {
            name: signatureData.name,
            data: signatureData.data,
            ip: '0.0.0.0', // TODO: Capture IP from request if passed
            signedAt
        }
        await offer.save()

        // 4. Update Application
        await JobApplication.updateOne(
            { _id: offer.applicationId },
            { status: ApplicationStatus.OFFER_ACCEPTED }
        )

        // 5. Return Offer (Controller will trigger Onboarding)
        return offer
    }

    async declineOffer(token: string, reason: string) {
        const offer = await Offer.findOne({ token })
        if (!offer) throw new Error('Invalid offer token')

        offer.status = OfferStatus.DECLINED
        offer.declinedAt = new Date()
        offer.declineReason = reason
        await offer.save()

        await JobApplication.updateOne(
            { _id: offer.applicationId },
            { status: ApplicationStatus.OFFER_DECLINED }
        )

        return offer
    }
}

export const offersService = new OffersService()

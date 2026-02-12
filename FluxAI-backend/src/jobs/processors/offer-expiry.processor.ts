import { Job } from 'bullmq'
import { Offer, OfferStatus, JobApplication, ApplicationStatus } from '../../database/models/index.js'

export const processOfferExpiryJob = async (job: Job) => {
    try {
        const now = new Date()

        // Find all offers that are SENT and have expired
        const expiredOffers = await Offer.find({
            status: OfferStatus.SENT,
            expiresAt: { $lt: now }
        })

        if (expiredOffers.length === 0) {
            console.log('No expired offers found')
            return
        }

        console.log(`Processing ${expiredOffers.length} expired offers...`)

        for (const offer of expiredOffers) {
            offer.status = OfferStatus.EXPIRED
            await offer.save()

            // Update Application Status if needed
            // Currently ApplicationStatus doesn't have explicit EXPIRED state for OFFER, 
            // but we can set it to DECLINED or leave it as SENT but mark internally?
            // Actually, we should probably add OFFER_EXPIRED status to ApplicationStatus,
            // but for now let's set it to REJECTED or leave it. 
            // Wait, we have 'OFFER_DECLINED'. 
            // Let's create an Audit Log entry at least?
            // For now, just update offer status.
            // If we want to reflect in Application, maybe add a note?

            console.log(`Marked Offer ${offer._id} as EXPIRED`)
        }

    } catch (error: any) {
        console.error('Error processing offer expiry:', error.message)
        throw error
    }
}

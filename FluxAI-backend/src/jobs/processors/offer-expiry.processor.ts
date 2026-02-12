import { Job } from 'bullmq'
import { Offer, OfferStatus } from '../../database/models/index.js'

export const offerExpiryProcessor = async (_job: Job) => {
    try {
        const now = new Date()

        // Find offers that are PENDING and have expired
        // Assuming Offer model has expiresAt field
        const result = await Offer.updateMany(
            {
                status: 'PENDING',
                expiresAt: { $lt: now }
            },
            {
                $set: { status: 'EXPIRED' }
            }
        )

        if (result.modifiedCount > 0) {
            console.log(`[OfferExpiry] Marked ${result.modifiedCount} offers as EXPIRED`)
        }
    } catch (error) {
        console.error('Error processing offer expiry:', error)
        throw error
    }
}

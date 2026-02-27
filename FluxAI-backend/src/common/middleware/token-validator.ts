import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import { Offer } from '../../database/models/index.js'
import rateLimit from 'express-rate-limit'

export const publicRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per window
    message: { success: false, error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
})

export const validatePublicToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token } = req.params
        if (!token) {
            res.status(400).json({ success: false, error: 'Token is required' })
            return
        }

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
        const offer = await Offer.findOne({ publicToken: tokenHash }).select('tokenExpiresAt tokenUsedAt')

        if (!offer) {
            res.status(404).json({ success: false, error: 'Invalid offer token' })
            return
        }

        if (offer.tokenExpiresAt && new Date() > offer.tokenExpiresAt) {
            res.status(410).json({ success: false, error: '410 Gone: Token has expired' })
            return
        }

        if (offer.tokenUsedAt) {
            res.status(410).json({ success: false, error: '410 Gone: Token has already been consumed' })
            return
        }

        // Validation passed, continue to controller
        next()
    } catch (error) {
        next(error)
    }
}

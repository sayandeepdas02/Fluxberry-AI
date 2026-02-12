
import rateLimit from 'express-rate-limit'

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 300, // Limit each IP to 300 requests per window (buffer for dev/testing)
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many requests from this IP, please try again after 15 minutes',
        },
    },
})

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 20, // Limit login attempts
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many login attempts, please try again later',
        },
    },
})

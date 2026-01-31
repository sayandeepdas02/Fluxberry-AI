import morgan from 'morgan'
import { Request } from 'express'

// Custom token for request body (only in development)
morgan.token('body', (req: Request) => {
    if (process.env.NODE_ENV === 'development' && req.body && Object.keys(req.body).length > 0) {
        // Redact sensitive fields
        const sanitized = { ...req.body }
        if (sanitized.password) sanitized.password = '[REDACTED]'
        if (sanitized.passwordHash) sanitized.passwordHash = '[REDACTED]'
        return JSON.stringify(sanitized)
    }
    return ''
})

// Custom format for development
const devFormat = ':method :url :status :response-time ms - :res[content-length] :body'

// Custom format for production
const prodFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]'

export const requestLogger = morgan(
    process.env.NODE_ENV === 'production' ? prodFormat : devFormat
)

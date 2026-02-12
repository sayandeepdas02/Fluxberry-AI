import { Request, Response, NextFunction } from 'express'
import { errorResponse, ErrorCodes } from '../utils/api-response.js'
import { ZodError } from 'zod'
import { logger } from '../utils/structured-logger.js'

export interface AppError extends Error {
    statusCode?: number
    code?: string
}

export function errorHandler(
    err: AppError,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    const requestId = req.requestId || 'unknown'

    // Handle Zod validation errors
    if (err instanceof ZodError) {
        logger.warn('Validation error', {
            requestId,
            path: req.path,
            errors: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
        } as any)

        res.status(400).json({
            ...errorResponse(
                ErrorCodes.VALIDATION_ERROR,
                'Validation failed',
                err.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }))
            ),
            requestId,
        })
        return
    }

    // Handle known app errors (include details when present)
    if (err.statusCode) {
        logger.warn('App error', {
            requestId,
            path: req.path,
            statusCode: err.statusCode,
            code: err.code,
            message: err.message,
        } as any)

        const errWithDetails = err as AppError & { details?: unknown }
        res.status(err.statusCode).json({
            ...errorResponse(err.code || ErrorCodes.INTERNAL_ERROR, err.message, errWithDetails.details),
            requestId,
        })
        return
    }

    // Handle unknown errors
    logger.error('Unhandled error', err, {
        requestId,
        path: req.path,
        method: req.method,
    } as any)

    res.status(500).json({
        ...errorResponse(
            ErrorCodes.INTERNAL_ERROR,
            process.env.NODE_ENV === 'production'
                ? 'An unexpected error occurred'
                : err.message
        ),
        requestId,
    })
}


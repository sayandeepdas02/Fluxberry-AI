import { Request, Response, NextFunction } from 'express'
import { errorResponse, ErrorCodes } from '../utils/api-response.js'
import { ZodError } from 'zod'

export interface AppError extends Error {
    statusCode?: number
    code?: string
}

export function errorHandler(
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    console.error('Error:', err)

    // Handle Zod validation errors
    if (err instanceof ZodError) {
        res.status(400).json(
            errorResponse(
                ErrorCodes.VALIDATION_ERROR,
                'Validation failed',
                err.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }))
            )
        )
        return
    }

    // Handle known app errors
    if (err.statusCode) {
        res.status(err.statusCode).json(
            errorResponse(err.code || ErrorCodes.INTERNAL_ERROR, err.message)
        )
        return
    }

    // Handle unknown errors
    res.status(500).json(
        errorResponse(
            ErrorCodes.INTERNAL_ERROR,
            process.env.NODE_ENV === 'production'
                ? 'An unexpected error occurred'
                : err.message
        )
    )
}

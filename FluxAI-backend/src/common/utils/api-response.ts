export interface ApiResponse<T = unknown> {
    success: boolean
    data?: T
    error?: {
        code: string
        message: string
        details?: unknown
    }
}

export function successResponse<T>(data: T): ApiResponse<T> {
    return {
        success: true,
        data,
    }
}

export function errorResponse(
    code: string,
    message: string,
    details?: unknown
): ApiResponse<never> {
    return {
        success: false,
        error: {
            code,
            message,
            details,
        },
    }
}

// Common error codes
export const ErrorCodes = {
    // Auth
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',

    // Validation
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',

    // Resources
    NOT_FOUND: 'NOT_FOUND',
    ALREADY_EXISTS: 'ALREADY_EXISTS',
    CONFLICT: 'CONFLICT',

    // Server
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const

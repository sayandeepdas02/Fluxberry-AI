import { Request, Response, NextFunction } from 'express'
import { successResponse, errorResponse } from '../utils/api-response.js'

// Extend Express Response interface
declare global {
    namespace Express {
        interface Response {
            success: (data?: any, statusCode?: number) => void;
            error: (code: string, message: string, details?: any, statusCode?: number) => void;
        }
    }
}

export function responseWrapper(req: Request, res: Response, next: NextFunction): void {
    res.success = (payload: any = null, statusCode: number = 200) => {
        let finalData = payload;
        let meta = undefined;

        // Auto-extract pagination keys if they exist at the root
        if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
            const { page, limit, total, totalPages, skip, ...rest } = payload;
            if (page !== undefined || limit !== undefined || total !== undefined) {
                meta = { page, limit, total, totalPages, skip };
                
                // If the only remaining property is an array (e.g., candidates: []), promote it to finalData
                const remainingKeys = Object.keys(rest);
                if (remainingKeys.length === 1 && Array.isArray(rest[remainingKeys[0]])) {
                    finalData = rest[remainingKeys[0]];
                } else {
                    finalData = rest;
                }
            }
        }

        return res.status(statusCode).json({
            success: true,
            data: finalData,
            ...(meta && { meta }),
            requestId: req.requestId
        })
    }

    res.error = (code: string, message: string, details?: any, statusCode: number = 400) => {
        return res.status(statusCode).json({
            ...errorResponse(code, message, details),
            requestId: req.requestId
        })
    }

    next()
}

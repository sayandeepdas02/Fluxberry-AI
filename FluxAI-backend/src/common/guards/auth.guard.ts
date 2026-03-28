import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { OrganizationMember, MemberRole, MemberRoleType } from '../../database/models/index.js'

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string
        email: string
        organizationId: string | null
        role: string | null
    }
}

/**
 * JWT Authentication Guard
 * Verifies JWT token and attaches user to request
 */
export function authGuard(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' },
        })
        return
    }

    const token = authHeader.substring(7)
    const secret = process.env.JWT_SECRET

    if (!secret) {
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'JWT secret not configured' },
        })
        return
    }

    try {
        const payload = jwt.verify(token, secret) as {
            id: string
            email: string
            organizationId: string | null
            role: string | null
            type: string
        }

        if (payload.type !== 'access') {
            res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Invalid token type' },
            })
            return
        }

        req.user = {
            id: payload.id,
            email: payload.email,
            organizationId: payload.organizationId,
            role: payload.role,
        }

        next()
    } catch (err: any) {
        const isExpired = err.name === 'TokenExpiredError'
        res.status(401).json({
            success: false,
            error: { code: isExpired ? 'TOKEN_EXPIRED' : 'UNAUTHORIZED', message: isExpired ? 'Token expired' : 'Invalid token' },
        })
    }
}

/**
 * Require user to have an organization
 */
export function requireOrganization(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    if (!req.user?.organizationId) {
        res.status(403).json({
            success: false,
            error: { code: 'NO_ORGANIZATION', message: 'User must belong to an organization' },
        })
        return
    }
    next()
}

// Role hierarchy: OWNER > ADMIN > RECRUITER
const ROLE_HIERARCHY: Record<string, number> = {
    OWNER: 3,
    ADMIN: 2,
    RECRUITER: 1,
}

/**
 * Require user to have org access with optional role check
 * Validates:
 * 1. User belongs to an organization
 * 2. User's role meets minimum requirement (if specified)
 * 3. User's org membership is verified from database
 */
export function requireOrgAccess(requiredRole?: MemberRoleType) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        const user = req.user

        if (!user) {
            res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
            })
            return
        }

        if (!user.organizationId) {
            res.status(403).json({
                success: false,
                error: { code: 'NO_ORGANIZATION', message: 'User must belong to an organization' },
            })
            return
        }

        // Verify membership from database (prevents stale JWT data)
        const membership = await OrganizationMember.findOne({
            userId: user.id,
            organizationId: user.organizationId,
        })

        if (!membership) {
            res.status(403).json({
                success: false,
                error: { code: 'NOT_MEMBER', message: 'User is not a member of this organization' },
            })
            return
        }

        // Check role hierarchy if required
        if (requiredRole) {
            const userRoleLevel = ROLE_HIERARCHY[membership.role] ?? 0
            const requiredRoleLevel = ROLE_HIERARCHY[requiredRole] ?? 0

            if (userRoleLevel < requiredRoleLevel) {
                res.status(403).json({
                    success: false,
                    error: {
                        code: 'INSUFFICIENT_ROLE',
                        message: `Requires ${requiredRole} role or higher`
                    },
                })
                return
            }
        }

        // Update req.user with fresh role from database
        if (req.user) {
            req.user.role = membership.role
        }

        next()
    }
}

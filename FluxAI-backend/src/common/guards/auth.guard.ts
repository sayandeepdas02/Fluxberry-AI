import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { OrganizationMember, MemberRole, MemberRoleType, MemberStatus } from '../../database/models/index.js'

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

// Role hierarchy: higher number = more permissions
const ROLE_HIERARCHY: Record<string, number> = {
    OWNER: 9,
    SUPER_ADMIN: 8,
    ADMIN: 7,
    FINANCE_ADMIN: 4,
    RECRUITER: 3,
    HIRING_MANAGER: 3,
    COORDINATOR: 2,
    INTERVIEWER: 2,
    VIEWER: 1,
    EXTERNAL_COLLABORATOR: 0,
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

        // Reject suspended or deactivated members
        if (membership.status === MemberStatus.SUSPENDED) {
            res.status(403).json({
                success: false,
                error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended. Contact your organization admin.' },
            })
            return
        }

        if (membership.status === MemberStatus.DEACTIVATED) {
            res.status(403).json({
                success: false,
                error: { code: 'ACCOUNT_DEACTIVATED', message: 'Your account has been deactivated.' },
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

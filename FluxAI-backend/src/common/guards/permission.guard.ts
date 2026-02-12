import { Request, Response, NextFunction } from 'express'
import {
    RolePermission, RBACResourceType, RBACActionType,
    MemberRoleType
} from '../../database/models/index.js'
import { AuthenticatedRequest } from './auth.guard.js'

// In-memory cache for permissions (cleared on server restart, refreshed periodically)
let permissionCache: Map<string, boolean> | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function getCacheKey(role: string, resource: string, action: string): string {
    return `${role}:${resource}:${action}`
}

async function loadPermissions(): Promise<Map<string, boolean>> {
    const now = Date.now()
    if (permissionCache && (now - cacheTimestamp) < CACHE_TTL_MS) {
        return permissionCache
    }

    const permissions = await RolePermission.find({}).lean()
    const cache = new Map<string, boolean>()

    for (const perm of permissions) {
        cache.set(getCacheKey(perm.role, perm.resource, perm.action), perm.allowed)
    }

    permissionCache = cache
    cacheTimestamp = now
    return cache
}

/**
 * Clear the permission cache (call after updating permissions)
 */
export function clearPermissionCache(): void {
    permissionCache = null
    cacheTimestamp = 0
}

/**
 * Check if a role has permission for a resource+action
 */
export async function hasPermission(
    role: MemberRoleType,
    resource: RBACResourceType,
    action: RBACActionType
): Promise<boolean> {
    const cache = await loadPermissions()

    // Check MANAGE first (full access to the resource)
    const manageKey = getCacheKey(role, resource, 'MANAGE')
    if (cache.get(manageKey) === true) return true

    // Check specific action
    const key = getCacheKey(role, resource, action)
    const allowed = cache.get(key)

    // If no explicit permission found, default to deny
    return allowed === true
}

/**
 * Permission guard middleware
 * Usage: requirePermission('JOBS', 'CREATE')
 */
export function requirePermission(resource: RBACResourceType, action: RBACActionType) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        const user = req.user

        if (!user) {
            res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
            })
            return
        }

        if (!user.role) {
            res.status(403).json({
                success: false,
                error: { code: 'NO_ROLE', message: 'User has no role in this organization' },
            })
            return
        }

        const allowed = await hasPermission(
            user.role as MemberRoleType,
            resource,
            action
        )

        if (!allowed) {
            res.status(403).json({
                success: false,
                error: {
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: `You do not have permission to ${action.toLowerCase()} ${resource.toLowerCase()}`
                },
            })
            return
        }

        next()
    }
}

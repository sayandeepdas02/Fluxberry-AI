import { useAuth } from '@/lib/context/auth-context'

// Role hierarchy levels
const ROLE_LEVELS: Record<string, number> = {
    OWNER: 5,
    ADMIN: 4,
    HIRING_MANAGER: 3,
    RECRUITER: 2,
    INTERVIEWER: 1,
}

export type RBACAction =
    | 'create_jobs'
    | 'edit_jobs'
    | 'delete_jobs'
    | 'publish_jobs'
    | 'manage_jobs'       // publish + close + delete combined
    | 'view_analytics'
    | 'manage_assessments'
    | 'manage_offers'
    | 'manage_members'
    | 'manage_settings'
    | 'manage_billing'
    | 'manage_email_templates'
    | 'view_candidates'
    | 'manage_candidates'
    | 'manage_pipeline'

// Minimum role required for each action
const ACTION_REQUIREMENTS: Record<RBACAction, string> = {
    create_jobs: 'RECRUITER',
    edit_jobs: 'RECRUITER',
    delete_jobs: 'ADMIN',
    publish_jobs: 'RECRUITER',
    manage_jobs: 'RECRUITER',
    view_analytics: 'INTERVIEWER',
    manage_assessments: 'RECRUITER',
    manage_offers: 'HIRING_MANAGER',
    manage_members: 'ADMIN',
    manage_settings: 'ADMIN',
    manage_billing: 'OWNER',
    manage_email_templates: 'RECRUITER',
    view_candidates: 'INTERVIEWER',
    manage_candidates: 'RECRUITER',
    manage_pipeline: 'RECRUITER',
}

/**
 * useRBAC — derives permissions from the authenticated user's organization role.
 *
 * Usage:
 *   const { can, role } = useRBAC()
 *   if (can('delete_jobs')) { ... }
 */
export function useRBAC() {
    const { user } = useAuth()
    const role = (user?.organization?.role ?? null) as string | null

    function can(action: RBACAction): boolean {
        if (!role) return false
        const userLevel = ROLE_LEVELS[role] ?? 0
        const requiredRole = ACTION_REQUIREMENTS[action]
        const requiredLevel = ROLE_LEVELS[requiredRole] ?? 99
        return userLevel >= requiredLevel
    }

    function isAtLeast(minRole: string): boolean {
        if (!role) return false
        return (ROLE_LEVELS[role] ?? 0) >= (ROLE_LEVELS[minRole] ?? 99)
    }

    return { can, role, isAtLeast }
}

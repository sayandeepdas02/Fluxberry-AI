import { apiClient } from './client'
import { ApiResponse } from './types'

export interface BillingStatus {
    plan: 'free' | 'growth' | 'scale' | 'enterprise'
    trialActive: boolean
    trialEndsAt: string | null
    apps: Record<string, { enabled: boolean; installed: boolean; limits?: Record<string, number> }>
}

export const billingApi = {
    /**
     * GET /api/billing/status
     * Returns the organization's current plan, trial state, and installed apps map.
     */
    getStatus: async (): Promise<ApiResponse<BillingStatus>> => {
        return apiClient.get('/billing/status')
    },

    /**
     * POST /api/billing/apps/:appId/install
     * Enables an app for the organization and returns the updated billing status.
     */
    installApp: async (appId: string): Promise<ApiResponse<BillingStatus>> => {
        return apiClient.post(`/billing/apps/${appId}/install`, {})
    },

    /**
     * POST /api/billing/apps/:appId/uninstall
     * Disables an app for the organization and returns the updated billing status.
     */
    uninstallApp: async (appId: string): Promise<ApiResponse<BillingStatus>> => {
        return apiClient.post(`/billing/apps/${appId}/uninstall`, {})
    },
}

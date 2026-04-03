import { Organization } from '../../database/models/index.js'

export class BillingService {

    /**
     * Returns the current subscription status for an organization.
     * Normalizes the DB representation (Mixed type) into a plain SubscriptionConfig
     * that the frontend can consume directly.
     */
    async getStatus(organizationId: string) {
        const org = await Organization.findById(organizationId)
        if (!org) throw new Error('Organization not found')

        // Recalculate trialActive based on current time (single source of truth)
        const now = new Date()
        const trialActive = org.trialEndsAt ? now < new Date(org.trialEndsAt) : false

        // If trial just expired in DB, update it lazily
        if ((org as any).trialActive !== trialActive) {
            await Organization.updateOne({ _id: org._id }, { trialActive })
        }

        return {
            plan: org.plan,
            trialActive,
            trialEndsAt: org.trialEndsAt ? org.trialEndsAt.toISOString() : null,
            apps: (org as any).installedApps || {},
        }
    }

    /**
     * Installs or enables an app for an organization.
     * Uses $set with the Mixed field path to avoid overwriting other apps.
     */
    async installApp(organizationId: string, appId: string) {
        const org = await Organization.findById(organizationId)
        if (!org) throw new Error('Organization not found')

        // Patch the app entry using dot-notation safe update
        await Organization.updateOne(
            { _id: organizationId },
            { $set: { [`installedApps.${appId}`]: { enabled: true, installed: true } } }
        )

        return this.getStatus(organizationId)
    }

    /**
     * Uninstalls/disables an app for an organization.
     */
    async uninstallApp(organizationId: string, appId: string) {
        await Organization.updateOne(
            { _id: organizationId },
            { $set: { [`installedApps.${appId}`]: { enabled: false, installed: false } } }
        )
        return this.getStatus(organizationId)
    }
}

export const billingService = new BillingService()

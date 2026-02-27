import {
    Organization,
    OrganizationMember,
    OrganizationOnboardingSettings,
    IOrganization,
    MemberRoleType,
} from '../../database/models/index.js'
import { UpdateOrganizationInput, UpdateOnboardingSettingsInput, OrganizationResponse, OrganizationMemberResponse } from './organizations.types.js'

export class OrganizationsService {
    /**
     * Get all organizations the user belongs to
     */
    async getAll(userId: string): Promise<OrganizationResponse[]> {
        const memberships = await OrganizationMember.find({ userId })
            .populate('organizationId')
            .sort({ joinedAt: 'asc' })

        const results: OrganizationResponse[] = []

        for (const m of memberships) {
            const org = m.organizationId as unknown as IOrganization
            if (!org) continue

            const memberCount = await OrganizationMember.countDocuments({ organizationId: org._id })

            results.push({
                id: org._id.toString(),
                name: org.name,
                slug: org.slug,
                logoUrl: org.logoUrl ?? null,
                website: org.website ?? null,
                plan: org.plan,
                memberCount,
                role: m.role,
                createdAt: org.createdAt,
            })
        }

        return results
    }

    /**
     * Get organization by ID (with membership verification)
     */
    async getById(organizationId: string, userId: string): Promise<OrganizationResponse> {
        // Verify user is a member of this organization
        const membership = await OrganizationMember.findOne({ userId, organizationId })

        if (!membership) {
            const error = new Error('Access denied') as Error & { statusCode: number; code: string }
            error.statusCode = 403
            error.code = 'FORBIDDEN'
            throw error
        }

        const org = await Organization.findById(organizationId)

        if (!org) {
            const error = new Error('Organization not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        const memberCount = await OrganizationMember.countDocuments({ organizationId })

        return {
            id: org._id.toString(),
            name: org.name,
            slug: org.slug,
            logoUrl: org.logoUrl ?? null,
            website: org.website ?? null,
            plan: org.plan,
            memberCount,
            role: membership.role,
            createdAt: org.createdAt,
        }
    }

    /**
     * Update organization (OWNER or ADMIN only)
     */
    async update(organizationId: string, userId: string, input: UpdateOrganizationInput): Promise<OrganizationResponse> {
        // Verify user is an OWNER or ADMIN of this organization
        const membership = await OrganizationMember.findOne({ userId, organizationId })

        if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
            const error = new Error('Owner or Admin access required') as Error & { statusCode: number; code: string }
            error.statusCode = 403
            error.code = 'FORBIDDEN'
            throw error
        }

        // Check if slug is unique (if being updated)
        if (input.slug) {
            const existing = await Organization.findOne({
                slug: input.slug,
                _id: { $ne: organizationId },
            })
            if (existing) {
                const error = new Error('Slug is already in use') as Error & { statusCode: number; code: string }
                error.statusCode = 409
                error.code = 'ALREADY_EXISTS'
                throw error
            }
        }

        const org = await Organization.findByIdAndUpdate(
            organizationId,
            { $set: input },
            { new: true }
        )

        if (!org) {
            const error = new Error('Organization not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        const memberCount = await OrganizationMember.countDocuments({ organizationId })

        return {
            id: org._id.toString(),
            name: org.name,
            slug: org.slug,
            logoUrl: org.logoUrl ?? null,
            website: org.website ?? null,
            plan: org.plan,
            memberCount,
            role: membership.role,
            createdAt: org.createdAt,
        }
    }

    /**
     * Get organization members
     */
    async getMembers(organizationId: string, userId: string): Promise<OrganizationMemberResponse[]> {
        // Verify user is a member of this organization
        const membership = await OrganizationMember.findOne({ userId, organizationId })

        if (!membership) {
            const error = new Error('Access denied') as Error & { statusCode: number; code: string }
            error.statusCode = 403
            error.code = 'FORBIDDEN'
            throw error
        }

        const members = await OrganizationMember.find({ organizationId })
            .populate('userId', 'email firstName lastName')
            .sort({ joinedAt: 'asc' })

        return members.map((m) => {
            const user = m.userId as unknown as { _id: string; email: string; firstName: string; lastName: string }
            return {
                id: user._id.toString(),
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: m.role as MemberRoleType,
                joinedAt: m.joinedAt,
            }
        })
    }

    /**
     * Get organization onboarding settings
     */
    async getOnboardingSettings(organizationId: string, userId: string): Promise<any> {
        // Verify user is a member of this organization
        const membership = await OrganizationMember.findOne({ userId, organizationId })

        if (!membership) {
            const error = new Error('Access denied') as Error & { statusCode: number; code: string }
            error.statusCode = 403
            error.code = 'FORBIDDEN'
            throw error
        }

        let settings = await OrganizationOnboardingSettings.findOne({ organizationId })
        if (!settings) {
            settings = await OrganizationOnboardingSettings.create({ organizationId })
        }
        return settings
    }

    /**
     * Update organization onboarding settings (OWNER or ADMIN only)
     */
    async updateOnboardingSettings(organizationId: string, userId: string, input: UpdateOnboardingSettingsInput): Promise<any> {
        // Verify user is an OWNER or ADMIN of this organization
        const membership = await OrganizationMember.findOne({ userId, organizationId })

        if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
            const error = new Error('Owner or Admin access required') as Error & { statusCode: number; code: string }
            error.statusCode = 403
            error.code = 'FORBIDDEN'
            throw error
        }

        const settings = await OrganizationOnboardingSettings.findOneAndUpdate(
            { organizationId },
            { $set: input },
            { new: true, upsert: true }
        )

        return settings
    }
}

export const organizationsService = new OrganizationsService()

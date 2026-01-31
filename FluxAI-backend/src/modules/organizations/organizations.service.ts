import prisma from '../../database/prisma.js'
import { UpdateOrganizationInput, OrganizationResponse, OrganizationMemberResponse } from './organizations.types.js'

export class OrganizationsService {
    /**
     * Get all organizations the user belongs to
     */
    async getAll(userId: string): Promise<OrganizationResponse[]> {
        const memberships = await prisma.organizationMember.findMany({
            where: { userId },
            include: {
                organization: {
                    include: {
                        _count: { select: { members: true } },
                    },
                },
            },
            orderBy: { joinedAt: 'asc' },
        })

        return memberships.map((m) => ({
            id: m.organization.id,
            name: m.organization.name,
            slug: m.organization.slug,
            logoUrl: m.organization.logoUrl,
            website: m.organization.website,
            plan: m.organization.plan,
            memberCount: m.organization._count.members,
            role: m.role,
            createdAt: m.organization.createdAt,
        }))
    }

    /**
     * Get organization by ID (with membership verification)
     */
    async getById(organizationId: string, userId: string): Promise<OrganizationResponse> {
        // Verify user is a member of this organization
        const membership = await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: { userId, organizationId },
            },
        })

        if (!membership) {
            const error = new Error('Access denied') as Error & { statusCode: number; code: string }
            error.statusCode = 403
            error.code = 'FORBIDDEN'
            throw error
        }

        const org = await prisma.organization.findUnique({
            where: { id: organizationId },
            include: {
                _count: { select: { members: true } },
            },
        })

        if (!org) {
            const error = new Error('Organization not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        return {
            id: org.id,
            name: org.name,
            slug: org.slug,
            logoUrl: org.logoUrl,
            website: org.website,
            plan: org.plan,
            memberCount: org._count.members,
            role: membership.role,
            createdAt: org.createdAt,
        }
    }

    /**
     * Update organization (OWNER or ADMIN only)
     */
    async update(organizationId: string, userId: string, input: UpdateOrganizationInput): Promise<OrganizationResponse> {
        // Verify user is an OWNER or ADMIN of this organization
        const membership = await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: { userId, organizationId },
            },
        })

        if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
            const error = new Error('Owner or Admin access required') as Error & { statusCode: number; code: string }
            error.statusCode = 403
            error.code = 'FORBIDDEN'
            throw error
        }

        // Check if slug is unique (if being updated)
        if (input.slug) {
            const existing = await prisma.organization.findFirst({
                where: { slug: input.slug, NOT: { id: organizationId } },
            })
            if (existing) {
                const error = new Error('Slug is already in use') as Error & { statusCode: number; code: string }
                error.statusCode = 409
                error.code = 'ALREADY_EXISTS'
                throw error
            }
        }

        const org = await prisma.organization.update({
            where: { id: organizationId },
            data: input,
            include: {
                _count: { select: { members: true } },
            },
        })

        return {
            id: org.id,
            name: org.name,
            slug: org.slug,
            logoUrl: org.logoUrl,
            website: org.website,
            plan: org.plan,
            memberCount: org._count.members,
            role: membership.role,
            createdAt: org.createdAt,
        }
    }

    /**
     * Get organization members
     */
    async getMembers(organizationId: string, userId: string): Promise<OrganizationMemberResponse[]> {
        // Verify user is a member of this organization
        const membership = await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: { userId, organizationId },
            },
        })

        if (!membership) {
            const error = new Error('Access denied') as Error & { statusCode: number; code: string }
            error.statusCode = 403
            error.code = 'FORBIDDEN'
            throw error
        }

        const members = await prisma.organizationMember.findMany({
            where: { organizationId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { joinedAt: 'asc' },
        })

        return members.map((m) => ({
            id: m.user.id,
            email: m.user.email,
            firstName: m.user.firstName,
            lastName: m.user.lastName,
            role: m.role,
            joinedAt: m.joinedAt,
        }))
    }
}

export const organizationsService = new OrganizationsService()


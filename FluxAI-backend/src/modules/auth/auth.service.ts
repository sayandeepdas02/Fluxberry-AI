import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../../database/prisma.js'
import { SignupInput, LoginInput, AuthResponse, AuthUser, AuthTokens, JwtPayload } from './auth.types.js'

const SALT_ROUNDS = 10
const JWT_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60 // 7 days

export class AuthService {
    /**
     * Register a new recruiter account
     * Creates: User + Organization + OrganizationMember (as ADMIN)
     */
    async signup(input: SignupInput): Promise<AuthResponse> {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: input.email },
        })

        if (existingUser) {
            const error = new Error('User with this email already exists') as Error & { statusCode: number; code: string }
            error.statusCode = 409
            error.code = 'ALREADY_EXISTS'
            throw error
        }

        // Hash password
        const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS)

        // Generate unique slug for organization
        const slug = await this.generateUniqueSlug(input.organizationName)

        // Create organization
        const organization = await prisma.organization.create({
            data: {
                name: input.organizationName,
                slug,
            },
        })

        // Create user
        const user = await prisma.user.create({
            data: {
                email: input.email,
                passwordHash,
                firstName: input.firstName,
                lastName: input.lastName,
                authProvider: 'email',
            },
        })

        // Create organization membership (first member is OWNER)
        const membership = await prisma.organizationMember.create({
            data: {
                userId: user.id,
                organizationId: organization.id,
                role: 'OWNER',
            },
        })

        // Generate tokens
        const tokens = this.generateTokens({
            id: user.id,
            email: user.email,
            organizationId: organization.id,
            role: membership.role,
        })

        return {
            user: this.formatUser(user, organization, membership.role),
            tokens,
        }
    }

    /**
     * Login with email and password
     */
    async login(input: LoginInput): Promise<AuthResponse> {
        const user = await prisma.user.findUnique({
            where: { email: input.email },
            include: {
                memberships: {
                    include: { organization: true },
                    take: 1, // Get first/primary org for now
                },
            },
        })

        if (!user || !user.passwordHash) {
            const error = new Error('Invalid email or password') as Error & { statusCode: number; code: string }
            error.statusCode = 401
            error.code = 'INVALID_CREDENTIALS'
            throw error
        }

        const validPassword = await bcrypt.compare(input.password, user.passwordHash)
        if (!validPassword) {
            const error = new Error('Invalid email or password') as Error & { statusCode: number; code: string }
            error.statusCode = 401
            error.code = 'INVALID_CREDENTIALS'
            throw error
        }

        const membership = user.memberships[0]
        const organization = membership?.organization ?? null
        const role = membership?.role ?? null

        const tokens = this.generateTokens({
            id: user.id,
            email: user.email,
            organizationId: organization?.id ?? null,
            role,
        })

        return {
            user: this.formatUser(user, organization, role),
            tokens,
        }
    }

    /**
     * Get current user from token payload
     */
    async getCurrentUser(userId: string): Promise<AuthUser> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                memberships: {
                    include: { organization: true },
                    take: 1,
                },
            },
        })

        if (!user) {
            const error = new Error('User not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        const membership = user.memberships[0]
        return this.formatUser(user, membership?.organization ?? null, membership?.role ?? null)
    }

    /**
     * Generate JWT tokens
     */
    private generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>): AuthTokens {
        const secret = process.env.JWT_SECRET
        if (!secret) {
            throw new Error('JWT_SECRET not configured')
        }

        const accessToken = jwt.sign(payload, secret, { expiresIn: JWT_EXPIRES_IN_SECONDS })

        return {
            accessToken,
            expiresIn: JWT_EXPIRES_IN_SECONDS,
        }
    }

    /**
     * Format user for response (exclude sensitive data)
     */
    private formatUser(
        user: { id: string; email: string; firstName: string; lastName: string },
        organization: { id: string; name: string; slug: string } | null,
        role: string | null
    ): AuthUser {
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            organization: organization
                ? {
                    id: organization.id,
                    name: organization.name,
                    slug: organization.slug,
                    role: role ?? 'RECRUITER',
                }
                : null,
        }
    }

    /**
     * Generate unique URL-friendly slug from name
     */
    private async generateUniqueSlug(name: string): Promise<string> {
        const baseSlug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 50)

        // Check if slug exists
        let slug = baseSlug
        let counter = 0
        while (await prisma.organization.findUnique({ where: { slug } })) {
            counter++
            slug = `${baseSlug}-${counter}`
        }

        return slug
    }
}

export const authService = new AuthService()

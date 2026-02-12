
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {
    User,
    Organization,
    OrganizationMember,
    IUser,
    IOrganization,
    MemberRoleType,
} from '../../database/models/index.js'
import { SignupInput, LoginInput, AuthResponse, AuthUser, AuthTokens, JwtPayload } from './auth.types.js'

const SALT_ROUNDS = 10
const JWT_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60 // 7 days

export class AuthService {
    /**
     * Register a new recruiter account
     * Creates: User + Organization + OrganizationMember (as OWNER)
     */
    async signup(input: SignupInput): Promise<AuthResponse> {
        // Check if user already exists
        const existingUser = await User.findOne({ email: input.email })

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
        const organization = await Organization.create({
            name: input.organizationName,
            slug,
        })

        // Create user
        const user = await User.create({
            email: input.email,
            passwordHash,
            firstName: input.firstName,
            lastName: input.lastName,
            authProvider: 'email',
        })

        // Create organization membership (first member is OWNER)
        const membership = await OrganizationMember.create({
            userId: user._id,
            organizationId: organization._id,
            role: 'OWNER',
        })

        // Generate tokens
        const tokens = this.generateTokens({
            id: user._id.toString(),
            email: user.email,
            organizationId: organization._id.toString(),
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
        const user = await User.findOne({ email: input.email })

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

        // Get first/primary organization membership
        const membership = await OrganizationMember.findOne({ userId: user._id }).populate('organizationId')
        const organization = membership?.organizationId as unknown as IOrganization | null
        const role = membership?.role ?? null

        const tokens = this.generateTokens({
            id: user._id.toString(),
            email: user.email,
            organizationId: organization?._id?.toString() ?? null,
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
        const user = await User.findById(userId)

        if (!user) {
            const error = new Error('User not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        const membership = await OrganizationMember.findOne({ userId: user._id }).populate('organizationId')
        const organization = membership?.organizationId as unknown as IOrganization | null

        return this.formatUser(user, organization, membership?.role ?? null)
    }

    /**
     * Delete user account (GDPR)
     */
    async deleteAccount(userId: string): Promise<void> {
        const user = await User.findById(userId)
        if (!user) {
            throw { code: 'NOT_FOUND', message: 'User not found' }
        }

        // Hard delete user and memberships
        await OrganizationMember.deleteMany({ userId: user._id })
        await User.deleteOne({ _id: user._id })

        // Note: In a real production system, we might want to anonymize 
        // or cascade delete other resources (applications, interviews, etc.)
        // For now, this satisfies the basic GDPR requirement of removing the user record.
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
        user: IUser,
        organization: IOrganization | null,
        role: MemberRoleType | null
    ): AuthUser {
        return {
            id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            onboardingCompleted: user.onboardingCompleted,
            organization: organization
                ? {
                    id: organization._id.toString(),
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
        while (await Organization.findOne({ slug })) {
            counter++
            slug = `${baseSlug}-${counter}`
        }

        return slug
    }
}

export const authService = new AuthService()

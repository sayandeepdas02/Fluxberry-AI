
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
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
const ACCESS_EXPIRES_IN = 15 * 60 // 15 minutes
const REFRESH_EXPIRES_IN = 7 * 24 * 60 * 60 // 7 days

const googleClient = new OAuth2Client()


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

    // Google OAuth Login / Signup
    async googleAuth({ credential }: { credential: string }): Promise<AuthResponse> {
        const clientId = process.env.GOOGLE_CLIENT_ID
        if (!clientId) throw new Error('GOOGLE_CLIENT_ID not configured')

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: clientId,
        })
        const payload = ticket.getPayload()
        if (!payload || !payload.email || !payload.email_verified) {
            const error = new Error('Invalid Google Token format or unverified email') as Error & { statusCode: number; code: string }
            error.statusCode = 401
            error.code = 'INVALID_CREDENTIALS'
            throw error
        }

        let user = await User.findOne({ email: payload.email })
        
        // If not exists, register the user implicitly with an auto-generated Org
        if (!user) {
            const organizationName = `${payload.given_name || 'User'}'s Organization`
            const slug = await this.generateUniqueSlug(organizationName)
            
            const organization = await Organization.create({
                name: organizationName,
                slug,
            })
            
            user = await User.create({
                email: payload.email,
                firstName: payload.given_name || 'User',
                lastName: payload.family_name || 'Unknown',
                authProvider: 'google',
                authProviderId: payload.sub,
            })
            
            await OrganizationMember.create({
                userId: user._id,
                organizationId: organization._id,
                role: 'OWNER',
            })
        } else if (!user.authProviderId && user.authProvider === 'email') {
            // Upgrade existing email user to google linked
            user.authProvider = 'google'
            user.authProviderId = payload.sub
            await user.save()
        }

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

    // Refresh Token Flow
    async refreshToken(token: string): Promise<AuthTokens> {
        const secret = process.env.JWT_SECRET
        if (!secret) throw new Error('JWT_SECRET not configured')

        try {
            const payload = jwt.verify(token, secret) as JwtPayload
            if (payload.type !== 'refresh') {
                throw new Error('Invalid token type')
            }

            const user = await User.findById(payload.id)
            if (!user) {
                const err = new Error('User not found') as Error & { statusCode: number; code: string }
                err.statusCode = 401; err.code = 'TOKEN_EXPIRED'; throw err
            }

            const membership = await OrganizationMember.findOne({ userId: user._id }).populate('organizationId')
            const organization = membership?.organizationId as unknown as IOrganization | null
            const role = membership?.role ?? null

            return this.generateTokens({
                id: user._id.toString(),
                email: user.email,
                organizationId: organization?._id?.toString() ?? null,
                role: role,
            })
        } catch (e: any) {
            const err = new Error(e.message || 'Invalid refresh token') as Error & { statusCode: number; code: string }
            err.statusCode = 401
            err.code = 'TOKEN_EXPIRED'
            throw err
        }
    }

    /**
     * Generate JWT tokens
     */
    private generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp' | 'type'>): AuthTokens {
        const secret = process.env.JWT_SECRET
        if (!secret) {
            throw new Error('JWT_SECRET not configured')
        }

        const accessToken = jwt.sign({ ...payload, type: 'access' }, secret, { expiresIn: ACCESS_EXPIRES_IN })
        const refreshToken = jwt.sign({ ...payload, type: 'refresh' }, secret, { expiresIn: REFRESH_EXPIRES_IN })

        return {
            accessToken,
            refreshToken,
            expiresIn: ACCESS_EXPIRES_IN,
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

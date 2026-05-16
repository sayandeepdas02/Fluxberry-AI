import { User, Organization, OrganizationMember } from '../../database/models/index.js'
import { CompleteOnboardingInput } from './onboarding.types.js'
import { Types } from 'mongoose'

export class OnboardingService {
    /**
     * Complete user onboarding and update organization details
     */
    async complete(
        userId: string,
        input: CompleteOnboardingInput
    ): Promise<{
        user: {
            id: string
            email: string
            firstName: string
            lastName: string
            onboardingCompleted: boolean
            organization: {
                id: string
                name: string
                slug: string
                role: string
            } | null
        }
    }> {
        // Get user
        const user = await User.findById(userId)
        if (!user) {
            const error = new Error('User not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'USER_NOT_FOUND'
            throw error
        }

        // Mark onboarding as complete
        user.onboardingCompleted = true
        await user.save()

        // Get user's organization membership
        const membership = await OrganizationMember.findOne({ userId: new Types.ObjectId(userId) })

        if (membership) {
            // Update organization name with workspace name
            const organization = await Organization.findById(membership.organizationId)
            if (organization) {
                if (input.workspaceName) {
                    organization.name = input.workspaceName
                    organization.slug = input.workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                }
                if (input.companyWebsite) {
                    organization.website = input.companyWebsite
                }
                await organization.save()

                return {
                    user: {
                        id: user._id.toString(),
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        onboardingCompleted: true,
                        organization: {
                            id: organization._id.toString(),
                            name: organization.name,
                            slug: organization.slug,
                            role: membership.role,
                        },
                    },
                }
            }
        }

        return {
            user: {
                id: user._id.toString(),
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                onboardingCompleted: true,
                organization: null,
            },
        }
    }
}

export const onboardingService = new OnboardingService()

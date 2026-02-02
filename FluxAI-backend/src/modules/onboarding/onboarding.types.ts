import { z } from 'zod'

export const completeOnboardingSchema = z.object({
    fullName: z.string().optional(),
    companyRole: z.string().optional(),
    companyWebsite: z.string().optional(),
    productSelection: z.enum(['ats', 'hire', 'both']).optional(),
    workspaceName: z.string().min(1, 'Workspace name is required'),
})

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>

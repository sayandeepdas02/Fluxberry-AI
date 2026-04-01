import { z } from 'zod'

// ──────────────────────────────────────────────────────────────
// Scoring Config Zod Schema (optional override during job create/update)
// ──────────────────────────────────────────────────────────────

const scoringConfigWeightsSchema = z.object({
    skills:      z.number().min(0).max(1),
    experience:  z.number().min(0).max(1),
    projects:    z.number().min(0).max(1),
    education:   z.number().min(0).max(1),
    signalBoost: z.number().min(0).max(1),
}).refine(
    (w) => Math.abs(w.skills + w.experience + w.projects + w.education + w.signalBoost - 1.0) < 0.01,
    { message: 'Weights must sum to 1.0' }
)

const scoringConfigThresholdsSchema = z.object({
    shortlist:  z.number().min(0).max(100),
    review:     z.number().min(0).max(100),
    autoReject: z.number().min(0).max(100),
})

const scoringConfigHardGatesSchema = z.object({
    requiredSkills:         z.array(z.string()).optional(),
    minimumExperienceYears: z.number().min(0).optional(),
    requiredEducationLevel: z.string().optional(),
})

const scoringConfigSchema = z.object({
    version:    z.enum(['v1', 'v2']).optional(),
    weights:    scoringConfigWeightsSchema.optional(),
    thresholds: scoringConfigThresholdsSchema.optional(),
    hardGates:  scoringConfigHardGatesSchema.optional(),
}).optional()

// ──────────────────────────────────────────────────────────────
// Job Schemas
// ──────────────────────────────────────────────────────────────

export const createJobSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    department: z.string().optional(),
    location: z.string().optional(),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'OTHER']).default('FULL_TIME'),
    status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED']).default('DRAFT'),
    requirements: z.array(z.string()).optional(),
    requiredSkills: z.array(z.string()).optional(),
    optionalSkills: z.array(z.string()).optional(),
    experienceRange: z.object({
        min: z.number().min(0),
        max: z.number().min(0),
    }).optional(),
    salaryRange: z.object({
        min: z.number().min(0),
        max: z.number().min(0),
        currency: z.string().default('USD')
    }).optional(),
    scoringConfig: scoringConfigSchema,
    applicationSchema: z.any().optional(),
})

export const updateJobSchema = createJobSchema.partial()

export const listJobsQuerySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
    status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED']).optional(),
    search: z.string().optional(),
})

export type CreateJobInput = z.infer<typeof createJobSchema>
export type UpdateJobInput = z.infer<typeof updateJobSchema>
export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>

// ──────────────────────────────────────────────────────────────
// AI Parsing Schema
// ──────────────────────────────────────────────────────────────

export const parseDescriptionSchema = z.object({
    description: z.string()
        .min(50, 'Job description must be at least 50 characters')
        .max(5000, 'Job description must not exceed 5000 characters'),
})

export type ParseDescriptionInput = z.infer<typeof parseDescriptionSchema>

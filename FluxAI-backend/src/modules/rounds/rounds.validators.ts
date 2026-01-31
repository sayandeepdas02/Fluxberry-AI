import { questionsService } from '../questions/questions.service.js'
import {
    MCQRoundConfig,
    DSARoundConfig,
    AIRoundConfig,
    RoundConfigInput,
} from '../assessments/assessments.types.js'

interface ValidationError {
    field: string
    message: string
}

interface ValidationResult {
    valid: boolean
    errors: ValidationError[]
}

/**
 * Validate MCQ round configuration
 * - Exactly 20 single-correct questions
 * - Exactly 10 multi-correct questions
 * - All question IDs must exist and be MCQ type
 */
export async function validateMCQConfig(config: MCQRoundConfig | null): Promise<ValidationResult> {
    const errors: ValidationError[] = []

    if (!config) {
        return { valid: false, errors: [{ field: 'MCQ.config', message: 'MCQ config is required when enabled' }] }
    }

    // Validate counts
    if (config.singleCorrectQuestionIds.length !== 20) {
        errors.push({
            field: 'MCQ.config.singleCorrectQuestionIds',
            message: `Requires exactly 20 single-correct questions, got ${config.singleCorrectQuestionIds.length}`,
        })
    }

    if (config.multiCorrectQuestionIds.length !== 10) {
        errors.push({
            field: 'MCQ.config.multiCorrectQuestionIds',
            message: `Requires exactly 10 multi-correct questions, got ${config.multiCorrectQuestionIds.length}`,
        })
    }

    // Validate questions exist and are correct type
    const allIds = [...config.singleCorrectQuestionIds, ...config.multiCorrectQuestionIds]
    const questions = await questionsService.getByIds(allIds)

    const foundIds = new Set(questions.map(q => q.id))
    const missingIds = allIds.filter(id => !foundIds.has(id))

    if (missingIds.length > 0) {
        errors.push({
            field: 'MCQ.config',
            message: `Questions not found: ${missingIds.join(', ')}`,
        })
    }

    // Check question types
    const nonMcqQuestions = questions.filter(q => q.type !== 'MCQ')
    if (nonMcqQuestions.length > 0) {
        errors.push({
            field: 'MCQ.config',
            message: `Non-MCQ questions included: ${nonMcqQuestions.map(q => q.id).join(', ')}`,
        })
    }

    // Validate single vs multi correct
    const mcqQuestions = questions.filter(q => q.type === 'MCQ')

    for (const qId of config.singleCorrectQuestionIds) {
        const q = mcqQuestions.find(mq => mq.id === qId)
        if (q?.mcqDetails?.isMultiCorrect) {
            errors.push({
                field: 'MCQ.config.singleCorrectQuestionIds',
                message: `Question ${qId} is multi-correct but placed in single-correct list`,
            })
        }
    }

    for (const qId of config.multiCorrectQuestionIds) {
        const q = mcqQuestions.find(mq => mq.id === qId)
        if (q?.mcqDetails && !q.mcqDetails.isMultiCorrect) {
            errors.push({
                field: 'MCQ.config.multiCorrectQuestionIds',
                message: `Question ${qId} is single-correct but placed in multi-correct list`,
            })
        }
    }

    return { valid: errors.length === 0, errors }
}

/**
 * Validate DSA round configuration
 * - Exactly 4 DSA questions
 * - All question IDs must exist and be DSA type
 */
export async function validateDSAConfig(config: DSARoundConfig | null): Promise<ValidationResult> {
    const errors: ValidationError[] = []

    if (!config) {
        return { valid: false, errors: [{ field: 'DSA.config', message: 'DSA config is required when enabled' }] }
    }

    if (config.questionIds.length !== 4) {
        errors.push({
            field: 'DSA.config.questionIds',
            message: `Requires exactly 4 DSA questions, got ${config.questionIds.length}`,
        })
    }

    const questions = await questionsService.getByIds(config.questionIds)

    const foundIds = new Set(questions.map(q => q.id))
    const missingIds = config.questionIds.filter(id => !foundIds.has(id))

    if (missingIds.length > 0) {
        errors.push({
            field: 'DSA.config',
            message: `Questions not found: ${missingIds.join(', ')}`,
        })
    }

    const nonDsaQuestions = questions.filter(q => q.type !== 'DSA')
    if (nonDsaQuestions.length > 0) {
        errors.push({
            field: 'DSA.config',
            message: `Non-DSA questions included: ${nonDsaQuestions.map(q => q.id).join(', ')}`,
        })
    }

    return { valid: errors.length === 0, errors }
}

/**
 * Validate AI round configuration
 * - Exactly 1 agent selected
 */
export async function validateAIConfig(config: AIRoundConfig | null): Promise<ValidationResult> {
    const errors: ValidationError[] = []

    if (!config) {
        return { valid: false, errors: [{ field: 'AI.config', message: 'AI config is required when enabled' }] }
    }

    if (!config.agentId || config.agentId.trim() === '') {
        errors.push({
            field: 'AI.config.agentId',
            message: 'AI round requires exactly 1 agent',
        })
    }

    // TODO: Validate agent exists in agent registry

    return { valid: errors.length === 0, errors }
}

/**
 * Validate all enabled rounds
 */
export async function validateRoundsForPublish(
    rounds: RoundConfigInput
): Promise<ValidationResult> {
    const errors: ValidationError[] = []

    // Check at least one round enabled
    const enabledRounds = ['MCQ', 'DSA', 'AI'].filter(
        rt => rounds[rt as keyof RoundConfigInput]?.enabled
    )

    if (enabledRounds.length === 0) {
        errors.push({
            field: 'rounds',
            message: 'At least one round must be enabled',
        })
        return { valid: false, errors }
    }

    // Validate each enabled round
    if (rounds.MCQ?.enabled) {
        const result = await validateMCQConfig(rounds.MCQ.config)
        errors.push(...result.errors)
    }

    if (rounds.DSA?.enabled) {
        const result = await validateDSAConfig(rounds.DSA.config)
        errors.push(...result.errors)
    }

    if (rounds.AI?.enabled) {
        const result = await validateAIConfig(rounds.AI.config)
        errors.push(...result.errors)
    }

    return { valid: errors.length === 0, errors }
}

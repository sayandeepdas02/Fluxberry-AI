import { Job } from 'bullmq'
import {
    AssessmentAttempt,
    Assessment,
    Question,
    Evaluation,
    IQuestion,
} from '../../database/models/index.js'
import { EvaluationJobData, EvaluateMCQJob, EvaluateDSAJob, EvaluateAIJob } from '../queues/index.js'

// ============================================
// EVALUATION PROCESSOR
// ============================================

export async function processEvaluationJob(job: Job<EvaluationJobData>): Promise<void> {
    console.log(`🔄 Processing ${job.data.type} job: ${job.id}`)

    switch (job.data.type) {
        case 'EVALUATE_MCQ':
            await processMCQEvaluation(job.data)
            break
        case 'EVALUATE_DSA':
            await processDSAEvaluation(job.data)
            break
        case 'EVALUATE_AI':
            await processAIEvaluation(job.data)
            break
        default:
            throw new Error(`Unknown evaluation job type`)
    }

    console.log(`✅ Completed ${job.data.type} job: ${job.id}`)
}

// ============================================
// MCQ EVALUATION
// ============================================

interface MCQQuestionResult {
    questionId: string
    correct: boolean
    selectedOptions: string[]
    correctOptions: number[]
}

interface MCQEvaluationMetadata {
    questionResults: MCQQuestionResult[]
    totalQuestions: number
    correctCount: number
    [key: string]: unknown
}

async function processMCQEvaluation(data: EvaluateMCQJob): Promise<void> {
    const { attemptId, answers } = data

    // Get attempt with assessment
    const attempt = await AssessmentAttempt.findById(attemptId)

    if (!attempt) {
        throw new Error(`Attempt not found: ${attemptId}`)
    }

    const assessment = await Assessment.findById(attempt.assessmentId)

    if (!assessment) {
        throw new Error(`Assessment not found for attempt: ${attemptId}`)
    }

    const mcqRound = assessment.rounds.find(r => r.roundType === 'MCQ' && r.enabled)
    if (!mcqRound) {
        throw new Error(`MCQ round not found for attempt: ${attemptId}`)
    }

    // Get questions from the question pool
    const allQuestionIds = Object.keys(answers)
    const questions = await Question.find({
        _id: { $in: allQuestionIds },
        type: 'MCQ',
    })

    // Build lookup map
    const questionMap = new Map<string, IQuestion>(
        questions.map((q) => [q._id.toString(), q])
    )

    // Grade each answer
    let correctCount = 0
    const questionResults: MCQQuestionResult[] = []

    for (const questionId of allQuestionIds) {
        const question = questionMap.get(questionId)
        if (!question || !question.mcqDetails) continue

        const selectedOptions = answers[questionId] || []
        const correctOptions = question.mcqDetails.correctOptions

        // Exact match - arrays must be identical
        const selectedArr = selectedOptions as unknown as number[]
        const isCorrect =
            selectedArr.length === correctOptions.length &&
            selectedArr.every((opt: number) => correctOptions.includes(opt))

        if (isCorrect) correctCount++

        questionResults.push({
            questionId,
            correct: isCorrect,
            selectedOptions: selectedOptions as string[],
            correctOptions,
        })
    }

    const maxScore = allQuestionIds.length
    const score = correctCount

    const metadata: MCQEvaluationMetadata = {
        questionResults,
        totalQuestions: maxScore,
        correctCount,
    }

    // Create immutable evaluation record (upsert to handle idempotency)
    const existingEval = await Evaluation.findOne({ attemptId, roundType: 'MCQ' })

    if (!existingEval) {
        await Evaluation.create({
            attemptId,
            roundType: 'MCQ',
            score,
            maxScore,
            metadata: metadata as Record<string, unknown>,
        })
    }
    // No updates - immutable
}

// ============================================
// DSA EVALUATION (Placeholder)
// ============================================

interface DSAEvaluationMetadata {
    code: string
    language: string
    status: 'PENDING' | 'GRADED'
    [key: string]: unknown
}

async function processDSAEvaluation(data: EvaluateDSAJob): Promise<void> {
    const { attemptId, submission } = data

    const metadata: DSAEvaluationMetadata = {
        code: submission.code,
        language: submission.language,
        status: 'PENDING',
    }

    const existingEval = await Evaluation.findOne({ attemptId, roundType: 'DSA' })

    if (!existingEval) {
        await Evaluation.create({
            attemptId,
            roundType: 'DSA',
            score: 0,
            maxScore: 100,
            metadata: metadata as Record<string, unknown>,
        })
    }
}

// ============================================
// AI EVALUATION (Placeholder)
// ============================================

interface AIEvaluationMetadata {
    transcriptRef?: string
    videoRef?: string
    summary: string
    status: 'PENDING' | 'GRADED'
    [key: string]: unknown
}

async function processAIEvaluation(data: EvaluateAIJob): Promise<void> {
    const { attemptId, refs } = data

    const metadata: AIEvaluationMetadata = {
        transcriptRef: refs.transcriptRef,
        videoRef: refs.videoRef,
        summary: 'Pending AI evaluation',
        status: 'PENDING',
    }

    const existingEval = await Evaluation.findOne({ attemptId, roundType: 'AI' })

    if (!existingEval) {
        await Evaluation.create({
            attemptId,
            roundType: 'AI',
            score: 0,
            maxScore: 100,
            metadata: metadata as Record<string, unknown>,
        })
    }
}

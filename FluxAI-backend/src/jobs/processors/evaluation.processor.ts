import { Job } from 'bullmq'
import prisma from '../../database/prisma.js'
import { Prisma } from '@prisma/client'
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
    correctOptions: string[]
}

interface MCQEvaluationMetadata {
    questionResults: MCQQuestionResult[]
    totalQuestions: number
    correctCount: number
}

async function processMCQEvaluation(data: EvaluateMCQJob): Promise<void> {
    const { attemptId, answers } = data

    // Get attempt with round info
    const attempt = await prisma.assessmentAttempt.findUnique({
        where: { id: attemptId },
        include: {
            assessment: {
                include: {
                    rounds: {
                        where: { roundType: 'MCQ', enabled: true },
                    },
                },
            },
        },
    })

    if (!attempt) {
        throw new Error(`Attempt not found: ${attemptId}`)
    }

    const mcqRound = attempt.assessment.rounds[0]
    if (!mcqRound) {
        throw new Error(`MCQ round not found for attempt: ${attemptId}`)
    }

    // Get questions from the question pool
    const allQuestionIds = Object.keys(answers)
    const questions = await prisma.question.findMany({
        where: { id: { in: allQuestionIds } },
    })

    // Build lookup map
    const questionMap = new Map(
        questions.map((q) => [q.id, q])
    )

    // Grade each answer
    let correctCount = 0
    const questionResults: MCQQuestionResult[] = []

    for (const questionId of allQuestionIds) {
        const question = questionMap.get(questionId)
        if (!question) continue

        const selectedOptions = answers[questionId] || []
        // correctOptions is stored in metadata JSON field
        const questionMetadata = question.metadata as { correctOptions?: string[] } | null
        const correctOptions = questionMetadata?.correctOptions || []

        // Exact match - arrays must be identical
        const isCorrect =
            selectedOptions.length === correctOptions.length &&
            selectedOptions.every((opt) => correctOptions.includes(opt))

        if (isCorrect) correctCount++

        questionResults.push({
            questionId,
            correct: isCorrect,
            selectedOptions,
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
    await prisma.evaluation.upsert({
        where: {
            attemptId_roundType: { attemptId, roundType: 'MCQ' },
        },
        create: {
            attemptId,
            roundType: 'MCQ',
            score,
            maxScore,
            metadata: metadata as unknown as Prisma.InputJsonValue,
        },
        update: {}, // No updates - immutable
    })
}

// ============================================
// DSA EVALUATION (Placeholder)
// ============================================

interface DSAEvaluationMetadata {
    code: string
    language: string
    status: 'PENDING' | 'GRADED'
}

async function processDSAEvaluation(data: EvaluateDSAJob): Promise<void> {
    const { attemptId, submission } = data

    const metadata: DSAEvaluationMetadata = {
        code: submission.code,
        language: submission.language,
        status: 'PENDING',
    }

    await prisma.evaluation.upsert({
        where: {
            attemptId_roundType: { attemptId, roundType: 'DSA' },
        },
        create: {
            attemptId,
            roundType: 'DSA',
            score: 0,
            maxScore: 100,
            metadata: metadata as unknown as Prisma.InputJsonValue,
        },
        update: {},
    })
}

// ============================================
// AI EVALUATION (Placeholder)
// ============================================

interface AIEvaluationMetadata {
    transcriptRef?: string
    videoRef?: string
    summary: string
    status: 'PENDING' | 'GRADED'
}

async function processAIEvaluation(data: EvaluateAIJob): Promise<void> {
    const { attemptId, refs } = data

    const metadata: AIEvaluationMetadata = {
        transcriptRef: refs.transcriptRef,
        videoRef: refs.videoRef,
        summary: 'Pending AI evaluation',
        status: 'PENDING',
    }

    await prisma.evaluation.upsert({
        where: {
            attemptId_roundType: { attemptId, roundType: 'AI' },
        },
        create: {
            attemptId,
            roundType: 'AI',
            score: 0,
            maxScore: 100,
            metadata: metadata as unknown as Prisma.InputJsonValue,
        },
        update: {},
    })
}

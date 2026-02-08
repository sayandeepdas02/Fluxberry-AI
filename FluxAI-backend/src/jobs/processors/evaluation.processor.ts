import { Job } from 'bullmq'
import {
    AssessmentAttempt,
    Assessment,
    Question,
    Evaluation,
    IQuestion,
    IDSADetails,
} from '../../database/models/index.js'
import { EvaluationJobData, EvaluateMCQJob, EvaluateDSAJob, EvaluateAIJob } from '../queues/index.js'
import { getJudge0LanguageId, runTestCase } from '../../services/judge0/judge0.client.js'

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
// DSA EVALUATION (Judge0)
// ============================================

const JUDGE0_BASE_URL = process.env.JUDGE0_BASE_URL || 'http://localhost:2358'
const JUDGE0_AUTH_TOKEN = process.env.JUDGE0_AUTH_TOKEN || undefined
const JUDGE0_RAPIDAPI_KEY = process.env.JUDGE0_RAPIDAPI_KEY || undefined
const JUDGE0_RAPIDAPI_HOST = process.env.JUDGE0_RAPIDAPI_HOST || undefined

interface DSATestCaseResult {
    stdin: string
    expectedStdout: string
    passed: boolean
    statusDescription?: string
}

interface DSAEvaluationMetadata {
    code: string
    language: string
    status: 'PENDING' | 'EVALUATED'
    testCasesRun?: number
    testCasesPassed?: number
    testResults?: DSATestCaseResult[]
    judge0Error?: string
    [key: string]: unknown
}

async function processDSAEvaluation(data: EvaluateDSAJob): Promise<void> {
    const { attemptId, submission } = data

    const attempt = await AssessmentAttempt.findById(attemptId)
    if (!attempt) {
        throw new Error(`Attempt not found: ${attemptId}`)
    }

    const assessment = await Assessment.findById(attempt.assessmentId)
    if (!assessment) {
        throw new Error(`Assessment not found for attempt: ${attemptId}`)
    }

    const dsaRound = assessment.rounds.find((r) => r.roundType === 'DSA' && r.enabled)
    if (!dsaRound?.config) {
        await updateDSAPlaceholder(attemptId, submission, 'PENDING', undefined)
        return
    }

    const questionIds = (dsaRound.config as { questionIds?: string[] }).questionIds as string[] | undefined
    if (!questionIds?.length) {
        await updateDSAPlaceholder(attemptId, submission, 'PENDING', undefined)
        return
    }

    const questions = await Question.find({ _id: { $in: questionIds } }).sort({ createdAt: 1 })
    const questionWithTests = questions.find(
        (q) => q.dsaDetails?.testCases && Array.isArray(q.dsaDetails.testCases) && q.dsaDetails.testCases.length > 0
    ) as (IQuestion & { dsaDetails: IDSADetails }) | undefined

    if (!questionWithTests?.dsaDetails?.testCases?.length) {
        await updateDSAPlaceholder(attemptId, submission, 'PENDING', undefined)
        return
    }

    const languageId = getJudge0LanguageId(submission.language)
    if (languageId == null) {
        await updateDSAPlaceholder(attemptId, submission, 'EVALUATED', {
            judge0Error: `Unsupported language: ${submission.language}`,
            testCasesRun: 0,
            testCasesPassed: 0,
            score: 0,
            maxScore: 100,
        })
        return
    }

    const testCases = questionWithTests.dsaDetails.testCases
    const testResults: DSATestCaseResult[] = []
    let passed = 0

    try {
        for (const tc of testCases) {
            const { passed: p, result } = await runTestCase(
                JUDGE0_BASE_URL,
                submission.code,
                languageId,
                tc.stdin ?? '',
                tc.expectedStdout ?? '',
                {
                    authToken: JUDGE0_AUTH_TOKEN,
                    rapidApiKey: JUDGE0_RAPIDAPI_KEY,
                    rapidApiHost: JUDGE0_RAPIDAPI_HOST,
                }
            )
            if (p) passed++
            testResults.push({
                stdin: tc.stdin ?? '',
                expectedStdout: tc.expectedStdout ?? '',
                passed: p,
                statusDescription: result.statusDescription,
            })
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`Judge0 DSA evaluation failed for attempt ${attemptId}:`, message)
        await updateDSAPlaceholder(attemptId, submission, 'EVALUATED', {
            judge0Error: message,
            testCasesRun: testResults.length,
            testCasesPassed: passed,
            testResults,
            score: 0,
            maxScore: testCases.length,
        })
        return
    }

    const maxScore = testCases.length
    const score = passed
    await updateDSAPlaceholder(attemptId, submission, 'EVALUATED', {
        testCasesRun: maxScore,
        testCasesPassed: score,
        testResults,
        score,
        maxScore,
    })
}

async function updateDSAPlaceholder(
    attemptId: string,
    submission: { code: string; language: string },
    status: 'PENDING' | 'EVALUATED',
    extra: {
        judge0Error?: string
        testCasesRun?: number
        testCasesPassed?: number
        testResults?: DSATestCaseResult[]
        score?: number
        maxScore?: number
    } | undefined
): Promise<void> {
    const metadata: DSAEvaluationMetadata = {
        code: submission.code,
        language: submission.language,
        status,
        ...extra,
    }

    const existingEval = await Evaluation.findOne({ attemptId, roundType: 'DSA' })
    if (existingEval) {
        await Evaluation.updateOne(
            { attemptId, roundType: 'DSA' },
            {
                $set: {
                    score: extra?.score ?? existingEval.score,
                    maxScore: extra?.maxScore ?? existingEval.maxScore,
                    metadata: metadata as Record<string, unknown>,
                    evaluatedAt: new Date(),
                },
            }
        )
    } else {
        await Evaluation.create({
            attemptId,
            roundType: 'DSA',
            score: extra?.score ?? 0,
            maxScore: extra?.maxScore ?? 100,
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

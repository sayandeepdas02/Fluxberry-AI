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

const JUDGE0_BASE_URL = process.env.JUDGE0_BASE_URL || 'https://ce.judge0.com'
const JUDGE0_AUTH_TOKEN = process.env.JUDGE0_AUTH_TOKEN || undefined
const JUDGE0_RAPIDAPI_KEY = process.env.JUDGE0_RAPIDAPI_KEY || undefined
const JUDGE0_RAPIDAPI_HOST = process.env.JUDGE0_RAPIDAPI_HOST || undefined
const JUDGE0_CPU_TIME_LIMIT = process.env.JUDGE0_CPU_TIME_LIMIT != null ? parseFloat(process.env.JUDGE0_CPU_TIME_LIMIT) : 2
const JUDGE0_MEMORY_LIMIT_KB = process.env.JUDGE0_MEMORY_LIMIT_KB != null ? parseInt(process.env.JUDGE0_MEMORY_LIMIT_KB, 10) : 128000

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
    const { attemptId, submission: jobSubmission } = data

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
        await updateDSAPlaceholder(attemptId, { code: '', language: 'python' }, 'PENDING', undefined)
        return
    }

    const questionIds = (dsaRound.config as { questionIds?: string[] }).questionIds as string[] | undefined
    if (!questionIds?.length) {
        await updateDSAPlaceholder(attemptId, { code: '', language: 'python' }, 'PENDING', undefined)
        return
    }

    const questions = await Question.find({ _id: { $in: questionIds } }).sort({ createdAt: 1 })

    // Legacy path: single submission from submitRound (e.g. one question round)
    if (jobSubmission?.code != null) {
        const questionWithTests = questions.find(
            (q) => q.dsaDetails?.testCases && Array.isArray(q.dsaDetails.testCases) && q.dsaDetails.testCases.length > 0
        ) as (IQuestion & { dsaDetails: IDSADetails }) | undefined
        if (!questionWithTests?.dsaDetails?.testCases?.length) {
            await updateDSAPlaceholder(attemptId, jobSubmission, 'PENDING', undefined)
            return
        }
        const languageId = getJudge0LanguageId(jobSubmission.language)
        if (languageId == null) {
            await updateDSAPlaceholder(attemptId, jobSubmission, 'EVALUATED', {
                judge0Error: `Unsupported language: ${jobSubmission.language}`,
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
                    jobSubmission.code,
                    languageId,
                    tc.stdin ?? '',
                    tc.expectedStdout ?? '',
                    {
                        authToken: JUDGE0_AUTH_TOKEN,
                        rapidApiKey: JUDGE0_RAPIDAPI_KEY,
                        rapidApiHost: JUDGE0_RAPIDAPI_HOST,
                        cpuTimeLimit: JUDGE0_CPU_TIME_LIMIT,
                        memoryLimitKb: JUDGE0_MEMORY_LIMIT_KB,
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
            await updateDSAPlaceholder(attemptId, jobSubmission, 'EVALUATED', {
                judge0Error: message,
                testCasesRun: testResults.length,
                testCasesPassed: passed,
                testResults,
                score: 0,
                maxScore: testCases.length,
            })
            return
        }
        await updateDSAPlaceholder(attemptId, jobSubmission, 'EVALUATED', {
            testCasesRun: testCases.length,
            testCasesPassed: passed,
            testResults,
            score: passed,
            maxScore: testCases.length,
        })
        return
    }

    // Main path: load saved answers from attempt (submitAnswer-per-question flow)
    const roundAttempt = attempt.rounds.find((r: { roundType: string }) => r.roundType === 'DSA')
    if (!roundAttempt?.answers || typeof roundAttempt.answers !== 'object') {
        await updateDSAPlaceholder(attemptId, { code: '', language: 'python' }, 'PENDING', undefined)
        return
    }

    const answers = roundAttempt.answers as Record<string, { code?: string; language?: string }>
    let totalScore = 0
    let totalMax = 0
    const questionResults: Array<{
        questionId: string
        testCasesRun: number
        testCasesPassed: number
        score: number
        maxScore: number
        judge0Error?: string
    }> = []

    for (const q of questions) {
        const qId = q._id.toString()
        const sub = answers[qId]
        if (!sub?.code) continue

        const testCases = q.dsaDetails?.testCases && Array.isArray(q.dsaDetails.testCases)
            ? (q as IQuestion & { dsaDetails: IDSADetails }).dsaDetails.testCases
            : []
        if (testCases.length === 0) continue

        const languageId = getJudge0LanguageId(sub.language ?? 'python')
        if (languageId == null) {
            questionResults.push({
                questionId: qId,
                testCasesRun: 0,
                testCasesPassed: 0,
                score: 0,
                maxScore: testCases.length,
                judge0Error: `Unsupported language: ${sub.language}`,
            })
            totalMax += testCases.length
            continue
        }

        let passed = 0
        try {
            for (const tc of testCases) {
                const { passed: p } = await runTestCase(
                    JUDGE0_BASE_URL,
                    sub.code,
                    languageId,
                    tc.stdin ?? '',
                    tc.expectedStdout ?? '',
                    {
                        authToken: JUDGE0_AUTH_TOKEN,
                        rapidApiKey: JUDGE0_RAPIDAPI_KEY,
                        rapidApiHost: JUDGE0_RAPIDAPI_HOST,
                        cpuTimeLimit: JUDGE0_CPU_TIME_LIMIT,
                        memoryLimitKb: JUDGE0_MEMORY_LIMIT_KB,
                    }
                )
                if (p) passed++
            }
            questionResults.push({
                questionId: qId,
                testCasesRun: testCases.length,
                testCasesPassed: passed,
                score: passed,
                maxScore: testCases.length,
            })
            totalScore += passed
            totalMax += testCases.length
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            console.error(`Judge0 DSA evaluation failed for attempt ${attemptId} question ${qId}:`, message)
            questionResults.push({
                questionId: qId,
                testCasesRun: testCases.length,
                testCasesPassed: 0,
                score: 0,
                maxScore: testCases.length,
                judge0Error: message,
            })
            totalMax += testCases.length
        }
    }

    const placeholderSubmission = { code: '', language: 'python' }
    await updateDSAPlaceholder(attemptId, placeholderSubmission, 'EVALUATED', {
        score: totalScore,
        maxScore: totalMax || 100,
        questionResults,
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
        questionResults?: Array<{
            questionId: string
            testCasesRun: number
            testCasesPassed: number
            score: number
            maxScore: number
            judge0Error?: string
        }>
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

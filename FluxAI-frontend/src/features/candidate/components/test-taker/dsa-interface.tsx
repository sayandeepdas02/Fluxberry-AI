"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import type { RoundQuestionDSA } from "@/lib/api/attempts"
import { attemptsApi } from "@/lib/api/attempts"
import { publicApi, type RunCodeResponse } from "@/lib/api/public"
import { Loader2, Play, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react"

const DEFAULT_LANGUAGE = "python"

interface DSAInterfaceProps {
    attemptId: string
    roundIndex: number
    questions: RoundQuestionDSA[]
    onRoundComplete: () => void
}

interface CodeSubmission {
    code: string
    language: string
}

/**
 * DSA Interface with per-question timer (V1)
 * - Shows ONE question at a time
 * - 30-minute countdown timer per question (derived from backend)
 * - NO back navigation
 * - Auto-advance on timeout or submit
 * - Timer resets for each question
 */
export function DSAInterface({
    attemptId,
    roundIndex,
    questions,
    onRoundComplete,
}: DSAInterfaceProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, CodeSubmission>>({})
    const [startedAt, setStartedAt] = useState<Date | null>(null)
    const [timeLimit, setTimeLimit] = useState(30 * 60) // 30 minutes in seconds
    const [timeLeft, setTimeLeft] = useState(30 * 60)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Code execution state
    const [runLoading, setRunLoading] = useState(false)
    const [runResult, setRunResult] = useState<RunCodeResponse | null>(null)
    const [runError, setRunError] = useState<string | null>(null)
    const [outputOpen, setOutputOpen] = useState(true)

    const hasStartedQuestion = useRef(false)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const autosaveRef = useRef<NodeJS.Timeout | null>(null)

    const problem = questions[currentQuestionIndex]

    // Current code/language for this question
    const currentCode = answers[problem?.id]?.code ??
        (problem?.starterCode ? (Object.values(problem.starterCode)[0] as string) ?? "" : "")
    const currentLanguage = answers[problem?.id]?.language ??
        (problem?.languagesSupported?.[0] ?? DEFAULT_LANGUAGE)

    // Start question timer on mount / question change
    useEffect(() => {
        if (!problem || hasStartedQuestion.current) return

        async function startQuestion() {
            hasStartedQuestion.current = true
            try {
                const res = await attemptsApi.startQuestion(attemptId, roundIndex, currentQuestionIndex)
                if (res.success && res.data) {
                    setStartedAt(new Date(res.data.startedAt))
                    setTimeLimit(res.data.perQuestionTimeLimit)
                    setTimeLeft(res.data.perQuestionTimeLimit)
                }
            } catch (err) {
                console.error('Failed to start question:', err)
                // Fallback: use default timer
                setStartedAt(new Date())
            }
        }
        startQuestion()
    }, [attemptId, roundIndex, currentQuestionIndex, problem])

    // Log tab switch events (proctoring)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                attemptsApi.logProctoringEvent(attemptId, { eventType: 'TAB_SWITCH' })
                    .catch(console.error)
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [attemptId])

    // Calculate remaining time from backend startedAt
    useEffect(() => {
        if (!startedAt || timeLimit <= 0) return

        timerRef.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000)
            const remaining = Math.max(0, timeLimit - elapsed)
            setTimeLeft(remaining)

            if (remaining <= 0) {
                // Time expired - auto-submit
                if (timerRef.current) clearInterval(timerRef.current)
                handleSubmit(true)
            }
        }, 1000)

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [startedAt, timeLimit])

    // Autosave every 30 seconds
    useEffect(() => {
        if (!problem) return

        autosaveRef.current = setInterval(() => {
            // Local autosave - code is already saved in state
            console.log('Autosaving code for question:', problem.id)
        }, 30000)

        return () => {
            if (autosaveRef.current) clearInterval(autosaveRef.current)
        }
    }, [problem])

    const handleSubmit = useCallback(async (isTimeout = false) => {
        if (isSubmitting) return
        setIsSubmitting(true)

        if (timerRef.current) clearInterval(timerRef.current)

        try {
            const answer = answers[problem?.id] ?? { code: currentCode, language: currentLanguage }
            const res = await attemptsApi.submitAnswer(
                attemptId,
                roundIndex,
                currentQuestionIndex,
                answer
            )

            if (res.success && res.data) {
                if (res.data.roundComplete) {
                    onRoundComplete()
                } else if (res.data.nextQuestionIndex !== null) {
                    // Move to next question
                    setCurrentQuestionIndex(res.data.nextQuestionIndex)
                    setStartedAt(null)
                    setRunResult(null)
                    setRunError(null)
                    hasStartedQuestion.current = false
                }
            } else {
                const errorCode = res.error?.code
                if (errorCode === 'TIME_EXPIRED') {
                    // Already expired - move to next
                    setCurrentQuestionIndex(prev => prev + 1)
                    setStartedAt(null)
                    setRunResult(null)
                    setRunError(null)
                    hasStartedQuestion.current = false
                } else {
                    setError(res.error?.message || 'Submit failed')
                }
            }
        } catch (err) {
            console.error('Submit error:', err)
            setError('Submit failed. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }, [attemptId, roundIndex, currentQuestionIndex, answers, problem, currentCode, currentLanguage, isSubmitting, onRoundComplete])

    const handleCodeChange = (newCode: string) => {
        if (!problem) return
        setAnswers(prev => ({
            ...prev,
            [problem.id]: {
                code: newCode,
                language: currentLanguage
            }
        }))
    }

    const handleRunCode = async () => {
        setRunError(null)
        setRunResult(null)
        setRunLoading(true)
        try {
            const res = await publicApi.runCode({
                code: currentCode,
                language: currentLanguage,
                stdin: ""
            })
            if (res.success && res.data) {
                setRunResult(res.data)
                setOutputOpen(true)
            } else {
                setRunError(res.error?.message ?? "Run failed")
            }
        } catch {
            setRunError("Run failed")
        } finally {
            setRunLoading(false)
        }
    }

    if (!problem) {
        return (
            <div className="p-8 text-center text-neutral-500">
                {questions.length === 0 ? "No problems in this round." : "Loading next problem..."}
            </div>
        )
    }

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    // Timer color based on time left
    const timerColor = timeLeft <= 60 ? 'text-red-600' : timeLeft <= 300 ? 'text-orange-500' : 'text-neutral-200'
    const timerBg = timeLeft <= 60 ? 'bg-red-900/30' : timeLeft <= 300 ? 'bg-orange-900/30' : 'bg-neutral-800'

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Left panel - Problem description */}
            <div className="w-2/5 flex flex-col border-r border-neutral-200 bg-white">
                <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                    <span className="text-sm text-neutral-500 font-medium">
                        Problem {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    {/* No navigation buttons - per V1 spec */}
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex items-center justify-between mb-4">
                        <Badge
                            variant="outline"
                            className={
                                problem.difficulty === "EASY"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : problem.difficulty === "MEDIUM"
                                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                        : "bg-red-50 text-red-700 border-red-200"
                            }
                        >
                            {problem.difficulty}
                        </Badge>
                        {answers[problem.id] && (
                            <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                <CheckCircle2 className="w-3 h-3" /> Saved
                            </div>
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-neutral-900 mb-4">{problem.title}</h2>
                    <div className="prose prose-sm prose-neutral max-w-none text-neutral-600 whitespace-pre-wrap">
                        {problem.prompt}
                    </div>
                    {problem.constraints && (
                        <div className="mt-4 p-3 bg-neutral-50 rounded-lg text-sm text-neutral-600">
                            <strong>Constraints:</strong>
                            <pre className="mt-1 whitespace-pre-wrap font-sans text-xs">{problem.constraints}</pre>
                        </div>
                    )}
                </div>

                {/* Error message */}
                {error && (
                    <div className="m-4 text-red-600 text-sm p-3 bg-red-50 rounded-lg">
                        {error}
                    </div>
                )}
            </div>

            {/* Right panel - Code editor */}
            <div className="w-3/5 flex flex-col bg-[#1e1e1e]">
                {/* Editor header with timer */}
                <div className="h-10 bg-[#252526] flex items-center justify-between px-4 border-b border-[#3e3e42]">
                    <div className="text-xs text-neutral-400 font-mono">{currentLanguage}</div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded ${timerBg}`}>
                        <div className={`w-2 h-2 rounded-full ${timeLeft <= 60 ? 'bg-red-500 animate-pulse' : 'bg-neutral-400'}`} />
                        <span className={`text-sm font-mono font-medium ${timerColor}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                </div>

                {/* Code editor */}
                <Textarea
                    className="flex-1 bg-transparent border-0 text-white font-mono text-sm resize-none focus-visible:ring-0 p-4 leading-relaxed"
                    value={currentCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    spellCheck={false}
                    disabled={isSubmitting}
                />

                {/* Action bar */}
                <div className="h-14 bg-[#252526] border-t border-[#3e3e42] flex items-center justify-between px-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-[#3e3e42] hover:text-white gap-2"
                        onClick={handleRunCode}
                        disabled={runLoading || isSubmitting}
                    >
                        {runLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Play className="w-4 h-4" />
                        )}
                        Run Code
                    </Button>

                    <Button
                        size="sm"
                        onClick={() => handleSubmit(false)}
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700 text-white border-0"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Solution'}
                    </Button>
                </div>

                {/* Output panel */}
                {(runResult != null || runError != null) && (
                    <div className="border-t border-[#3e3e42] bg-[#252526]">
                        <button
                            type="button"
                            className="w-full px-4 py-2 flex items-center justify-between text-left text-xs text-neutral-400 hover:text-white"
                            onClick={() => setOutputOpen((o) => !o)}
                        >
                            <span>Output</span>
                            {outputOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                        {outputOpen && (
                            <div className="px-4 pb-4 pt-0 font-mono text-sm max-h-40 overflow-auto">
                                {runError && (
                                    <pre className="text-red-400 whitespace-pre-wrap">{runError}</pre>
                                )}
                                {runResult && (
                                    <div className="space-y-2 text-neutral-300">
                                        {runResult.compileError && (
                                            <div>
                                                <span className="text-amber-400">Compile:</span>
                                                <pre className="whitespace-pre-wrap mt-0.5">{runResult.compileError}</pre>
                                            </div>
                                        )}
                                        {runResult.stdout && (
                                            <div>
                                                <span className="text-green-400">Stdout:</span>
                                                <pre className="whitespace-pre-wrap mt-0.5">{runResult.stdout || "(empty)"}</pre>
                                            </div>
                                        )}
                                        {runResult.stderr && (
                                            <div>
                                                <span className="text-amber-400">Stderr:</span>
                                                <pre className="whitespace-pre-wrap mt-0.5">{runResult.stderr}</pre>
                                            </div>
                                        )}
                                        <div className="text-neutral-500 text-xs">
                                            {runResult.statusDescription}
                                            {runResult.timeSeconds != null && ` · ${runResult.timeSeconds}s`}
                                            {runResult.memoryKb != null && ` · ${runResult.memoryKb} KB`}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

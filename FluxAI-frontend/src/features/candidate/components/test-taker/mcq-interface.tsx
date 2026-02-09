"use client"

import { Button } from "@/components/ui/button"
import { useState, useEffect, useCallback, useRef } from "react"
import type { RoundQuestionMCQ } from "@/lib/api/attempts"
import { attemptsApi } from "@/lib/api/attempts"

interface MCQInterfaceProps {
    attemptId: string
    roundIndex: number
    questions: RoundQuestionMCQ[]
    onRoundComplete: () => void
}

/**
 * MCQ Interface with per-question timer (V1)
 * - Shows ONE question at a time
 * - 20-second countdown timer (derived from backend)
 * - NO back navigation
 * - Auto-advance on timeout or submit
 */
export function MCQInterface({
    attemptId,
    roundIndex,
    questions,
    onRoundComplete,
}: MCQInterfaceProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [selectedOptions, setSelectedOptions] = useState<number[]>([])
    const [startedAt, setStartedAt] = useState<Date | null>(null)
    const [timeLimit, setTimeLimit] = useState(20) // seconds
    const [timeLeft, setTimeLeft] = useState(20)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const hasStartedQuestion = useRef(false)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const currentQuestion = questions[currentQuestionIndex]

    // Start question timer on mount / question change
    useEffect(() => {
        if (!currentQuestion || hasStartedQuestion.current) return

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
    }, [attemptId, roundIndex, currentQuestionIndex, currentQuestion])

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

    // Keep handleSubmit ref current for timer callback
    const handleSubmitRef = useRef<(isTimeout?: boolean) => void>(() => { })

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
                handleSubmitRef.current(true)
            }
        }, 100)

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [startedAt, timeLimit])

    const handleSubmit = useCallback(async (isTimeout = false) => {
        if (isSubmitting) return
        setIsSubmitting(true)

        if (timerRef.current) clearInterval(timerRef.current)

        try {
            const answer = selectedOptions
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
                    setSelectedOptions([])
                    setStartedAt(null)
                    hasStartedQuestion.current = false
                }
            } else {
                // Handle error
                const errorCode = res.error?.code
                if (errorCode === 'TIME_EXPIRED') {
                    // Already expired - move to next
                    setCurrentQuestionIndex(prev => prev + 1)
                    setSelectedOptions([])
                    setStartedAt(null)
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
    }, [attemptId, roundIndex, currentQuestionIndex, selectedOptions, isSubmitting, onRoundComplete])

    // Keep handleSubmitRef current so timer can call latest version
    useEffect(() => {
        handleSubmitRef.current = handleSubmit
    }, [handleSubmit])

    const toggleOption = (optionIndex: number) => {
        if (isSubmitting) return

        if (currentQuestion.isMultiCorrect) {
            setSelectedOptions(prev => {
                if (prev.includes(optionIndex)) {
                    return prev.filter(i => i !== optionIndex)
                } else {
                    return [...prev, optionIndex].sort((a, b) => a - b)
                }
            })
        } else {
            setSelectedOptions([optionIndex])
        }
    }

    if (questions.length === 0) {
        return (
            <div className="p-8 text-center text-neutral-500">
                No questions in this round.
            </div>
        )
    }

    if (!currentQuestion) {
        return (
            <div className="p-8 text-center text-neutral-500">
                Loading next question...
            </div>
        )
    }

    // Timer color based on time left
    const timerColor = timeLeft <= 5 ? 'text-red-600' : timeLeft <= 10 ? 'text-orange-500' : 'text-neutral-700'
    const timerBg = timeLeft <= 5 ? 'bg-red-50' : timeLeft <= 10 ? 'bg-orange-50' : 'bg-neutral-100'

    return (
        <div className="max-w-3xl mx-auto w-full p-8 flex flex-col h-full justify-between">
            <div className="space-y-6">
                {/* Header with progress and timer */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${timerBg}`}>
                        <div className={`w-2 h-2 rounded-full ${timeLeft <= 5 ? 'bg-red-500 animate-pulse' : 'bg-neutral-400'}`} />
                        <span className={`text-sm font-mono font-medium ${timerColor}`}>
                            {timeLeft}s
                        </span>
                    </div>
                </div>

                {/* Question type indicator */}
                <div className="text-xs text-neutral-400 uppercase tracking-wider">
                    {currentQuestion.isMultiCorrect ? "Multi Select" : "Single Select"}
                </div>

                {/* Question */}
                <h2 className="text-xl font-medium text-neutral-900 leading-relaxed">
                    {currentQuestion.title}
                </h2>

                {/* Options */}
                <div className="space-y-3">
                    {currentQuestion.options.map((opt, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => toggleOption(i)}
                            disabled={isSubmitting}
                            className={`w-full flex items-center gap-3 p-4 border rounded-lg text-left transition-colors group ${selectedOptions.includes(i)
                                ? "border-neutral-900 bg-neutral-100"
                                : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {currentQuestion.isMultiCorrect ? (
                                <div
                                    className={`w-4 h-4 rounded border flex items-center justify-center ${selectedOptions.includes(i) ? "border-neutral-900 bg-neutral-900" : "border-neutral-300"
                                        }`}
                                >
                                    {selectedOptions.includes(i) && (
                                        <span className="text-white text-[10px]">✓</span>
                                    )}
                                </div>
                            ) : (
                                <div
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedOptions.includes(i) ? "border-neutral-900 bg-neutral-900" : "border-neutral-300"
                                        }`}
                                >
                                    {selectedOptions.includes(i) && (
                                        <span className="w-2 h-2 rounded-full bg-white" />
                                    )}
                                </div>
                            )}
                            <span className="text-sm text-neutral-700">{opt}</span>
                        </button>
                    ))}
                </div>

                {/* Error message */}
                {error && (
                    <div className="text-red-600 text-sm p-3 bg-red-50 rounded-lg">
                        {error}
                    </div>
                )}
            </div>

            {/* Footer - Submit only, no back navigation */}
            <div className="flex items-center justify-end pt-8 border-t border-neutral-100 mt-auto">
                <Button
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting}
                    className="bg-neutral-900 hover:bg-neutral-800"
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                </Button>
            </div>
        </div>
    )
}

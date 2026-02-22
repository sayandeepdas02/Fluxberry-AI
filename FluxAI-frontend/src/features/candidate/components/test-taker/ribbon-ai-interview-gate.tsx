"use client"

/**
 * Ribbon AI Interview Gate
 *
 * Single screen: instructions + "Start AI voice interview". On click, calls backend
 * to create a Ribbon interview, then redirects the candidate to Ribbon's hosted page.
 */

import { useState } from "react"
import { attemptsApi } from "@/lib/api/attempts"
import { Video, Loader2, AlertCircle } from "lucide-react"

interface RibbonAIInterviewGateProps {
    attemptId: string
    assessmentId: string
    onComplete: () => void
}

export function RibbonAIInterviewGate({
    attemptId,
    assessmentId,
    onComplete,
}: RibbonAIInterviewGateProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleStart = async () => {
        setError(null)
        setLoading(true)
        try {
            const res = await attemptsApi.startRibbonAISession(attemptId)
            if (!res.success || !res.data?.interview_link) {
                setError(res.error?.message ?? "Failed to start interview")
                setLoading(false)
                return
            }
            window.location.href = res.data.interview_link
            return
        } catch {
            setError("Failed to start interview")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-lg space-y-8">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto">
                        <Video className="w-8 h-8 text-orange-500" />
                    </div>
                    <h1 className="text-2xl font-bold">AI Voice Interview</h1>
                    <p className="text-neutral-400 leading-relaxed">
                        You&apos;ll have a live voice conversation with our AI interviewer.
                        You can speak naturally and ask for clarification. The interview will
                        open in a new flow — when you&apos;re done, you&apos;ll be brought back here.
                    </p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-red-400 bg-red-500/10 rounded-lg p-4">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <button
                    onClick={handleStart}
                    disabled={loading}
                    className="w-full py-3 px-6 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:pointer-events-none text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Starting…
                        </>
                    ) : (
                        <>
                            <Video className="w-5 h-5" />
                            Start AI voice interview
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}

"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2, ArrowRight, Timer, Code, Video } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

const ROUND_INFO: Record<string, { title: string; icon: React.ComponentType<{ className?: string }>; defaultDuration: string }> = {
    MCQ: { title: "Technical MCQ", icon: Timer, defaultDuration: "~10 min" },
    DSA: { title: "Hands-on Coding", icon: Code, defaultDuration: "~2 hours" },
    AI: { title: "AI Video Interview", icon: Video, defaultDuration: "~20 min" },
}

interface RoundTransitionProps {
    assessmentId: string
    completedRoundIndex: number
    nextRoundIndex: number
    completedRoundType: string
    nextRoundType: string
    totalRounds: number
}

/**
 * Round Transition Screen (V1)
 * - Explicit transition screen between rounds
 * - No auto-jump to next round
 * - Shows completed round confirmation and next round preview
 */
export function RoundTransition({
    assessmentId,
    completedRoundIndex,
    nextRoundIndex,
    completedRoundType,
    nextRoundType,
    totalRounds,
}: RoundTransitionProps) {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const timer = setTimeout(() => setProgress(100), 100)
        return () => clearTimeout(timer)
    }, [])

    const completedInfo = ROUND_INFO[completedRoundType] || { title: completedRoundType, icon: Timer, defaultDuration: "" }
    const nextInfo = ROUND_INFO[nextRoundType] || { title: nextRoundType, icon: Timer, defaultDuration: "" }
    const NextIcon = nextInfo.icon

    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden relative">

                {/* Progress Bar Top */}
                <div className="h-1.5 w-full bg-neutral-100">
                    <div
                        className="h-full bg-green-500 transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="p-10 text-center space-y-8">

                    {/* Completed Round Confirmation */}
                    <div className="space-y-4">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto text-green-600 animate-in zoom-in-75 duration-300">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl text-neutral-900">
                            Round {completedRoundIndex + 1} Complete
                        </h1>
                        <p className="text-neutral-500 text-base">
                            {completedInfo.title} — Your responses have been securely saved.
                        </p>
                    </div>

                    {/* Progress indicator */}
                    <div className="flex items-center justify-center gap-2">
                        {Array.from({ length: totalRounds }).map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-2.5 h-2.5 rounded-full transition-colors ${idx <= completedRoundIndex ? 'bg-green-500' : 'bg-neutral-200' }`}
                            />
                        ))}
                    </div>

                    {/* Next Round Preview */}
                    <div className="bg-neutral-50 border border-neutral-100 rounded-lg p-6 space-y-4">
                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Up Next</p>
                        <div className="flex items-center justify-between">
                            <div className="text-left">
                                <h3 className="text-lg text-neutral-900">{nextInfo.title}</h3>
                                <p className="text-sm text-neutral-500">{nextInfo.defaultDuration}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600">
                                <NextIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="text-xs text-neutral-400 bg-white p-3 rounded border border-neutral-100 text-left">
                            <strong>Note:</strong> Once you start Round {nextRoundIndex + 1}, you cannot return to modify previous answers.
                        </div>
                    </div>

                    {/* Start Button */}
                    <Button size="lg" className="w-full h-12 text-base group" asChild>
                        <Link href={`/assessment/${assessmentId}/round/${nextRoundIndex}`}>
                            Start Round {nextRoundIndex + 1} <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}

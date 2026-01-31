"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

const rounds = [
    { id: "1", title: "Technical MCQ", duration: "45m" },
    { id: "2", title: "Hands-on Coding", duration: "60m" },
    { id: "3", title: "AI Video Interview", duration: "15m" }
]

export function RoundTransition({ assessmentId, nextRoundId }: { assessmentId: string, nextRoundId: string }) {
    const nextRoundIndex = rounds.findIndex(r => r.id === nextRoundId)
    const nextRound = rounds[nextRoundIndex]
    const prevRound = rounds[nextRoundIndex - 1]

    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const timer = setTimeout(() => setProgress(100), 100)
        return () => clearTimeout(timer)
    }, [])

    if (!nextRound) return <div>Invalid Round</div>

    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden relative">

                {/* Progress Bar Top */}
                <div className="h-1.5 w-full bg-neutral-100">
                    <div
                        className="h-full bg-green-500 transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="p-10 text-center space-y-8">

                    <div className="space-y-4">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto text-green-600 animate-in zoom-in-75 duration-300">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-neutral-900">
                            {prevRound ? `${prevRound.title} Completed` : 'Round Completed'}
                        </h1>
                        <p className="text-neutral-500 text-sm">
                            Your responses have been securely saved.
                        </p>
                    </div>

                    <div className="bg-neutral-50 border border-neutral-100 rounded-lg p-6 space-y-4">
                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Up Next</p>
                        <div className="flex items-center justify-between">
                            <div className="text-left">
                                <h3 className="font-bold text-lg text-neutral-900">{nextRound.title}</h3>
                                <p className="text-sm text-neutral-500">{nextRound.duration} Duration</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500">
                                <span className="font-mono font-bold">{nextRound.id}</span>
                            </div>
                        </div>
                        <div className="text-xs text-neutral-400 bg-white p-3 rounded border border-neutral-100 text-left">
                            <strong>Note:</strong> Once you start the next round, you cannot return to modify previous answers.
                        </div>
                    </div>

                    <Button size="lg" className="w-full h-12 text-base group" asChild>
                        <Link href={`/assessment/${assessmentId}/round/${nextRoundId}`}>
                            Start Round {nextRound.id} <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}

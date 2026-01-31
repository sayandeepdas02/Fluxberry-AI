"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Camera, Square } from "lucide-react"
import { useState, useEffect } from "react"

const aiQuestion = "Tell me about a time you had to debug a complex production issue. What was your approach and what was the outcome?"

export function AIInterviewInterface({ onComplete }: { onComplete: () => void }) {
    const [state, setState] = useState<'intro' | 'recording' | 'processing'>('intro')
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        if (state === 'recording') {
            const timer = setInterval(() => {
                setProgress(p => Math.min(p + 1, 100))
            }, 100)
            return () => clearInterval(timer)
        }
    }, [state])

    return (
        <div className="max-w-4xl mx-auto w-full p-8 flex flex-col h-full bg-neutral-50">

            {/* Question Card */}
            <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm mb-6 text-center space-y-2">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Question 2 of 5</span>
                <p className="text-lg font-medium text-neutral-900 max-w-2xl mx-auto">
                    {aiQuestion}
                </p>
            </div>

            {/* Video Area */}
            <div className="flex-1 bg-black rounded-2xl overflow-hidden relative shadow-lg group">
                {/* Mock Camera Feed */}
                <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center">
                    <div className="text-white/20 flex flex-col items-center gap-2">
                        <Camera className="w-12 h-12" />
                        <span className="text-sm">Camera Feed Mock</span>
                    </div>
                </div>

                {/* Overlay Controls */}
                <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center gap-6">

                    {state === 'intro' && (
                        <div className="flex items-center gap-4">
                            <Button size="lg" className="rounded-full px-8 bg-red-600 hover:bg-red-700 border-0" onClick={() => setState('recording')}>
                                <div className="w-3 h-3 rounded-full bg-white mr-2" /> Start Recording
                            </Button>
                        </div>
                    )}

                    {state === 'recording' && (
                        <div className="w-full max-w-md space-y-4">
                            <div className="flex items-center justify-between text-white text-sm font-medium px-1">
                                <span className="flex items-center gap-2 text-red-500">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Recording
                                </span>
                                <span className="font-mono">00:12 / 02:00</span>
                            </div>
                            <Progress value={progress} className="h-1 bg-white/20" indicatorClassName="bg-red-500" />
                            <div className="flex justify-center pt-2">
                                <Button size="lg" variant="secondary" className="rounded-full px-8" onClick={onComplete}>
                                    <Square className="w-4 h-4 mr-2 fill-current" /> Stop & Submit
                                </Button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}

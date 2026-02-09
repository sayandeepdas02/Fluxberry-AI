"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import type { RoundQuestionDSA } from "@/lib/api/attempts"
import { publicApi, type RunCodeResponse } from "@/lib/api/public"
import { Loader2, Play, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

const DEFAULT_LANGUAGE = "python"

interface CodeSubmission {
    code: string
    language: string
}

export function DSAInterface({
    questions,
    onComplete,
}: {
    questions: RoundQuestionDSA[]
    onComplete: (answers: Record<string, unknown>) => void
}) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, CodeSubmission>>({})

    // Initialize answers with starter code if not present
    const problem = questions[currentIndex]

    // Per-question state
    const currentCode = answers[problem?.id]?.code ??
        (problem?.starterCode ? (Object.values(problem.starterCode)[0] as string) ?? "" : "")

    const currentLanguage = answers[problem?.id]?.language ??
        (problem?.languagesSupported?.[0] ?? DEFAULT_LANGUAGE)

    const [runLoading, setRunLoading] = useState(false)
    const [runResult, setRunResult] = useState<RunCodeResponse | null>(null)
    const [runError, setRunError] = useState<string | null>(null)
    const [outputOpen, setOutputOpen] = useState(true)

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

    const handleSubmitAll = () => {
        onComplete(answers)
    }

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(i => i + 1)
            setRunResult(null)
            setRunError(null)
        }
    }

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(i => i - 1)
            setRunResult(null)
            setRunError(null)
        }
    }

    if (!problem) {
        return (
            <div className="p-8 text-center text-neutral-500">
                No problems in this round.
            </div>
        )
    }

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            <div className="w-2/5 flex flex-col border-r border-neutral-200 bg-white">
                <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                    <span className="text-sm src-neutral-500 font-medium">Problem {currentIndex + 1} of {questions.length}</span>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" disabled={currentIndex === 0} onClick={handlePrev}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" disabled={currentIndex === questions.length - 1} onClick={handleNext}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
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
            </div>

            <div className="w-3/5 flex flex-col bg-[#1e1e1e]">
                <div className="h-10 bg-[#252526] flex items-center justify-between px-4 border-b border-[#3e3e42]">
                    <div className="text-xs text-neutral-400 font-mono">{currentLanguage}</div>
                    <div className="flex items-center gap-2">
                        {/* Language selector could go here */}
                    </div>
                </div>
                <Textarea
                    className="flex-1 bg-transparent border-0 text-white font-mono text-sm resize-none focus-visible:ring-0 p-4 leading-relaxed"
                    value={currentCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    spellCheck={false}
                />
                <div className="h-14 bg-[#252526] border-t border-[#3e3e42] flex items-center justify-between px-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-[#3e3e42] hover:text-white gap-2"
                        onClick={handleRunCode}
                        disabled={runLoading}
                    >
                        {runLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Play className="w-4 h-4" />
                        )}
                        Run Code
                    </Button>

                    {currentIndex === questions.length - 1 ? (
                        <Button size="sm" onClick={handleSubmitAll} className="bg-green-600 hover:bg-green-700 text-white border-0">
                            Submit Assessment
                        </Button>
                    ) : (
                        <Button size="sm" onClick={handleNext} variant="secondary">
                            Next Problem <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                </div>

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

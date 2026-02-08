"use client"

import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { useState } from "react"
import type { RoundQuestionMCQ } from "@/lib/api/attempts"

export function MCQInterface({
    questions,
    onComplete,
}: {
    questions: RoundQuestionMCQ[]
    onComplete: (answers: Record<string, number[]>) => void
}) {
    const [currentQ, setCurrentQ] = useState(0)
    const [selected, setSelected] = useState<Record<string, number[]>>({})

    if (questions.length === 0) {
        return (
            <div className="p-8 text-center text-neutral-500">
                No questions in this round.
            </div>
        )
    }

    const q = questions[currentQ]
    const selectedForQ = selected[q.id] ?? []

    const toggleOption = (optionIndex: number) => {
        if (q.isMultiCorrect) {
            setSelected((prev) => {
                const arr = prev[q.id] ?? []
                const next = arr.includes(optionIndex)
                    ? arr.filter((i) => i !== optionIndex)
                    : [...arr, optionIndex].sort((a, b) => a - b)
                return { ...prev, [q.id]: next }
            })
        } else {
            setSelected((prev) => ({ ...prev, [q.id]: [optionIndex] }))
        }
    }

    const handleSubmit = () => {
        const answers: Record<string, number[]> = {}
        questions.forEach((question) => {
            const sel = selected[question.id]
            answers[question.id] = Array.isArray(sel) ? sel : []
        })
        onComplete(answers)
    }

    return (
        <div className="max-w-3xl mx-auto w-full p-8 flex flex-col h-full justify-between">
            <div className="space-y-8">
                <div className="flex items-center justify-between text-sm text-neutral-500">
                    <span>Question {currentQ + 1} of {questions.length}</span>
                    <span>{q.isMultiCorrect ? "Multi Select" : "Single Select"}</span>
                </div>

                <h2 className="text-xl font-medium text-neutral-900 leading-relaxed">
                    {q.title}
                </h2>

                <div className="space-y-3">
                    {q.options.map((opt, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => toggleOption(i)}
                            className={`w-full flex items-center gap-3 p-4 border rounded-lg text-left transition-colors group ${
                                selectedForQ.includes(i)
                                    ? "border-neutral-900 bg-neutral-100"
                                    : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                            }`}
                        >
                            {q.isMultiCorrect ? (
                                <div
                                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                                        selectedForQ.includes(i) ? "border-neutral-900 bg-neutral-900" : "border-neutral-300"
                                    }`}
                                >
                                    {selectedForQ.includes(i) && (
                                        <span className="text-white text-[10px]">✓</span>
                                    )}
                                </div>
                            ) : (
                                <div
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                        selectedForQ.includes(i) ? "border-neutral-900 bg-neutral-900" : "border-neutral-300"
                                    }`}
                                >
                                    {selectedForQ.includes(i) && (
                                        <span className="w-2 h-2 rounded-full bg-white" />
                                    )}
                                </div>
                            )}
                            <span className="text-sm text-neutral-700">{opt}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between pt-8 border-t border-neutral-100 mt-auto">
                <Button
                    variant="ghost"
                    disabled={currentQ === 0}
                    onClick={() => setCurrentQ((c) => c - 1)}
                >
                    Previous
                </Button>

                {currentQ < questions.length - 1 ? (
                    <Button onClick={() => setCurrentQ((c) => c + 1)}>
                        Next Question <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                ) : (
                    <Button onClick={handleSubmit} className="bg-neutral-900 hover:bg-neutral-800">
                        Submit Section
                    </Button>
                )}
            </div>
        </div>
    )
}

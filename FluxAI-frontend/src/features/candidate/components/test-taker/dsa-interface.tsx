"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import type { RoundQuestionDSA } from "@/lib/api/attempts"

const DEFAULT_LANGUAGE = "python"

export function DSAInterface({
    questions,
    onComplete,
}: {
    questions: RoundQuestionDSA[]
    onComplete: (answers: Record<string, unknown>) => void
}) {
    const problem = questions[0]
    const [code, setCode] = useState(
        problem?.starterCode
            ? (Object.values(problem.starterCode)[0] as string) ?? ""
            : ""
    )
    const [language] = useState(problem?.languagesSupported?.[0] ?? DEFAULT_LANGUAGE)

    const handleSubmit = () => {
        onComplete({ code, language })
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
            <div className="w-2/5 p-6 border-r border-neutral-200 overflow-y-auto bg-white">
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
                </div>
                <h2 className="text-xl font-bold text-neutral-900 mb-4">{problem.title}</h2>
                <div className="prose prose-sm prose-neutral max-w-none text-neutral-600 whitespace-pre-wrap">
                    {problem.prompt}
                </div>
                {problem.constraints && (
                    <div className="mt-4 p-3 bg-neutral-50 rounded-lg text-sm text-neutral-600">
                        <strong>Constraints:</strong>
                        <pre className="mt-1 whitespace-pre-wrap font-sans">{problem.constraints}</pre>
                    </div>
                )}
            </div>

            <div className="w-3/5 flex flex-col bg-[#1e1e1e]">
                <div className="h-10 bg-[#252526] flex items-center justify-between px-4 border-b border-[#3e3e42]">
                    <div className="text-xs text-neutral-400 font-mono">{language}</div>
                </div>
                <Textarea
                    className="flex-1 bg-transparent border-0 text-white font-mono text-sm resize-none focus-visible:ring-0 p-4 leading-relaxed"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    spellCheck={false}
                />
                <div className="h-14 bg-[#252526] border-t border-[#3e3e42] flex items-center justify-between px-4">
                    <Button variant="ghost" size="sm" className="text-white hover:bg-[#3e3e42] hover:text-white">
                        Run Code
                    </Button>
                    <Button size="sm" onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white border-0">
                        Submit Solution
                    </Button>
                </div>
            </div>
        </div>
    )
}

"use client"

import { useState } from "react"
import { LibraryBig, Code2 } from "lucide-react"
import { RoundOneQuestionBank } from "@/features/assessments/components/RoundOneQuestionBank"
import { RoundTwoQuestionBank } from "@/features/assessments/components/RoundTwoQuestionBank"

export default function QuestionBankPage() {
    const [activeRound, setActiveRound] = useState<1 | 2 | null>(null)

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900">
            <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Question Bank</h1>
                    <p className="text-sm text-neutral-500">
                        Manage your assessment question repository. Choose a round below to view or edit questions.
                    </p>
                </div>

                {!activeRound ? (
                    /* Initial "2 Boxes" Layout */
                    <div className="grid md:grid-cols-2 gap-6 mt-8">
                        {/* Box 1: Round 1 - MCQ / MSQ */}
                        <div
                            onClick={() => setActiveRound(1)}
                            className="group cursor-pointer bg-white border border-neutral-200 hover:border-orange-500/50 rounded-2xl p-8 shadow-sm transition-all hover:shadow-md"
                        >
                            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <LibraryBig className="w-6 h-6 text-orange-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Round 1</h2>
                            <h3 className="text-base font-medium text-neutral-700 mb-4">MCQ / MSQ Fundamentals</h3>
                            <p className="text-sm text-neutral-500 leading-relaxed">
                                Access the Multiple Choice and Multiple Select question pools. Includes segments for System Design, Machine Learning, Data Science, Backend Engineer, Frontend Engineer, and DevOps.
                            </p>
                        </div>

                        {/* Box 2: Round 2 - DSA */}
                        <div
                            onClick={() => setActiveRound(2)}
                            className="group cursor-pointer bg-white border border-neutral-200 hover:border-blue-500/50 rounded-2xl p-8 shadow-sm transition-all hover:shadow-md"
                        >
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Code2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Round 2</h2>
                            <h3 className="text-base font-medium text-neutral-700 mb-4">Data Structures & Algorithms</h3>
                            <p className="text-sm text-neutral-500 leading-relaxed">
                                Access live coding challenges. View problem statements, example test cases, and difficulty levels for Data Structures and algorithmic problem solving.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Active View with Back Button */
                    <div className="space-y-6">
                        <button
                            onClick={() => setActiveRound(null)}
                            className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-1 -ml-1"
                        >
                            ← Back to Rounds
                        </button>

                        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm min-h-[500px]">
                            {activeRound === 1 && <RoundOneQuestionBank />}
                            {activeRound === 2 && <RoundTwoQuestionBank />}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}


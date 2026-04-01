"use client"

import { useState } from "react"
import { LibraryBig, Code2, ArrowLeft } from "lucide-react"
import { RoundOneQuestionBank } from "@/features/assessments/components/RoundOneQuestionBank"
import { RoundTwoQuestionBank } from "@/features/assessments/components/RoundTwoQuestionBank"
import { Button } from "@/components/ui/button"

export default function QuestionBankPage() {
    const [activeRound, setActiveRound] = useState<1 | 2 | null>(null)

    return (
        <div className="flex flex-col h-full overflow-y-auto bg-muted/5 relative">
            <div className="max-w-6xl mx-auto w-full p-8 md:p-12">
                {/* Header */}
                <div className="mb-12 border-b border-line pb-8">
                    {activeRound ? (
                        <div className="flex items-center gap-4 mb-4">
                            <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => setActiveRound(null)}
                                className="w-8 h-8 rounded-none border-line"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                            <div>
                                <h1 className="text-3xl tracking-tight mb-2">
                                    {activeRound === 1 ? "Round 1: MCQ Fundamentals" : "Round 2: Data Structures & Algorithms"}
                                </h1>
                                <p className="text-muted-foreground whitespace-pre-line text-sm">
                                    Manage your assessment question repository.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h1 className="text-3xl tracking-tight mb-2">Question Bank</h1>
                            <p className="text-muted-foreground whitespace-pre-line text-sm max-w-xl">
                                Manage your assessment question repository. Choose a round below to view or edit granular questions.
                            </p>
                        </div>
                    )}
                </div>

                {!activeRound ? (
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Box 1: Round 1 - MCQ / MSQ */}
                        <div
                            onClick={() => setActiveRound(1)}
                            className="group cursor-pointer bg-card border border-line rounded-none p-8 transition-colors hover:border-primary/50 flex flex-col h-full"
                        >
                            <div className="w-12 h-12 rounded-none bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                <LibraryBig className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                            </div>
                            <h2 className="text-xl tracking-tight mb-2">Round 1: Foundation</h2>
                            <h3 className="text-sm font-semibold text-foreground mb-4">MCQ / MSQ Evaluation</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                                Access the Multiple Choice and Multiple Select question pools. Includes segments for System Design, Machine Learning, Data Science, Backend Engineer, Frontend Engineer, and DevOps.
                            </p>
                        </div>

                        {/* Box 2: Round 2 - DSA */}
                        <div
                            onClick={() => setActiveRound(2)}
                            className="group cursor-pointer bg-card border border-line rounded-none p-8 transition-colors hover:border-primary/50 flex flex-col h-full"
                        >
                            <div className="w-12 h-12 rounded-none bg-foreground flex items-center justify-center mb-6 group-hover:bg-primary transition-all">
                                <Code2 className="w-6 h-6 text-background" />
                            </div>
                            <h2 className="text-xl tracking-tight mb-2">Round 2: Technical</h2>
                            <h3 className="text-sm font-semibold text-foreground mb-4">Data Structures & Algorithms</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                                Access live coding challenges. View problem statements, example test cases, and difficulty levels for Data Structures and algorithmic problem solving.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-card border border-line rounded-none shadow-none min-h-[500px]">
                        {activeRound === 1 && <RoundOneQuestionBank />}
                        {activeRound === 2 && <RoundTwoQuestionBank />}
                    </div>
                )}
            </div>
        </div>
    )
}

"use client"

import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { useState } from "react"

// This would typically come from props or a store, but for now we mimic the implementation
const mcqQuestions = [
    {
        id: 1,
        text: "Which of the following is NOT a valid hook in React?",
        options: ["useState", "useEffect", "useData", "useCallback"],
        type: "single"
    },
    {
        id: 2,
        text: "What represents the Time Complexity of accessing an element in an Array by index?",
        options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
        type: "single"
    },
    {
        id: 3,
        text: "Select all valid CSS Flexbox properties for the parent container.",
        options: ["justify-content", "align-items", "flex-grow", "flex-wrap"],
        type: "multi"
    }
]

export function MCQInterface({ onComplete }: { onComplete: () => void }) {
    const [currentQ, setCurrentQ] = useState(0)

    return (
        <div className="max-w-3xl mx-auto w-full p-8 flex flex-col h-full justify-between">
            <div className="space-y-8">
                <div className="flex items-center justify-between text-sm text-neutral-500">
                    <span>Question {currentQ + 1} of {mcqQuestions.length}</span>
                    <span>Single Select</span>
                </div>

                <h2 className="text-xl font-medium text-neutral-900 leading-relaxed">
                    {mcqQuestions[currentQ].text}
                </h2>

                <div className="space-y-3">
                    {mcqQuestions[currentQ].options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 cursor-pointer transition-colors group">
                            {mcqQuestions[currentQ].type === 'single' ? (
                                <div className="w-4 h-4 rounded-full border border-neutral-300 group-hover:border-neutral-400" />
                            ) : (
                                <div className="w-4 h-4 rounded border border-neutral-300 group-hover:border-neutral-400" />
                            )}
                            <span className="text-sm text-neutral-700">{opt}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between pt-8 border-t border-neutral-100 mt-auto">
                <Button
                    variant="ghost"
                    disabled={currentQ === 0}
                    onClick={() => setCurrentQ(c => c - 1)}
                >
                    Previous
                </Button>

                {currentQ < mcqQuestions.length - 1 ? (
                    <Button onClick={() => setCurrentQ(c => c + 1)}>
                        Next Question <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                ) : (
                    <Button onClick={onComplete} className="bg-neutral-900 hover:bg-neutral-800">
                        Submit Section
                    </Button>
                )}
            </div>
        </div>
    )
}

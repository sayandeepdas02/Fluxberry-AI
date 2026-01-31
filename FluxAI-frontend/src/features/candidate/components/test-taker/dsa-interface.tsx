"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

const dsaProblem = {
    title: "Merge Two Sorted Lists",
    difficulty: "Medium",
    description: "You are given the heads of two sorted linked lists `list1` and `list2`. Merge the two lists into one <strong>sorted</strong> list. The list should be made by splicing together the nodes of the first two lists. Return the head of the merged linked list.",
    starterCode: `class Solution:
    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        # Write your solution here
        pass`
}

export function DSAInterface({ onComplete }: { onComplete: () => void }) {
    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Left: Problem */}
            <div className="w-2/5 p-6 border-r border-neutral-200 overflow-y-auto bg-white">
                <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline" className={
                        dsaProblem.difficulty === "Easy" ? "bg-green-50 text-green-700 border-green-200" :
                            dsaProblem.difficulty === "Medium" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                "bg-red-50 text-red-700 border-red-200"
                    }>
                        {dsaProblem.difficulty}
                    </Badge>
                </div>
                <h2 className="text-xl font-bold text-neutral-900 mb-4">{dsaProblem.title}</h2>
                <div
                    className="prose prose-sm prose-neutral max-w-none text-neutral-600"
                    dangerouslySetInnerHTML={{ __html: dsaProblem.description }}
                />
            </div>

            {/* Right: Code Editor */}
            <div className="w-3/5 flex flex-col bg-[#1e1e1e]">
                <div className="h-10 bg-[#252526] flex items-center justify-between px-4 border-b border-[#3e3e42]">
                    <div className="text-xs text-neutral-400 font-mono">Python 3.10</div>
                </div>
                <Textarea
                    className="flex-1 bg-transparent border-0 text-white font-mono text-sm resize-none focus-visible:ring-0 p-4 leading-relaxed"
                    defaultValue={dsaProblem.starterCode}
                    spellCheck={false}
                />
                <div className="h-14 bg-[#252526] border-t border-[#3e3e42] flex items-center justify-between px-4">
                    <Button variant="ghost" size="sm" className="text-white hover:bg-[#3e3e42] hover:text-white">
                        Run Code
                    </Button>
                    <Button size="sm" onClick={onComplete} className="bg-green-600 hover:bg-green-700 text-white border-0">
                        Submit Solution
                    </Button>
                </div>
            </div>
        </div>
    )
}

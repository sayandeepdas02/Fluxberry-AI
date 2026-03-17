"use client"

import { useState } from "react"
import { Plus, Search, Pencil, Trash2, LibraryBig, Loader2, CheckCircle2, FileCode2 } from "lucide-react"
import { useQuestionBank } from "@/features/assessments/hooks/useQuestionBank"
import type { Question } from "@/lib/api/questions"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const DIFFICULTY_BADGE: Record<string, string> = {
    EASY: "bg-emerald-100 text-emerald-700 border-emerald-200",
    MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
    HARD: "bg-red-100 text-red-700 border-red-200",
}

export function RoundTwoQuestionBank() {
    const [search, setSearch] = useState("")

    const { questions, isLoading, error, deleteQuestion } = useQuestionBank({
        type: "DSA",
        search: search || undefined,
    })

    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null)

    async function handleDelete(id: string) {
        setIsDeletingId(id)
        try {
            await deleteQuestion(id)
            setDeleteConfirmId(null)
        } finally {
            setIsDeletingId(null)
        }
    }

    // Modal logic for DSA will require a separate DSA form modal if implemented,
    // otherwise we just show a placeholder or alert.
    function openCreate() {
        alert("DSA Custom Question Creation coming soon!")
    }

    function openEdit(q: Question) {
        if (!q.organizationId) return
        alert("DSA Question Editing coming soon!")
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-neutral-900">Data Structures & Algorithms</h2>
                    <p className="text-sm text-neutral-500">Live coding challenges for Round 2 technical assessment</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex shrink-0 items-center gap-2 px-4 py-2 bg-neutral-900 flex text-white hover:bg-neutral-800 text-sm font-medium rounded-xl transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    New Coding Challenge
                </button>
            </div>

            <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-4 py-2.5 shadow-sm max-w-md">
                <Search className="w-4 h-4 text-neutral-400 shrink-0" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search DSA problems..."
                    className="flex-1 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                />
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-red-500">{error}</div>
                ) : questions.length === 0 ? (
                    <div className="text-center py-16 space-y-3">
                        <FileCode2 className="w-10 h-10 text-neutral-300 mx-auto" />
                        <p className="text-neutral-500 text-sm">No DSA problems found.</p>
                        <button
                            onClick={openCreate}
                            className="text-neutral-900 text-sm hover:underline font-medium transition-colors"
                        >
                            Create your first problem →
                        </button>
                    </div>
                ) : (
                    <Accordion type="single" collapsible className="w-full">
                        {questions.map((q) => {
                            const isOwned = !!q.organizationId;
                            const isConfirmingDelete = deleteConfirmId === q.id;
                            const isDeleting = isDeletingId === q.id;

                            // Using unknown type assertion for dsaDetails structure, typically contains problemStatement, constraints, etc.
                            const details = q.dsaDetails as any || {};

                            return (
                                <AccordionItem key={q.id} value={q.id} className="border-neutral-100 last:border-0 px-4">
                                    <AccordionTrigger className="hover:no-underline py-4 group">
                                        <div className="flex items-center justify-between w-full pr-4 text-left">
                                            <div className="flex flex-col gap-1.5 min-w-0 pr-4">
                                                <p className="text-sm font-medium text-neutral-900 group-hover:text-blue-600 transition-colors line-clamp-1">{q.title}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border ${DIFFICULTY_BADGE[q.difficulty]}`}>
                                                        {q.difficulty}
                                                    </span>
                                                    {isOwned ? (
                                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3" /> Custom
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                                            Global Source
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="pt-2 pb-4 pl-1 space-y-4">
                                            <div className="space-y-2 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                                                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Problem Statement</p>
                                                <div className="text-sm text-neutral-700 whitespace-pre-wrap">
                                                    {details.problemStatement || "No problem statement provided."}
                                                </div>

                                                {details.testCases && details.testCases.length > 0 && (
                                                    <div className="mt-4">
                                                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Example Cases</p>
                                                        <div className="grid gap-2">
                                                            {details.testCases.slice(0, 2).map((tc: any, i: number) => (
                                                                <div key={i} className="bg-neutral-800 text-neutral-200 font-mono text-xs p-3 rounded-md">
                                                                    <div><span className="text-orange-400">Input:</span> {tc.input}</div>
                                                                    <div><span className="text-emerald-400">Output:</span> {tc.expectedOutput}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {details.solution && (
                                                    <div className="mt-4">
                                                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Reference Solution</p>
                                                        <pre className="bg-neutral-800 text-neutral-200 font-mono text-xs p-3 rounded-md overflow-x-auto">
                                                            <code>{details.solution}</code>
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>

                                            {isOwned && (
                                                <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                                                    {!isConfirmingDelete ? (
                                                        <>
                                                            <button
                                                                onClick={() => openEdit(q)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" /> Edit
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteConfirmId(q.id)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" /> Delete
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-red-600 font-medium">Are you sure?</span>
                                                            <button
                                                                onClick={() => handleDelete(q.id)}
                                                                disabled={isDeleting}
                                                                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                                            >
                                                                {isDeleting ? "Deleting..." : "Yes, Delete"}
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteConfirmId(null)}
                                                                className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })}
                    </Accordion>
                )}
            </div>
        </div>
    )
}

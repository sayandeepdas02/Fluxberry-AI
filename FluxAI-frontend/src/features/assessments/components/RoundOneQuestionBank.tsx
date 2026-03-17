"use client"

import { useState } from "react"
import { Plus, Search, Pencil, Trash2, LibraryBig, Loader2, CheckCircle2 } from "lucide-react"
import { useQuestionBank } from "@/features/assessments/hooks/useQuestionBank"
import { QuestionFormModal } from "@/features/assessments/components/QuestionFormModal"
import type { Question, CreateQuestionInput, UpdateQuestionInput } from "@/lib/api/questions"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"

const SEGMENTS = [
    { id: "System Design", label: "System Design" },
    { id: "Machine Learning", label: "Machine Learning" },
    { id: "Data Science", label: "Data Science" },
    { id: "Backend Engineer", label: "Backend Engineer" },
    { id: "Frontend Engineer", label: "Frontend Engineer" },
    { id: "DevOps", label: "DevOps" },
]

const DIFFICULTY_BADGE: Record<string, string> = {
    EASY: "bg-emerald-100 text-emerald-700 border-emerald-200",
    MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
    HARD: "bg-red-100 text-red-700 border-red-200",
}

export function RoundOneQuestionBank() {
    const [search, setSearch] = useState("")
    const [activeSegment, setActiveSegment] = useState(SEGMENTS[0].id)

    const { questions, isLoading, error, createQuestion, updateQuestion, deleteQuestion } = useQuestionBank({
        type: "MCQ",
        search: search || undefined,
        topic: activeSegment
    })

    const [modalOpen, setModalOpen] = useState(false)
    const [editingQuestion, setEditingQuestion] = useState<Question | undefined>(undefined)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null)

    async function handleSave(data: CreateQuestionInput | UpdateQuestionInput) {
        if (editingQuestion) {
            await updateQuestion(editingQuestion.id, data as UpdateQuestionInput)
        } else {
            // Force the topic to include the active segment when creating a new question in this view
            const newData = { ...data } as CreateQuestionInput
            if (!newData.topics.includes(activeSegment)) {
                newData.topics = [...newData.topics, activeSegment]
            }
            await createQuestion(newData)
        }
    }

    async function handleDelete(id: string) {
        setIsDeletingId(id)
        try {
            await deleteQuestion(id)
            setDeleteConfirmId(null)
        } finally {
            setIsDeletingId(null)
        }
    }

    function openCreate() {
        setEditingQuestion(undefined)
        setModalOpen(true)
    }

    function openEdit(q: Question) {
        if (!q.organizationId) return // Cannot edit global questions
        setEditingQuestion(q)
        setModalOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex bg-neutral-100 p-1 rounded-xl overflow-x-auto hide-scrollbar">
                    {SEGMENTS.map((segment) => (
                        <button
                            key={segment.id}
                            onClick={() => setActiveSegment(segment.id)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${activeSegment === segment.id
                                ? "bg-white text-neutral-900 shadow-sm"
                                : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50"
                                }`}
                        >
                            {segment.label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={openCreate}
                    className="flex shrink-0 items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    New Question
                </button>
            </div>

            <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-4 py-2.5 shadow-sm max-w-md">
                <Search className="w-4 h-4 text-neutral-400 shrink-0" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search questions in this segment..."
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
                        <LibraryBig className="w-10 h-10 text-neutral-300 mx-auto" />
                        <p className="text-neutral-500 text-sm">No questions found for {activeSegment}.</p>
                        <button
                            onClick={openCreate}
                            className="text-orange-600 text-sm hover:text-orange-700 font-medium transition-colors"
                        >
                            Create your first question →
                        </button>
                    </div>
                ) : (
                    <Accordion type="single" collapsible className="w-full">
                        {questions.map((q) => {
                            const isOwned = !!q.organizationId;
                            const isMulti = q.mcqDetails?.isMultiCorrect;
                            const isConfirmingDelete = deleteConfirmId === q.id;
                            const isDeleting = isDeletingId === q.id;

                            return (
                                <AccordionItem key={q.id} value={q.id} className="border-neutral-100 last:border-0 px-4">
                                    <AccordionTrigger className="hover:no-underline py-4 group">
                                        <div className="flex items-center justify-between w-full pr-4 text-left">
                                            <div className="flex flex-col gap-1.5 min-w-0 pr-4">
                                                <p className="text-sm font-medium text-neutral-900 group-hover:text-orange-600 transition-colors line-clamp-1">{q.title}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border ${DIFFICULTY_BADGE[q.difficulty]}`}>
                                                        {q.difficulty}
                                                    </span>
                                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                                                        {isMulti ? "Multi-Select" : "Single-Select"}
                                                    </span>
                                                    {isOwned ? (
                                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3" /> Custom
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                                            Global
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="pt-2 pb-4 pl-1 space-y-4">
                                            <div className="space-y-2">
                                                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Options</p>
                                                <div className="grid gap-2">
                                                    {q.mcqDetails?.options.map((opt, i) => {
                                                        const isCorrect = q.mcqDetails?.correctOptions.includes(i);
                                                        return (
                                                            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium' : 'bg-neutral-50 border-neutral-200 text-neutral-700'}`}>
                                                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${isCorrect ? 'bg-emerald-200 text-emerald-800' : 'bg-neutral-200 text-neutral-600'}`}>
                                                                    {String.fromCharCode(65 + i)}
                                                                </span>
                                                                <span>{opt}</span>
                                                                {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-auto" />}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
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

            <QuestionFormModal
                open={modalOpen}
                question={editingQuestion}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
            />
        </div>
    )
}

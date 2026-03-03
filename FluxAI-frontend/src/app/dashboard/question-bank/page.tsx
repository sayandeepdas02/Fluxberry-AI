"use client"

import { useState } from "react"
import { Plus, Search, Filter, Pencil, Trash2, CheckCircle2, AlertCircle, LibraryBig, Loader2 } from "lucide-react"
import { useQuestionBank } from "@/features/assessments/hooks/useQuestionBank"
import { QuestionFormModal } from "@/features/assessments/components/QuestionFormModal"
import type { Question, CreateQuestionInput, UpdateQuestionInput } from "@/lib/api/questions"

const DIFFICULTY_BADGE: Record<string, string> = {
    EASY: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    MEDIUM: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    HARD: 'bg-red-500/15 text-red-400 border border-red-500/30',
}

const TYPE_BADGE: Record<string, string> = {
    Single: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    Multi: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
}

export default function QuestionBankPage() {
    const [search, setSearch] = useState('')
    const [filterDifficulty, setFilterDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD' | ''>('')
    const [filterType, setFilterType] = useState<'single' | 'multi' | ''>('')

    const { questions, total, isLoading, error, createQuestion, updateQuestion, deleteQuestion } = useQuestionBank({
        type: 'MCQ',
        search: search || undefined,
        difficulty: filterDifficulty || undefined,
    })

    const [modalOpen, setModalOpen] = useState(false)
    const [editingQuestion, setEditingQuestion] = useState<Question | undefined>(undefined)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
    const [saveError, setSaveError] = useState<string | null>(null)

    // Client-side type filter (since it's from mcqDetails.isMultiCorrect)
    const displayed = questions.filter(q => {
        if (filterType === 'single') return !q.mcqDetails?.isMultiCorrect
        if (filterType === 'multi') return q.mcqDetails?.isMultiCorrect
        return true
    })

    const ownedCount = questions.filter(q => q.organizationId !== null).length

    async function handleSave(data: CreateQuestionInput | UpdateQuestionInput) {
        setSaveError(null)
        try {
            if (editingQuestion) {
                await updateQuestion(editingQuestion.id, data as UpdateQuestionInput)
            } else {
                await createQuestion(data as CreateQuestionInput)
            }
        } catch (e: any) {
            setSaveError(e.message ?? 'Failed to save question')
            throw e
        }
    }

    async function handleDelete(id: string) {
        setIsDeletingId(id)
        try {
            await deleteQuestion(id)
            setDeleteConfirmId(null)
        } catch {
            // ignore
        } finally {
            setIsDeletingId(null)
        }
    }

    function openCreate() {
        setEditingQuestion(undefined)
        setModalOpen(true)
        setSaveError(null)
    }

    function openEdit(q: Question) {
        if (!q.organizationId) return // can't edit global seeded questions
        setEditingQuestion(q)
        setModalOpen(true)
        setSaveError(null)
    }

    return (
        <div className="min-h-screen bg-[#0c0c0e] text-white">
            <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

                {/* Page header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
                            <LibraryBig className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-white">Question Bank</h1>
                            <p className="text-sm text-neutral-500">
                                {total} total · <span className="text-orange-400">{ownedCount} created by your org</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-orange-900/20"
                    >
                        <Plus className="w-4 h-4" />
                        New Question
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5">
                        <Search className="w-4 h-4 text-neutral-600 shrink-0" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search questions…"
                            className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-600 focus:outline-none"
                        />
                    </div>

                    {/* Difficulty filter */}
                    <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1">
                        {(['', 'EASY', 'MEDIUM', 'HARD'] as const).map(d => (
                            <button
                                key={d}
                                onClick={() => setFilterDifficulty(d)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterDifficulty === d
                                    ? 'bg-neutral-700 text-white'
                                    : 'text-neutral-500 hover:text-neutral-300'
                                    }`}
                            >
                                {d === '' ? 'All' : d.charAt(0) + d.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>

                    {/* Type filter */}
                    <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1">
                        {(['', 'single', 'multi'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setFilterType(t)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterType === t
                                    ? 'bg-neutral-700 text-white'
                                    : 'text-neutral-500 hover:text-neutral-300'
                                    }`}
                            >
                                {t === '' ? 'All Types' : t === 'single' ? 'Single' : 'Multi'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error */}
                {(error || saveError) && (
                    <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <p className="text-sm">{error ?? saveError}</p>
                    </div>
                )}

                {/* Table */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-neutral-800 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        <span>Question</span>
                        <span className="w-20 text-center">Type</span>
                        <span className="w-20 text-center">Difficulty</span>
                        <span className="w-24 text-center">Source</span>
                        <span className="w-20 text-center">Actions</span>
                    </div>

                    {/* Loading */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                        </div>
                    )}

                    {/* Empty */}
                    {!isLoading && displayed.length === 0 && (
                        <div className="text-center py-16 space-y-3">
                            <LibraryBig className="w-10 h-10 text-neutral-700 mx-auto" />
                            <p className="text-neutral-500 text-sm">No questions found.</p>
                            <button
                                onClick={openCreate}
                                className="text-orange-400 text-sm hover:text-orange-300 transition-colors"
                            >
                                Create your first question →
                            </button>
                        </div>
                    )}

                    {/* Rows */}
                    {!isLoading && displayed.map((q, i) => {
                        const isOwned = !!q.organizationId
                        const typeLabel = q.mcqDetails?.isMultiCorrect ? 'Multi' : 'Single'
                        const isConfirmingDelete = deleteConfirmId === q.id
                        const isDeleting = isDeletingId === q.id

                        return (
                            <div
                                key={q.id}
                                className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-4 transition-colors hover:bg-neutral-800/40 ${i < displayed.length - 1 ? 'border-b border-neutral-800' : ''
                                    }`}
                            >
                                {/* Question text + topics */}
                                <div className="min-w-0">
                                    <p className="text-sm text-white font-medium leading-snug line-clamp-2">{q.title}</p>
                                    {q.topics.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                            {q.topics.slice(0, 3).map(t => (
                                                <span key={t} className="text-xs px-2 py-0.5 bg-neutral-800 border border-neutral-700 text-neutral-500 rounded-full">{t}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Type */}
                                <span className={`w-20 text-center text-xs px-2 py-1 rounded-full font-medium ${TYPE_BADGE[typeLabel]}`}>
                                    {typeLabel}
                                </span>

                                {/* Difficulty */}
                                <span className={`w-20 text-center text-xs px-2 py-1 rounded-full font-medium ${DIFFICULTY_BADGE[q.difficulty]}`}>
                                    {q.difficulty.charAt(0) + q.difficulty.slice(1).toLowerCase()}
                                </span>

                                {/* Source */}
                                <span className="w-24 text-center">
                                    {isOwned
                                        ? <span className="text-xs text-emerald-400 flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" /> Yours</span>
                                        : <span className="text-xs text-neutral-600">Global</span>
                                    }
                                </span>

                                {/* Actions */}
                                <div className="w-20 flex items-center justify-center gap-1">
                                    {isOwned && !isConfirmingDelete && (
                                        <>
                                            <button
                                                onClick={() => openEdit(q)}
                                                className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-700 transition-all"
                                                title="Edit"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirmId(q.id)}
                                                className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </>
                                    )}
                                    {isOwned && isConfirmingDelete && (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleDelete(q.id)}
                                                disabled={isDeleting}
                                                className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {isDeleting ? '…' : 'Yes'}
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirmId(null)}
                                                className="text-xs px-2 py-1 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
                                            >
                                                No
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {displayed.length > 0 && (
                    <p className="text-xs text-neutral-600 text-center">
                        Showing {displayed.length} of {total} questions · Global questions are read-only
                    </p>
                )}
            </div>

            {/* Create/Edit Modal */}
            <QuestionFormModal
                open={modalOpen}
                question={editingQuestion}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
            />
        </div>
    )
}

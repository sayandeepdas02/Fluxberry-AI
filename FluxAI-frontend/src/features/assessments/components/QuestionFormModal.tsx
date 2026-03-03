"use client"

import { useState, useEffect } from "react"
import { X, Plus, Trash2, CheckCircle2, Circle } from "lucide-react"
import type { Question, CreateQuestionInput, UpdateQuestionInput } from "@/lib/api/questions"

interface QuestionFormModalProps {
    open: boolean
    /** Pass a question to open in edit mode; undefined = create mode */
    question?: Question
    onClose: () => void
    onSave: (data: CreateQuestionInput | UpdateQuestionInput) => Promise<void>
}

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const
const DIFFICULTY_LABELS: Record<string, string> = { EASY: 'Easy', MEDIUM: 'Medium', HARD: 'Hard' }
const DIFFICULTY_COLORS: Record<string, string> = {
    EASY: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    MEDIUM: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    HARD: 'bg-red-500/15 text-red-400 border-red-500/30',
}

export function QuestionFormModal({ open, question, onClose, onSave }: QuestionFormModalProps) {
    const isEdit = !!question

    // Form state
    const [title, setTitle] = useState('')
    const [isMultiCorrect, setIsMultiCorrect] = useState(false)
    const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM')
    const [topicsInput, setTopicsInput] = useState('')
    const [options, setOptions] = useState<string[]>(['', '', '', ''])
    const [correctOptions, setCorrectOptions] = useState<number[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Populate form when editing
    useEffect(() => {
        if (question) {
            setTitle(question.title)
            setIsMultiCorrect(question.mcqDetails?.isMultiCorrect ?? false)
            setDifficulty(question.difficulty)
            setTopicsInput(question.topics.join(', '))
            setOptions(question.mcqDetails?.options.length ? [...question.mcqDetails.options] : ['', '', '', ''])
            setCorrectOptions(question.mcqDetails?.correctOptions ?? [])
        } else {
            setTitle('')
            setIsMultiCorrect(false)
            setDifficulty('MEDIUM')
            setTopicsInput('')
            setOptions(['', '', '', ''])
            setCorrectOptions([])
        }
        setErrors({})
    }, [question, open])

    // Switch from multi to single → keep only first correct option
    function handleTypeToggle(multi: boolean) {
        setIsMultiCorrect(multi)
        if (!multi && correctOptions.length > 1) {
            setCorrectOptions([correctOptions[0]])
        }
    }

    function handleOptionChange(index: number, value: string) {
        setOptions(prev => prev.map((o, i) => i === index ? value : o))
    }

    function addOption() {
        if (options.length >= 6) return
        setOptions(prev => [...prev, ''])
    }

    function removeOption(index: number) {
        if (options.length <= 2) return
        setOptions(prev => prev.filter((_, i) => i !== index))
        setCorrectOptions(prev => {
            const updated = prev.filter(i => i !== index).map(i => i > index ? i - 1 : i)
            return updated
        })
    }

    function toggleCorrect(index: number) {
        if (isMultiCorrect) {
            setCorrectOptions(prev =>
                prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
            )
        } else {
            setCorrectOptions([index])
        }
    }

    function validate(): boolean {
        const errs: Record<string, string> = {}
        if (!title.trim()) errs.title = 'Question text is required'
        const filledOptions = options.filter(o => o.trim())
        if (filledOptions.length < 2) errs.options = 'At least 2 options are required'
        if (correctOptions.length === 0) errs.correct = 'Mark at least one correct answer'

        // Validate correctOptions point to filled options
        const invalidCorrect = correctOptions.some(i => !options[i]?.trim())
        if (invalidCorrect) errs.correct = 'Correct answer must point to a non-empty option'

        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!validate()) return
        setIsSaving(true)
        try {
            const filledOptions = options.map(o => o.trim()).filter(Boolean)
            // Re-index correctOptions after filtering
            const correctReindexed: number[] = []
            options.forEach((o, i) => {
                if (o.trim() && correctOptions.includes(i)) {
                    correctReindexed.push(filledOptions.indexOf(o.trim()))
                }
            })
            const topics = topicsInput.split(',').map(t => t.trim()).filter(Boolean)

            const payload: CreateQuestionInput = {
                type: 'MCQ',
                title: title.trim(),
                difficulty,
                topics,
                mcqDetails: {
                    options: filledOptions,
                    correctOptions: correctReindexed,
                    isMultiCorrect,
                },
            }
            await onSave(payload)
            onClose()
        } finally {
            setIsSaving(false)
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
                    <div>
                        <h2 className="text-lg font-semibold text-white">{isEdit ? 'Edit Question' : 'New MCQ Question'}</h2>
                        <p className="text-xs text-neutral-500 mt-0.5">Single-select or multi-select question for Round 1</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">

                        {/* Question Text */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-300">Question Text</label>
                            <textarea
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="What is the time complexity of binary search?"
                                rows={3}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 resize-none focus:outline-none focus:border-orange-500 transition-colors"
                            />
                            {errors.title && <p className="text-xs text-red-400">{errors.title}</p>}
                        </div>

                        {/* Type + Difficulty row */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Answer Type */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">Answer Type</label>
                                <div className="flex gap-2">
                                    {[false, true].map(multi => (
                                        <button
                                            key={String(multi)}
                                            type="button"
                                            onClick={() => handleTypeToggle(multi)}
                                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${isMultiCorrect === multi
                                                    ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                                                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-500'
                                                }`}
                                        >
                                            {multi ? 'Multi-Select' : 'Single-Select'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Difficulty */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">Difficulty</label>
                                <div className="flex gap-2">
                                    {DIFFICULTIES.map(d => (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => setDifficulty(d)}
                                            className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium border transition-all ${difficulty === d
                                                    ? DIFFICULTY_COLORS[d]
                                                    : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:border-neutral-500'
                                                }`}
                                        >
                                            {DIFFICULTY_LABELS[d]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Topics */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-300">
                                Topics <span className="text-neutral-600 font-normal">(comma-separated)</span>
                            </label>
                            <input
                                type="text"
                                value={topicsInput}
                                onChange={e => setTopicsInput(e.target.value)}
                                placeholder="e.g. Algorithms, Data Structures, DBMS"
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-orange-500 transition-colors"
                            />
                            {topicsInput && (
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {topicsInput.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                                        <span key={t} className="text-xs px-2 py-0.5 bg-neutral-800 border border-neutral-700 text-neutral-400 rounded-full">{t}</span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-neutral-300">
                                    Options <span className="text-neutral-600 font-normal text-xs ml-1">— click the circle/checkbox to mark correct</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={addOption}
                                    disabled={options.length >= 6}
                                    className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Plus className="w-3 h-3" /> Add Option
                                </button>
                            </div>

                            <div className="space-y-2">
                                {options.map((opt, i) => {
                                    const isCorrect = correctOptions.includes(i)
                                    return (
                                        <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isCorrect ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-neutral-700 bg-neutral-800'
                                            }`}>
                                            {/* Correct toggle */}
                                            <button
                                                type="button"
                                                onClick={() => toggleCorrect(i)}
                                                className={`shrink-0 transition-colors ${isCorrect ? 'text-emerald-400' : 'text-neutral-600 hover:text-neutral-400'}`}
                                                title={isMultiCorrect ? 'Toggle correct' : 'Set as correct answer'}
                                            >
                                                {isMultiCorrect
                                                    ? (isCorrect
                                                        ? <CheckCircle2 className="w-5 h-5" />
                                                        : <span className="w-5 h-5 border-2 border-current rounded inline-block" />)
                                                    : (isCorrect
                                                        ? <CheckCircle2 className="w-5 h-5" />
                                                        : <Circle className="w-5 h-5" />)
                                                }
                                            </button>

                                            {/* Option label */}
                                            <span className="text-xs font-mono text-neutral-500 shrink-0 w-5">
                                                {String.fromCharCode(65 + i)}
                                            </span>

                                            {/* Text input */}
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={e => handleOptionChange(i, e.target.value)}
                                                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                                className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-600 focus:outline-none"
                                            />

                                            {/* Remove button */}
                                            <button
                                                type="button"
                                                onClick={() => removeOption(i)}
                                                disabled={options.length <= 2}
                                                className="shrink-0 text-neutral-600 hover:text-red-400 disabled:opacity-0 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>

                            {errors.options && <p className="text-xs text-red-400">{errors.options}</p>}
                            {errors.correct && <p className="text-xs text-red-400">{errors.correct}</p>}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-800 bg-neutral-900">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
                        >
                            {isSaving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Question'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

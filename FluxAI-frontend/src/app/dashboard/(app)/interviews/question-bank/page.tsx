"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useApiMutation } from "@/lib/hooks/use-api-mutation"
import { apiClient } from "@/lib/api/client"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/dashboard/empty-state"
import {
    HelpCircle, Plus, Loader2, Search, Code, CheckSquare, Trash2, Pencil,
    X, AlertCircle, ChevronDown, BookOpen,
} from "lucide-react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { toast } from "sonner"

// ──────────────────────────────────────────────────────────────
// Types (matching backend QuestionResponse exactly)
// ──────────────────────────────────────────────────────────────

interface MCQDetails {
    options: string[]
    correctOptions: number[]
    isMultiCorrect: boolean
}

interface DSATestCase {
    stdin: string
    expectedStdout: string
}

interface DSADetails {
    prompt: string
    constraints: string | null
    starterCode: Record<string, string>
    languagesSupported: string[]
    testCases?: DSATestCase[]
}

interface QuestionResponse {
    id: string
    organizationId: string | null
    type: 'MCQ' | 'DSA'
    title: string
    difficulty: 'EASY' | 'MEDIUM' | 'HARD'
    topics: string[]
    mcqDetails: MCQDetails | null
    dsaDetails: DSADetails | null
    createdAt: string
}

interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: { code: string; message: string }
}

// ──────────────────────────────────────────────────────────────
// API helpers (local to this page — uses apiClient directly)
// ──────────────────────────────────────────────────────────────

const questionsApi = {
    list: (query?: Record<string, string | undefined>): Promise<ApiResponse<{ data: QuestionResponse[]; total: number }>> =>
        apiClient.get('/questions', query),
    create: (data: unknown): Promise<ApiResponse<QuestionResponse>> =>
        apiClient.post('/questions', data),
    update: (id: string, data: unknown): Promise<ApiResponse<QuestionResponse>> =>
        apiClient.patch(`/questions/${id}`, data),
    delete: (id: string): Promise<ApiResponse<{ deleted: boolean }>> =>
        apiClient.delete(`/questions/${id}`),
}

// ──────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────

const DIFF_STYLES: Record<string, string> = {
    EASY: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    HARD: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const DSA_LANGUAGES = ['javascript', 'python', 'java', 'cpp', 'go', 'rust', 'typescript'] as const

// ──────────────────────────────────────────────────────────────
// Debounce hook
// ──────────────────────────────────────────────────────────────

function useDebounce(value: string, delay: number) {
    const [v, setV] = useState(value)
    useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t) }, [value, delay])
    return v
}

// ──────────────────────────────────────────────────────────────
// MCQ Form State
// ──────────────────────────────────────────────────────────────

interface MCQFormState {
    options: string[]
    correctOptions: number[]
}

function defaultMCQForm(): MCQFormState {
    return { options: ['', '', '', ''], correctOptions: [0] }
}

// ──────────────────────────────────────────────────────────────
// DSA Form State
// ──────────────────────────────────────────────────────────────

interface DSAFormState {
    prompt: string
    constraints: string
    languagesSupported: string[]
    starterCode: Record<string, string>
    testCases: DSATestCase[]
}

function defaultDSAForm(): DSAFormState {
    return {
        prompt: '',
        constraints: '',
        languagesSupported: ['javascript', 'python'],
        starterCode: { javascript: '// Your solution here\n', python: '# Your solution here\n' },
        testCases: [{ stdin: '', expectedStdout: '' }],
    }
}

// ──────────────────────────────────────────────────────────────
// Question Form Modal
// ──────────────────────────────────────────────────────────────

interface QuestionFormModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    editingQuestion: QuestionResponse | null
    onSaved: () => void
}

function QuestionFormModal({ open, onOpenChange, editingQuestion, onSaved }: QuestionFormModalProps) {
    const isEdit = !!editingQuestion

    // Base fields
    const [qType, setQType] = useState<'MCQ' | 'DSA'>('MCQ')
    const [title, setTitle] = useState('')
    const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM')
    const [topics, setTopics] = useState('')

    // MCQ state
    const [mcq, setMcq] = useState<MCQFormState>(defaultMCQForm)

    // DSA state
    const [dsa, setDsa] = useState<DSAFormState>(defaultDSAForm)

    // Submission
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Populate on edit
    useEffect(() => {
        if (editingQuestion) {
            setQType(editingQuestion.type)
            setTitle(editingQuestion.title)
            setDifficulty(editingQuestion.difficulty)
            setTopics(editingQuestion.topics.join(', '))
            if (editingQuestion.mcqDetails) {
                setMcq({
                    options: [...editingQuestion.mcqDetails.options],
                    correctOptions: [...editingQuestion.mcqDetails.correctOptions],
                })
            }
            if (editingQuestion.dsaDetails) {
                setDsa({
                    prompt: editingQuestion.dsaDetails.prompt,
                    constraints: editingQuestion.dsaDetails.constraints ?? '',
                    languagesSupported: [...editingQuestion.dsaDetails.languagesSupported],
                    starterCode: { ...editingQuestion.dsaDetails.starterCode },
                    testCases: editingQuestion.dsaDetails.testCases?.length
                        ? editingQuestion.dsaDetails.testCases.map(tc => ({ ...tc }))
                        : [{ stdin: '', expectedStdout: '' }],
                })
            }
        } else {
            setQType('MCQ')
            setTitle('')
            setDifficulty('MEDIUM')
            setTopics('')
            setMcq(defaultMCQForm())
            setDsa(defaultDSAForm())
        }
        setErrors({})
    }, [editingQuestion, open])

    // Validation
    function validate(): boolean {
        const e: Record<string, string> = {}
        if (!title.trim()) e.title = 'Title is required'

        if (qType === 'MCQ') {
            const validOptions = mcq.options.filter(o => o.trim())
            if (validOptions.length < 2) e.options = 'At least 2 options required'
            if (mcq.correctOptions.length === 0) e.correct = 'Select at least 1 correct answer'
            const maxIdx = mcq.options.length - 1
            if (mcq.correctOptions.some(i => i > maxIdx)) e.correct = 'Correct answer index out of range'
        }

        if (qType === 'DSA') {
            if (!dsa.prompt.trim()) e.prompt = 'Problem statement is required'
            if (dsa.languagesSupported.length === 0) e.languages = 'Select at least 1 language'
        }

        setErrors(e)
        return Object.keys(e).length === 0
    }

    async function handleSubmit() {
        if (!validate()) return
        setIsSubmitting(true)

        const topicsArr = topics.split(',').map(t => t.trim()).filter(Boolean)

        try {
            let payload: Record<string, unknown> = {
                type: qType,
                title: title.trim(),
                difficulty,
                topics: topicsArr,
            }

            if (qType === 'MCQ') {
                const validOptions = mcq.options.map(o => o.trim()).filter(Boolean)
                payload.mcqDetails = {
                    options: validOptions,
                    correctOptions: mcq.correctOptions.filter(i => i < validOptions.length),
                    isMultiCorrect: mcq.correctOptions.length > 1,
                }
            }

            if (qType === 'DSA') {
                const validTestCases = dsa.testCases.filter(tc => tc.stdin.trim() || tc.expectedStdout.trim())
                payload.dsaDetails = {
                    prompt: dsa.prompt.trim(),
                    constraints: dsa.constraints.trim() || null,
                    starterCode: dsa.starterCode,
                    languagesSupported: dsa.languagesSupported,
                    testCases: validTestCases.length > 0 ? validTestCases : undefined,
                }
            }

            let result: ApiResponse<QuestionResponse>
            if (isEdit) {
                result = await questionsApi.update(editingQuestion!.id, payload)
            } else {
                result = await questionsApi.create(payload)
            }

            if (!result.success) {
                throw new Error(result.error?.message || 'Operation failed')
            }

            toast.success(isEdit ? 'Question updated' : 'Question created')
            onSaved()
            onOpenChange(false)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to save question')
        } finally {
            setIsSubmitting(false)
        }
    }

    // ── MCQ option helpers ───────────────────────────────
    const updateOption = (idx: number, value: string) => {
        setMcq(prev => {
            const opts = [...prev.options]
            opts[idx] = value
            return { ...prev, options: opts }
        })
    }

    const addOption = () => setMcq(prev => ({ ...prev, options: [...prev.options, ''] }))

    const removeOption = (idx: number) => {
        setMcq(prev => ({
            options: prev.options.filter((_, i) => i !== idx),
            correctOptions: prev.correctOptions.filter(i => i !== idx).map(i => i > idx ? i - 1 : i),
        }))
    }

    const toggleCorrect = (idx: number) => {
        setMcq(prev => ({
            ...prev,
            correctOptions: prev.correctOptions.includes(idx)
                ? prev.correctOptions.filter(i => i !== idx)
                : [...prev.correctOptions, idx],
        }))
    }

    // ── DSA test case helpers ────────────────────────────
    const updateTestCase = (idx: number, field: keyof DSATestCase, value: string) => {
        setDsa(prev => {
            const tcs = [...prev.testCases]
            tcs[idx] = { ...tcs[idx], [field]: value }
            return { ...prev, testCases: tcs }
        })
    }

    const addTestCase = () => setDsa(prev => ({ ...prev, testCases: [...prev.testCases, { stdin: '', expectedStdout: '' }] }))

    const removeTestCase = (idx: number) => setDsa(prev => ({ ...prev, testCases: prev.testCases.filter((_, i) => i !== idx) }))

    const toggleLanguage = (lang: string) => {
        setDsa(prev => {
            const has = prev.languagesSupported.includes(lang)
            const langs = has ? prev.languagesSupported.filter(l => l !== lang) : [...prev.languagesSupported, lang]
            // Update starterCode — add default or remove
            const sc = { ...prev.starterCode }
            if (!has) {
                sc[lang] = sc[lang] || getDefaultStarter(lang)
            } else {
                delete sc[lang]
            }
            return { ...prev, languagesSupported: langs, starterCode: sc }
        })
    }

    function getDefaultStarter(lang: string): string {
        switch (lang) {
            case 'javascript': case 'typescript': return '// Your solution here\n'
            case 'python': return '# Your solution here\n'
            case 'java': return '// Your solution here\npublic class Solution {\n    \n}\n'
            case 'cpp': return '// Your solution here\n#include <bits/stdc++.h>\nusing namespace std;\n\n'
            case 'go': return '// Your solution here\npackage main\n\n'
            case 'rust': return '// Your solution here\nfn main() {\n    \n}\n'
            default: return '// Your solution here\n'
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Question' : 'Create Question'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'Update the question details below.' : 'Add a new question to your bank.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-6 px-1 py-2">

                    {/* Row 1: Type + Difficulty */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={qType} onValueChange={(v) => setQType(v as 'MCQ' | 'DSA')} disabled={isEdit}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MCQ">
                                        <span className="flex items-center gap-2"><CheckSquare className="w-3.5 h-3.5 text-blue-400" /> MCQ</span>
                                    </SelectItem>
                                    <SelectItem value="DSA">
                                        <span className="flex items-center gap-2"><Code className="w-3.5 h-3.5 text-purple-400" /> DSA</span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Difficulty</Label>
                            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as 'EASY' | 'MEDIUM' | 'HARD')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EASY">Easy</SelectItem>
                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                    <SelectItem value="HARD">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label>Question Title <span className="text-red-400">*</span></Label>
                        <Input
                            placeholder={qType === 'MCQ' ? 'e.g. Which normal form eliminates partial dependency?' : 'e.g. Two Sum'}
                            value={title}
                            onChange={(e) => { setTitle(e.target.value); setErrors(p => { const n = { ...p }; delete n.title; return n }) }}
                            className={errors.title ? 'border-red-400' : ''}
                        />
                        {errors.title && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.title}</p>}
                    </div>

                    {/* Topics */}
                    <div className="space-y-2">
                        <Label>Topics <span className="text-xs text-muted-foreground font-normal">(comma separated)</span></Label>
                        <Input
                            placeholder="e.g. Arrays, Hash Table, Dynamic Programming"
                            value={topics}
                            onChange={(e) => setTopics(e.target.value)}
                        />
                    </div>

                    {/* ═══ MCQ Fields ═══ */}
                    {qType === 'MCQ' && (
                        <div className="space-y-4 pt-2 border-t border-line">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">Options</Label>
                                <span className="text-xs text-muted-foreground">Check the correct answer(s)</span>
                            </div>
                            {errors.options && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.options}</p>}
                            {errors.correct && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.correct}</p>}

                            <div className="space-y-2">
                                {mcq.options.map((opt, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <Checkbox
                                            checked={mcq.correctOptions.includes(i)}
                                            onCheckedChange={() => toggleCorrect(i)}
                                            className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                        />
                                        <Input
                                            placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                            value={opt}
                                            onChange={(e) => updateOption(i, e.target.value)}
                                            className="flex-1 text-sm"
                                        />
                                        {mcq.options.length > 2 && (
                                            <button onClick={() => removeOption(i)} className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button onClick={addOption} className="text-xs text-accent hover:underline font-medium">+ Add option</button>
                        </div>
                    )}

                    {/* ═══ DSA Fields ═══ */}
                    {qType === 'DSA' && (
                        <div className="space-y-5 pt-2 border-t border-line">

                            {/* Problem Statement */}
                            <div className="space-y-2">
                                <Label>Problem Statement <span className="text-red-400">*</span></Label>
                                <Textarea
                                    placeholder="Describe the problem in detail. HTML is supported."
                                    value={dsa.prompt}
                                    onChange={(e) => { setDsa(prev => ({ ...prev, prompt: e.target.value })); setErrors(p => { const n = { ...p }; delete n.prompt; return n }) }}
                                    rows={6}
                                    className={errors.prompt ? 'border-red-400' : ''}
                                />
                                {errors.prompt && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.prompt}</p>}
                            </div>

                            {/* Constraints */}
                            <div className="space-y-2">
                                <Label>Constraints <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                                <Textarea
                                    placeholder="e.g. 1 ≤ n ≤ 10^5, -10^9 ≤ nums[i] ≤ 10^9"
                                    value={dsa.constraints}
                                    onChange={(e) => setDsa(prev => ({ ...prev, constraints: e.target.value }))}
                                    rows={2}
                                />
                            </div>

                            {/* Languages */}
                            <div className="space-y-2">
                                <Label>Supported Languages <span className="text-red-400">*</span></Label>
                                {errors.languages && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.languages}</p>}
                                <div className="flex flex-wrap gap-2">
                                    {DSA_LANGUAGES.map(lang => (
                                        <button
                                            key={lang}
                                            type="button"
                                            onClick={() => toggleLanguage(lang)}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${dsa.languagesSupported.includes(lang)
                                                    ? 'bg-accent/10 border-accent/30 text-accent'
                                                    : 'bg-card border-line text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            {lang}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Starter Code (per selected language) */}
                            {dsa.languagesSupported.length > 0 && (
                                <div className="space-y-3">
                                    <Label>Starter Code</Label>
                                    {dsa.languagesSupported.map(lang => (
                                        <div key={lang} className="space-y-1">
                                            <span className="text-xs font-medium text-muted-foreground">{lang}</span>
                                            <Textarea
                                                value={dsa.starterCode[lang] ?? ''}
                                                onChange={(e) => setDsa(prev => ({
                                                    ...prev,
                                                    starterCode: { ...prev.starterCode, [lang]: e.target.value }
                                                }))}
                                                rows={3}
                                                className="font-mono text-xs"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Test Cases */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Test Cases <span className="text-xs text-muted-foreground font-normal">(for automated grading)</span></Label>
                                    <button onClick={addTestCase} className="text-xs text-accent hover:underline font-medium">+ Add case</button>
                                </div>
                                {dsa.testCases.map((tc, i) => (
                                    <div key={i} className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg border border-line relative group">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Input (stdin)</span>
                                            <Textarea
                                                value={tc.stdin}
                                                onChange={(e) => updateTestCase(i, 'stdin', e.target.value)}
                                                rows={2}
                                                className="font-mono text-xs"
                                                placeholder="e.g. [2,7,11,15]\n9"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Expected Output</span>
                                            <Textarea
                                                value={tc.expectedStdout}
                                                onChange={(e) => updateTestCase(i, 'expectedStdout', e.target.value)}
                                                rows={2}
                                                className="font-mono text-xs"
                                                placeholder="e.g. [0,1]"
                                            />
                                        </div>
                                        {dsa.testCases.length > 1 && (
                                            <button
                                                onClick={() => removeTestCase(i)}
                                                className="absolute -top-2 -right-2 p-1 rounded-full bg-card border border-line text-muted-foreground hover:text-red-400 hover:border-red-400/30 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="pt-4 border-t border-line">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="min-w-[100px]">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? 'Save Changes' : 'Create Question'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ──────────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────────

export default function QuestionBankPage() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [diffFilter, setDiffFilter] = useState('')

    // Modal state
    const [modalOpen, setModalOpen] = useState(false)
    const [editingQuestion, setEditingQuestion] = useState<QuestionResponse | null>(null)

    // Expanded DSA details
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const debouncedSearch = useDebounce(search, 400)

    const { data: response, isLoading } = useQuery({
        queryKey: ['questions', debouncedSearch, typeFilter, diffFilter],
        queryFn: () => questionsApi.list({
            search: debouncedSearch || undefined,
            type: typeFilter || undefined,
            difficulty: diffFilter || undefined,
            limit: '100',
        }),
    })

    const questions: QuestionResponse[] = useMemo(() => {
        const raw = response?.data
        if (!raw) return []
        // Handle both { data: [...] } and direct array
        if (Array.isArray(raw)) return raw as unknown as QuestionResponse[]
        if ('data' in raw && Array.isArray(raw.data)) return raw.data
        return []
    }, [response])

    const deleteMutation = useApiMutation({
        mutationFn: (id: string) => questionsApi.delete(id),
        successMessage: 'Question deleted',
        errorMessage: 'Failed to delete question',
        invalidateKeys: [['questions']],
    })

    const handleCreate = () => {
        setEditingQuestion(null)
        setModalOpen(true)
    }

    const handleEdit = (q: QuestionResponse) => {
        if (q.organizationId === null) {
            toast.error("Cannot edit global seeded questions — only your organization's questions can be modified.")
            return
        }
        setEditingQuestion(q)
        setModalOpen(true)
    }

    const handleDelete = (q: QuestionResponse) => {
        if (q.organizationId === null) {
            toast.error("Cannot delete global seeded questions.")
            return
        }
        if (confirm(`Delete "${q.title}"? This cannot be undone.`)) {
            deleteMutation.mutate(q.id)
        }
    }

    const handleSaved = () => {
        queryClient.invalidateQueries({ queryKey: ['questions'] })
    }

    // Category counts
    const mcqCount = questions.filter(q => q.type === 'MCQ').length
    const dsaCount = questions.filter(q => q.type === 'DSA').length

    const diffLabel = (d: string) => d.charAt(0) + d.slice(1).toLowerCase()

    return (
        <PageContainer title="Question Bank" description="Manage reusable questions for assessments. All questions are stored in the database and used in assessment configuration.">
            <div className="mt-6 w-full flex flex-col space-y-6">

                {/* Stats row */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-2 bg-card/50 border border-line rounded-lg">
                        <CheckSquare className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium">{mcqCount}</span><span className="text-xs text-muted-foreground">MCQ</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-card/50 border border-line rounded-lg">
                        <Code className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium">{dsaCount}</span><span className="text-xs text-muted-foreground">DSA</span>
                    </div>
                    <div className="flex-1" />
                    <Button onClick={handleCreate} size="sm" className="gap-1.5">
                        <Plus className="w-4 h-4" /> Add Question
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input placeholder="Search questions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card" />
                    </div>
                    <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === 'ALL' ? '' : v)}>
                        <SelectTrigger className="w-[130px] bg-card border-line"><SelectValue placeholder="All Types" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Types</SelectItem>
                            <SelectItem value="MCQ">MCQ</SelectItem>
                            <SelectItem value="DSA">DSA</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={diffFilter} onValueChange={(v) => setDiffFilter(v === 'ALL' ? '' : v)}>
                        <SelectTrigger className="w-[140px] bg-card border-line"><SelectValue placeholder="All Levels" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Levels</SelectItem>
                            <SelectItem value="EASY">Easy</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HARD">Hard</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Questions List */}
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : questions.length === 0 ? (
                    <EmptyState
                        icon={HelpCircle}
                        title="No questions in your bank"
                        description="Build your question bank by adding MCQ and DSA questions for assessments. These will be used when configuring assessment rounds."
                        actions={[{ label: 'Add Question', onClick: handleCreate, variant: 'primary' }]}
                    />
                ) : (
                    <div className="space-y-2">
                        {questions.map((q) => {
                            const isExpanded = expandedId === q.id
                            const isGlobal = q.organizationId === null

                            return (
                                <div key={q.id} className="border border-line rounded-lg bg-card/50 hover:bg-card/80 transition-colors group">
                                    {/* Main row */}
                                    <div className="flex items-center justify-between p-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                {q.type === 'MCQ'
                                                    ? <CheckSquare className="w-4 h-4 text-blue-400 shrink-0" />
                                                    : <Code className="w-4 h-4 text-purple-400 shrink-0" />
                                                }
                                                <p className="font-medium text-sm truncate">{q.title}</p>
                                                <Badge variant="outline" className={`text-[10px] ${DIFF_STYLES[q.difficulty] || ''}`}>
                                                    {diffLabel(q.difficulty)}
                                                </Badge>
                                                {isGlobal && (
                                                    <Badge variant="outline" className="text-[10px] bg-card border-line text-muted-foreground">
                                                        Global
                                                    </Badge>
                                                )}
                                            </div>
                                            {q.topics && q.topics.length > 0 && (
                                                <div className="flex gap-1 mt-1.5 ml-6">
                                                    {q.topics.slice(0, 5).map(t => (
                                                        <span key={t} className="text-[9px] px-1.5 py-0.5 bg-muted rounded font-medium text-muted-foreground">{t}</span>
                                                    ))}
                                                    {q.topics.length > 5 && <span className="text-[9px] text-muted-foreground">+{q.topics.length - 5}</span>}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {/* Expand (for DSA with details) */}
                                            {q.type === 'DSA' && q.dsaDetails && (
                                                <button
                                                    onClick={() => setExpandedId(isExpanded ? null : q.id)}
                                                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                    title="View details"
                                                >
                                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                </button>
                                            )}
                                            {/* MCQ expand for options */}
                                            {q.type === 'MCQ' && q.mcqDetails && (
                                                <button
                                                    onClick={() => setExpandedId(isExpanded ? null : q.id)}
                                                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                    title="View options"
                                                >
                                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                </button>
                                            )}
                                            {!isGlobal && (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(q)}
                                                        className="p-1.5 rounded hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(q)}
                                                        className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && q.type === 'MCQ' && q.mcqDetails && (
                                        <div className="border-t border-line px-4 py-3 bg-muted/20 animate-in slide-in-from-top-1 duration-200">
                                            <p className="text-xs font-medium text-muted-foreground mb-2">
                                                Options ({q.mcqDetails.isMultiCorrect ? 'Multiple correct' : 'Single correct'})
                                            </p>
                                            <div className="space-y-1.5">
                                                {q.mcqDetails.options.map((opt, i) => (
                                                    <div key={i} className={`flex items-center gap-2 text-sm px-2 py-1 rounded ${q.mcqDetails!.correctOptions.includes(i) ? 'bg-emerald-500/10 text-emerald-400' : 'text-foreground/70'}`}>
                                                        <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-medium shrink-0">
                                                            {String.fromCharCode(65 + i)}
                                                        </span>
                                                        <span>{opt}</span>
                                                        {q.mcqDetails!.correctOptions.includes(i) && <span className="text-[10px] ml-auto font-medium">✓ Correct</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {isExpanded && q.type === 'DSA' && q.dsaDetails && (
                                        <div className="border-t border-line px-4 py-3 bg-muted/20 space-y-3 animate-in slide-in-from-top-1 duration-200">
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground mb-1">Problem Statement</p>
                                                <div className="text-sm text-foreground/80 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: q.dsaDetails.prompt }} />
                                            </div>
                                            {q.dsaDetails.constraints && (
                                                <div>
                                                    <p className="text-xs font-medium text-muted-foreground mb-1">Constraints</p>
                                                    <p className="text-sm text-foreground/80 font-mono">{q.dsaDetails.constraints}</p>
                                                </div>
                                            )}
                                            <div className="flex gap-1.5">
                                                {q.dsaDetails.languagesSupported.map(l => (
                                                    <Badge key={l} variant="outline" className="text-[10px]">{l}</Badge>
                                                ))}
                                            </div>
                                            {q.dsaDetails.testCases && q.dsaDetails.testCases.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-medium text-muted-foreground mb-1">Test Cases ({q.dsaDetails.testCases.length})</p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {q.dsaDetails.testCases.slice(0, 3).map((tc, i) => (
                                                            <div key={i} className="text-xs font-mono p-2 bg-card rounded border border-line">
                                                                <span className="text-muted-foreground">In:</span> {tc.stdin.substring(0, 60)}
                                                                <br />
                                                                <span className="text-muted-foreground">Out:</span> {tc.expectedStdout.substring(0, 60)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <QuestionFormModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                editingQuestion={editingQuestion}
                onSaved={handleSaved}
            />
        </PageContainer>
    )
}

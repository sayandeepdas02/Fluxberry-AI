"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/client"
import { ApiResponse, Question } from "@/lib/api/types"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { EmptyState } from "@/components/dashboard/empty-state"
import {
    HelpCircle, Plus, Loader2, Search, Code, CheckSquare, Trash2, Pencil,
    SlidersHorizontal, Tag,
} from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface QuestionListRes { data: Question[]; total: number }

const questionsApi = {
    list: (query?: any): Promise<ApiResponse<Question[]>> =>
        apiClient.get('/questions', query),
    create: (data: any): Promise<ApiResponse<Question>> =>
        apiClient.post('/questions', data),
    update: (id: string, data: any): Promise<ApiResponse<Question>> =>
        apiClient.patch(`/questions/${id}`, data),
    delete: (id: string): Promise<ApiResponse<any>> =>
        apiClient.delete(`/questions/${id}`),
}

const DIFF_STYLES: Record<string, string> = {
    EASY: 'bg-emerald-500/10 text-emerald-400',
    MEDIUM: 'bg-amber-500/10 text-amber-400',
    HARD: 'bg-red-500/10 text-red-400',
}

function useDebounce(value: string, delay: number) {
    const [v, setV] = useState(value)
    useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t) }, [value, delay])
    return v
}

export default function QuestionBankPage() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [diffFilter, setDiffFilter] = useState('')
    const [showCreate, setShowCreate] = useState(false)

    // Create form state
    const [cType, setCType] = useState<'MCQ' | 'DSA'>('MCQ')
    const [cTitle, setCTitle] = useState('')
    const [cDiff, setCDiff] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM')
    const [cTopics, setCTopics] = useState('')
    // MCQ fields
    const [cOptions, setCOptions] = useState(['', '', '', ''])
    const [cCorrect, setCCorrect] = useState<number[]>([0])

    const debouncedSearch = useDebounce(search, 500)

    const { data: response, isLoading } = useQuery({
        queryKey: ['questions', debouncedSearch, typeFilter, diffFilter],
        queryFn: () => questionsApi.list({
            search: debouncedSearch || undefined,
            type: typeFilter || undefined,
            difficulty: diffFilter || undefined,
            limit: '50',
        }),
    })
    const questions = response?.data || []

    const createMutation = useMutation({
        mutationFn: (data: any) => questionsApi.create(data),
        onSuccess: () => {
            toast.success('Question created')
            resetCreate()
            queryClient.invalidateQueries({ queryKey: ['questions'] })
        },
        onError: () => toast.error('Failed to create question'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => questionsApi.delete(id),
        onSuccess: () => {
            toast.success('Question deleted')
            queryClient.invalidateQueries({ queryKey: ['questions'] })
        },
    })

    const resetCreate = () => {
        setShowCreate(false)
        setCTitle('')
        setCType('MCQ')
        setCDiff('MEDIUM')
        setCTopics('')
        setCOptions(['', '', '', ''])
        setCCorrect([0])
    }

    const handleCreate = () => {
        if (!cTitle) return toast.error('Title required')
        const topics = cTopics.split(',').map(t => t.trim()).filter(Boolean)

        if (cType === 'MCQ') {
            const validOptions = cOptions.filter(o => o.trim())
            if (validOptions.length < 2) return toast.error('At least 2 options required')
            createMutation.mutate({
                type: 'MCQ', title: cTitle, difficulty: cDiff, topics,
                mcqDetails: { options: validOptions, correctOptions: cCorrect, isMultiCorrect: cCorrect.length > 1 },
            })
        } else {
            createMutation.mutate({
                type: 'DSA', title: cTitle, difficulty: cDiff, topics,
                dsaDetails: { prompt: cTitle, starterCode: { javascript: '// Write your solution\n' }, languagesSupported: ['javascript', 'python'] },
            })
        }
    }

    // Category counts
    const mcqCount = questions.filter(q => q.type === 'MCQ').length
    const dsaCount = questions.filter(q => q.type === 'DSA').length

    return (
        <PageContainer title="Question Bank" description="Manage reusable questions for assessments across categories and difficulty levels.">
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
                    <button onClick={() => setShowCreate(true)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90">
                        <Plus className="w-4 h-4" /> Add Question
                    </button>
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

                {/* Create Form */}
                {showCreate && (
                    <div className="p-6 border border-line rounded-lg bg-card/50 space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <h3 className="font-semibold text-sm">Create Question</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Select value={cType} onValueChange={(v) => setCType(v as any)}>
                                <SelectTrigger className="bg-card border-line"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MCQ">MCQ</SelectItem>
                                    <SelectItem value="DSA">DSA</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={cDiff} onValueChange={(v) => setCDiff(v as any)}>
                                <SelectTrigger className="bg-card border-line"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EASY">Easy</SelectItem>
                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                    <SelectItem value="HARD">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input placeholder="Topics (comma separated)" value={cTopics} onChange={(e) => setCTopics(e.target.value)} className="bg-card" />
                        </div>
                        <Input placeholder="Question title" value={cTitle} onChange={(e) => setCTitle(e.target.value)} className="bg-card" />

                        {cType === 'MCQ' && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">Options</p>
                                {cOptions.map((opt, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <input type="checkbox" checked={cCorrect.includes(i)}
                                            onChange={(e) => {
                                                if (e.target.checked) setCCorrect([...cCorrect, i])
                                                else setCCorrect(cCorrect.filter(x => x !== i))
                                            }}
                                            className="accent-accent"
                                        />
                                        <Input placeholder={`Option ${i + 1}`} value={opt}
                                            onChange={(e) => { const n = [...cOptions]; n[i] = e.target.value; setCOptions(n) }}
                                            className="bg-card text-sm flex-1" />
                                    </div>
                                ))}
                                <button onClick={() => setCOptions([...cOptions, ''])} className="text-xs text-accent hover:underline">+ Add option</button>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button onClick={handleCreate} disabled={createMutation.isPending}
                                className="px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 disabled:opacity-50">Create</button>
                            <button onClick={resetCreate} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                        </div>
                    </div>
                )}

                {/* Questions List */}
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : questions.length === 0 && !showCreate ? (
                    <EmptyState icon={HelpCircle} title="No questions in your bank" description="Build your question bank by adding MCQ and DSA questions for assessments."
                        actions={[{ label: 'Add Question', onClick: () => setShowCreate(true), variant: 'primary' }]} />
                ) : (
                    <div className="space-y-2">
                        {questions.map((q: Question) => (
                            <div key={q.id} className="flex items-center justify-between p-4 border border-line rounded-lg bg-card/50 hover:bg-card/80 transition-colors group">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        {q.type === 'MCQ' ? <CheckSquare className="w-4 h-4 text-blue-400 shrink-0" /> : <Code className="w-4 h-4 text-purple-400 shrink-0" />}
                                        <p className="font-medium text-sm truncate">{q.title}</p>
                                        <Badge className={`text-[10px] ${DIFF_STYLES[q.difficulty] || ''}`}>{q.difficulty}</Badge>
                                    </div>
                                    {q.topics && q.topics.length > 0 && (
                                        <div className="flex gap-1 mt-1.5 ml-6">
                                            {q.topics.slice(0, 4).map(t => (
                                                <span key={t} className="text-[9px] px-1.5 py-0.5 bg-muted rounded font-medium text-muted-foreground">{t}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { if (confirm('Delete this question?')) deleteMutation.mutate(q.id) }}
                                        className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageContainer>
    )
}

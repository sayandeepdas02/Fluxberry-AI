"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import type { Question } from "@/lib/api/questions"

interface MCQSelectorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (selectedIds: string[]) => void
    initialSelection: string[]
    /** Questions loaded from the API — passed by configure-assessment */
    questions: Question[]
    isLoading?: boolean
}

export function MCQSelector({ open, onOpenChange, onSave, initialSelection, questions, isLoading }: MCQSelectorProps) {
    const [selected, setSelected] = useState<string[]>(initialSelection)
    const [search, setSearch] = useState("")
    const [filterType, setFilterType] = useState<'All' | 'Single' | 'Multi'>('All')

    const filteredQuestions = useMemo(() => {
        return questions.filter(q => {
            const typeLabel = q.mcqDetails?.isMultiCorrect ? 'Multi' : 'Single'
            const matchesSearch = q.title.toLowerCase().includes(search.toLowerCase()) ||
                q.topics.some(t => t.toLowerCase().includes(search.toLowerCase()))
            const matchesType = filterType === 'All' || typeLabel === filterType
            return matchesSearch && matchesType
        })
    }, [questions, search, filterType])

    const stats = useMemo(() => {
        const selectedQuestions = questions.filter(q => selected.includes(q.id))
        return {
            total: selected.length,
            single: selectedQuestions.filter(q => !q.mcqDetails?.isMultiCorrect).length,
            multi: selectedQuestions.filter(q => q.mcqDetails?.isMultiCorrect).length,
        }
    }, [selected, questions])

    const isValid = stats.single >= 1 && stats.multi >= 0 && stats.total >= 1

    const toggleSelection = (id: string) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    const autoSelect = () => {
        const singles = questions.filter(q => !q.mcqDetails?.isMultiCorrect).slice(0, 20).map(q => q.id)
        const multis = questions.filter(q => q.mcqDetails?.isMultiCorrect).slice(0, 10).map(q => q.id)
        setSelected([...singles, ...multis])
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center justify-between mr-8">
                        <div>
                            <DialogTitle>Select MCQ Questions</DialogTitle>
                            <DialogDescription>
                                Choose questions from your bank (including global seeded questions). Select single-choice and multi-choice as needed.
                            </DialogDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={autoSelect} className="text-xs">
                            Auto-Fill
                        </Button>
                    </div>
                </DialogHeader>

                {/* Filters */}
                <div className="flex items-center gap-4 py-4 border-b">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by keyword or topic..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 border rounded-md p-1">
                        {(['All', 'Single', 'Multi'] as const).map(type => (
                            <Button
                                key={type}
                                variant={filterType === type ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setFilterType(type)}
                                className="h-8"
                            >
                                {type}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="flex items-center gap-6 py-2 text-sm">
                    <div className={cn("flex items-center gap-2 font-medium", stats.single > 0 ? "text-green-600" : "text-amber-600")}>
                        {stats.single > 0 ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        Single Choice: {stats.single}
                    </div>
                    <div className="flex items-center gap-2 font-medium text-neutral-500">
                        Multi Choice: {stats.multi}
                    </div>
                    <div className="ml-auto text-neutral-500">{stats.total} selected</div>
                </div>

                {/* Question List */}
                <ScrollArea className="flex-1 bg-neutral-50 rounded-md border p-4">
                    {isLoading && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                        </div>
                    )}
                    {!isLoading && filteredQuestions.length === 0 && (
                        <p className="text-center text-sm text-neutral-500 py-12">
                            No questions found. <a href="/dashboard/question-bank" target="_blank" className="text-orange-500 underline">Create questions in the Question Bank</a>.
                        </p>
                    )}
                    <div className="space-y-3">
                        {filteredQuestions.map(q => {
                            const typeLabel = q.mcqDetails?.isMultiCorrect ? 'Multi' : 'Single'
                            const diffLabel = q.difficulty.charAt(0) + q.difficulty.slice(1).toLowerCase()
                            return (
                                <div
                                    key={q.id}
                                    className={cn(
                                        "p-4 rounded-lg border bg-white flex items-start gap-4 transition-all hover:bg-neutral-50 cursor-pointer",
                                        selected.includes(q.id) ? "border-primary/50 ring-1 ring-primary/5 shadow-sm" : "border-neutral-200"
                                    )}
                                    onClick={() => toggleSelection(q.id)}
                                >
                                    <Checkbox
                                        checked={selected.includes(q.id)}
                                        onCheckedChange={() => toggleSelection(q.id)}
                                        className="mt-1"
                                    />
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium text-sm text-neutral-900 line-clamp-2">{q.title}</p>
                                            <Badge variant="outline" className={cn("text-xs flex-shrink-0 ml-2",
                                                q.difficulty === 'EASY' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    q.difficulty === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                        'bg-red-50 text-red-700 border-red-200'
                                            )}>
                                                {diffLabel}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                                            {q.topics.slice(0, 2).map(t => (
                                                <Badge key={t} variant="secondary" className="rounded-sm font-normal text-xs px-1.5 py-0 h-5">{t}</Badge>
                                            ))}
                                            <span>•</span>
                                            <span>{typeLabel} Choice</span>
                                            {!q.organizationId && <span className="text-neutral-400">· Global</span>}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>

                <DialogFooter className="pt-4">
                    <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-neutral-500">
                            {selected.length} questions selected
                        </span>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button
                                onClick={() => onSave(selected)}
                                disabled={!isValid}
                                className={cn(isValid ? "bg-green-600 hover:bg-green-700 text-white" : "")}
                            >
                                Save Selection
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

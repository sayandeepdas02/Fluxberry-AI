"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Filter, AlertCircle, CheckCircle2 } from "lucide-react"
import { useState, useMemo } from "react"
import { mcqBank } from "@/features/assessments/mocks/question-bank"
import { cn } from "@/lib/utils"

interface MCQSelectorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (selectedIds: string[]) => void
    initialSelection: string[]
}

export function MCQSelector({ open, onOpenChange, onSave, initialSelection }: MCQSelectorProps) {
    const [selected, setSelected] = useState<string[]>(initialSelection)
    const [search, setSearch] = useState("")
    const [filterType, setFilterType] = useState<'All' | 'Single' | 'Multi'>('All')

    const filteredQuestions = useMemo(() => {
        return mcqBank.filter(q => {
            const matchesSearch = q.text.toLowerCase().includes(search.toLowerCase()) || q.category.toLowerCase().includes(search.toLowerCase())
            const matchesType = filterType === 'All' || q.type === filterType
            return matchesSearch && matchesType
        })
    }, [search, filterType])

    const stats = useMemo(() => {
        const selectedQuestions = mcqBank.filter(q => selected.includes(q.id))
        return {
            total: selected.length,
            single: selectedQuestions.filter(q => q.type === 'Single').length,
            multi: selectedQuestions.filter(q => q.type === 'Multi').length
        }
    }, [selected])

    const isValid = stats.single === 20 && stats.multi === 10

    const toggleSelection = (id: string) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    // Auto-fill helper for demo purposes
    const autoSelect = () => {
        const singles = mcqBank.filter(q => q.type === 'Single').slice(0, 20).map(q => q.id)
        const multis = mcqBank.filter(q => q.type === 'Multi').slice(0, 10).map(q => q.id)
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
                                Curate questions from the bank. You must select exactly 20 Single-Choice and 10 Multi-Choice questions.
                            </DialogDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={autoSelect} className="text-xs">
                            Auto-Fill (Demo)
                        </Button>
                    </div>
                </DialogHeader>

                {/* Filters */}
                <div className="flex items-center gap-4 py-4 border-b">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by keyword or category..."
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
                    <div className={cn("flex items-center gap-2 font-medium", stats.single === 20 ? "text-green-600" : "text-amber-600")}>
                        {stats.single === 20 ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        Single Choice: {stats.single} / 20
                    </div>
                    <div className={cn("flex items-center gap-2 font-medium", stats.multi === 10 ? "text-green-600" : "text-amber-600")}>
                        {stats.multi === 10 ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        Multi Choice: {stats.multi} / 10
                    </div>
                </div>

                {/* Question List */}
                <ScrollArea className="flex-1 bg-neutral-50 rounded-md border p-4">
                    <div className="space-y-3">
                        {filteredQuestions.map(q => (
                            <div
                                key={q.id}
                                className={cn(
                                    "p-4 rounded-lg border bg-white flex items-start gap-4 transition-all hover:bg-neutral-50",
                                    selected.includes(q.id) ? "border-primary/50 ring-1 ring-primary/5 shadow-sm" : "border-neutral-200"
                                )}
                            >
                                <Checkbox
                                    checked={selected.includes(q.id)}
                                    onCheckedChange={() => toggleSelection(q.id)}
                                    className="mt-1"
                                />
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium text-sm text-neutral-900 line-clamp-2">{q.text}</p>
                                        <Badge variant="outline" className={cn("text-xs flex-shrink-0",
                                            q.difficulty === 'Easy' ? 'bg-green-50 text-green-700 border-green-200' :
                                                q.difficulty === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                    'bg-red-50 text-red-700 border-red-200'
                                        )}>
                                            {q.difficulty}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                                        <Badge variant="secondary" className="rounded-sm font-normal text-xs px-1.5 py-0 h-5">
                                            {q.category}
                                        </Badge>
                                        <span>•</span>
                                        <span>{q.type} Choice</span>
                                    </div>
                                </div>
                            </div>
                        ))}
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

"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, CheckCircle2, Code2, Loader2 } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import type { Question } from "@/lib/api/questions"

interface DSASelectorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (selectedIds: string[]) => void
    initialSelection: string[]
    /** DSA questions loaded from the API — passed by configure-assessment */
    questions: Question[]
    isLoading?: boolean
}

export function DSASelector({ open, onOpenChange, onSave, initialSelection, questions, isLoading }: DSASelectorProps) {
    const [selected, setSelected] = useState<string[]>(initialSelection)

    const isValid = selected.length === 4

    const toggleSelection = (id: string) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Select Coding Problems</DialogTitle>
                    <DialogDescription>
                        Select exactly 4 problems for the Hands-on Coding round. Ideally mix difficulty levels.
                    </DialogDescription>
                </DialogHeader>

                {/* Stats Bar */}
                <div className="flex items-center gap-4 py-2 text-sm border-b pb-4">
                    <div className={cn("flex items-center gap-2 font-medium", isValid ? "text-green-600" : "text-amber-600")}>
                        {isValid ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        Selected: {selected.length} / 4
                    </div>
                    <span className="text-neutral-300">|</span>
                    <div className="text-neutral-500 text-xs flex gap-2">
                        {selected.map(id => {
                            const q = questions.find(x => x.id === id)
                            return q ? (
                                <Badge key={id} variant="outline" className="text-[10px] font-normal h-5 border-neutral-300">
                                    {q.difficulty.charAt(0) + q.difficulty.slice(1).toLowerCase()}
                                </Badge>
                            ) : null
                        })}
                    </div>
                </div>

                {/* Question List */}
                <ScrollArea className="flex-1 rounded-md mt-2">
                    {isLoading && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-5 h-5 animate-spin text-green-500" />
                        </div>
                    )}
                    {!isLoading && questions.length === 0 && (
                        <p className="text-center text-sm text-neutral-500 py-12">
                            No DSA questions found. <a href="/dashboard/interviews/question-bank" target="_blank" className="text-green-600 underline">Create questions in the Question Bank</a>.
                        </p>
                    )}
                    <div className="space-y-3 p-1">
                        {questions.map(q => {
                            const diffLabel = q.difficulty.charAt(0) + q.difficulty.slice(1).toLowerCase()
                            return (
                            <div
                                key={q.id}
                                className={cn(
                                    "p-4 rounded-lg border bg-white flex items-start gap-4 transition-all hover:bg-neutral-50 group",
                                    selected.includes(q.id) ? "border-primary/50 ring-1 ring-primary/5 shadow-sm" : "border-neutral-200"
                                )}
                                onClick={() => toggleSelection(q.id)}
                            >
                                <Checkbox
                                    checked={selected.includes(q.id)}
                                    // onCheckedChange handled by parent div click for better UX
                                    className="mt-1"
                                />
                                <div className="flex-1 space-y-2 cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-sm text-neutral-900">{q.title}</p>
                                            <Badge variant="outline" className={cn("text-xs",
                                                q.difficulty === 'EASY' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    q.difficulty === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                        'bg-red-50 text-red-700 border-red-200'
                                            )}>
                                                {diffLabel}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {q.topics.map(t => (
                                            <Badge key={t} variant="secondary" className="rounded-sm font-normal text-[10px] px-1.5 h-5 bg-neutral-100 text-neutral-600">
                                                {t}
                                            </Badge>
                                        ))}
                                        {!q.organizationId && <span className="text-[10px] text-neutral-400 ml-1">· Global</span>}
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="sm" className="h-8 text-xs">Preview</Button>
                                </div>
                            </div>
                        )})}
                    </div>
                </ScrollArea>

                <DialogFooter className="pt-4 border-t">
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button
                            onClick={() => onSave(selected)}
                            disabled={!isValid}
                            className={cn(isValid ? "bg-green-600 hover:bg-green-700 text-white" : "")}
                        >
                            Save Requirements
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

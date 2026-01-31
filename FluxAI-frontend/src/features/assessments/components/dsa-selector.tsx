"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, CheckCircle2, Code2 } from "lucide-react"
import { useState } from "react"
import { dsaBank } from "@/features/assessments/mocks/question-bank"
import { cn } from "@/lib/utils"

interface DSASelectorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (selectedIds: string[]) => void
    initialSelection: string[]
}

export function DSASelector({ open, onOpenChange, onSave, initialSelection }: DSASelectorProps) {
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
                            const q = dsaBank.find(x => x.id === id)
                            return q ? (
                                <Badge key={id} variant="outline" className="text-[10px] font-normal h-5 border-neutral-300">
                                    {q.difficulty}
                                </Badge>
                            ) : null
                        })}
                    </div>
                </div>

                {/* Question List */}
                <ScrollArea className="flex-1 rounded-md mt-2">
                    <div className="space-y-3 p-1">
                        {dsaBank.map(q => (
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
                                                q.difficulty === 'Easy' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    q.difficulty === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                        'bg-red-50 text-red-700 border-red-200'
                                            )}>
                                                {q.difficulty}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {q.topics.map(t => (
                                            <Badge key={t} variant="secondary" className="rounded-sm font-normal text-[10px] px-1.5 h-5 bg-neutral-100 text-neutral-600">
                                                {t}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="sm" className="h-8 text-xs">Preview</Button>
                                </div>
                            </div>
                        ))}
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

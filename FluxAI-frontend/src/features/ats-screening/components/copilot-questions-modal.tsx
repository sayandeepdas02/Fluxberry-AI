"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Sparkles, Copy, Check, Loader2, MessageSquare, RefreshCw } from "lucide-react"
import { copilotApi } from "@/lib/api/ats-screening"

interface CopilotQuestionsModalProps {
    isOpen:          boolean
    onOpenChange:    (open: boolean) => void
    jobId:           string
    candidateId:     string | null
    candidateName:   string | null
}

export function CopilotQuestionsModal({
    isOpen,
    onOpenChange,
    jobId,
    candidateId,
    candidateName,
}: CopilotQuestionsModalProps) {
    const [questions,  setQuestions]  = React.useState<string[]>([])
    const [loading,    setLoading]    = React.useState(false)
    const [error,      setError]      = React.useState<string | null>(null)
    const [copiedIdx,  setCopiedIdx]  = React.useState<number | null>(null)

    const fetchQuestions = React.useCallback(async () => {
        if (!candidateId || !jobId) return
        setLoading(true)
        setError(null)
        setQuestions([])
        try {
            const res = await copilotApi.generateQuestions(jobId, candidateId)
            if (res.success && res.data) {
                const qs = (res.data as any).data ?? res.data
                setQuestions(Array.isArray(qs) ? qs : [])
            } else {
                setError('Failed to generate questions. Please try again.')
            }
        } catch {
            setError('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [candidateId, jobId])

    React.useEffect(() => {
        if (isOpen && candidateId) {
            fetchQuestions()
        }
    }, [isOpen, candidateId, fetchQuestions])

    // Reset on close
    React.useEffect(() => {
        if (!isOpen) {
            setQuestions([])
            setError(null)
            setCopiedIdx(null)
        }
    }, [isOpen])

    const handleCopy = async (question: string, idx: number) => {
        await navigator.clipboard.writeText(question)
        setCopiedIdx(idx)
        setTimeout(() => setCopiedIdx(null), 2000)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                        </div>
                        Interview Questions
                        {candidateName && (
                            <span className="text-muted-foreground font-normal">— {candidateName}</span>
                        )}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        AI-generated questions tailored to this candidate's profile and the job requirements.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 pt-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Generating tailored questions...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                            <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-20" />
                            <p className="mb-3">{error}</p>
                            <button
                                type="button"
                                onClick={fetchQuestions}
                                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Try again
                            </button>
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                            No questions generated yet.
                        </div>
                    ) : (
                        <>
                            <ol className="space-y-2.5">
                                {questions.map((q, i) => (
                                    <li
                                        key={i}
                                        className="group flex items-start gap-3 p-3.5 border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                                    >
                                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center mt-0.5">
                                            {i + 1}
                                        </span>
                                        <span className="flex-1 text-sm text-foreground leading-relaxed">{q}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(q, i)}
                                            className="flex-shrink-0 p-1 text-muted-foreground/50 hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                                            title="Copy question"
                                        >
                                            {copiedIdx === i ? (
                                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                            ) : (
                                                <Copy className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ol>

                            <div className="flex items-center justify-between pt-2">
                                <p className="text-[10px] text-muted-foreground">
                                    Questions are AI-generated — review before use.
                                </p>
                                <button
                                    type="button"
                                    onClick={fetchQuestions}
                                    disabled={loading}
                                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    Regenerate
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

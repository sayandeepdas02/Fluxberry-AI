"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { compareApi, CandidateCompareResult } from "@/lib/api/ats-screening"
import { Sparkles, AlertTriangle, User, Trophy, BarChart4 } from "lucide-react"

interface CandidateComparisonModalProps {
    jobId: string
    candidateIds: [string, string] | null
    onClose: () => void
}

function ScoreBar({ label, score1, score2, winnerId, id1, id2 }: { label: string, score1: number, score2: number, winnerId: string | null, id1: string, id2: string }) {
    const isW1 = winnerId === id1
    const isW2 = winnerId === id2
    const tie = !isW1 && !isW2

    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
                <span className="truncate w-1/3 group relative">
                    {label}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex-1 flex justify-end">
                    <span className={`text-xs mr-2 ${isW1 ? ' text-foreground' : 'text-muted-foreground'}`}>{score1}%</span>
                    <div className="h-2 w-full bg-muted rounded-full max-w-[120px] flex justify-end overflow-hidden">
                         <div className={`h-full rounded-full ${isW1 ? 'bg-primary' : tie ? 'bg-primary/50' : 'bg-primary/30'}`} style={{ width: `${score1}%` }} />
                    </div>
                </div>
                <div className="w-px h-4 bg-border" />
                <div className="flex-1 flex justify-start">
                    <div className="h-2 w-full bg-muted rounded-full max-w-[120px] flex justify-start overflow-hidden">
                         <div className={`h-full rounded-full ${isW2 ? 'bg-primary' : tie ? 'bg-primary/50' : 'bg-primary/30'}`} style={{ width: `${score2}%` }} />
                    </div>
                    <span className={`text-xs ml-2 ${isW2 ? ' text-foreground' : 'text-muted-foreground'}`}>{score2}%</span>
                </div>
            </div>
        </div>
    )
}

export function CandidateComparisonModal({ jobId, candidateIds, onClose }: CandidateComparisonModalProps) {
    const [data, setData] = React.useState<CandidateCompareResult | null>(null)
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
        if (!candidateIds || candidateIds.length !== 2) {
            setData(null)
            return
        }

        const load = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const res = await compareApi.compareCandidates(jobId, candidateIds[0], candidateIds[1])
                // Backend returns { success, data: CandidateCompareResult }
                const result = (res as any).data?.data || (res as any).data
                setData(result)
            } catch (err: any) {
                setError(err.message || "Failed to compare candidates")
            } finally {
                setIsLoading(false)
            }
        }

        load()
    }, [jobId, candidateIds])

    const open = Boolean(candidateIds && candidateIds.length === 2)

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BarChart4 className="w-4 h-4 text-primary" />
                        Candidate Comparison
                    </DialogTitle>
                    <DialogDescription>
                        Side-by-side technical evaluation of selected candidates.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-24 text-center text-muted-foreground animate-pulse">Analyzing profiles...</div>
                ) : error ? (
                    <div className="py-12 text-center text-red-500">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        {error}
                    </div>
                ) : data && data.candidates.length === 2 ? (
                    <div className="space-y-6 mt-2">
                        {/* Recommendation Banner */}
                        <div className="bg-primary/5 border border-primary/20 p-4 rounded-md flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="text-sm font-semibold text-foreground mb-1">Copilot Recommendation</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {data.recommendation.winnerId 
                                        ? <span><strong className="text-foreground">{data.candidates.find(c => c.id === data.recommendation.winnerId)?.name}</strong> is recommended. </span>
                                        : <span>Candidates are closely tied. </span>
                                    }
                                    {data.recommendation.reason}
                                </p>
                            </div>
                        </div>

                        {/* Candidates Header */}
                        <div className="grid grid-cols-2 gap-4 border-b border-border pb-4">
                            {data.candidates.map(c => (
                                <div key={c.id} className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border flex-shrink-0">
                                        <User className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-lg text-foreground flex items-center gap-2">
                                            {c.name}
                                            {data.recommendation.winnerId === c.id && (
                                                <span title="Recommended"><Trophy className="w-3.5 h-3.5 text-amber-500" /></span>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground flex gap-3 mt-1">
                                            <span>Score: <strong className="text-foreground">{c.score}</strong></span>
                                            <span>Conf: <strong className="text-foreground">{c.confidence}%</strong></span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Scores Comparison */}
                        <div>
                            <h4 className="text-sm font-medium mb-4 text-center text-muted-foreground uppercase tracking-wider">Score Breakdown</h4>
                            <div className="space-y-4 max-w-lg mx-auto">
                                <ScoreBar 
                                    label="Overall Match" 
                                    id1={data.candidates[0].id} id2={data.candidates[1].id}
                                    score1={data.candidates[0].score} 
                                    score2={data.candidates[1].score} 
                                    winnerId={data.candidates[0].score > data.candidates[1].score ? data.candidates[0].id : data.candidates[1].score > data.candidates[0].score ? data.candidates[1].id : null}
                                />
                                {['Skills', 'Experience', 'Projects', 'Education'].map((metric) => {
                                    const b1 = data.breakdowns[data.candidates[0].id]
                                    const b2 = data.breakdowns[data.candidates[1].id]
                                    const s1 = b1?.radarData?.find((r: any) => r.subject === metric)?.A || 0
                                    const s2 = b2?.radarData?.find((r: any) => r.subject === metric)?.A || 0
                                    let winId = null
                                    if (s1 > s2) winId = data.candidates[0].id
                                    else if (s2 > s1) winId = data.candidates[1].id

                                    return (
                                        <ScoreBar 
                                            key={metric}
                                            label={metric}
                                            id1={data.candidates[0].id} id2={data.candidates[1].id}
                                            score1={s1}
                                            score2={s2}
                                            winnerId={winId}
                                        />
                                    )
                                })}
                            </div>
                        </div>

                        {/* Explanations Grid */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                            {data.candidates.map(c => {
                                const b = data.breakdowns[c.id]
                                return (
                                    <div key={c.id} className="space-y-3">
                                        <div className="text-sm font-semibold text-foreground px-2">AI Assessment</div>
                                        <div className="bg-muted/30 p-3 rounded-md border border-border/50 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap min-h-[120px]">
                                            {(b as any)?.explanation || "No explanation available."}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}

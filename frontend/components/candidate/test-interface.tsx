"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Clock, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export function TestInterface({ jobId, candidateId, duration, onComplete }: any) {
    const [questions, setQuestions] = useState<any[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [timeLeft, setTimeLeft] = useState(duration * 60)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [loaded, setLoaded] = useState(false)
    const [isCompleted, setIsCompleted] = useState(false)
    const [tabSwitches, setTabSwitches] = useState(0)
    const [warning, setWarning] = useState<string | null>(null)
    const submittedRef = useRef(false)

    // ── Load questions ────────────────────────────────────────────────────────
    useEffect(() => {
        const startTest = async () => {
            try {
                const res = await fetch(`/api/test/${jobId}/start`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ candidateId }),
                })
                const data = await res.json()
                setQuestions(data.questions || [])
            } catch (err) {
                console.error("Failed to load test", err)
                setQuestions([])
            } finally {
                setLoaded(true)
            }
        }
        startTest()
    }, []) // eslint-disable-line

    // ── Tab switch detection ──────────────────────────────────────────────────
    useEffect(() => {
        if (!loaded || isCompleted) return
        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") handleTabSwitch()
        }
        const handleBlur = () => handleTabSwitch()
        window.addEventListener("visibilitychange", handleVisibilityChange)
        window.addEventListener("blur", handleBlur)
        return () => {
            window.removeEventListener("visibilitychange", handleVisibilityChange)
            window.removeEventListener("blur", handleBlur)
        }
    }, [loaded, tabSwitches, isCompleted]) // eslint-disable-line

    const handleTabSwitch = () => {
        const newCount = tabSwitches + 1
        setTabSwitches(newCount)
        if (newCount === 2) {
            setWarning("⚠️ Warning: Leaving this tab is not allowed. Multiple violations will result in automatic submission.")
        } else if (newCount >= 5) {
            setWarning("❌ Test auto-submitted due to multiple tab switches.")
            submitTest(newCount)
        }
    }

    // ── Countdown ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!loaded || isCompleted) return
        if (timeLeft <= 0) {
            submitTest()
            return
        }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
        return () => clearInterval(timer)
    }, [timeLeft, loaded, isCompleted]) // eslint-disable-line

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60)
        const s = secs % 60
        return `${m}:${s < 10 ? "0" : ""}${s}`
    }

    const selectAnswer = (optionKey: string) => {
        const qId = questions[currentIndex].id
        setAnswers(prev => ({ ...prev, [qId]: optionKey }))
    }

    const submitAnswer = async (qId: string, answer: string) => {
        if (!answer) return
        try {
            await fetch(`/api/test/${jobId}/submit-answer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ candidateId, questionId: qId, answer }),
            })
        } catch { /* non-blocking */ }
    }

    const goNext = async () => {
        const q = questions[currentIndex]
        const answer = answers[q.id]
        await submitAnswer(q.id, answer)

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1)
        } else {
            await submitTest()
        }
    }

    const goPrev = () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1)
    }

    const submitTest = async (finalSwitchCount?: number) => {
        if (submittedRef.current) return
        submittedRef.current = true
        try {
            await fetch(`/api/test/${jobId}/submit-test`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    candidateId,
                    tabSwitchCount: finalSwitchCount !== undefined ? finalSwitchCount : tabSwitches,
                }),
            })
        } catch (err) {
            console.error("Submit test failed", err)
        }
        setIsCompleted(true)
    }

    // ── Completed ─────────────────────────────────────────────────────────────
    if (isCompleted) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-20 px-4 space-y-6 animate-in zoom-in-95 duration-500">
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-400 blur-[30px] opacity-20 rounded-full" />
                    <div className="relative h-24 w-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-xl ring-8 ring-emerald-50">
                        <CheckCircle2 className="h-12 w-12 text-white" strokeWidth={2.5} />
                    </div>
                </div>
                <div className="space-y-2">
                    <h2 className="text-[28px] font-extrabold text-slate-900 tracking-tight">Assessment Completed!</h2>
                    <p className="text-[16px] text-slate-500 max-w-md mx-auto leading-relaxed">
                        Your responses have been successfully recorded. You may close this window. We will review your application and get back to you soon.
                    </p>
                </div>
                <Button onClick={onComplete} size="lg" className="mt-8 rounded-full px-8 h-12 shadow-lg shadow-primary/20">
                    Return to Home
                </Button>
            </div>
        )
    }

    if (!loaded) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="relative h-12 w-12">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
                <p className="text-[15px] font-medium text-slate-500 animate-pulse">Initializing your assessment...</p>
            </div>
        )
    }

    if (questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-20 space-y-6">
                <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                    <AlertTriangle className="h-10 w-10 text-slate-400" />
                </div>
                <div>
                    <h2 className="text-[24px] font-bold text-slate-900">No Questions Found</h2>
                    <p className="text-[15px] text-slate-500 mt-2">There are no questions configured for this assessment.</p>
                </div>
                <Button onClick={() => submitTest()} size="lg" className="rounded-full px-8">
                    Complete Without Test
                </Button>
            </div>
        )
    }

    const currentQ = questions[currentIndex]
    const OPTION_KEYS = ["optionA", "optionB", "optionC", "optionD"]
    const OPTION_LABELS = ["A", "B", "C", "D"]

    return (
        <div className="space-y-8 max-w-3xl mx-auto w-full animate-in fade-in duration-500">
            {/* Warning banner */}
            {warning && (
                <div className="flex items-start gap-3 p-4 rounded-[12px] bg-amber-50 border border-amber-200 text-amber-800 shadow-sm animate-in slide-in-from-top-4">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
                    <p className="text-[14px] font-semibold flex-1 leading-snug">{warning}</p>
                    <button className="shrink-0 h-6 w-6 rounded-full flex items-center justify-center hover:bg-amber-100 transition-colors" onClick={() => setWarning(null)}>✕</button>
                </div>
            )}

            {/* Top Header Section */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-[16px] p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                        <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[12px] font-bold tracking-widest uppercase mb-1">
                            Question {currentIndex + 1} of {questions.length}
                        </span>
                    </div>
                    <div className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full font-bold text-[16px] tabular-nums transition-colors shadow-sm",
                        timeLeft < 60 
                            ? "bg-red-50 text-red-600 border border-red-200 animate-pulse" 
                            : "bg-slate-900 text-white"
                    )}>
                        <Clock className="h-4 w-4" />
                        {formatTime(timeLeft)}
                    </div>
                </div>
                
                {/* Custom Progress Bar */}
                <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                        className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-out rounded-full"
                        style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Question Card */}
            <Card className="border-0 shadow-xl shadow-slate-200/40 rounded-[24px] overflow-hidden bg-white">
                <CardContent className="p-8 sm:p-10 space-y-8">
                    <h3 className="text-[20px] sm:text-[22px] font-bold text-slate-900 leading-snug">
                        {currentQ.questionText}
                    </h3>
                    
                    <div className="space-y-4">
                        {OPTION_KEYS.map((optKey, i) => {
                            const isSelected = answers[currentQ.id] === optKey
                            return (
                                <div
                                    key={optKey}
                                    onClick={() => selectAnswer(optKey)}
                                    className={cn(
                                        "group flex items-center gap-4 p-4 sm:p-5 border-2 rounded-[16px] cursor-pointer transition-all duration-200",
                                        isSelected
                                            ? "border-primary bg-primary/[0.03] shadow-md shadow-primary/5 scale-[1.01]"
                                            : "border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                                    )}
                                >
                                    <div className={cn(
                                        "h-10 w-10 shrink-0 rounded-[10px] border-2 flex items-center justify-center text-[15px] font-bold transition-all",
                                        isSelected 
                                            ? "bg-primary border-primary text-white shadow-inner" 
                                            : "border-slate-200 text-slate-500 bg-white group-hover:border-slate-300 group-hover:bg-slate-100"
                                    )}>
                                        {OPTION_LABELS[i]}
                                    </div>
                                    <span className={cn(
                                        "text-[16px] sm:text-[17px] leading-snug", 
                                        isSelected ? "text-slate-900 font-semibold" : "text-slate-600 font-medium"
                                    )}>
                                        {currentQ[optKey]}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
                
                {/* Navigation Footer inside Card */}
                <div className="bg-slate-50/80 border-t border-slate-100 p-6 flex items-center justify-between">
                    <Button 
                        variant="ghost" 
                        className="h-12 px-6 rounded-full font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/50" 
                        onClick={goPrev} 
                        disabled={currentIndex === 0}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                    </Button>
                    
                    {/* Question dots navigator */}
                    <div className="hidden sm:flex justify-center gap-1.5 flex-wrap px-4">
                        {questions.map((q, i) => {
                            const isAnswered = !!answers[q.id];
                            const isCurrent = i === currentIndex;
                            return (
                                <button
                                    key={i}
                                    onClick={() => setCurrentIndex(i)}
                                    className={cn(
                                        "h-8 w-8 rounded-full text-[12px] font-bold transition-all border-2",
                                        isCurrent
                                            ? "bg-primary border-primary text-white scale-110 shadow-sm"
                                            : isAnswered
                                                ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                                                : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                                    )}
                                >
                                    {i + 1}
                                </button>
                            )
                        })}
                    </div>

                    <Button 
                        className={cn(
                            "h-12 px-8 rounded-full font-bold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]",
                            currentIndex === questions.length - 1 ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                        )} 
                        onClick={goNext}
                    >
                        {currentIndex === questions.length - 1 ? "Submit Test" : "Next Question"}
                        {currentIndex !== questions.length - 1 && <ArrowRight className="w-4 h-4 ml-2" />}
                    </Button>
                </div>
            </Card>
        </div>
    )
}

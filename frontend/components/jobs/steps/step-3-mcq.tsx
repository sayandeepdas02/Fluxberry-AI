"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { JobData } from "../job-wizard"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Trash2, Plus, BookOpen, X, Check, Search, Timer, Target, HelpCircle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { CURATED_QUESTION_BANK, BankQuestion, Difficulty } from "@/lib/question-bank"
import { cn } from "@/lib/utils"

interface StepProps {
    data: JobData
    updateData: (data: Partial<JobData>) => void
}

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
    Easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    Hard: "bg-red-50 text-red-700 border-red-200",
}

const ALL_CATEGORIES = Array.from(new Set(CURATED_QUESTION_BANK.map(q => q.category))).sort()

export function Step3MCQ({ data, updateData }: StepProps) {
    const [showBank, setShowBank] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | "All">("All")
    const [filterCategory, setFilterCategory] = useState<string>("All")
    const [searchQuery, setSearchQuery] = useState("")

    const alreadyAddedTexts = new Set(data.questions.map(q => q.text))

    const filteredBank = useMemo(() => {
        return CURATED_QUESTION_BANK.filter(q => {
            const matchesDifficulty = filterDifficulty === "All" || q.difficulty === filterDifficulty
            const matchesCategory = filterCategory === "All" || q.category === filterCategory
            const matchesSearch = q.text.toLowerCase().includes(searchQuery.toLowerCase())
            return matchesDifficulty && matchesCategory && matchesSearch
        })
    }, [filterDifficulty, filterCategory, searchQuery])

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    const addSelectedToJob = () => {
        const toAdd = CURATED_QUESTION_BANK
            .filter(q => selectedIds.has(q.id) && !alreadyAddedTexts.has(q.text))
            .map(q => ({
                text: q.text,
                options: q.options,
                correctAnswer: q.correctAnswer,
            }))
        updateData({ questions: [...data.questions, ...toAdd] })
        setSelectedIds(new Set())
        setShowBank(false)
    }

    const addQuestion = () => {
        updateData({
            questions: [...data.questions, { text: "", options: ["", "", "", ""], correctAnswer: "" }]
        })
    }

    const removeQuestion = (index: number) => {
        const q = [...data.questions]
        q.splice(index, 1)
        updateData({ questions: q })
    }

    const updateQuestion = (index: number, field: string, value: any) => {
        const q = [...data.questions]
        // @ts-ignore
        q[index][field] = value
        updateData({ questions: q })
    }

    const updateOption = (qIndex: number, optIndex: number, value: string) => {
        const q = [...data.questions]
        q[qIndex].options[optIndex] = value
        updateData({ questions: q })
    }

    if (!data.testEnabled) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 space-y-6 border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-[16px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-5 bg-white border border-slate-100 shadow-sm rounded-full">
                    <BookOpen className="h-10 w-10 text-primary/80" />
                </div>
                <div className="text-center max-w-md">
                    <h3 className="font-semibold text-[20px] text-slate-900">Enable Skill Assessment</h3>
                    <p className="text-muted-foreground text-[15px] mb-8 mt-2 leading-relaxed">
                        Add an automated MCQ test to screen candidates before the interview. Filter out unqualified candidates effortlessly.
                    </p>
                    <Button onClick={() => updateData({ testEnabled: true })} className="h-11 px-8 rounded-full font-medium shadow-sm">
                        Enable Skill Assessment
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header toggle */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Skill Assessment</h2>
                    <p className="text-sm text-muted-foreground mt-1">Configure test parameters and questions.</p>
                </div>
                <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-full shadow-sm">
                    <Label className="font-medium text-slate-700 cursor-pointer" htmlFor="test-toggle">Enabled</Label>
                    <Switch id="test-toggle" checked={data.testEnabled} onCheckedChange={(c) => updateData({ testEnabled: c })} />
                </div>
            </div>

            {/* Duration & Passing Score */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-[16px] border border-slate-100">
                <div className="space-y-2.5">
                    <Label className="font-medium text-slate-700 flex items-center gap-2">
                        <Timer className="h-4 w-4 text-slate-400" />
                        Test Duration (Minutes)
                    </Label>
                    <Input
                        type="number"
                        value={isNaN(data.testDuration) ? "" : data.testDuration}
                        onChange={(e) => {
                            const val = parseInt(e.target.value)
                            updateData({ testDuration: isNaN(val) ? 0 : val })
                        }}
                        className="h-11 bg-white border-slate-200 focus-visible:ring-primary/20 rounded-[10px]"
                    />
                </div>
                <div className="space-y-2.5">
                    <Label className="font-medium text-slate-700 flex items-center gap-2">
                        <Target className="h-4 w-4 text-slate-400" />
                        Passing Score (%)
                    </Label>
                    <Input
                        type="number"
                        value={isNaN(data.passingScore) ? "" : data.passingScore}
                        onChange={(e) => {
                            const val = parseInt(e.target.value)
                            updateData({ passingScore: isNaN(val) ? 0 : val })
                        }}
                        className="h-11 bg-white border-slate-200 focus-visible:ring-primary/20 rounded-[10px]"
                    />
                </div>
            </div>

            {/* Questions Header */}
            <div className="space-y-6 pt-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-[18px] text-slate-900">Questions</h3>
                        <span className="bg-primary/10 text-primary font-semibold text-[13px] px-2.5 py-0.5 rounded-full">
                            {data.questions.length} Added
                        </span>
                    </div>
                    <div className="flex gap-3">
                        <Button size="sm" variant="outline" onClick={() => setShowBank(true)} className="h-9 rounded-full border-primary/20 text-primary hover:bg-primary/5">
                            <BookOpen className="h-4 w-4 mr-2" /> Browse Question Bank
                        </Button>
                        <Button size="sm" variant="default" onClick={addQuestion} className="h-9 rounded-full shadow-sm">
                            <Plus className="h-4 w-4 mr-2" /> Add Manually
                        </Button>
                    </div>
                </div>

                {/* Manual questions list */}
                <div className="space-y-6">
                    {data.questions.length === 0 && (
                        <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed border-slate-200 rounded-[16px] bg-slate-50/50">
                            <HelpCircle className="h-10 w-10 text-slate-300 mb-4" />
                            <p className="text-slate-600 font-medium">No questions added yet</p>
                            <p className="text-slate-500 text-sm mt-1">Browse our curated bank or create your own.</p>
                        </div>
                    )}
                    {data.questions.map((q, i) => (
                        <div key={i} className="flex flex-col gap-5 bg-white border border-slate-200 rounded-[16px] p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-[13px] uppercase tracking-wider text-slate-500">
                                    Question {i + 1}
                                </span>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => removeQuestion(i)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <Textarea
                                placeholder="Enter question text here..."
                                value={q.text}
                                onChange={(e) => updateQuestion(i, "text", e.target.value)}
                                className="resize-none bg-slate-50/50 border-slate-200 focus-visible:bg-white focus-visible:ring-primary/20 rounded-[10px] text-[15px] font-medium"
                                rows={2}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {q.options.map((opt, optIndex) => {
                                    const label = ["A", "B", "C", "D"][optIndex]
                                    const isCorrect = q.correctAnswer === opt && opt.length > 0
                                    return (
                                        <div key={optIndex} className={cn(
                                            "flex items-center space-x-3 bg-white border rounded-[10px] p-2 pr-4 transition-all focus-within:ring-2 focus-within:ring-primary/20",
                                            isCorrect ? "border-emerald-500 bg-emerald-50/30" : "border-slate-200 hover:border-slate-300"
                                        )}>
                                            <div className={cn(
                                                "h-8 w-8 shrink-0 rounded-[8px] border flex items-center justify-center text-[13px] font-bold transition-colors cursor-pointer",
                                                isCorrect ? "bg-emerald-500 border-emerald-500 text-white" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                                            )} onClick={() => updateQuestion(i, "correctAnswer", opt)}>
                                                {label}
                                            </div>
                                            <Input
                                                placeholder={`Option ${label}`}
                                                value={opt}
                                                onChange={(e) => {
                                                    const oldVal = opt;
                                                    updateOption(i, optIndex, e.target.value);
                                                    if (isCorrect) updateQuestion(i, "correctAnswer", e.target.value);
                                                }}
                                                className="h-10 border-transparent shadow-none focus-visible:ring-0 bg-transparent px-0 font-medium text-slate-700"
                                            />
                                            <div className="flex items-center h-full pl-3 border-l border-slate-100">
                                                <div 
                                                    onClick={() => updateQuestion(i, "correctAnswer", opt)}
                                                    className={cn(
                                                        "h-5 w-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors",
                                                        isCorrect ? "border-emerald-500 bg-emerald-500" : "border-slate-300 bg-white"
                                                    )}
                                                >
                                                    {isCorrect && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Question Bank Side Panel ──────────────────────────────────── */}
            {showBank && (
                <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowBank(false)} />
                    <div className="relative w-full max-w-[640px] bg-white h-full ml-auto flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    Question Bank
                                </h2>
                                <p className="text-[13px] text-slate-500 mt-1 font-medium">Select from 50 curated technical questions</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100" onClick={() => setShowBank(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Filters */}
                        <div className="px-6 py-4 border-b border-slate-100 shrink-0 space-y-4 bg-slate-50/80">
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by keyword..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-[10px] border border-slate-200 bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all"
                                />
                            </div>

                            <div className="flex gap-2.5 flex-wrap items-center">
                                {(["All", "Easy", "Medium", "Hard"] as const).map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setFilterDifficulty(d)}
                                        className={cn(
                                            "px-4 py-1.5 rounded-full text-[13px] font-semibold border transition-all",
                                            filterDifficulty === d
                                                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                        )}
                                    >
                                        {d}
                                    </button>
                                ))}
                                <span className="w-px h-6 bg-slate-200 mx-1" />
                                <select
                                    value={filterCategory}
                                    onChange={e => setFilterCategory(e.target.value)}
                                    className="pl-4 pr-8 py-1.5 rounded-full text-[13px] font-semibold border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm"
                                >
                                    <option value="All">All Topics</option>
                                    {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Question list */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                            {filteredBank.length === 0 && (
                                <div className="text-center py-16">
                                    <Search className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium text-[15px]">No questions found</p>
                                </div>
                            )}
                            {filteredBank.map(q => {
                                const isSelected = selectedIds.has(q.id)
                                const isAlreadyAdded = alreadyAddedTexts.has(q.text)
                                return (
                                    <div
                                        key={q.id}
                                        onClick={() => !isAlreadyAdded && toggleSelect(q.id)}
                                        className={cn(
                                            "rounded-[12px] border p-5 cursor-pointer transition-all select-none group",
                                            isAlreadyAdded
                                                ? "opacity-50 cursor-not-allowed bg-slate-100 border-slate-200"
                                                : isSelected
                                                    ? "border-primary bg-primary/[0.03] ring-1 ring-primary shadow-sm"
                                                    : "hover:border-slate-300 bg-white shadow-sm hover:shadow"
                                        )}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={cn(
                                                "mt-1 h-5 w-5 shrink-0 rounded-[6px] border-2 flex items-center justify-center transition-colors",
                                                isSelected ? "bg-primary border-primary" : "border-slate-300 group-hover:border-slate-400"
                                            )}>
                                                {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3.5} />}
                                                {isAlreadyAdded && <Check className="h-3 w-3 text-slate-400" strokeWidth={3.5} />}
                                            </div>

                                            <div className="flex-1 min-w-0 space-y-3">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={cn(
                                                        "text-[11px] font-bold px-2 py-0.5 rounded-md border tracking-wide uppercase",
                                                        DIFFICULTY_COLORS[q.difficulty]
                                                    )}>
                                                        {q.difficulty}
                                                    </span>
                                                    <span className="text-[12px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{q.category}</span>
                                                    {isAlreadyAdded && (
                                                        <span className="text-[12px] font-semibold text-slate-400 italic ml-auto">Already added</span>
                                                    )}
                                                </div>
                                                <p className="text-[15px] font-semibold text-slate-900 leading-snug">{q.text}</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {q.options.map((opt, i) => {
                                                        const isCorrect = opt === q.correctAnswer;
                                                        return (
                                                            <div key={i} className={cn(
                                                                "flex items-start gap-2 text-[13px] px-3 py-2 rounded-[8px] border transition-colors",
                                                                isCorrect ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-slate-50 border-transparent text-slate-600"
                                                            )}>
                                                                <span className={cn("font-bold", isCorrect ? "text-emerald-600" : "text-slate-400")}>
                                                                    {["A", "B", "C", "D"][i]}.
                                                                </span>
                                                                <span className={isCorrect ? "font-semibold" : "font-medium"}>{opt}</span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Footer CTA */}
                        <div className="px-6 py-5 border-t border-slate-100 bg-white flex items-center justify-between shrink-0 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)]">
                            <div className="flex flex-col">
                                <span className="text-[14px] font-semibold text-slate-900">
                                    {selectedIds.size} selected
                                </span>
                                <span className="text-[12px] text-slate-500">Ready to add</span>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="rounded-full px-6" onClick={() => { setSelectedIds(new Set()); setShowBank(false) }}>
                                    Cancel
                                </Button>
                                <Button
                                    disabled={selectedIds.size === 0}
                                    onClick={addSelectedToJob}
                                    className="rounded-full px-8 shadow-sm"
                                >
                                    Add Questions
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

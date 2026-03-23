"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { JobData } from "../job-wizard"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Sparkles, Trash2, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { QUESTION_TEMPLATES } from "@/lib/question-bank"

interface StepProps {
    data: JobData
    updateData: (data: Partial<JobData>) => void
}

export function Step3MCQ({ data, updateData }: StepProps) {

    const generateQuestions = () => {
        const role = data.roleType || "Frontend" // Default fallback
        let targetBank = QUESTION_TEMPLATES[role]
        
        // If not found, create a mixed bank from available categories
        if (!targetBank) {
            targetBank = [
                ...(QUESTION_TEMPLATES["Frontend"] || []),
                ...(QUESTION_TEMPLATES["Backend"] || []),
                ...(QUESTION_TEMPLATES["Data Structures & Algorithms"] || [])
            ]
        }
        
        // Shuffle and pick 5 matching questions
        const shuffled = [...targetBank].sort(() => 0.5 - Math.random())
        const newQuestions = shuffled.slice(0, 5)

        updateData({ questions: [...data.questions, ...newQuestions] })
    }

    const addQuestion = () => {
        updateData({
            questions: [...data.questions, { text: "", options: ["", "", "", ""], correctAnswer: "0" }] // 0 index for A
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
            <div className="flex flex-col items-center justify-center py-16 space-y-4 border border-dashed border-slate-200 bg-slate-50/50 rounded-[12px]">
                <div className="p-4 bg-white border shadow-sm rounded-full">
                    <Sparkles className="h-8 w-8 text-primary/80" />
                </div>
                <div className="text-center">
                    <h3 className="font-semibold text-[18px] text-slate-800">Enable Skill Assessment</h3>
                    <p className="text-muted-foreground text-[14px] max-w-sm mb-6 mt-1">
                        Add an automated Multiple Choice Question test to screen candidates effectively before the interview.
                    </p>
                    <Button onClick={() => updateData({ testEnabled: true })}>
                        Enable Test
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between border-b pb-6">
                <div className="flex items-center space-x-3">
                    <Switch checked={data.testEnabled} onCheckedChange={(c) => updateData({ testEnabled: c })} />
                    <Label className="font-medium text-slate-700">Enable Test Configuration</Label>
                </div>
                {data.testEnabled && (
                    <Button variant="secondary" size="sm" onClick={generateQuestions}>
                        <Sparkles className="h-4 w-4 mr-2 text-primary" /> Auto-Generate Questions
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                    <Label className="font-medium text-slate-700">Test Duration (Minutes)</Label>
                    <Input
                        type="number"
                        value={data.testDuration}
                        onChange={(e) => updateData({ testDuration: parseInt(e.target.value) })}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <Label className="font-medium text-slate-700">Passing Score (%)</Label>
                    <Input
                        type="number"
                        value={data.passingScore}
                        onChange={(e) => updateData({ passingScore: parseInt(e.target.value) })}
                    />
                </div>
            </div>

            <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-[16px] text-slate-800">Questions ({data.questions.length})</h3>
                    <Button size="sm" variant="outline" onClick={addQuestion}>
                        <Plus className="h-4 w-4 mr-2" /> Add Manually
                    </Button>
                </div>

                <div className="space-y-6">
                    {data.questions.map((q, i) => (
                        <div key={i} className="flex flex-col gap-4 bg-card border rounded-[12px] p-6 shadow-sm">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-[14px] bg-slate-100 text-slate-700 px-3 py-1 rounded-[6px] tracking-wide">Question {i + 1}</span>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 text-destructive" onClick={() => removeQuestion(i)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>

                            <Textarea
                                placeholder="Enter question text..."
                                value={q.text}
                                onChange={(e) => updateQuestion(i, "text", e.target.value)}
                                className="mb-2"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {q.options.map((opt, optIndex) => (
                                    <div key={optIndex} className="flex items-center space-x-3 bg-background border rounded-[8px] p-2 pr-4 shadow-sm">
                                        <div className={`h-[32px] w-[32px] shrink-0 rounded-[6px] border flex items-center justify-center text-[12px] font-semibold transition-colors
                                            ${q.correctAnswer === ["A", "B", "C", "D"][optIndex] || q.correctAnswer === q.options[optIndex]
                                                ? "bg-primary border-primary text-white" : "bg-slate-50 text-slate-500"}`}>
                                            {["A", "B", "C", "D"][optIndex]}
                                        </div>
                                        <Input
                                            placeholder={`Option ${optIndex + 1}`}
                                            value={opt}
                                            onChange={(e) => updateOption(i, optIndex, e.target.value)}
                                            className="h-[36px] border-transparent shadow-none focus-visible:ring-0 bg-transparent px-0"
                                        />
                                        <div className="flex items-center h-full pl-2 border-l">
                                            <input
                                                type="radio"
                                                name={`correct-${i}`}
                                                checked={q.correctAnswer === opt}
                                                onChange={() => updateQuestion(i, "correctAnswer", opt)}
                                                className="h-4 w-4 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

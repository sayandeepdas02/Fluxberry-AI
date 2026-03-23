"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group" // If available

export function TestInterface({ jobId, candidateId, duration, onComplete }: any) {
    const [questions, setQuestions] = useState<any[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [timeLeft, setTimeLeft] = useState(duration * 60)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [loaded, setLoaded] = useState(false)
    const [isCompleted, setIsCompleted] = useState(false)

    const [tabSwitches, setTabSwitches] = useState(0)

    useEffect(() => {
        // Fetch questions (In real app, fetch one by one or all masked)
        const startTest = async () => {
            const res = await fetch(`/api/test/${jobId}/start`, {
                method: "POST",
                body: JSON.stringify({ candidateId })
            })
            const data = await res.json()
            setQuestions(data.questions)
            setLoaded(true)
        }
        startTest()
    }, [])

    useEffect(() => {
        if (!loaded) return

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                handleTabSwitch();
            }
        };

        const handleBlur = () => {
            handleTabSwitch();
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
        };
    }, [loaded, tabSwitches]);

    const handleTabSwitch = () => {
        const newCount = tabSwitches + 1;
        setTabSwitches(newCount);

        if (newCount === 2) {
            alert("⚠️ Warning: Please do not switch tabs or leave this window. Doing so again may automatically submit your test.");
        } else if (newCount >= 5) {
            alert("❌ Test Auto-Submitted due to multiple tab switches.");
            submitTest(newCount);
        }
    };

    useEffect(() => {
        if (!loaded) return
        if (timeLeft <= 0) {
            submitTest()
            return
        }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
        return () => clearInterval(timer)
    }, [timeLeft, loaded])

    const submitAnswer = async (answer: string) => {
        // Optimistic update
        setAnswers(prev => ({ ...prev, [currentQ.id]: answer }))
    }

    const nextQuestion = async () => {
        const currentAnswer = answers[questions[currentIndex].id]
        if (currentAnswer) {
            await fetch(`/api/test/${jobId}/submit-answer`, {
                method: "POST",
                body: JSON.stringify({
                    candidateId,
                    questionId: questions[currentIndex].id,
                    answer: currentAnswer
                })
            })
        }

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1)
        } else {
            submitTest()
        }
    }

    const previousQuestion = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1)
        }
    }

    const submitTest = async (finalSwitchCount?: number) => {
        // Final submission
        const res = await fetch(`/api/test/${jobId}/submit-test`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                candidateId,
                tabSwitchCount: finalSwitchCount !== undefined ? finalSwitchCount : tabSwitches
            })
        })
        const result = await res.json()
        setIsCompleted(true)
    }

    const formatTime = (secs: number) => {
        const minutes = Math.floor(secs / 60)
        const seconds = secs % 60
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
    }

    if (!loaded) return <div className="text-center py-12">Loading Test...</div>

    if (isCompleted) {
        return (
            <div className="text-center py-12 space-y-4">
                <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">Test Submitted Successfully</h2>
                <p className="text-lg text-gray-500 max-w-sm mx-auto">Your responses have been recorded securely. The recruiter will review your application and test results shortly.</p>
                <div className="pt-6">
                    <Button onClick={onComplete} size="lg" className="w-full max-w-xs">Return to Application</Button>
                </div>
            </div>
        )
    }

    if (questions.length === 0) {
        return (
            <div className="text-center py-12 space-y-4">
                <h2 className="text-2xl font-bold">Test Not Configured</h2>
                <p className="text-gray-500">There are no questions available for this test.</p>
                <Button onClick={() => submitTest()} className="mt-4">Submit Empty Test</Button>
            </div>
        )
    }

    const currentQ = questions[currentIndex]

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex justify-between items-center text-sm font-medium">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span className={timeLeft < 60 ? "text-red-500" : "text-gray-900"}>Time Left: {formatTime(timeLeft)}</span>
            </div>
            <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-1" />

            <Card>
                <CardContent className="pt-6 space-y-6">
                    <h3 className="text-lg font-medium">{currentQ.questionText}</h3>
                    <div className="space-y-3">
                        {["A", "B", "C", "D"].map((opt, i) => {
                            const optionKey = ["optionA", "optionB", "optionC", "optionD"][i]
                            const isSelected = answers[currentQ.id] === optionKey
                            return (
                                <div
                                    key={opt}
                                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all hover:bg-muted font-medium ${isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : ""}`}
                                    onClick={() => submitAnswer(optionKey)}
                                >
                                    <div className={`h-6 w-6 rounded-full border mr-3 flex items-center justify-center text-xs transition-colors ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-gray-300 text-gray-500"}`}>
                                        {opt}
                                    </div>
                                    <span className={isSelected ? "text-primary" : "text-gray-700"}>{currentQ[optionKey]}</span>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            <div className="flex gap-4 pt-4 border-t">
                {currentIndex > 0 && (
                    <Button variant="outline" className="w-full" onClick={previousQuestion}>
                        Previous Question
                    </Button>
                )}
                <Button className="w-full" onClick={nextQuestion}>
                    {currentIndex === questions.length - 1 ? "Submit Test" : "Next Question"}
                </Button>
            </div>
        </div>
    )
}

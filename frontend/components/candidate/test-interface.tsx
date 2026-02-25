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
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
    const [loaded, setLoaded] = useState(false)
    const [score, setScore] = useState<number | null>(null)

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
        setSelectedAnswer(answer)
    }

    const nextQuestion = async () => {
        if (selectedAnswer) {
            await fetch(`/api/test/${jobId}/submit-answer`, {
                method: "POST",
                body: JSON.stringify({
                    candidateId,
                    questionId: questions[currentIndex].id,
                    answer: selectedAnswer
                })
            })
        }

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1)
            setSelectedAnswer(null)
        } else {
            submitTest()
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
        setScore(result.score)
    }

    const formatTime = (secs: number) => {
        const minutes = Math.floor(secs / 60)
        const seconds = secs % 60
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
    }

    if (!loaded) return <div className="text-center py-12">Loading Test...</div>

    if (score !== null) {
        return (
            <div className="text-center py-12 space-y-4">
                <h2 className="text-2xl font-bold">Test Completed</h2>
                <p className="text-xl">Your Score: {score}%</p>
                <div className="w-full max-w-xs mx-auto">
                    <Progress value={score} className="h-2" />
                </div>
                <Button onClick={onComplete} className="mt-4">Return to Application</Button>
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
                        {["A", "B", "C", "D"].map((opt, i) => (
                            <div
                                key={opt}
                                className={`flex items-center p-3 border rounded-md cursor-pointer hover:bg-muted ${selectedAnswer === ["optionA", "optionB", "optionC", "optionD"][i] ? "border-primary bg-primary/5" : ""}`}
                                onClick={() => setSelectedAnswer(["optionA", "optionB", "optionC", "optionD"][i])} // Very simple mapping for demo
                            >
                                <div className={`h-6 w-6 rounded-full border mr-3 flex items-center justify-center text-xs ${selectedAnswer === ["optionA", "optionB", "optionC", "optionD"][i] ? "bg-primary text-primary-foreground" : ""}`}>
                                    {opt}
                                </div>
                                <span>{currentQ[`option${opt}`]}</span> {/* This assumes data shape match, simplified */}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Button className="w-full" onClick={nextQuestion}>
                {currentIndex === questions.length - 1 ? "Submit Test" : "Next Question"}
            </Button>
        </div>
    )
}

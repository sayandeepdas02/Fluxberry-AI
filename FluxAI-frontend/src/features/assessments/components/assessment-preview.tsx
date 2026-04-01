"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Camera, Check, Clock, Globe, Laptop, Mic, Monitor, ShieldCheck, Wifi } from "lucide-react"
import Link from "next/link"

export function AssessmentPreview({ assessmentId }: { assessmentId: string }) {
    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-4xl space-y-8">

                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold uppercase tracking-wider">
                        <Monitor className="w-3 h-3" /> Preview Mode
                    </div>
                    <h1 className="text-3xl tracking-tight text-neutral-900">Senior Frontend Engineer Assessment</h1>
                    <p className="text-neutral-500 max-w-lg mx-auto">
                        Welcome, Candidate. This assessment evaluates your technical skills through a series of timed challenges.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Instructions */}
                    <Card className="md:col-span-2 border-neutral-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Assessment Structure</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* Round 1 */}
                            <div className="flex gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-100">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded h-fit">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-neutral-900">Round 1: Technical MCQ</h4>
                                    <p className="text-sm text-neutral-500 mt-1">30 Questions • 45 Minutes</p>
                                    <p className="text-sm text-neutral-600 mt-2">
                                        Multiple choice questions covering HTML, CSS, JavaScript, and React fundamentals.
                                    </p>
                                </div>
                            </div>

                            {/* Round 2 */}
                            <div className="flex gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-100">
                                <div className="p-2 bg-green-100 text-green-600 rounded h-fit">
                                    <Laptop className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-neutral-900">Round 2: Hands-on Coding</h4>
                                    <p className="text-sm text-neutral-500 mt-1">4 Problems • 60 Minutes</p>
                                    <p className="text-sm text-neutral-600 mt-2">
                                        Solve Data Structures & Algorithms problems in your preferred language.
                                    </p>
                                </div>
                            </div>

                            {/* Round 3 */}
                            <div className="flex gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-100">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded h-fit">
                                    <Camera className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-neutral-900">Round 3: AI Video Interview</h4>
                                    <p className="text-sm text-neutral-500 mt-1">5 Questions • 15 Minutes</p>
                                    <p className="text-sm text-neutral-600 mt-2">
                                        Answer behavioral and scenario-based questions via video recording.
                                    </p>
                                </div>
                            </div>

                        </CardContent>
                    </Card>

                    {/* Proctoring Checks */}
                    <div className="space-y-6">
                        <Card className="border-neutral-200 shadow-sm h-full">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-green-600" />
                                    System Check
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        <Camera className="w-4 h-4" />
                                    </div>
                                    <span className="flex-1">Camera Access</span>
                                    <Check className="w-4 h-4 text-green-600" />
                                </div>

                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        <Mic className="w-4 h-4" />
                                    </div>
                                    <span className="flex-1">Microphone Access</span>
                                    <Check className="w-4 h-4 text-green-600" />
                                </div>

                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        <Monitor className="w-4 h-4" />
                                    </div>
                                    <span className="flex-1">Fullscreen Mode</span>
                                    <Check className="w-4 h-4 text-green-600" />
                                </div>

                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        <Wifi className="w-4 h-4" />
                                    </div>
                                    <span className="flex-1">Network Stability</span>
                                    <Check className="w-4 h-4 text-green-600" />
                                </div>

                                <div className="pt-4 border-t border-neutral-100">
                                    <div className="bg-amber-50 text-amber-800 p-3 rounded text-xs leading-relaxed flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <span>
                                            <strong>Proctoring is active.</strong> Tab switching, copy-pasting, and multiple monitors are monitored.
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="flex justify-center pt-8">
                    <Button size="lg" className="w-full md:w-auto px-12 h-12 text-base rounded-full" disabled>
                        Start Assessment (Preview)
                    </Button>
                </div>
                <div className="text-center">
                    <Button variant="link" className="text-neutral-500 hover:text-neutral-900" asChild>
                        <Link href={`/dashboard/assessments/${assessmentId}/configure`}>
                            Exit Preview
                        </Link>
                    </Button>
                </div>

            </div>
        </div>
    )
}

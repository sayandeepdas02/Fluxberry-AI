"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShieldAlert, Play } from "lucide-react"
import Link from "next/link"

export function StartStep({ assessmentId }: { assessmentId: string }) {
    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">

                {/* Header */}
                <div className="border-b border-neutral-100 p-8 text-center bg-white">
                    <div className="flex justify-center mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-neutral-900 rounded flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white">F</span>
                            </div>
                            <span className="font-semibold text-neutral-900">Flux AI</span>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-2">
                        Senior Frontend Engineer Assessment
                    </h1>
                    <p className="text-neutral-500 text-sm">
                        Created by <span className="font-medium text-neutral-900">Acme Corp</span> • 2 hours approx
                    </p>
                </div>

                <div className="p-8 space-y-8">

                    {/* Intro */}
                    <div className="text-center max-w-lg mx-auto">
                        <p className="text-neutral-600 leading-relaxed text-sm">
                            Welcome! This assessment is designed to evaluate your technical skills and problem-solving abilities. Please ensure you are in a quiet environment with a stable internet connection.
                        </p>
                    </div>

                    {/* Rounds */}
                    <div className="space-y-3">
                        <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider text-center mb-4">Assessment Rounds</div>

                        <div className="flex gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-100 items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold font-mono">1</div>
                            <div className="flex-1">
                                <h4 className="font-medium text-neutral-900 text-sm">Technical MCQ</h4>
                                <p className="text-xs text-neutral-500 mt-0.5">30 Questions • 45m</p>
                            </div>
                            <Badge variant="outline" className="bg-white">Technical</Badge>
                        </div>

                        <div className="flex gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-100 items-center">
                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold font-mono">2</div>
                            <div className="flex-1">
                                <h4 className="font-medium text-neutral-900 text-sm">Hands-on Coding</h4>
                                <p className="text-xs text-neutral-500 mt-0.5">4 Problems • 60m</p>
                            </div>
                            <Badge variant="outline" className="bg-white">Practical</Badge>
                        </div>

                        <div className="flex gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-100 items-center">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold font-mono">3</div>
                            <div className="flex-1">
                                <h4 className="font-medium text-neutral-900 text-sm">AI Video Interview</h4>
                                <p className="text-xs text-neutral-500 mt-0.5">5 Questions • 15m</p>
                            </div>
                            <Badge variant="outline" className="bg-white">Behavioral</Badge>
                        </div>
                    </div>

                    {/* Rules */}
                    <div className="bg-amber-50 text-amber-900 p-4 rounded-lg text-sm border border-amber-100 flex gap-3 items-start">
                        <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-semibold">Proctoring Enabled</p>
                            <p className="opacity-90 text-xs leading-relaxed">
                                This assessment monitors full-screen activity, browser tab switching, and utilizes your camera and microphone. Leaving the assessment window may effect your score.
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-center">
                        <Button size="lg" className="w-full md:w-auto px-12 h-12 text-base shadow-sm group" asChild>
                            <Link href={`/assessment/${assessmentId}/system-check`}>
                                Start Assessment <Play className="w-4 h-4 ml-2 fill-current opacity-60 group-hover:opacity-100 transition-opacity" />
                            </Link>
                        </Button>
                    </div>

                </div>

                {/* Footer */}
                <div className="bg-neutral-50 p-4 text-center text-xs text-neutral-400 border-t border-neutral-100">
                    Powered by FluxAI • Privacy Policy • Terms of Service
                </div>
            </div>
        </div>
    )
}

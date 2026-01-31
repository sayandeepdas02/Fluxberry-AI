"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Clock, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export function SecureShell({
    children,
    title,
    roundIndex,
    roundTotal,
    duration,
}: {
    children: React.ReactNode,
    title: string,
    roundIndex: number,
    roundTotal: number,
    duration: string,

}) {
    const [warnings, setWarnings] = useState(0)

    // Mock random proctoring events
    useEffect(() => {
        const timer = setInterval(() => {
            if (Math.random() > 0.8) {
                setWarnings(w => Math.min(w + 1, 3))
            }
        }, 15000)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
            {/* Top Bar */}
            <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-neutral-900 rounded flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white">F</span>
                        </div>
                        <span className="font-semibold text-neutral-900 text-sm hidden sm:inline-block">Senior Frontend Engineer</span>
                    </div>
                    <div className="h-6 w-px bg-neutral-200" />
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Badge variant="outline" className="bg-neutral-50 font-normal">Round {roundIndex} of {roundTotal}</Badge>
                        <span className="font-medium text-neutral-900">{title}</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-full">
                        <Clock className="w-4 h-4" />
                        <span className="font-mono text-sm font-medium">{duration}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium px-2 py-1 bg-green-50 rounded border border-green-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Camera ON
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium px-2 py-1 bg-green-50 rounded border border-green-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Mic ON
                        </div>
                    </div>

                    {/* Help Drawer */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-neutral-900">
                                <AlertCircle className="w-5 h-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Assessment Support</SheetTitle>
                                <SheetDescription>
                                    Common issues and contact information.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="py-6 space-y-6 text-sm">
                                <div className="space-y-2">
                                    <h4 className="font-medium text-neutral-900">Connectivity Issues</h4>
                                    <p className="text-neutral-500">If your internet disconnects, the assessment timer will continue. Reconnect as soon as possible and resume.</p>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-medium text-neutral-900">Proctoring Warnings</h4>
                                    <p className="text-neutral-500">Switching tabs or leaving full-screen mode will trigger a warning. Multiple warnings may be flagged to the recruiter.</p>
                                </div>
                                <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100 mt-4">
                                    <p className="font-medium text-neutral-900">Contact Recruiter</p>
                                    <p className="text-neutral-500 text-xs mt-1">support@example.com</p>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>

                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative">
                {/* Proctoring Feedback Toasts */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50 pointer-events-none">
                    {warnings > 0 && (
                        <div className="bg-amber-50 text-amber-800 border border-amber-200 px-4 py-2 rounded-full text-xs font-medium shadow-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-3 h-3" />
                            Warning: Face not clearly visible ({warnings}/3)
                        </div>
                    )}
                </div>
                {children}
            </main>
        </div>
    )
}

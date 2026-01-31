"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Camera, User, BadgeCheck, Shield, ChevronRight, FileText } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export function IdentityCheckStep({ assessmentId }: { assessmentId: string }) {
    const [confirmed, setConfirmed] = useState(false)

    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-4xl bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col md:flex-row">

                {/* Left: Camera Preview */}
                <div className="w-full md:w-1/2 bg-black p-6 flex flex-col justify-between relative overflow-hidden group">
                    {/* Mock Camera Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60 z-10" />

                    <div className="relative z-20 flex justify-between items-start">
                        <Badge variant="outline" className="bg-white/10 text-white border-white/20 backdrop-blur-md">
                            <Camera className="w-3 h-3 mr-2" /> Live Preview
                        </Badge>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center">
                        <Camera className="w-16 h-16 text-white/10" />
                    </div>

                    <div className="relative z-20 text-center">
                        <p className="text-white/60 text-xs mb-2">Ensure your face is clearly visible</p>
                        <div className="w-48 h-48 border-2 border-white/20 rounded-full mx-auto relative">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-white/50" />
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-white/50" />
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-white/50" />
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-white/50" />
                        </div>
                    </div>
                </div>

                {/* Right: Confirmation */}
                <div className="w-full md:w-1/2 p-8 flex flex-col">
                    <div className="flex-1 space-y-6">
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Confirm Identity</h1>
                            <p className="text-neutral-500 text-sm">
                                Please confirm your details before starting the secure assessment.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-100">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">Candidate Name</label>
                                    <p className="font-medium text-neutral-900">Arjun K.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-100">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                                    <BadgeCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">Verification Status</label>
                                    <div className="flex items-center gap-1.5 text-green-600 font-medium text-sm">
                                        <BadgeCheck className="w-4 h-4" /> System Check Passed
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Resume (Optional)</Label>
                                <div className="border-2 border-dashed border-neutral-200 rounded-lg p-6 text-center hover:bg-neutral-50 transition-colors cursor-pointer group">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                                            <FileText className="w-4 h-4 text-neutral-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-neutral-700">Upload Resume</p>
                                            <p className="text-xs text-neutral-400">PDF, DOCX up to 5MB</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-50 rounded-lg p-4 border border-amber-100 flex gap-3">
                            <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-amber-900">Identity Verification</p>
                                <p className="text-xs text-amber-800 leading-relaxed">
                                    A photo will be captured at the start of the assessment to verify your identity against your application.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-neutral-100">
                        <Button
                            size="lg"
                            className="w-full h-12 text-base"
                            onClick={() => setConfirmed(true)}
                            asChild
                        >
                            <Link href={`/assessment/${assessmentId}/round/1`}>
                                Confirm & Start Round 1 <ChevronRight className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    )
}

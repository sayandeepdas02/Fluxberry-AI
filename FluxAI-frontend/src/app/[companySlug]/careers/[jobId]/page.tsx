"use client"

import { useState, use } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, MapPin, Briefcase, Clock, Upload, CheckCircle2, Building } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePublicJob } from "@/features/public/hooks/use-public-job"

export default function JobApplicationPage({ params }: { params: Promise<{ companySlug: string, jobId: string }> }) {
    const { companySlug, jobId } = use(params);
    const { job, company, isLoading, error } = usePublicJob(companySlug, jobId)
    const [activeTab, setActiveTab] = useState<"details" | "form">("details")

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-zinc-50 text-zinc-600">Loading job details...</div>
    }

    if (error || !job || !company) {
        return <div className="min-h-screen flex items-center justify-center bg-zinc-50 text-red-600">Job not found or error loading page.</div>
    }

    // Fallback if description is plain text
    const descriptionHtml = job.description || '<p>No description provided.</p>'

    return (
        <div className="min-h-screen bg-zinc-50/50 text-zinc-900 font-sans selection:bg-orange-100 selection:text-orange-900">
            {/* 1. Header Section */}
            <div className="bg-background border-b border-zinc-100">
                <div className="container mx-auto max-w-3xl px-6 pt-12 pb-8">
                    <button onClick={() => window.history.back()} className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6 transition-colors">
                        <ArrowLeft className="w-3 h-3" /> Return to jobs list
                    </button>

                    <div className="text-center space-y-6">
                        <div className="w-12 h-12 rounded-xl bg-zinc-900 text-white mx-auto flex items-center justify-center font-bold text-xl shadow-sm overflow-hidden">
                            {company.logoUrl ? <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" /> : company.name[0]}
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">
                            {job.title}
                        </h1>

                        <div className="flex flex-wrap items-center justify-center gap-3 text-[13px] text-zinc-500 font-medium">
                            {job.type && <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Job type: <span className="text-zinc-900">{job.type}</span></span>}
                            {job.department && <span className="w-1 h-1 rounded-full bg-zinc-300" />}
                            {job.department && <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> Department: <span className="text-zinc-900">{job.department}</span></span>}
                            {job.location && <span className="w-1 h-1 rounded-full bg-zinc-300" />}
                            {job.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location: <span className="text-zinc-900">{job.location}</span></span>}
                        </div>

                        <div className="pt-2">
                            <Button
                                onClick={() => setActiveTab("form")}
                                className="bg-[#FF5A1F] hover:bg-[#E04812] text-white rounded-full px-8 h-10 font-medium shadow-sm active:scale-95 transition-all w-full sm:w-auto"
                            >
                                Apply for this position
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 2. Tabs */}
                <div className="container mx-auto max-w-3xl px-6 mt-8">
                    <div className="flex border-b border-zinc-200 gap-8">
                        <button
                            onClick={() => setActiveTab("details")}
                            className={cn(
                                "pb-3 text-sm font-medium transition-all relative",
                                activeTab === "details" ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
                            )}
                        >
                            Job details
                            {activeTab === "details" && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#FF5A1F]" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("form")}
                            className={cn(
                                "pb-3 text-sm font-medium transition-all relative",
                                activeTab === "form" ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
                            )}
                        >
                            Application form
                            {activeTab === "form" && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#FF5A1F]" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. Main Content */}
            <div className="container mx-auto max-w-3xl px-6 py-12">

                {/* Tab: Job Details */}
                {activeTab === "details" && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div
                            className="prose prose-zinc max-w-none text-[15px] leading-relaxed text-zinc-600"
                            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                        />

                        {/* We don't have separate sections for qualifications/responsibilities in DB yet, so skipping them unless they are part of description */}

                        <div className="pt-8 flex justify-center">
                            <Button
                                onClick={() => setActiveTab("form")}
                                className="bg-[#FF5A1F] hover:bg-[#E04812] text-white rounded-full px-8 h-10 font-medium shadow-sm w-full sm:w-auto"
                            >
                                Apply for this position
                            </Button>
                        </div>

                        <div className="pt-12 flex justify-center pb-8">
                            <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                                Made with <span className="font-bold flex items-center gap-1"><div className="w-4 h-4 bg-zinc-900 rounded-[2px] flex items-center justify-center text-[8px] text-white">F</div> Fluxberry AI</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab: Application Form */}
                {activeTab === "form" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-2xl mx-auto">

                        {/* Autofill */}
                        <div className="bg-white border border-dashed border-zinc-300 rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-orange-50 rounded-full text-orange-600">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-medium text-sm text-zinc-900">Autofill application</h3>
                                    <p className="text-xs text-muted-foreground">Save time by importing your resume.</p>
                                </div>
                            </div>
                            <Button variant="outline" className="rounded-full text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 h-8 text-xs px-4">
                                Upload file
                            </Button>
                        </div>

                        {/* Personal Information */}
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-zinc-900">Personal Information</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First name <span className="text-red-500">*</span></Label>
                                    <Input id="firstName" placeholder="Enter your first name" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last name <span className="text-red-500">*</span></Label>
                                    <Input id="lastName" placeholder="Enter your last name" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                                <Input id="email" type="email" placeholder="Enter your email address" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <div className="flex">
                                    <div className="w-[100px] border-r-0 rounded-r-none">
                                        <Input placeholder="+1" className="rounded-r-none focus:z-10" />
                                    </div>
                                    <Input id="phone" type="tel" placeholder="Enter your phone number" className="rounded-l-none -ml-[1px]" />
                                </div>
                            </div>
                        </div>

                        <div className="w-full h-px bg-zinc-100" />

                        {/* Resume Upload */}
                        <div className="space-y-3">
                            <Label>Resume <span className="text-red-500">*</span></Label>
                            <div className="border border-dashed border-zinc-300 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-zinc-50 transition-colors cursor-pointer group">
                                <div className="p-3 bg-zinc-50 rounded-full text-zinc-400 group-hover:scale-110 transition-transform mb-3">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-medium text-zinc-900">Upload your file <span className="text-muted-foreground font-normal">or drag and drop here</span></p>
                                <p className="text-xs text-muted-foreground mt-1">Supported formats: .pdf, .docx</p>
                                <Button variant="outline" className="mt-4 rounded-full text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 h-8 text-xs px-4">
                                    Upload file
                                </Button>
                            </div>
                        </div>

                        <div className="w-full h-px bg-zinc-100" />

                        <div className="pt-6">
                            <Button className="w-full bg-[#FF5A1F] hover:bg-[#E04812] text-white rounded-lg h-11 font-medium shadow-sm text-base">
                                Apply for this position
                            </Button>
                            <p className="text-[11px] text-center text-muted-foreground mt-3">
                                By applying, you agree to our terms of service and privacy policy.
                            </p>
                        </div>

                        <div className="pt-12 flex justify-center pb-8 border-t border-zinc-100 mt-12">
                            <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                                Made with <span className="font-bold flex items-center gap-1"><div className="w-4 h-4 bg-zinc-900 rounded-[2px] flex items-center justify-center text-[8px] text-white">F</div> Fluxberry AI</span>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    )
}

"use client"

import { JobData } from "../job-wizard"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, LayoutTemplate, Settings2 } from "lucide-react"

interface StepProps {
    data: JobData
    submitJob: (status: "draft" | "published") => void
    isLoading: boolean
}

export function Step4Review({ data }: StepProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-1">
                <h2 className="text-xl font-semibold text-slate-900">Review & Publish</h2>
                <p className="text-sm text-muted-foreground">Verify your configuration before making the job live.</p>
            </div>

            {/* Top Details Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[16px] space-y-5 text-white shadow-lg shadow-slate-900/10">
                <div className="space-y-2">
                    <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Job Post Preview</p>
                    <h3 className="font-bold text-[28px] leading-tight tracking-tight">{data.title || "Untitled Job"}</h3>
                </div>
                <div className="flex flex-wrap gap-2.5">
                    <Badge variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm px-3 py-1 font-medium">{data.roleType}</Badge>
                    <Badge variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm px-3 py-1 font-medium">{data.experienceLevel}</Badge>
                    <Badge variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm px-3 py-1 font-medium">{data.location}</Badge>
                </div>
                <p className="text-[15px] leading-relaxed text-slate-300 mt-6 line-clamp-3 bg-black/20 p-4 rounded-[10px] border border-white/10">
                    {data.description || "No description provided."}
                </p>
            </div>

            {/* Config Grids */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Form Card */}
                <div className="bg-white border border-slate-200 rounded-[16px] p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-[8px]">
                            <LayoutTemplate className="h-5 w-5" />
                        </div>
                        <h4 className="font-semibold text-[17px] text-slate-900">Application Form</h4>
                    </div>
                    
                    <ul className="text-[14px] space-y-3.5">
                        <li className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                            <span className="font-medium text-slate-700">Full Name, Email, Resume, CTC <span className="text-slate-400 font-normal">(Required)</span></span>
                        </li>
                        {data.customFields.length === 0 && (
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-slate-300 shrink-0" />
                                <span className="text-slate-500">No custom fields added</span>
                            </li>
                        )}
                        {data.customFields.map((f, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                <span className="font-medium text-slate-700">
                                    {f.name} 
                                    <span className="text-slate-400 font-normal ml-1">
                                        ({f.required ? "Required" : "Optional"})
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Assessment Card */}
                <div className="bg-white border border-slate-200 rounded-[16px] p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-[8px]">
                            <Settings2 className="h-5 w-5" />
                        </div>
                        <h4 className="font-semibold text-[17px] text-slate-900">Skill Assessment</h4>
                    </div>

                    {data.testEnabled ? (
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 rounded-[10px] p-3 border border-slate-100">
                                    <span className="text-[12px] uppercase tracking-wider font-bold text-slate-500 block mb-1">Duration</span>
                                    <span className="text-[18px] font-semibold text-slate-900">{data.testDuration} mins</span>
                                </div>
                                <div className="bg-slate-50 rounded-[10px] p-3 border border-slate-100">
                                    <span className="text-[12px] uppercase tracking-wider font-bold text-slate-500 block mb-1">Passing Score</span>
                                    <span className="text-[18px] font-semibold text-slate-900">{data.passingScore}%</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 bg-purple-50/50 border border-purple-100 p-4 rounded-[10px]">
                                <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-[14px]">
                                    {data.questions.length}
                                </div>
                                <span className="font-medium text-purple-900">Questions Configured</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[160px] border-2 border-dashed border-slate-100 rounded-[12px] bg-slate-50/50">
                            <XCircle className="h-8 w-8 text-slate-300 mb-2" />
                            <p className="text-[14px] font-medium text-slate-600">Assessment Disabled</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

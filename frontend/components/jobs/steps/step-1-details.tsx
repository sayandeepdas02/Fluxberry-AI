"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { JobData } from "../job-wizard"
import { Briefcase, MapPin, AlignLeft } from "lucide-react"

interface StepProps {
    data: JobData
    updateData: (data: Partial<JobData>) => void
}

export function Step1Details({ data, updateData }: StepProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-1">
                <h2 className="text-xl font-semibold text-slate-900">Job Details</h2>
                <p className="text-sm text-muted-foreground">Provide the core details about the position you are hiring for.</p>
            </div>

            <div className="space-y-6">
                {/* Title */}
                <div className="space-y-2.5">
                    <Label htmlFor="title" className="text-slate-700 font-medium flex items-center gap-2">
                        Job Title <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => updateData({ title: e.target.value })}
                            placeholder="e.g. Senior Frontend Engineer"
                            className="pl-9 h-11 bg-slate-50/50 border-slate-200 focus-visible:bg-white focus-visible:ring-primary/20 transition-all rounded-[10px]"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Role Type */}
                    <div className="space-y-2.5">
                        <Label className="text-slate-700 font-medium">Role Type <span className="text-red-500">*</span></Label>
                        <Select value={data.roleType} onValueChange={(val) => updateData({ roleType: val })}>
                            <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-primary/20 transition-all rounded-[10px]">
                                <SelectValue placeholder="Select Role Type" />
                            </SelectTrigger>
                            <SelectContent className="rounded-[10px]">
                                <SelectItem value="Frontend">Frontend Developer</SelectItem>
                                <SelectItem value="Backend">Backend Developer</SelectItem>
                                <SelectItem value="Full Stack">Full Stack Developer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Experience Level */}
                    <div className="space-y-2.5">
                        <Label className="text-slate-700 font-medium">Experience Level <span className="text-red-500">*</span></Label>
                        <Select value={data.experienceLevel} onValueChange={(val) => updateData({ experienceLevel: val })}>
                            <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-primary/20 transition-all rounded-[10px]">
                                <SelectValue placeholder="Select Level" />
                            </SelectTrigger>
                            <SelectContent className="rounded-[10px]">
                                <SelectItem value="Junior">Junior (0-2 years)</SelectItem>
                                <SelectItem value="Mid-Level">Mid-Level (3-5 years)</SelectItem>
                                <SelectItem value="Senior">Senior (5+ years)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Location */}
                <div className="space-y-2.5">
                    <Label htmlFor="location" className="text-slate-700 font-medium">Location <span className="text-red-500">*</span></Label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            id="location"
                            value={data.location}
                            onChange={(e) => updateData({ location: e.target.value })}
                            placeholder="e.g. Remote, San Francisco, London"
                            className="pl-9 h-11 bg-slate-50/50 border-slate-200 focus-visible:bg-white focus-visible:ring-primary/20 transition-all rounded-[10px]"
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2.5">
                    <Label htmlFor="description" className="text-slate-700 font-medium flex items-center gap-2">
                        Job Description <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                        <AlignLeft className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => updateData({ description: e.target.value })}
                            placeholder="Describe the role responsibilities and requirements..."
                            rows={7}
                            className="pl-9 pt-3 bg-slate-50/50 border-slate-200 focus-visible:bg-white focus-visible:ring-primary/20 transition-all rounded-[10px] resize-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

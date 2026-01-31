"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, MapPin, Briefcase, Clock, Upload, CheckCircle2, Building } from "lucide-react"
import { cn } from "@/lib/utils"

// Mock Job Data
const jobData = {
    title: "Senior Product Designer",
    department: "Product",
    type: "Full-time",
    workType: "On-site",
    location: "Chennai, Tamil Nadu, India",
    company: "Acme Corp",
    logo: "A",
    description: `
        <p>Are you a creative soul who loves to craft user-centric designs and spark innovation? We are on the lookout for a talented Product Designer here at Acme. Join us in this startup adventure where your knack for problem-solving and creativity will be your superpower. Collaboration fuels our design journey, so we need someone who thrives in a buzzing and ever-changing environment.</p>
        <br/>
        <p>Come aboard the Acme team and dive into a culture that treasures growth, where your ideas are not just heard but celebrated, and your work truly makes a difference.</p>
    `,
    aboutCompany: `Acme is an all-in-one recruitment automation platform that automates entire hiring process for recruiters so they can move faster with hiring the right candidates. Think, co-pilot for recruiters. We have seen first-hand how using Acme increases the recruiter yield by at least 50% and helps build a predictable pipeline and deliver a great experience to candidates.`,
    qualifications: [
        "Do you have 5 to 8 years of product design experience preferably in a B2B SaaS environment where you have shipped high quality products to users.",
        "Experience in using Figma for design collaboration and prototyping - a true digital artist!",
        "Rock-solid knowledge of Product Thinking to turn ideas into killer product features.",
        "UI/UX principles are your jam for creating designs that are not just pretty but practical too.",
        "Wireframing & prototyping is your playground to bring concepts to life and make magic happen.",
        "User research is your secret weapon to understand users and make design decisions with confidence.",
        "HTML/CSS skills to jam with developers and make those design dreams a reality."
    ],
    responsibilities: [
        "Lead the design journey from ideas to reality, always keeping the user in mind.",
        "Team up with product managers and developers to craft seamless user experiences that wow.",
        "Flex those problem-solving muscles to tackle design challenges and refine solutions based on user feedback.",
        "Use your leadership flair to guide design choices and champion the user's perspective.",
        "Dive into user research to uncover insights and validate design decisions for successful products.",
        "Stay hungry for growth, always learning and staying ahead of the design curve.",
        "Take charge of your projects, delivering top-notch designs on time with a proactive spirit."
    ]
}

export default function JobApplicationPage({ params }: { params: { companySlug: string, jobId: string } }) {
    const [activeTab, setActiveTab] = useState<"details" | "form">("details")

    return (
        <div className="min-h-screen bg-zinc-50/50 text-zinc-900 font-sans selection:bg-orange-100 selection:text-orange-900">
            {/* 1. Header Section */}
            <div className="bg-background border-b border-zinc-100">
                <div className="container mx-auto max-w-3xl px-6 pt-12 pb-8">
                    <button className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6 transition-colors">
                        <ArrowLeft className="w-3 h-3" /> Return to jobs list
                    </button>

                    <div className="text-center space-y-6">
                        <div className="w-12 h-12 rounded-xl bg-zinc-900 text-white mx-auto flex items-center justify-center font-bold text-xl shadow-sm">
                            {jobData.logo}
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">
                            {jobData.title}
                        </h1>

                        <div className="flex flex-wrap items-center justify-center gap-3 text-[13px] text-zinc-500 font-medium">
                            <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Job type: <span className="text-zinc-900">{jobData.type}</span></span>
                            <span className="w-1 h-1 rounded-full bg-zinc-300" />
                            <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> Department: <span className="text-zinc-900">{jobData.department}</span></span>
                            <span className="w-1 h-1 rounded-full bg-zinc-300" />
                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Work type: <span className="text-zinc-900">{jobData.workType}</span></span>
                        </div>

                        <div className="text-zinc-500 text-sm">
                            {jobData.location}
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
                            dangerouslySetInnerHTML={{ __html: jobData.description }}
                        />

                        <section className="space-y-4">
                            <h3 className="text-lg font-semibold text-zinc-900">Who are we?</h3>
                            <p className="text-[15px] leading-relaxed text-zinc-600">
                                {jobData.aboutCompany}
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-lg font-semibold text-zinc-900">What does it take?</h3>
                            <ul className="space-y-2 list-disc pl-5 text-[15px] text-zinc-600 marker:text-zinc-300">
                                {jobData.qualifications.map((q, i) => (
                                    <li key={i} className="pl-1">{q}</li>
                                ))}
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-lg font-semibold text-zinc-900">What you'll do?</h3>
                            <ul className="space-y-2 list-disc pl-5 text-[15px] text-zinc-600 marker:text-zinc-300">
                                {jobData.responsibilities.map((r, i) => (
                                    <li key={i} className="pl-1">{r}</li>
                                ))}
                            </ul>
                        </section>

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
                                Made with <span className="font-bold flex items-center gap-1"><div className="w-4 h-4 bg-zinc-900 rounded-[2px] flex items-center justify-center text-[8px] text-white">F</div> FluxAI</span>
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

                        {/* Profile Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-zinc-900">Profile</h2>
                            </div>

                            {/* Education Repeater Placeholder */}
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm font-medium text-zinc-700">Education</span>
                                <Button variant="outline" size="sm" className="rounded-full h-7 text-xs border-orange-200 text-orange-600 hover:bg-orange-50">
                                    Add
                                </Button>
                            </div>

                            {/* Experience Repeater Placeholder */}
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm font-medium text-zinc-700">Experience</span>
                                <Button variant="outline" size="sm" className="rounded-full h-7 text-xs border-orange-200 text-orange-600 hover:bg-orange-50">
                                    Add
                                </Button>
                            </div>

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
                        </div>

                        <div className="w-full h-px bg-zinc-100" />

                        {/* Additional Info */}
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-zinc-900">Additional Information</h2>
                            <div className="space-y-2">
                                <Label htmlFor="portfolio">Portfolio</Label>
                                <Textarea id="portfolio" placeholder="Share your amazing work here..." className="min-h-[100px] resize-none" />
                            </div>
                        </div>

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
                                Made with <span className="font-bold flex items-center gap-1"><div className="w-4 h-4 bg-zinc-900 rounded-[2px] flex items-center justify-center text-[8px] text-white">F</div> FluxAI</span>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    )
}

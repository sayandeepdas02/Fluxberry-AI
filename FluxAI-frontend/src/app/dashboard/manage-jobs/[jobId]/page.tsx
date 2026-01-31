"use client";

import * as React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { FileText, Search, File } from "lucide-react";

// Mock Data Interfaces
interface Candidate {
    id: string;
    name: string;
    contact: string;
    email: string;
    education: string;
    currentCompany: string;
    currentSalary: string;
    yearsOfExperience: number;
    expectedSalary: string;
}

// Mock Data
const CANDIDATES: Candidate[] = [
    {
        id: "1",
        name: "Ayush Sharma",
        contact: "+91 75837 78693",
        email: "ayush@gmail.com",
        education: "IIT Delhi",
        currentCompany: "Microsoft",
        currentSalary: "42 LPA",
        yearsOfExperience: 4,
        expectedSalary: "60 LPA",
    },
    {
        id: "2",
        name: "Sarah Jenkins",
        contact: "+1 555 0123 4567",
        email: "sarah.j@example.com",
        education: "Stanford University",
        currentCompany: "Google",
        currentSalary: "$180k",
        yearsOfExperience: 5,
        expectedSalary: "$220k",
    },
    {
        id: "3",
        name: "Rahul Verma",
        contact: "+91 98765 43210",
        email: "rahul.v@tech.in",
        education: "BITS Pilani",
        currentCompany: "Swiggy",
        currentSalary: "28 LPA",
        yearsOfExperience: 3,
        expectedSalary: "40 LPA",
    },
    {
        id: "4",
        name: "Emily Chen",
        contact: "+1 415 555 8899",
        email: "emily.chen@dev.io",
        education: "UC Berkeley",
        currentCompany: "Uber",
        currentSalary: "$160k",
        yearsOfExperience: 4,
        expectedSalary: "$190k",
    },
    {
        id: "5",
        name: "Vikram Singh",
        contact: "+91 88888 77777",
        email: "vikram.s@code.co",
        education: "IIT Bombay",
        currentCompany: "Amazon",
        currentSalary: "35 LPA",
        yearsOfExperience: 4,
        expectedSalary: "50 LPA",
    },
    {
        id: "6",
        name: "Priya Patel",
        contact: "+91 99999 11111",
        email: "priya.p@startup.io",
        education: "IIIT Hyderabad",
        currentCompany: "Razorpay",
        currentSalary: "30 LPA",
        yearsOfExperience: 3,
        expectedSalary: "45 LPA",
    },
];

interface PageProps {
    params: Promise<{ jobId: string }>;
}

export default async function JobApplicantsPage({ params }: PageProps) {
    // Next.js 15 params are promises
    const { jobId } = await params;

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* 1. Breadcrumb / Context Header */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground/60">
                    <span>Manage Jobs</span>
                    <span>/</span>
                    <span className="text-foreground font-medium">Job ID: {jobId}</span>
                </div>

                {/* 2. Tabs */}
                <div className="border-b border-edge">
                    <div className="flex items-center gap-8">
                        <button className="border-b-2 border-foreground px-1 py-3 text-sm font-medium text-foreground">
                            Applications
                        </button>
                        <button className="border-b-2 border-transparent px-1 py-3 text-sm font-medium text-muted-foreground hover:text-foreground/80 transition-colors">
                            Shortlists
                        </button>
                        <button className="border-b-2 border-transparent px-1 py-3 text-sm font-medium text-muted-foreground hover:text-foreground/80 transition-colors">
                            Offer Letter Sent
                        </button>
                    </div>
                </div>

                {/* 3. Summary Row */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <h2 className="text-lg font-medium">
                        Total Applications: 456
                    </h2>

                    {/* Placeholder AI Search */}
                    <div className="relative w-full sm:w-72">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                            <Search className="w-4 h-4" />
                        </span>
                        <input
                            type="text"
                            disabled
                            placeholder="AI Search (coming soon)"
                            className="w-full h-9 rounded-md border border-input bg-muted/30 pl-9 pr-4 text-sm text-muted-foreground cursor-not-allowed"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border border-input rounded text-[10px] flex items-center justify-center text-muted-foreground/50">
                            /
                        </div>
                    </div>
                </div>

                {/* 4. Candidates Table */}
                <div className="border border-edge rounded-lg overflow-hidden bg-background">
                    <Table>
                        <TableHeader className="bg-muted/10">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[180px] text-muted-foreground/70 font-normal">Candidate Name</TableHead>
                                <TableHead className="text-muted-foreground/70 font-normal">Contact Number</TableHead>
                                <TableHead className="text-muted-foreground/70 font-normal">Email ID</TableHead>
                                <TableHead className="text-muted-foreground/70 font-normal">Education</TableHead>
                                <TableHead className="text-muted-foreground/70 font-normal">Current Company</TableHead>
                                <TableHead className="text-muted-foreground/70 font-normal">Current Salary</TableHead>
                                <TableHead className="text-center text-muted-foreground/70 font-normal">Years of Exp</TableHead>
                                <TableHead className="text-muted-foreground/70 font-normal">Exp. Salary</TableHead>
                                <TableHead className="text-center text-muted-foreground/70 font-normal">Resume</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {CANDIDATES.map((candidate) => (
                                <TableRow key={candidate.id} className="hover:bg-muted/20 border-edge">
                                    <TableCell className="font-medium text-foreground">
                                        {candidate.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {candidate.contact}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground underline underline-offset-4 decoration-muted-foreground/30">
                                        {candidate.email}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs uppercase tracking-wide">
                                        {candidate.education}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {candidate.currentCompany}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {candidate.currentSalary}
                                    </TableCell>
                                    <TableCell className="text-center text-muted-foreground">
                                        {candidate.yearsOfExperience}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {candidate.expectedSalary}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <button className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground">
                                            <FileText className="w-4 h-4" />
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}

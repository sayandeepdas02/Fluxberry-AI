"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Briefcase, ChevronRight, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { assessmentsApi } from "@/lib/api/assessments";

export function CreateAssessment() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [jobId, setJobId] = useState<string>("");

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            setError("Title is required.");
            return;
        }
        setIsLoading(true);
        try {
            const res = await assessmentsApi.create({
                title: trimmedTitle,
                jobId: jobId || undefined,
            });
            if (res.success && res.data?.id) {
                router.push(`/dashboard/assessments/${res.data.id}/configure`);
                return;
            }
            setError(res.error?.message ?? "Failed to create assessment.");
        } catch {
            setError("Failed to create assessment.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-12 px-4">
            <div className="mb-8">
                <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground" asChild>
                    <Link href="/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
                <h1 className="text-3xl tracking-tight text-neutral-900">Create New Assessment</h1>
                <p className="text-neutral-500 mt-2">Setup a new screening pipeline for a role.</p>
            </div>

            <Card className="border-neutral-200 shadow-sm">
                <CardHeader>
                    <CardTitle>Assessment Details</CardTitle>
                    <CardDescription>
                        Define the role and context for this assessment.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreate} className="space-y-6">
                        {error && (
                            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="title">Assessment Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g. Senior Frontend Engineer Screening"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="job">Linked Job Post</Label>
                                <Select value={jobId} onValueChange={setJobId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a job..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fe-senior">Senior Frontend Engineer</SelectItem>
                                        <SelectItem value="be-lead">Lead Backend Engineer</SelectItem>
                                        <SelectItem value="pm-product">Product Manager</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">Role Type</Label>
                                <Select required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role category..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="engineering">Engineering</SelectItem>
                                        <SelectItem value="design">Design</SelectItem>
                                        <SelectItem value="product">Product</SelectItem>
                                        <SelectItem value="marketing">Marketing</SelectItem>
                                        <SelectItem value="sales">Sales</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Button variant="outline" type="button" asChild>
                                <Link href="/dashboard">Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>Creating...</>
                                ) : (
                                    <>
                                        <Wand2 className="mr-2 h-4 w-4" />
                                        Create & Configure
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

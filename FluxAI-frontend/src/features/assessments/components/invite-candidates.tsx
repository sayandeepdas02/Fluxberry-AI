"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Mail, Upload, Rocket } from "lucide-react"
import Link from "next/link"

export function InviteCandidates({ assessmentId }: { assessmentId: string }) {
    return (
        <div className="max-w-2xl mx-auto space-y-8 py-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/assessments/${assessmentId}/configure`}>
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Invite Candidates</h1>
                    <p className="text-sm text-muted-foreground">Step 3 of 3: Send test links</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-6 space-y-6">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
                        <Rocket className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div>
                            <p className="font-semibold">Ready to launch!</p>
                            <p className="opacity-90 mt-1">
                                Each candidate will receive a unique secure link. Based on your configuration, they will face <strong>Round 1 (MCQ)</strong> and <strong>Round 2 (DSA)</strong>.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label>Enter Email Addresses (comma separated)</Label>
                        <Textarea
                            placeholder="john@example.com, sarah@example.com, ..."
                            className="min-h-[150px] font-mono text-sm"
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-muted" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or</span>
                        </div>
                    </div>

                    <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors">
                        <Upload className="w-8 h-8 text-muted-foreground mb-3" />
                        <p className="text-sm font-medium">Upload CSV</p>
                        <p className="text-xs text-muted-foreground">Drag and drop or click to upload</p>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/assessments">
                                Save as Draft
                            </Link>
                        </Button>
                        <Button className="bg-foreground text-background hover:bg-foreground/90 gap-2" asChild>
                            <Link href="/dashboard/assessments">
                                <Rocket className="w-4 h-4" /> Launch Assessment
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

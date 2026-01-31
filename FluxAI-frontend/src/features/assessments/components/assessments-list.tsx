"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Clock, CheckCircle2, Copy } from "lucide-react"
import Link from "next/link"
import { assessments } from "../mocks/assessments"

export function AssessmentsList() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Assessments</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage technical interview campaigns and track candidate performance.
                    </p>
                </div>
                <Button size="sm" className="gap-2" asChild>
                    <Link href="/dashboard/assessments/new">
                        <Plus className="w-4 h-4" /> Create Assessment
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4">
                {assessments.map((assessment) => (
                    <Card key={assessment.id} className="hover:border-foreground/20 transition-colors">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold text-lg hover:underline decoration-1 underline-offset-4 cursor-pointer">
                                                <Link href={`/dashboard/assessments/${assessment.id}/results`}>{assessment.name}</Link>
                                            </h3>
                                            <Badge variant={assessment.status === 'Active' ? 'default' : assessment.status === 'Draft' ? 'secondary' : 'outline'} className="rounded-full">
                                                {assessment.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Linked to <span className="font-medium text-foreground">{assessment.job}</span>
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {assessment.rounds.map((round) => (
                                            <Badge key={round} variant="outline" className="text-xs font-mono bg-muted/50">
                                                {round}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        <span className="font-medium text-foreground">{assessment.invited}</span> Invited
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="font-medium text-foreground">{assessment.completed}</span> Completed
                                    </div>
                                    {assessment.status === 'Draft' ? (
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Duplicate" asChild>
                                                <Link href={`/dashboard/assessments/new?duplicate=${assessment.id}`}>
                                                    <Copy className="w-4 h-4 text-neutral-500" />
                                                </Link>
                                            </Button>
                                            <Button size="sm" variant="outline" asChild>
                                                <Link href={`/dashboard/assessments/${assessment.id}/configure`}>
                                                    Continue Setup
                                                </Link>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Duplicate" asChild>
                                                <Link href={`/dashboard/assessments/new?duplicate=${assessment.id}`}>
                                                    <Copy className="w-4 h-4 text-neutral-500" />
                                                </Link>
                                            </Button>
                                            <Button size="sm" variant="secondary" asChild>
                                                <Link href={`/dashboard/assessments/${assessment.id}/results`}>
                                                    View Results
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

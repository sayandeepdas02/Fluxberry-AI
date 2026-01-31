"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MoreVertical } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface Job {
    id: string;
    title: string;
    requirements: string[]; // e.g. ["React JS", "Python", "3+ YOE"]
    applicationCount: number;
    isActive: boolean;
}

interface JobCardProps {
    job: Job;
}

export function JobCard({ job }: JobCardProps) {
    const [isActive, setIsActive] = useState(job.isActive);

    return (
        <Card className={cn(
            "p-5 relative transition-all border border-edge shadow-sm",
            "bg-background hover:bg-muted/30" // Strict monochrome: white bg with subtle gray hover
        )}>
            {/* Header Row: Title + Controls */}
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground pr-8">
                    {job.title}
                </h3>

                <div className="flex items-center gap-2 shrink-0">
                    <Switch
                        checked={isActive}
                        onCheckedChange={setIsActive}
                        aria-label="Toggle job status"
                    />
                    <button className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Requirements Section */}
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-muted-foreground/80">
                        Requirements :
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {job.requirements.map((req) => (
                            <Badge
                                key={req}
                                variant="outline"
                                className="bg-background/50 border-border/50 font-normal text-muted-foreground"
                            >
                                {req}
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer: Stats */}
            <div className="flex items-center text-sm font-medium text-foreground/80">
                <span>Total Applications : {job.applicationCount}</span>
            </div>
        </Card>
    );
}

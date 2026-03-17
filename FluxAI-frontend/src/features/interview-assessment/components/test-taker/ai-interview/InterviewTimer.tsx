import React, { useState, useEffect } from 'react';
import { useInterviewState } from './InterviewStateManager';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function InterviewTimer() {
    const { state, triggerEndInterview } = useInterviewState();
    const [secondsElapsed, setSecondsElapsed] = useState(0);
    const MAX_DURATION_SECONDS = 45 * 60; // 45 minutes

    const isActive = state !== 'WAITING' && state !== 'CONNECTING' && state !== 'FINISHED' && state !== 'DISCONNECTED';

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isActive) {
            timer = setInterval(() => {
                setSecondsElapsed(prev => {
                    if (prev >= MAX_DURATION_SECONDS) {
                        triggerEndInterview();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isActive, triggerEndInterview]);

    const minutes = Math.floor(secondsElapsed / 60);
    const seconds = secondsElapsed % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const isWarning = secondsElapsed > (40 * 60); // warning at 40 mins

    return (
        <div className="flex items-center gap-2 bg-background border px-3 py-1.5 rounded-full shadow-sm">
            <Clock className={cn("w-4 h-4", isWarning ? "text-destructive" : "text-primary")} />
            <span className={cn("text-sm font-medium tabular-nums", isWarning ? "text-destructive" : "text-foreground")}>
                {timeString}
            </span>
        </div>
    );
}

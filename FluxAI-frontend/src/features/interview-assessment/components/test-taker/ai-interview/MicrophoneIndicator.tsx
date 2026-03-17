import React from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { Track } from 'livekit-client';
import { cn } from '@/lib/utils';

export function MicrophoneIndicator() {
    const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();

    // Check if speaking based on audio level
    const isSpeaking = localParticipant.isSpeaking;

    // If not connected to a room yet (participant null), assume disconnected or waiting
    if (!localParticipant) {
        return null;
    }

    if (!isMicrophoneEnabled) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 border-destructive/20 border rounded-full text-xs font-medium text-destructive">
                <MicOff className="w-4 h-4" />
                <span>Microphone Muted - Please enable to speak</span>
            </div>
        );
    }

    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 border rounded-full text-xs font-medium transition-colors",
            isSpeaking ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-border text-muted-foreground"
        )}>
            <Mic className={cn("w-4 h-4", isSpeaking && "animate-pulse")} />
            <span>{isSpeaking ? "Detecting speech..." : "Microphone Active"}</span>
        </div>
    );
}

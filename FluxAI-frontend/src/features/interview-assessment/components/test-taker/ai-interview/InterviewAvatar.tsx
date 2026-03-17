import React from 'react';
import { useInterviewState } from './InterviewStateManager';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AudioWaveform } from './AudioWaveform';

export function InterviewAvatar() {
    const { isAISpeaking, state } = useInterviewState();

    const isActive = state !== 'WAITING' && state !== 'CONNECTING' && state !== 'DISCONNECTED';

    return (
        <div className="relative flex flex-col items-center justify-center w-full h-[300px] lg:h-[400px]">
            {/* Outer rings for visual effect */}
            {isActive && !isAISpeaking && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 rounded-full border border-primary/20 animate-ping [animation-duration:3s]" />
                    <div className="absolute w-64 h-64 rounded-full border border-primary/10 animate-ping [animation-duration:4s]" />
                </div>
            )}

            {/* Avatar Circle */}
            <div className={cn(
                "relative z-10 flex items-center justify-center rounded-full bg-card shadow-lg transition-all duration-500",
                isAISpeaking ? "w-40 h-40 border-4 border-primary" : "w-32 h-32 border border-border",
                isActive ? "opacity-100" : "opacity-50 grayscale"
            )}>
                <Bot className={cn(
                    "transition-all duration-500",
                    isAISpeaking ? "w-20 h-20 text-primary" : "w-12 h-12 text-muted-foreground"
                )} />

                {isActive && !isAISpeaking && (
                    <div className="absolute bottom-4 right-4 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-card" />
                )}
            </div>

            {/* Status text or waveform below avatar */}
            <div className="mt-8 h-16 w-full max-w-sm flex flex-col items-center justify-center text-center px-4">
                {isAISpeaking ? (
                    <AudioWaveform />
                ) : (
                    <div className="text-sm font-medium text-muted-foreground animate-pulse">
                        {state === 'WAITING' ? 'Waiting to start...' :
                            state === 'CONNECTING' ? 'Connecting to intelligence...' :
                                state === 'DISCONNECTED' ? 'Connection lost.' :
                                    state === 'FINISHED' ? 'Interview complete.' :
                                        'Listening...'}
                    </div>
                )}
            </div>
        </div>
    );
}

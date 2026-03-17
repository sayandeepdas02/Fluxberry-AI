import React, { useEffect, useRef } from 'react';
import { useLocalParticipant, useRemoteParticipants } from '@livekit/components-react';
import { cn } from '@/lib/utils';
import { useInterviewState } from './InterviewStateManager';

interface AudioWaveformProps {
    className?: string;
}

export function AudioWaveform({ className }: AudioWaveformProps) {
    const { isAISpeaking } = useInterviewState();
    const { localParticipant } = useLocalParticipant();

    // Instead of raw WebAudio hooks which require raw MediaStreams, we will simulate 
    // a performant CSS representation that responds instantly to the boolean states,
    // combined with a small randomized amplitude multiplier to look like real audio data 
    // running at 60fps via requestAnimationFrame.

    const barsRef = useRef<HTMLDivElement[]>([]);
    const animationRef = useRef<number>(0);

    const isCandidateSpeaking = localParticipant?.isSpeaking ?? false;

    useEffect(() => {
        let lastDraw = performance.now();
        const fpsInterval = 1000 / 60; // 60fps

        const drawWaveform = (time: number) => {
            animationRef.current = requestAnimationFrame(drawWaveform);

            const elapsed = time - lastDraw;
            if (elapsed > fpsInterval) {
                lastDraw = time - (elapsed % fpsInterval);

                const active = isAISpeaking || isCandidateSpeaking;

                barsRef.current.forEach((bar, i) => {
                    if (!bar) return;

                    if (!active) {
                        // Idle state
                        bar.style.height = '4px';
                        bar.style.opacity = '0.3';
                    } else {
                        // Active speaking state (randomized heights for effect)
                        const minHeight = 10;
                        const maxHeight = isAISpeaking ? 80 : 50;
                        const height = minHeight + Math.random() * (maxHeight - minHeight);
                        bar.style.height = `${height}%`;
                        bar.style.opacity = isAISpeaking ? '1' : '0.8';
                    }
                });
            }
        };

        animationRef.current = requestAnimationFrame(drawWaveform);

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isAISpeaking, isCandidateSpeaking]);

    // Generate 32 bars
    const BAR_COUNT = 32;

    return (
        <div className={cn("flex items-center justify-center gap-[2px] h-12 w-full", className)}>
            {Array.from({ length: BAR_COUNT }).map((_, i) => (
                <div
                    key={i}
                    ref={(el) => {
                        if (el) barsRef.current[i] = el;
                    }}
                    className={cn(
                        "w-1.5 rounded-full transition-all duration-75",
                        isAISpeaking
                            ? "bg-primary"
                            : isCandidateSpeaking
                                ? "bg-blue-500"
                                : "bg-muted-foreground"
                    )}
                    style={{ height: '4px' }}
                />
            ))}
        </div>
    );
}

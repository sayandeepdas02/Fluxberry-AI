import React, { useState } from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, PhoneOff, RefreshCw } from 'lucide-react';
import { Track } from 'livekit-client';
import { cn } from '@/lib/utils';
import { useInterviewState } from './InterviewStateManager';

export function InterviewControls({ onEndInterview, sessionId }: { onEndInterview: () => void, sessionId: string }) {
    const { localParticipant } = useLocalParticipant();
    const { state, connectSocket } = useInterviewState();
    const [isEnding, setIsEnding] = useState(false);

    // Mute/Unmute toggle
    const toggleMicrophone = async () => {
        if (!localParticipant) return;

        if (localParticipant.isMicrophoneEnabled) {
            await localParticipant.setMicrophoneEnabled(false);
        } else {
            // Need to handle permissions error gracefully if browser blocks
            try {
                await localParticipant.setMicrophoneEnabled(true);
            } catch (error) {
                console.error("Failed to enable microphone", error);
                alert("Please allow microphone permissions to continue the interview.");
            }
        }
    };

    const handleEnd = async () => {
        setIsEnding(true);
        // We trigger the wrapper's onEnd function which handles both API and state cleanup
        await onEndInterview();
    };

    return (
        <div className="flex items-center justify-center gap-4 bg-card border rounded-full px-6 py-3 shadow-sm mx-auto w-fit mt-4">

            {state === 'DISCONNECTED' && (
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => window.location.reload()}
                >
                    <RefreshCw className="w-4 h-4" />
                    Reconnect
                </Button>
            )}

            <Button
                variant="default"
                className={cn(
                    "w-12 h-12 rounded-full shadow-sm",
                    localParticipant?.isMicrophoneEnabled
                        ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                        : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                )}
                size="icon"
                onClick={toggleMicrophone}
                disabled={!localParticipant || state === 'FINISHED' || state === 'DISCONNECTED'}
            >
                {localParticipant?.isMicrophoneEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>

            <Button
                variant="default"
                className="rounded-full px-6 h-12 font-medium shadow-sm bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                onClick={handleEnd}
                disabled={isEnding || state === 'FINISHED'}
            >
                <PhoneOff className="w-4 h-4 mr-2" />
                {isEnding ? "Ending..." : "End Interview"}
            </Button>

        </div>
    );
}

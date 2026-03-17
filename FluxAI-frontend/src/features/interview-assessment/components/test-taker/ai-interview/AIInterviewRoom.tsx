"use client";

import React, { useEffect, useState } from 'react';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { InterviewStateProvider, useInterviewState } from './InterviewStateManager';
import { InterviewTimer } from './InterviewTimer';
import { ConnectionStatus } from './ConnectionStatus';
import { MicrophoneIndicator } from './MicrophoneIndicator';
import { InterviewAvatar } from './InterviewAvatar';
import { TranscriptStream } from './TranscriptStream';
import { InterviewControls } from './InterviewControls';
import { AudioWaveform } from './AudioWaveform';

interface AIInterviewRoomProps {
    attemptId: string;
    onComplete: () => void;
}

function InterviewLayout({ attemptId, onComplete }: AIInterviewRoomProps) {
    const { state, connectSocket, triggerEndInterview } = useInterviewState();
    const [token, setToken] = useState<string | null>(null);
    const [serverUrl, setServerUrl] = useState<string | null>(null);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Fetch token when component mounts
        const fetchToken = async () => {
            try {
                // Determine API base URL
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

                // Usually there is an auth token in local storage protecting this route
                const userToken = localStorage.getItem('token');

                const res = await fetch(`${apiUrl}/interviews/attempt/${attemptId}/token`, {
                    headers: userToken ? { Authorization: `Bearer ${userToken}` } : {}
                });

                if (!res.ok) {
                    throw new Error('Failed to fetch interview token');
                }

                const data = await res.json();

                if (data.success && data.data) {
                    setToken(data.data.token);
                    // Standard livekit structure 
                    // Make sure we pass the correct websocket URL from the environment or assume standard logic
                    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://localhost:7880';
                    setServerUrl(wsUrl);

                    // Connect the backend Interview Orchestrator socket
                    connectSocket(attemptId, data.data.token);
                } else {
                    throw new Error('Invalid token schema from server');
                }
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Could not connect to interview server.');
            } finally {
                setIsFetching(false);
            }
        };

        if (attemptId && state === 'WAITING') {
            fetchToken();
        }
    }, [attemptId, state, connectSocket]);

    const handleEndInterview = () => {
        triggerEndInterview();
        onComplete();
    };

    if (error) {
        return (
            <div className="flex h-[calc(100vh-100px)] items-center justify-center">
                <Card className="p-8 max-w-md text-center border-destructive">
                    <h2 className="text-xl font-semibold mb-2 text-destructive">Connection Error</h2>
                    <p className="text-muted-foreground mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium"
                    >
                        Retry Connection
                    </button>
                </Card>
            </div>
        );
    }

    if (isFetching || !token || !serverUrl) {
        return (
            <div className="flex h-[calc(100vh-100px)] items-center justify-center flex-col gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium animate-pulse">Initializing Secure Interview Room...</p>
            </div>
        );
    }

    return (
        <LiveKitRoom
            video={false}
            audio={true}
            token={token}
            serverUrl={serverUrl}
            connect={true}
            data-lk-theme="default"
            style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}
        >
            <RoomAudioRenderer />

            <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-6">

                {/* TOP SECTION: Status & Stats */}
                <header className="flex items-center justify-between w-full shrink-0">
                    <div className="flex items-center gap-4">
                        <ConnectionStatus />
                        <MicrophoneIndicator />
                    </div>
                    <div>
                        <InterviewTimer />
                    </div>
                </header>

                {/* MAIN SECTION: Layout Split */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">

                    {/* LEFT PANEL: Transcript (takes 4 columns on large screens) */}
                    <aside className="hidden lg:flex flex-col col-span-4 h-full">
                        <TranscriptStream />
                    </aside>

                    {/* CENTER/RIGHT PANEL: Avatar & Controls (takes 8 columns) */}
                    <main className="flex flex-col col-span-1 lg:col-span-8 bg-muted/10 rounded-xl border p-4 md:p-8 relative overflow-hidden h-full">
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <InterviewAvatar />
                        </div>

                        <div className="shrink-0 pt-8 pb-4">
                            <div className="lg:hidden mb-6 h-48">
                                <TranscriptStream />
                            </div>

                            <InterviewControls onEndInterview={handleEndInterview} sessionId={attemptId} />

                            {/* Candidate's local waveform (optional feedback overlay) */}
                            <div className="mt-8">
                                <AudioWaveform className="opacity-0 lg:opacity-100" />
                            </div>
                        </div>
                    </main>

                </div>
            </div>
        </LiveKitRoom>
    );
}

export function AIInterviewRoom(props: AIInterviewRoomProps) {
    return (
        <InterviewStateProvider>
            <InterviewLayout {...props} />
        </InterviewStateProvider>
    );
}

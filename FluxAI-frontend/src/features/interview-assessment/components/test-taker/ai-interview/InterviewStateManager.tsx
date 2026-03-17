import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

export type InterviewState =
    | 'WAITING'
    | 'CONNECTING'
    | 'INTRO_PHASE'
    | 'PROJECT_DEEP_DIVE_PHASE'
    | 'FUNDAMENTALS_PHASE'
    | 'CULTURE_PHASE'
    | 'SUMMARY_PHASE'
    | 'FINISHED'
    | 'DISCONNECTED';

export interface TranscriptMessage {
    id: string;
    speaker: 'AI' | 'candidate';
    text: string;
    timestamp: Date;
    isPartial?: boolean;
}

interface InterviewContextType {
    state: InterviewState;
    isAISpeaking: boolean;
    transcript: TranscriptMessage[];
    connectSocket: (sessionId: string, token: string) => void;
    disconnectSocket: () => void;
    triggerEndInterview: () => void;
}

const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

export function InterviewStateProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<InterviewState>('WAITING');
    const [isAISpeaking, setIsAISpeaking] = useState(false);
    const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);

    const connectSocket = useCallback((sessionId: string, token: string) => {
        if (socket) return;

        setState('CONNECTING');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001';

        const newSocket = io(apiUrl, {
            auth: { token },
            query: { sessionId }
        });

        newSocket.on('connect', () => {
            // Socket connected, but wait for interview start
        });

        newSocket.on('disconnect', () => {
            setState('DISCONNECTED');
        });

        newSocket.on('INTERVIEW_STARTED', () => {
            setState('INTRO_PHASE');
        });

        newSocket.on('INTERVIEW_PHASE_CHANGED', (data: { newPhase: string }) => {
            // Map the backend phase to frontend state if necessary, or just use exactly
            setState(data.newPhase as InterviewState);
        });

        newSocket.on('AI_SPEAKING_START', () => {
            setIsAISpeaking(true);
        });

        newSocket.on('AI_SPEAKING_END', () => {
            setIsAISpeaking(false);
        });

        newSocket.on('TRANSCRIPT_FINAL', (data: { speaker: 'AI' | 'candidate'; text: string }) => {
            setTranscript(prev => {
                // Remove partials from this speaker
                const filtered = prev.filter(m => !(m.isPartial && m.speaker === data.speaker));
                return [
                    ...filtered,
                    { id: Date.now().toString() + Math.random(), speaker: data.speaker, text: data.text, timestamp: new Date() }
                ];
            });
        });

        newSocket.on('TRANSCRIPT_PARTIAL', (data: { speaker: 'AI' | 'candidate'; text: string }) => {
            setTranscript(prev => {
                const filtered = prev.filter(m => !(m.isPartial && m.speaker === data.speaker));
                return [
                    ...filtered,
                    { id: 'partial-' + data.speaker, speaker: data.speaker, text: data.text, timestamp: new Date(), isPartial: true }
                ];
            });
        });

        newSocket.on('INTERVIEW_COMPLETED', () => {
            setState('FINISHED');
            newSocket.disconnect();
        });

        setSocket(newSocket);
    }, [socket]);

    const disconnectSocket = useCallback(() => {
        if (socket) {
            socket.disconnect();
            setSocket(null);
            setState('DISCONNECTED');
        }
    }, [socket]);

    const triggerEndInterview = useCallback(() => {
        setState('FINISHED');
        if (socket) {
            // Alternatively emit an end event to the backend if needed
            socket.disconnect();
            setSocket(null);
        }
    }, [socket]);

    useEffect(() => {
        return () => {
            if (socket) socket.disconnect();
        };
    }, [socket]);

    return (
        <InterviewContext.Provider value={{ state, isAISpeaking, transcript, connectSocket, disconnectSocket, triggerEndInterview }}>
            {children}
        </InterviewContext.Provider>
    );
}

export function useInterviewState() {
    const context = useContext(InterviewContext);
    if (context === undefined) {
        throw new Error('useInterviewState must be used within an InterviewStateProvider');
    }
    return context;
}

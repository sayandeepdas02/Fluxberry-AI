import React, { useEffect, useRef } from 'react';
import { useInterviewState } from './InterviewStateManager';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function TranscriptStream() {
    const { transcript, isAISpeaking } = useInterviewState();
    const endRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to newest message
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript, isAISpeaking]);

    return (
        <div className="flex flex-col h-full bg-card border rounded-lg overflow-hidden shadow-sm">
            <div className="p-4 border-b bg-muted/30">
                <h3 className="font-semibold text-sm">Live Transcript</h3>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                    {transcript.length === 0 && !isAISpeaking && (
                        <div className="text-center text-sm text-muted-foreground mt-10">
                            Conversation will appear here once the interview starts.
                        </div>
                    )}

                    {transcript.map((msg) => {
                        const isAI = msg.speaker === 'AI';
                        return (
                            <div key={msg.id} className={cn("flex flex-col gap-1 max-w-[85%]", isAI ? "mr-auto" : "ml-auto items-end")}>
                                <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", isAI ? "" : "flex-row-reverse")}>
                                    {isAI ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                                    <span>{isAI ? "AI Interviewer" : "You"}</span>
                                    {msg.isPartial && <span className="animate-pulse text-primary font-medium">...</span>}
                                </div>
                                <div className={cn(
                                    "p-3 rounded-2xl text-sm leading-relaxed",
                                    isAI ? "bg-muted text-foreground rounded-tl-none" : "bg-primary text-primary-foreground rounded-tr-none"
                                )}>
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })}

                    {/* Typing indicator when AI is generating/preparing to speak but no partial transcript yet */}
                    {isAISpeaking && transcript.length > 0 && transcript[transcript.length - 1].speaker !== 'AI' && (
                        <div className="flex flex-col gap-1 max-w-[85%] mr-auto mt-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Bot className="w-3.5 h-3.5" />
                                <span>AI Interviewer is typing...</span>
                            </div>
                            <div className="p-3 bg-muted rounded-2xl rounded-tl-none w-16">
                                <div className="flex gap-1 justify-center items-center h-4">
                                    <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={endRef} />
                </div>
            </ScrollArea>
        </div>
    );
}

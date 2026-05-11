"use client"

import { useState, useRef, useEffect } from "react"
import { aiApi } from "@/lib/api/ai-intelligence"
import { useApiMutation } from "@/lib/hooks/use-api-mutation"
import { cn } from "@/lib/utils"
import { Sparkles, X, Send, Loader2, Bot, User, ChevronDown } from "lucide-react"

interface Message {
    role: 'user' | 'assistant'
    content: string
}

const SUGGESTED_PROMPTS = [
    "What's the current state of my hiring pipeline?",
    "Which roles have the most applicants awaiting review?",
    "What are my biggest hiring bottlenecks right now?",
    "Summarize the conversion rates in my pipeline.",
]

export function CopilotPanel() {
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (open && messages.length === 0) {
            setMessages([{
                role: 'assistant',
                content: "Hi! I'm your Fluxberry AI Copilot. I can help you understand your hiring pipeline, analyze candidate data, identify bottlenecks, and suggest next steps. What would you like to know?",
            }])
        }
    }, [open])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 100)
    }, [open])

    const chatMutation = useApiMutation({
        mutationFn: (userMessage: string) => {
            const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }]
            return aiApi.copilotChat(newMessages.filter(m => m.role !== 'assistant' || messages.indexOf(m) > 0))
        },
        onSuccess: (data, userMessage) => {
            setMessages(prev => [
                ...prev,
                { role: 'user', content: userMessage },
                { role: 'assistant', content: (data?.data as any)?.response || 'I encountered an error. Please try again.' }
            ])
        },
        onError: () => {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I ran into an issue. Please try again in a moment.',
            }])
        },
    })

    function sendMessage(text?: string) {
        const message = text || input.trim()
        if (!message || chatMutation.isPending) return
        setInput('')
        chatMutation.mutate(message)
    }

    return (
        <>
            {/* Floating trigger button */}
            <button
                onClick={() => setOpen(!open)}
                className={cn(
                    'fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg font-medium text-sm transition-all duration-200',
                    open
                        ? 'bg-card border border-line text-foreground'
                        : 'bg-accent text-accent-foreground hover:opacity-90 shadow-accent/20'
                )}
            >
                {open ? <ChevronDown className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                {open ? 'Close' : 'AI Copilot'}
            </button>

            {/* Panel */}
            {open && (
                <div className="fixed bottom-20 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] flex flex-col bg-background border border-line rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
                    {/* Header */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-line bg-card/40">
                        <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-accent" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold">AI Copilot</p>
                            <p className="text-[10px] text-muted-foreground">Powered by GPT-4o mini</p>
                        </div>
                        <button onClick={() => setOpen(false)} className="ml-auto p-1 text-muted-foreground hover:text-foreground transition-colors rounded">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-80">
                        {messages.map((msg, i) => (
                            <div key={i} className={cn('flex gap-2.5', msg.role === 'user' ? 'flex-row-reverse' : '')}>
                                <div className={cn(
                                    'w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                                    msg.role === 'assistant' ? 'bg-accent/20' : 'bg-muted'
                                )}>
                                    {msg.role === 'assistant'
                                        ? <Bot className="w-3 h-3 text-accent" />
                                        : <User className="w-3 h-3 text-muted-foreground" />
                                    }
                                </div>
                                <div className={cn(
                                    'max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed',
                                    msg.role === 'assistant'
                                        ? 'bg-muted/50 text-foreground rounded-tl-sm'
                                        : 'bg-accent text-accent-foreground rounded-tr-sm'
                                )}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {chatMutation.isPending && (
                            <div className="flex gap-2.5">
                                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                                    <Bot className="w-3 h-3 text-accent" />
                                </div>
                                <div className="px-3 py-2 rounded-2xl rounded-tl-sm bg-muted/50">
                                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggestions (only when no user messages yet) */}
                    {messages.length <= 1 && !chatMutation.isPending && (
                        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                            {SUGGESTED_PROMPTS.map((p, i) => (
                                <button
                                    key={i}
                                    onClick={() => sendMessage(p)}
                                    className="text-[10px] px-2.5 py-1 rounded-full border border-line text-muted-foreground hover:text-foreground hover:border-accent/40 transition-colors"
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="flex items-center gap-2 px-3 py-3 border-t border-line bg-card/20">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendMessage()}
                            placeholder="Ask anything about your pipeline..."
                            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none"
                            disabled={chatMutation.isPending}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || chatMutation.isPending}
                            className="p-1.5 bg-accent text-accent-foreground rounded-full hover:opacity-90 disabled:opacity-40 transition-opacity"
                        >
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}

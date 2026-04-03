"use client"

import * as React from "react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, Send } from "lucide-react"
import { copilotApi } from "@/lib/api/ats-screening"

export function CopilotChatPanel({ jobId }: { jobId: string }) {
    const [messages, setMessages] = React.useState<{ role: string; content: string }[]>([
        { role: 'assistant', content: "Hi! I'm your AI Hiring Copilot. I analyze the ATS data and resumes to give you an overview of the talent pool. Ask me anything about the candidates or requirements for this job." }
    ])
    const [input, setInput] = React.useState('')
    const [isLoading, setIsLoading] = React.useState(false)
    const [isOpen, setIsOpen] = React.useState(false)
    const messagesEndRef = React.useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }, 100)
    }

    React.useEffect(() => {
        if (isOpen) scrollToBottom()
    }, [messages, isOpen])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMsg = input.trim()
        setInput('')
        
        const newMessages = [...messages, { role: 'user', content: userMsg }]
        setMessages(newMessages)
        setIsLoading(true)
        scrollToBottom()

        try {
            const res = await copilotApi.chat(jobId, newMessages)
            if (res.success && res.data) {
                const aiResp = (res.data as any).data ?? res.data
                setMessages([...newMessages, { role: 'assistant', content: aiResp }])
            } else {
                setMessages([...newMessages, { role: 'assistant', content: "Sorry, I had an issue processing that. Please try again." }])
            }
        } catch (err) {
            setMessages([...newMessages, { role: 'assistant', content: "An error occurred while communicating with the AI Copilot." }])
        } finally {
            setIsLoading(false)
            scrollToBottom()
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md border-0">
                    <Sparkles className="w-4 h-4" />
                    Ask Copilot
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0 border-l border-border bg-card">
                <SheetHeader className="p-4 border-b border-border bg-muted/10">
                    <SheetTitle className="flex items-center gap-2 text-base">
                        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                        </div>
                        AI Hiring Copilot
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {m.role === 'assistant' && (
                                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                                </div>
                            )}
                            <div className={`p-3 text-sm rounded-lg max-w-[85%] ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-sm' : 'bg-muted rounded-tl-sm text-foreground'}`}>
                                {m.content.split('\\n').map((line, j) => (
                                    <p key={j} className={j > 0 ? "mt-2" : ""}>{line}</p>
                                ))}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3 justify-start">
                            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                            </div>
                            <div className="p-3 w-16 h-10 flex items-center justify-center text-sm rounded-lg bg-muted rounded-tl-sm">
                                <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" />
                                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-border bg-muted/5 pb-8">
                    <form 
                        onSubmit={e => { e.preventDefault(); handleSend(); }}
                        className="relative flex items-center"
                    >
                        <input
                            title="Message Copilot"
                            placeholder="Ask about the candidate pool..."
                            className="w-full pl-4 pr-12 py-3 text-sm bg-background border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/50"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            disabled={isLoading}
                        />
                        <button
                            title="Send Message"
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 p-1.5 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                    <p className="text-[10px] text-center text-muted-foreground/70 mt-2">
                        AI can make mistakes. Consider verifying insights manually.
                    </p>
                </div>
            </SheetContent>
        </Sheet>
    )
}

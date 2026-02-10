"use client"

/**
 * AI Interview Completion Screen
 * 
 * Shown after interview ends (completed, timeout, or early exit).
 */

import { Button } from '@/components/ui/button'
import { CheckCircle2, Clock, LogOut, AlertCircle } from 'lucide-react'

interface InterviewCompleteProps {
    status: 'COMPLETED' | 'TIMEOUT' | 'CANDIDATE_EXIT' | 'ERROR'
    duration: number // seconds
    onContinue: () => void
}

export function InterviewComplete({
    status,
    duration,
    onContinue,
}: InterviewCompleteProps) {
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins} min ${secs} sec`
    }

    const statusConfig = {
        COMPLETED: {
            icon: CheckCircle2,
            iconColor: 'text-green-500',
            bgColor: 'bg-green-500/10',
            title: 'Congrats! The Test is Over 🎉',
            description: 'You have successfully completed the AI interview. Your responses have been recorded and submitted.',
        },
        TIMEOUT: {
            icon: Clock,
            iconColor: 'text-yellow-500',
            bgColor: 'bg-yellow-500/10',
            title: 'Time\'s Up',
            description: 'The interview time has ended. Your responses up to this point have been recorded.',
        },
        CANDIDATE_EXIT: {
            icon: LogOut,
            iconColor: 'text-orange-500',
            bgColor: 'bg-orange-500/10',
            title: 'Interview Ended',
            description: 'You\'ve ended the interview early. Your responses have been recorded.',
        },
        ERROR: {
            icon: AlertCircle,
            iconColor: 'text-red-500',
            bgColor: 'bg-red-500/10',
            title: 'Interview Interrupted',
            description: 'There was a technical issue. Your responses up to the interruption have been saved.',
        },
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-8">
            <div className="max-w-md w-full text-center space-y-6">
                {/* Icon */}
                <div className={`w-20 h-20 mx-auto rounded-full ${config.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-10 h-10 ${config.iconColor}`} />
                </div>

                {/* Title & Description */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">{config.title}</h1>
                    <p className="text-neutral-400">{config.description}</p>
                </div>

                {/* Duration */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                    <div className="text-sm text-neutral-500 mb-1">Interview Duration</div>
                    <div className="text-xl font-mono text-white">{formatDuration(duration)}</div>
                </div>

                {/* Next Steps */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-left">
                    <h3 className="font-medium mb-2">What happens next?</h3>
                    <ul className="text-sm text-neutral-400 space-y-2">
                        <li>• Your interview recording is being processed</li>
                        <li>• The <span className="text-white font-medium">Talent Acquisition team</span> will review your responses and get back to you</li>
                        <li>• You'll receive updates via email</li>
                    </ul>
                </div>

                {/* Action */}
                <Button
                    onClick={onContinue}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                >
                    Continue
                </Button>
            </div>
        </div>
    )
}

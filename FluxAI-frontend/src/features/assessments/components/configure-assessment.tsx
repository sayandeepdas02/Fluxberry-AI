import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Clock, Code2, FileText, Video, AlertTriangle, CheckCircle2, Settings2, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { assessmentsApi, type RoundConfigInput } from "@/lib/api/assessments"
import { MCQSelector } from "@/features/assessments/components/mcq-selector"
import { DSASelector } from "@/features/assessments/components/dsa-selector"
import { dsaBank } from "@/features/assessments/mocks/question-bank"
import { AIRoundConfigForm, AI_ROUND_CONFIG_DEFAULT, type AIRoundConfig } from "./ai-round-config-form"
import { useQuestionBank } from "@/features/assessments/hooks/useQuestionBank"

export function ConfigureAssessment({ assessmentId }: { assessmentId: string }) {
    const router = useRouter()

    // Load MCQ questions from API (org + global)
    const { questions: mcqQuestions, isLoading: mcqLoading } = useQuestionBank({ type: 'MCQ' })

    // Round Toggle State
    const [rounds, setRounds] = useState({
        mcq: true,
        dsa: true,
        ai: false
    })

    // Configuration Data State
    const [mcqConfig, setMcqConfig] = useState<{ mode: 'default' | 'custom', selectedIds: string[] }>({ mode: 'default', selectedIds: [] })
    const [dsaConfig, setDsaConfig] = useState<string[]>([])
    const [aiConfig, setAiConfig] = useState<AIRoundConfig>(AI_ROUND_CONFIG_DEFAULT)

    // Modals
    const [showMcqModal, setShowMcqModal] = useState(false)
    const [showDsaModal, setShowDsaModal] = useState(false)

    // Save and continue
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)

    // Validation — at least 1 question selected or default mode
    const isMcqValid = !rounds.mcq || mcqConfig.mode === 'default' || mcqConfig.selectedIds.length >= 1
    const isDsaValid = !rounds.dsa || dsaConfig.length === 4
    const isAiValid = !rounds.ai // AI config always valid
    const isAllValid = isMcqValid && isDsaValid && isAiValid

    // Prevent empty assessment
    const hasAtLeastOneRound = rounds.mcq || rounds.dsa || rounds.ai

    function buildMcqConfig(): { singleCorrectQuestionIds: string[]; multiCorrectQuestionIds: string[] } {
        if (mcqConfig.mode === 'default') {
            const single = mcqQuestions.filter(q => !q.mcqDetails?.isMultiCorrect).slice(0, 20).map(q => q.id)
            const multi = mcqQuestions.filter(q => q.mcqDetails?.isMultiCorrect).slice(0, 10).map(q => q.id)
            return { singleCorrectQuestionIds: single, multiCorrectQuestionIds: multi }
        }
        const selected = mcqQuestions.filter(q => mcqConfig.selectedIds.includes(q.id))
        const single = selected.filter(q => !q.mcqDetails?.isMultiCorrect).map(q => q.id)
        const multi = selected.filter(q => q.mcqDetails?.isMultiCorrect).map(q => q.id)
        return { singleCorrectQuestionIds: single, multiCorrectQuestionIds: multi }
    }

    async function handleContinueToInvite() {
        if (!isAllValid || !hasAtLeastOneRound) return
        setSaveError(null)
        setIsSaving(true)
        try {
            const payload: RoundConfigInput = {
                MCQ: {
                    enabled: rounds.mcq,
                    order: 1,
                    config: rounds.mcq ? buildMcqConfig() : null,
                },
                DSA: {
                    enabled: rounds.dsa,
                    order: 2,
                    config: rounds.dsa && dsaConfig.length === 4 ? { questionIds: dsaConfig } : null,
                },
                AI: {
                    enabled: rounds.ai,
                    order: 3,
                    config: rounds.ai ? {
                        role: aiConfig.role,
                        difficulty: aiConfig.difficulty,
                        maxDurationMinutes: aiConfig.maxDurationMinutes,
                        grillingIntensity: aiConfig.grillingIntensity,
                        maxFundamentalQuestions: aiConfig.maxFundamentalQuestions,
                        maxProjectFollowUps: aiConfig.maxProjectFollowUps,
                    } : null,
                },
            }
            await assessmentsApi.configureRounds(assessmentId, payload)
            router.push(`/dashboard/assessments/${assessmentId}/invite`)
        } catch (e: unknown) {
            const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Failed to save configuration'
            setSaveError(message)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">

            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/assessments/new">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                </Button>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight">Configure Rounds</h1>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Draft</Badge>
                    </div>
                    <p className="text-sm text-neutral-500">Step 2 of 3: Select interview stages and curate content.</p>
                </div>
            </div>

            {/* Status Bar */}
            {!isAllValid && hasAtLeastOneRound && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3 text-sm text-amber-800 animate-in fade-in slide-in-from-top-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <p className="font-medium">Please complete configuration for all enabled rounds to proceed.</p>
                </div>
            )}

            <div className="space-y-6">

                {/* Round 1: MCQ */}
                <Card className={cn("transition-all duration-200 border-l-4", rounds.mcq ? "border-l-blue-500 border-neutral-200 shadow-sm" : "border-l-transparent border-neutral-200 opacity-60")}>
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div className={cn("mt-1 p-2 rounded-lg grid place-items-center w-10 h-10", rounds.mcq ? "bg-blue-100 text-blue-600" : "bg-neutral-100 text-neutral-400")}>
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-lg text-neutral-900">Round 1: Technical Screening (MCQ)</h3>
                                        <p className="text-sm text-neutral-500">Screen candidates on core fundamentals.</p>
                                    </div>
                                    <Switch checked={rounds.mcq} onCheckedChange={(c) => setRounds({ ...rounds, mcq: c })} />
                                </div>

                                {rounds.mcq && (
                                    <div className="space-y-4 pt-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Default Option */}
                                            <div
                                                className={cn("p-4 rounded-lg border cursor-pointer transition-all hover:bg-neutral-50 relative overflow-hidden", mcqConfig.mode === 'default' ? "border-blue-500 ring-1 ring-blue-500 bg-blue-50/10" : "border-neutral-200")}
                                                onClick={() => setMcqConfig({ ...mcqConfig, mode: 'default' })}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-medium text-sm">Use Default Set</span>
                                                    {mcqConfig.mode === 'default' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                                                </div>
                                                <p className="text-xs text-neutral-500 leading-relaxed">
                                                    Auto-generated balanced mix of Frontend (React, CSS) and CS Fundamentals.
                                                </p>
                                            </div>

                                            {/* Custom Option */}
                                            <div
                                                className={cn("p-4 rounded-lg border cursor-pointer transition-all hover:bg-neutral-50 relative overflow-hidden", mcqConfig.mode === 'custom' ? "border-blue-500 ring-1 ring-blue-500 bg-blue-50/10" : "border-neutral-200")}
                                                onClick={() => {
                                                    setMcqConfig(prev => ({ ...prev, mode: 'custom' }))
                                                    setShowMcqModal(true)
                                                }}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-medium text-sm">Custom Selection</span>
                                                    {mcqConfig.mode === 'custom' && (
                                                        isMcqValid ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Badge variant="destructive" className="text-[10px] h-5">Incomplete</Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-neutral-500 leading-relaxed">
                                                    Manually select 30 questions from the bank.
                                                </p>
                                                {mcqConfig.mode === 'custom' && mcqConfig.selectedIds.length > 0 && (
                                                    <div className="mt-3 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded inline-block">
                                                        {mcqConfig.selectedIds.length} / 30 Selected
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Round 2: DSA */}
                <Card className={cn("transition-all duration-200 border-l-4", rounds.dsa ? "border-l-green-500 border-neutral-200 shadow-sm" : "border-l-transparent border-neutral-200 opacity-60")}>
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div className={cn("mt-1 p-2 rounded-lg grid place-items-center w-10 h-10", rounds.dsa ? "bg-green-100 text-green-600" : "bg-neutral-100 text-neutral-400")}>
                                <Code2 className="w-5 h-5" />
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-lg text-neutral-900">Round 2: Hands-on Coding (DSA)</h3>
                                        <p className="text-sm text-neutral-500">Real-time problem solving with test cases.</p>
                                    </div>
                                    <Switch checked={rounds.dsa} onCheckedChange={(c) => setRounds({ ...rounds, dsa: c })} />
                                </div>

                                {rounds.dsa && (
                                    <div>
                                        {dsaConfig.length === 0 ? (
                                            <Button variant="outline" className="w-full h-12 border-dashed border-2 hover:border-green-500 hover:text-green-600 hover:bg-green-50" onClick={() => setShowDsaModal(true)}>
                                                <Settings2 className="w-4 h-4 mr-2" /> Configure Problem Set (Required)
                                            </Button>
                                        ) : (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between group cursor-pointer hover:border-green-300 transition-colors" onClick={() => setShowDsaModal(true)}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-green-600 border border-green-200 shadow-sm">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-green-900">4 Problems Selected</p>
                                                        <p className="text-xs text-green-700">Click to edit selection</p>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="ghost" className="text-green-700 hover:text-green-800 hover:bg-green-100">Edit</Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Round 3: AI Interview */}
                <Card className={cn("transition-all duration-200 border-l-4", rounds.ai ? "border-l-purple-500 border-neutral-200 shadow-sm" : "border-l-transparent border-neutral-200 opacity-60")}>
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div className={cn("mt-1 p-2 rounded-lg grid place-items-center w-10 h-10", rounds.ai ? "bg-purple-100 text-purple-600" : "bg-neutral-100 text-neutral-400")}>
                                <Video className="w-5 h-5" />
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-lg text-neutral-900">Round 3: AI Video Interview</h3>
                                        <p className="text-sm text-neutral-500">Autonomous behavioral and technical interview.</p>
                                    </div>
                                    <Switch checked={rounds.ai} onCheckedChange={(c) => setRounds({ ...rounds, ai: c })} />
                                </div>

                                {rounds.ai && (
                                    <AIRoundConfigForm value={aiConfig} onChange={setAiConfig} />
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* Footer */}
            {saveError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    {saveError}
                </div>
            )}
            <div className="flex justify-end pt-4 gap-4 border-t border-neutral-100 mt-8">
                <Button variant="ghost" asChild>
                    <Link href="/dashboard/assessments/new">Back</Link>
                </Button>
                <Button
                    variant={isAllValid && hasAtLeastOneRound ? "default" : "secondary"}
                    className={cn(isAllValid && hasAtLeastOneRound ? "bg-neutral-900 hover:bg-neutral-800" : "opacity-50 cursor-not-allowed")}
                    disabled={!isAllValid || !hasAtLeastOneRound || isSaving}
                    onClick={isAllValid && hasAtLeastOneRound ? handleContinueToInvite : undefined}
                >
                    {isSaving ? "Saving…" : "Continue to Invite"}
                </Button>
            </div>

            <MCQSelector
                open={showMcqModal}
                onOpenChange={setShowMcqModal}
                initialSelection={mcqConfig.selectedIds}
                questions={mcqQuestions}
                isLoading={mcqLoading}
                onSave={(ids) => {
                    setMcqConfig({ mode: 'custom', selectedIds: ids })
                    setShowMcqModal(false)
                }}
            />

            <DSASelector
                open={showDsaModal}
                onOpenChange={setShowDsaModal}
                initialSelection={dsaConfig}
                onSave={(ids) => {
                    setDsaConfig(ids)
                    setShowDsaModal(false)
                }}
            />

        </div>
    )
}

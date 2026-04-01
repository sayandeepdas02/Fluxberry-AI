import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { interviewsApi, IScorecard } from '@/lib/api/interviews'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ScorecardFormProps {
    interviewId: string
    candidateId: string
    existingScorecard?: IScorecard
}

export function ScorecardForm({ interviewId, candidateId, existingScorecard }: ScorecardFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [scorecard, setScorecard] = useState<Partial<IScorecard>>(existingScorecard || {
        sections: [
            { name: 'Technical Skills', rating: 0, feedback: '' },
            { name: 'Communication', rating: 0, feedback: '' },
            { name: 'Cultural Fit', rating: 0, feedback: '' },
        ],
        recommendation: 'HIRE',
        overallRating: 0,
        privateNotes: ''
    })

    const handleRatingChange = (sectionIndex: number, rating: number) => {
        const newSections = [...(scorecard.sections || [])]
        newSections[sectionIndex].rating = rating
        setScorecard({ ...scorecard, sections: newSections })
    }

    const handleFeedbackChange = (sectionIndex: number, feedback: string) => {
        const newSections = [...(scorecard.sections || [])]
        newSections[sectionIndex].feedback = feedback
        setScorecard({ ...scorecard, sections: newSections })
    }

    const handleSubmit = async () => {
        // Validation logic here
        setLoading(true)
        try {
            await interviewsApi.submitScorecard(interviewId, {
                ...scorecard,
                candidateId,
            })
            toast.success('Feedback submitted successfully')
            router.push('/dashboard/interviews')
        } catch (error) {
            toast.error('Failed to submit feedback')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-20">
            <h2 className="text-2xl tracking-tight">Interview Feedback</h2>

            {scorecard.sections?.map((section, index) => (
                <Card key={index}>
                    <CardHeader>
                        <CardTitle>{section.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Label>Rating:</Label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => handleRatingChange(index, star)}
                                        className={cn(
                                            "p-1 hover:text-yellow-500 transition-colors",
                                            section.rating >= star ? "text-yellow-500" : "text-muted-foreground"
                                        )}
                                    >
                                        <Star className="w-6 h-6 fill-current" />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Textarea
                            placeholder={`Feedback for ${section.name}...`}
                            value={section.feedback}
                            onChange={(e) => handleFeedbackChange(index, e.target.value)}
                        />
                    </CardContent>
                </Card>
            ))}

            <Card>
                <CardHeader>
                    <CardTitle>Overall Recommendation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <RadioGroup
                        value={scorecard.recommendation}
                        onValueChange={(val) => setScorecard({ ...scorecard, recommendation: val as any })}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="STRONG_HIRE" id="r1" />
                            <Label htmlFor="r1" className="text-green-600">Strong Hire</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="HIRE" id="r2" />
                            <Label htmlFor="r2" className="text-green-500">Hire</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="NO_HIRE" id="r3" />
                            <Label htmlFor="r3" className="text-orange-500">No Hire</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="STRONG_NO_HIRE" id="r4" />
                            <Label htmlFor="r4" className="text-red-600">Strong No Hire</Label>
                        </div>
                    </RadioGroup>

                    <div className="grid gap-2">
                        <Label>Private Notes (Only visible to hiring team)</Label>
                        <Textarea
                            placeholder="Additional private notes..."
                            value={scorecard.privateNotes}
                            onChange={(e) => setScorecard({ ...scorecard, privateNotes: e.target.value })}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={loading} size="lg">
                    {loading ? 'Submitting...' : 'Submit Feedback'}
                </Button>
            </div>
        </div>
    )
}

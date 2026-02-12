"use client"
import { ScorecardForm } from '@/features/interviews/components/ScorecardForm'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { interviewsApi } from '@/lib/api/interviews'

export default function ScorecardPage() {
    const params = useParams()
    const id = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : undefined
    const [candidateId, setCandidateId] = useState<string>('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) {
            interviewsApi.getById(id).then(res => {
                if (res.success && res.data) {
                    setCandidateId(res.data.candidateId)
                }
                setLoading(false)
            })
        }
    }, [id])

    if (loading) return <div>Loading...</div>
    if (!id || !candidateId) return <div>Interview not found</div>

    return (
        <div className="p-8">
            <ScorecardForm interviewId={id} candidateId={candidateId} />
        </div>
    )
}

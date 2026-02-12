import { useState, useCallback } from 'react'
import { atsOnboardingApi, IOnboarding, IOnboardingDocument } from '@/lib/api/ats-onboarding'
import { toast } from 'sonner'

export function useATSOnboarding() {
    const [activeOnboardings, setActiveOnboardings] = useState<IOnboarding[]>([])
    const [currentOnboarding, setCurrentOnboarding] = useState<IOnboarding | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchActiveOnboardings = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await atsOnboardingApi.getActiveOnboardings()
            if (response.success && response.data) {
                setActiveOnboardings(response.data)
            }
        } catch (err: any) {
            setError(err.message)
            toast.error('Failed to fetch active onboardings')
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchOnboarding = useCallback(async (id: string) => {
        setLoading(true)
        setError(null)
        try {
            const response = await atsOnboardingApi.getOnboarding(id)
            if (response.success && response.data) {
                setCurrentOnboarding(response.data)
            }
        } catch (err: any) {
            setError(err.message)
            toast.error('Failed to fetch onboarding details')
        } finally {
            setLoading(false)
        }
    }, [])

    const reviewDocument = async (documentId: string, status: 'APPROVED' | 'REJECTED', feedback?: string) => {
        setLoading(true)
        try {
            const response = await atsOnboardingApi.reviewDocument(documentId, status, feedback)
            if (response.success && response.data) {
                // Update local state
                if (currentOnboarding) {
                    setCurrentOnboarding({
                        ...currentOnboarding,
                        documents: currentOnboarding.documents.map(d =>
                            d._id === documentId ? response.data! : d
                        )
                    })
                }
                toast.success(`Document ${status.toLowerCase()}`)
                return response.data
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to review document')
            throw err
        } finally {
            setLoading(false)
        }
    }

    const completeOnboarding = async (id: string) => {
        setLoading(true)
        try {
            const response = await atsOnboardingApi.completeOnboarding(id)
            if (response.success) {
                toast.success('Onboarding marked as complete')
                // Remove from active list locally
                setActiveOnboardings(prev => prev.filter(o => o._id !== id))
                return response.data
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to complete onboarding')
            throw err
        } finally {
            setLoading(false)
        }
    }

    return {
        activeOnboardings,
        currentOnboarding,
        loading,
        error,
        fetchActiveOnboardings,
        fetchOnboarding,
        reviewDocument,
        completeOnboarding
    }
}

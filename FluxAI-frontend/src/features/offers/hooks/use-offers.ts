import { useState, useCallback } from 'react'
import { offersApi, IOffer, IOfferTemplate, CreateOfferInput, CreateTemplateInput } from '@/lib/api/offers'
import { toast } from 'sonner'

export function useOffers() {
    const [offers, setOffers] = useState<IOffer[]>([])
    const [templates, setTemplates] = useState<IOfferTemplate[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchOffersByApplication = useCallback(async (applicationId: string) => {
        setLoading(true)
        setError(null)
        try {
            const response = await offersApi.getOffersByApplication(applicationId)
            if (response.success && response.data) {
                setOffers(response.data)
            }
        } catch (err: any) {
            setError(err.message)
            toast.error('Failed to fetch offers')
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchOffers = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await offersApi.getOffers()
            if (response.success && response.data) {
                setOffers(response.data)
            }
        } catch (err: any) {
            setError(err.message)
            toast.error('Failed to fetch offers')
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchTemplates = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await offersApi.getTemplates()
            if (response.success && response.data) {
                setTemplates(response.data)
            }
        } catch (err: any) {
            setError(err.message)
            toast.error('Failed to fetch templates')
        } finally {
            setLoading(false)
        }
    }, [])

    const createOffer = async (data: CreateOfferInput) => {
        setLoading(true)
        try {
            const response = await offersApi.createOffer(data)
            if (response.success && response.data) {
                setOffers(prev => [response.data!, ...prev])
                toast.success('Offer created successfully')
                return response.data
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to create offer')
            throw err
        } finally {
            setLoading(false)
        }
    }

    const sendOffer = async (offerId: string) => {
        setLoading(true)
        try {
            const response = await offersApi.sendOffer(offerId)
            if (response.success && response.data) {
                setOffers(prev => prev.map(o => o._id === offerId ? response.data! : o))
                toast.success('Offer sent successfully')
                return response.data
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to send offer')
        } finally {
            setLoading(false)
        }
    }

    const createTemplate = async (data: CreateTemplateInput) => {
        setLoading(true)
        try {
            const response = await offersApi.createTemplate(data)
            if (response.success && response.data) {
                setTemplates(prev => [response.data!, ...prev])
                toast.success('Template created successfully')
                return response.data
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to create template')
            throw err
        } finally {
            setLoading(false)
        }
    }

    const updateTemplate = async (id: string, data: Partial<CreateTemplateInput>) => {
        setLoading(true)
        try {
            const response = await offersApi.updateTemplate(id, data)
            if (response.success && response.data) {
                setTemplates(prev => prev.map(t => t._id === id ? response.data! : t))
                toast.success('Template updated successfully')
                return response.data
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to update template')
            throw err
        } finally {
            setLoading(false)
        }
    }

    return {
        offers,
        templates,
        loading,
        error,
        fetchOffers,
        fetchOffersByApplication,
        fetchTemplates,
        createOffer,
        sendOffer,
        createTemplate,
        updateTemplate
    }
}

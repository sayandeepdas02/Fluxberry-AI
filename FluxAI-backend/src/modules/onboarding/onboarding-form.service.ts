import { OnboardingFormTemplate, OnboardingFormResponse, Onboarding } from '../../database/models/index.js'
import { Types } from 'mongoose'

export class OnboardingFormService {

    async fetchFormTemplates(organizationId: string) {
        return OnboardingFormTemplate.find({ organizationId }).sort({ createdAt: -1 })
    }

    async getFormTemplate(templateId: string, organizationId: string) {
        return OnboardingFormTemplate.findOne({ _id: templateId, organizationId })
    }

    async createFormTemplate(organizationId: string, data: { name: string; fields: any[] }) {
        return OnboardingFormTemplate.create({
            organizationId,
            name: data.name,
            fields: data.fields,
            version: 1
        })
    }

    async fetchFormResponse(onboardingId: string) {
        return OnboardingFormResponse.findOne({ onboardingId }).populate('formTemplateId')
    }

    async attachFormToOnboarding(organizationId: string, onboardingId: string, formTemplateId: string) {
        // Confirm Onboarding exists
        const onboarding = await Onboarding.findOne({ _id: onboardingId, organizationId })
        if (!onboarding) throw new Error('Onboarding record not found')

        // Create empty IN_PROGRESS response
        const existingResponse = await OnboardingFormResponse.findOne({ onboardingId })
        if (existingResponse) throw new Error('Onboarding form already attached')

        const formResponse = await OnboardingFormResponse.create({
            onboardingId,
            formTemplateId,
            responses: {},
            status: 'IN_PROGRESS'
        })

        // Workflow state updates
        onboarding.workflowState = 'FORM_PENDING'
        await onboarding.save()

        return formResponse
    }

    async saveFormDraft(onboardingId: string, responses: Record<string, any>) {
        const formResponse = await OnboardingFormResponse.findOne({ onboardingId })
        if (!formResponse) throw new Error('Form response not found')

        if (formResponse.status === 'SUBMITTED') {
            throw new Error('Form is already submitted')
        }

        formResponse.responses = { ...formResponse.responses, ...responses }
        await formResponse.save()
        return formResponse
    }

    async submitForm(onboardingId: string, responses: Record<string, any>) {
        const formResponse = await OnboardingFormResponse.findOne({ onboardingId }).populate('formTemplateId')
        if (!formResponse) throw new Error('Form response not found')

        if (formResponse.status === 'SUBMITTED') {
            throw new Error('Form is already submitted')
        }

        formResponse.responses = { ...formResponse.responses, ...responses }
        formResponse.status = 'SUBMITTED'
        formResponse.submittedAt = new Date()

        await this.validateForm(formResponse.formTemplateId as any, formResponse.responses)

        await formResponse.save()
        return formResponse
    }

    async rejectForm(organizationId: string, onboardingId: string, feedback: { fieldId: string, message: string }[]) {
        const onboarding = await Onboarding.findOne({ _id: onboardingId, organizationId })
        if (!onboarding) throw new Error('Onboarding record not found')

        const formResponse = await OnboardingFormResponse.findOne({ onboardingId })
        if (!formResponse) throw new Error('Form response not found')

        if (formResponse.status !== 'SUBMITTED') {
            throw new Error('Can only reject SUBMITTED forms')
        }

        formResponse.status = 'NEEDS_REVISION'
        formResponse.feedback = feedback

        // Let's ensure candidate workflow reflects pending action again if needed,
        // but 'FORM_PENDING' or similar is tracked in workflowState
        onboarding.workflowState = 'FORM_PENDING'

        await formResponse.save()
        await onboarding.save()

        return formResponse
    }

    private async validateForm(template: any, responses: Record<string, any>) {
        for (const field of template.fields) {
            if (field.required && (responses[field.id] === undefined || responses[field.id] === '')) {
                throw new Error(`Field ${field.label} is required`)
            }
        }
    }
}

export const onboardingFormService = new OnboardingFormService()

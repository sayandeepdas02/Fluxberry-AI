import mongoose, { Document, Schema } from 'mongoose'

export interface IOrganizationOnboardingSettings extends Document {
    organizationId: mongoose.Types.ObjectId
    offerReminderHours: number
    onboardingReminderHours: number
    offerExpiryDays: number
    maxReminders: number
    createdAt?: Date
    updatedAt?: Date
}

const OrganizationOnboardingSettingsSchema = new Schema<IOrganizationOnboardingSettings>(
    {
        organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true },
        offerReminderHours: { type: Number, default: 48 },
        onboardingReminderHours: { type: Number, default: 72 },
        offerExpiryDays: { type: Number, default: 7 },
        maxReminders: { type: Number, default: 3 }
    },
    { timestamps: true }
)

export const OrganizationOnboardingSettings = mongoose.model<IOrganizationOnboardingSettings>(
    'OrganizationOnboardingSettings',
    OrganizationOnboardingSettingsSchema
)

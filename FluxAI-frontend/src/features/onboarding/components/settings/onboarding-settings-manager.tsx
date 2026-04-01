"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Settings, Clock, Save, Building } from 'lucide-react'
import { organizationsApi } from '@/lib/api/organizations'

export function OnboardingSettingsManager() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [settings, setSettings] = useState({
        offerReminderHours: 48,
        onboardingReminderHours: 72,
        offerExpiryDays: 7,
        maxReminders: 3
    })

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await organizationsApi.getOnboardingSettings()
                if (res.success && res.data) {
                    setSettings({
                        offerReminderHours: res.data.offerReminderHours || 48,
                        onboardingReminderHours: res.data.onboardingReminderHours || 72,
                        offerExpiryDays: res.data.offerExpiryDays || 7,
                        maxReminders: res.data.maxReminders || 3
                    })
                }
            } catch (err) {
                console.error("Failed to load onboarding settings:", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchSettings()
    }, [])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const res = await organizationsApi.updateOnboardingSettings(settings)
            if (res.success && res.data) {
                // optionally show a toast here
            }
        } catch (err) {
            console.error("Failed to save settings:", err)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="max-w-3xl space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl tracking-tight">Onboarding Settings</h1>
                <p className="text-muted-foreground">Manage organizational defaults for cron tasks and expirations.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        Reminders & Expirations
                    </CardTitle>
                    <CardDescription>
                        Configure how often the system pushes notifications to candidates waiting on action.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="offerReminderHours">Offer Reminder Interval (Hours)</Label>
                            <Input
                                id="offerReminderHours"
                                type="number"
                                value={settings.offerReminderHours}
                                onChange={(e) => setSettings({ ...settings, offerReminderHours: parseInt(e.target.value) || 0 })}
                            />
                            <p className="text-xs text-muted-foreground">Hours before the first nudge is sent on a pending offer.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="offerExpiryDays">Offer Expiry Duration (Days)</Label>
                            <Input
                                id="offerExpiryDays"
                                type="number"
                                value={settings.offerExpiryDays}
                                onChange={(e) => setSettings({ ...settings, offerExpiryDays: parseInt(e.target.value) || 0 })}
                            />
                            <p className="text-xs text-muted-foreground">How many days before the offer is permanently locked.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="onboardingReminderHours">Task Reminder Interval (Hours)</Label>
                            <Input
                                id="onboardingReminderHours"
                                type="number"
                                value={settings.onboardingReminderHours}
                                onChange={(e) => setSettings({ ...settings, onboardingReminderHours: parseInt(e.target.value) || 0 })}
                            />
                            <p className="text-xs text-muted-foreground">Hours between document upload reminders.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="maxReminders">Maximum Reminders</Label>
                            <Input
                                id="maxReminders"
                                type="number"
                                value={settings.maxReminders}
                                onChange={(e) => setSettings({ ...settings, maxReminders: parseInt(e.target.value) || 0 })}
                            />
                            <p className="text-xs text-muted-foreground">Caps the number of automated nudges.</p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/50 px-6 py-4 flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Settings
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}

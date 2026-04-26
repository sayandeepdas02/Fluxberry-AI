"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { JobData } from "../job-wizard"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, GripVertical, Lock } from "lucide-react"

interface StepProps {
    data: JobData
    updateData: (data: Partial<JobData>) => void
}

export function Step2FormBuilder({ data, updateData }: StepProps) {

    const addCustomField = () => {
        updateData({
            customFields: [...data.customFields, { name: "", type: "text", required: false }]
        })
    }

    const removeCustomField = (index: number) => {
        const newFields = [...data.customFields]
        newFields.splice(index, 1)
        updateData({ customFields: newFields })
    }

    const updateField = (index: number, field: Partial<{ name: string; type: string; required: boolean }>) => {
        const newFields = [...data.customFields]
        newFields[index] = { ...newFields[index], ...field }
        updateData({ customFields: newFields })
    }

    const DEFAULT_FIELDS = [
        { label: "Full Name", required: true },
        { label: "Email Address", required: true },
        { label: "Resume Upload (PDF)", required: true },
        { label: "Current CTC", required: true },
        { label: "Expected CTC", required: true },
    ]

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-1">
                <h2 className="text-xl font-semibold text-slate-900">Application Form</h2>
                <p className="text-sm text-muted-foreground">Configure the fields candidates must fill out when applying.</p>
            </div>

            {/* Standard Fields */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[13px] uppercase tracking-wider text-slate-500">Standard Fields</h3>
                    <div className="h-px flex-1 bg-slate-100" />
                </div>

                <div className="bg-slate-50/50 border border-slate-200 rounded-[12px] p-2 space-y-2">
                    {DEFAULT_FIELDS.map((field, i) => (
                        <div key={i} className="flex items-center justify-between p-3.5 bg-white rounded-[8px] border border-slate-100 shadow-sm transition-all hover:border-slate-300">
                            <div className="flex items-center gap-3 text-slate-700">
                                <Lock className="h-4 w-4 text-slate-400" />
                                <Label className="font-medium text-[14px]">{field.label}</Label>
                            </div>
                            <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider bg-slate-100/80 px-2.5 py-1 rounded-full">
                                Required
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Custom Fields */}
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <h3 className="font-semibold text-[13px] uppercase tracking-wider text-slate-500 shrink-0">Custom Fields</h3>
                    <div className="h-px flex-1 bg-slate-100" />
                    <Button size="sm" variant="outline" onClick={addCustomField} className="shrink-0 h-8 rounded-full border-dashed bg-white">
                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Field
                    </Button>
                </div>

                {data.customFields.length === 0 ? (
                    <div className="text-[14px] text-center py-10 text-slate-500 border-2 border-dashed border-slate-200 rounded-[12px] bg-slate-50/50">
                        No custom fields added. Click 'Add Field' to create one.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data.customFields.map((field, index) => (
                            <div key={index} className="group flex gap-3 items-start border border-slate-200 p-3.5 rounded-[12px] bg-white shadow-sm hover:border-slate-300 transition-colors">
                                <div className="mt-2.5 cursor-grab text-slate-300 group-hover:text-slate-400">
                                    <GripVertical className="h-5 w-5" />
                                </div>
                                
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="md:col-span-6 space-y-1.5">
                                        <Label className="text-[12px] text-slate-500 font-medium ml-1">Field Name</Label>
                                        <Input
                                            placeholder="e.g. Portfolio URL"
                                            value={field.name}
                                            onChange={(e) => updateField(index, { name: e.target.value })}
                                            className="h-10 bg-slate-50/50 border-slate-200 focus-visible:bg-white focus-visible:ring-primary/20 rounded-[8px]"
                                        />
                                    </div>
                                    
                                    <div className="md:col-span-4 space-y-1.5">
                                        <Label className="text-[12px] text-slate-500 font-medium ml-1">Field Type</Label>
                                        <select
                                            className="flex h-10 w-full rounded-[8px] border border-slate-200 bg-slate-50/50 px-3 text-[14px] text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20 focus-visible:bg-white"
                                            value={field.type}
                                            onChange={(e) => updateField(index, { type: e.target.value })}
                                        >
                                            <option value="text">Short Text</option>
                                            <option value="textarea">Long Text</option>
                                            <option value="number">Number</option>
                                        </select>
                                    </div>

                                    <div className="md:col-span-2 space-y-1.5 flex flex-col justify-end">
                                        <div className="flex items-center justify-between h-10 border border-slate-200 rounded-[8px] px-3 bg-slate-50/50">
                                            <Label htmlFor={`req-${index}`} className="text-[13px] font-medium text-slate-600 cursor-pointer">Required</Label>
                                            <Switch
                                                id={`req-${index}`}
                                                checked={field.required}
                                                onCheckedChange={(c) => updateField(index, { required: c })}
                                                className="scale-75 origin-right"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="mt-6 text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0" 
                                    onClick={() => removeCustomField(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

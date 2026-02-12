import { useState, useEffect } from "react";
import { useJobs } from "@/features/jobs/hooks/use-jobs";
// import { useApplications } from "@/features/jobs/hooks/use-applications"; 
import { useOffers } from "../hooks/use-offers";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { IOfferTemplate } from "@/lib/api/offers";

export function CreateOfferModal() {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);

    // Data Hooks
    const { jobs, fetchJobs } = useJobs();
    const { templates, fetchTemplates, createOffer, loading: offerLoading } = useOffers();

    // Selection State
    const [selectedJobId, setSelectedJobId] = useState<string>("");
    const [selectedRepoId, setSelectedRepoId] = useState<string>(""); // Application ID
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [variables, setVariables] = useState<Record<string, any>>({});
    const [expiresInDays, setExpiresInDays] = useState<number>(7);

    // Dynamic fetching of applications
    const [jobApplications, setJobApplications] = useState<any[]>([]);
    const [loadingApps, setLoadingApps] = useState(false);

    // Load initial data
    useEffect(() => {
        if (open) {
            fetchJobs();
            fetchTemplates();
            setStep(1);
            setSelectedJobId("");
            setSelectedRepoId("");
            setSelectedTemplateId("");
            setVariables({});
            setJobApplications([]);
        }
    }, [open, fetchJobs, fetchTemplates]);

    const loadApplications = async (jobId: string) => {
        setLoadingApps(true);
        try {
            // Dynamic import to avoid circular dependencies if any, but regular import is fine too.
            const { applicationsApi } = await import("@/lib/api/applications");
            const response = await applicationsApi.listByJob(jobId, { stage: 'INTERVIEW' } as any);
            if (response.success && response.data) {
                setJobApplications(response.data.applications);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingApps(false);
        }
    }

    const handleJobChange = (jobId: string) => {
        setSelectedJobId(jobId);
        loadApplications(jobId);
        setSelectedRepoId(""); // Reset application
    };

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplateId(templateId);
        setVariables({}); // Reset variables
    };

    const getSelectedTemplate = () => templates.find(t => t._id === selectedTemplateId);

    const handleCreate = async () => {
        try {
            await createOffer({
                applicationId: selectedRepoId,
                templateId: selectedTemplateId,
                variables,
                expiresInDays
            });
            setOpen(false);
        } catch (e) {
            // handled by hook
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1: // Job & Candidate
                return (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Select Job</Label>
                            <Select value={selectedJobId} onValueChange={handleJobChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a job position" />
                                </SelectTrigger>
                                <SelectContent>
                                    {jobs.map(job => (
                                        <SelectItem key={job._id} value={job._id}>{job.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Select Candidate (Interview Stage)</Label>
                            <Select value={selectedRepoId} onValueChange={setSelectedRepoId} disabled={!selectedJobId || loadingApps}>
                                <SelectTrigger>
                                    <SelectValue placeholder={loadingApps ? "Loading..." : "Select a candidate"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {jobApplications.map(app => {
                                        const candidateName = typeof app.candidateId === 'object'
                                            ? `${app.candidateId.firstName} ${app.candidateId.lastName}`
                                            : 'Unknown Candidate';
                                        return (
                                            <SelectItem key={app._id} value={app._id}>
                                                {candidateName}
                                            </SelectItem>
                                        );
                                    })}
                                    {jobApplications.length === 0 && !loadingApps && selectedJobId && (
                                        <div className="p-2 text-sm text-muted-foreground">No candidates in Interview stage</div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                );
            case 2: // Template
                return (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Select Offer Template</Label>
                            <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a template" />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map(t => (
                                        <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedTemplateId && (
                            <div className="border rounded-md p-3 bg-muted/20 text-xs text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
                                {getSelectedTemplate()?.content ?? ''}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Expires In (Days)</Label>
                            <Input
                                type="number"
                                min={1}
                                value={expiresInDays}
                                onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 7)}
                            />
                        </div>
                    </div>
                );
            case 3: // Variables
                const template = getSelectedTemplate();
                if (!template) return <div>Invalid Template</div>;

                return (
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">Fill in the details for dynamic placeholders.</p>
                        {template.variables.map(variable => {
                            // Basic schema check if available, otherwise text input
                            const schema = template.variableSchema?.[variable];
                            const label = schema?.label || variable;
                            const type = schema?.type || 'text';

                            return (
                                <div key={variable} className="space-y-2">
                                    <Label className="capitalize">{label.replace(/_/g, ' ')}</Label>
                                    <Input
                                        value={variables[variable] || ''}
                                        onChange={(e) => setVariables(prev => ({ ...prev, [variable]: e.target.value }))}
                                        placeholder={`Enter ${label}`}
                                        type={type === 'number' ? 'number' : 'text'}
                                    />
                                </div>
                            );
                        })}
                        {template.variables.length === 0 && (
                            <div className="text-sm text-muted-foreground italic">No variables to fill for this template.</div>
                        )}
                    </div>
                );
            default: return null;
        }
    };

    const isStepValid = () => {
        if (step === 1) return !!selectedJobId && !!selectedRepoId;
        if (step === 2) return !!selectedTemplateId;
        if (step === 3) {
            // Check if all variables are filled
            const template = getSelectedTemplate();
            if (!template) return false;
            return template.variables.every(v => !!variables[v]);
        }
        return false;
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Offer
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Offer</DialogTitle>
                    <DialogDescription>
                        Step {step} of 3: {step === 1 ? 'Select Candidate' : step === 2 ? 'Choose Template' : 'Offer Details'}
                    </DialogDescription>
                </DialogHeader>

                {renderStepContent()}

                <DialogFooter className="flex justify-between sm:justify-between w-full">
                    <Button
                        variant="outline"
                        onClick={() => setStep(s => s - 1)}
                        disabled={step === 1 || offerLoading}
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>

                    {step < 3 ? (
                        <Button
                            onClick={() => setStep(s => s + 1)}
                            disabled={!isStepValid()}
                        >
                            Next
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleCreate}
                            disabled={!isStepValid() || offerLoading}
                        >
                            {offerLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Create Offer
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

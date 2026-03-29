import React from 'react';
import { ProspectCandidate } from '../types';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MapPin, Globe, Sparkles, PlusCircle, Unlock, Mail, Linkedin, Briefcase } from 'lucide-react';

interface ProspectDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    candidate: ProspectCandidate | null;
    onUnlock: (id: string) => Promise<boolean>;
    onPushToATS: (id: string) => void;
}

export function ProspectDrawer({
    open,
    onOpenChange,
    candidate,
    onUnlock,
    onPushToATS
}: ProspectDrawerProps) {
    if (!candidate) return null;

    const [unlocking, setUnlocking] = React.useState(false);

    const handleUnlock = async () => {
        setUnlocking(true);
        await onUnlock(candidate.id);
        setUnlocking(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl md:max-w-2xl px-0 border-l border-line flex flex-col h-full bg-background overflow-y-auto">
                
                {/* Fixed Top Header */}
                <div className="px-6 py-6 border-b border-line bg-card sticky top-0 z-20 flex flex-col gap-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16 rounded-none border border-line bg-muted">
                                <AvatarFallback className="rounded-none text-xl">
                                    {candidate.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <SheetTitle className="text-2xl font-bold tracking-tight">
                                    {candidate.name}
                                </SheetTitle>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {candidate.location}
                                </div>
                            </div>
                        </div>

                        {/* Top Right Actions */}
                        <div className="flex flex-col gap-2 shrink-0 items-end">
                             {candidate.unlocked ? (
                                <a href={`mailto:${candidate.email}`} className="text-sm font-medium border border-line px-3 py-1.5 flex items-center gap-2 hover:bg-muted">
                                    <Mail className="w-4 h-4" />
                                    {candidate.email}
                                </a>
                            ) : (
                                <Button 
                                    onClick={handleUnlock} 
                                    disabled={unlocking}
                                    className="rounded-none h-9 px-4 font-semibold text-xs"
                                >
                                    {unlocking ? <Sparkles className="w-4 h-4 mr-2 animate-pulse" /> : <Unlock className="w-4 h-4 mr-2" />}
                                    Unlock Email (-1 Credit)
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                onClick={() => onPushToATS(candidate.id)}
                                className="rounded-none h-9 px-4 text-xs font-semibold border-linetext-muted-foreground w-full justify-start"
                            >
                                <PlusCircle className="w-4 h-4 mr-2" />
                                Add to ATS Pipeline
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content Body */}
                <div className="px-6 py-8 flex flex-col gap-10">
                    
                    {/* Insights Box */}
                    <div className="p-5 border border-line bg-primary/5 relative">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                        <h4 className="text-primary font-semibold flex items-center gap-2 text-sm mb-3">
                            <Sparkles className="w-4 h-4" />
                            AI Recruiter Insight ({candidate.matchScore}% Match)
                        </h4>
                        <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                            {candidate.aiSummary.fit}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h5 className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-2">Strengths</h5>
                                <ul className="text-sm space-y-1">
                                    {candidate.aiSummary.strengths.map(s => (
                                        <li key={s} className="flex items-start gap-2 text-muted-foreground">
                                            <span className="text-emerald-500 mt-0.5">•</span>
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Skills Summary */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2 border-b border-line pb-2">
                            Top Technical Skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {candidate.skills.map(skill => (
                                <span key={skill} className="px-3 py-1.5 text-sm font-medium bg-muted/30 border border-line text-foreground">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Timeline Experience */}
                    <div>
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 border-b border-line pb-2">
                            <Briefcase className="w-5 h-5 text-muted-foreground" />
                            Work History
                        </h3>
                        <div className="relative border-l border-line ml-3 space-y-8 pb-4">
                            {candidate.experience.map((exp, i) => (
                                <div key={exp.id} className="relative pl-6">
                                    {/* Timeline dot */}
                                    <span className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-none border border-line ${exp.current ? 'bg-primary border-primary' : 'bg-background'}`} />
                                    
                                    <div className="flex flex-col gap-1">
                                        <h4 className="text-base font-semibold text-foreground">
                                            {exp.role}
                                        </h4>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                            <Building className="w-3.5 h-3.5" />
                                            {exp.company}
                                            <span>•</span>
                                            <span>{exp.years} yrs {exp.current ? '(Present)' : ''}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground/80 mt-2 leading-relaxed">
                                            {exp.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact Extractor */}
                    {!candidate.unlocked && (
                        <div className="bg-muted border border-line p-6 flex flex-col items-center justify-center text-center gap-3">
                            <Lock className="w-8 h-8 text-muted-foreground/50" />
                            <div>
                                <h4 className="font-semibold text-foreground">Contact details are locked</h4>
                                <p className="text-sm text-muted-foreground mt-1">Unlock this profile to reveal verified personal email and social links.</p>
                            </div>
                            <Button 
                                onClick={handleUnlock} 
                                disabled={unlocking}
                                className="mt-2 rounded-none bg-foreground text-background"
                            >
                                {unlocking ? 'Processing...' : 'Unlock Profile Details (-1)'}
                            </Button>
                        </div>
                    )}
                </div>

            </SheetContent>
        </Sheet>
    );
}

// Mini Building icon fallback if missed
function Building(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
            <path d="M9 22v-4h6v4" />
            <path d="M8 6h.01" />
            <path d="M16 6h.01" />
            <path d="M12 6h.01" />
            <path d="M12 10h.01" />
            <path d="M12 14h.01" />
            <path d="M16 10h.01" />
            <path d="M16 14h.01" />
            <path d="M8 10h.01" />
            <path d="M8 14h.01" />
        </svg>
    )
}
function Lock(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    )
}

import React from 'react';
import { ProspectCandidate } from '../types';
import { 
    Avatar, 
    AvatarFallback 
} from '@/components/ui/avatar';
import { 
    MapPin, 
    Building, 
    Briefcase,
    Sparkles,
    Unlock,
    Mail,
    PlusCircle,
    CheckCircle2,
    Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CandidateResultCardProps {
    candidate: ProspectCandidate;
    onUnlock: (id: string) => Promise<boolean>;
    onViewProfile: (id: string) => void;
    onPushToATS: (id: string) => void;
}

export function CandidateResultCard({
    candidate,
    onUnlock,
    onViewProfile,
    onPushToATS
}: CandidateResultCardProps) {
    const [unlocking, setUnlocking] = React.useState(false);
    
    const latestExperience = candidate.experience.find(e => e.current) || candidate.experience[0];
    const totalExp = candidate.experience.reduce((sum, e) => sum + e.years, 0);

    const handleUnlock = async () => {
        setUnlocking(true);
        await onUnlock(candidate.id);
        setUnlocking(false);
    };

    return (
        <div className="group bg-card border border-line p-5 transition-all hover:border-primary/50 relative">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
                
                {/* Avatar & Score Column */}
                <div className="flex flex-col items-center gap-3 shrink-0">
                    <Avatar className="w-16 h-16 rounded-none border border-line">
                        <AvatarFallback className="text-xl font-medium bg-muted text-muted-foreground rounded-none">
                            {candidate.name.substring(0,2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex flex-col items-center">
                        <div className={`
                            flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold border
                            ${candidate.matchScore >= 80 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                            : candidate.matchScore >= 60 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
                            : 'bg-primary/10 text-primary border-primary/20'}
                        `}>
                            <Sparkles className="w-3 h-3" />
                            {candidate.matchScore}% 
                        </div>
                    </div>
                </div>

                {/* Core Profile Details */}
                <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                {candidate.name}
                                {candidate.unlocked && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            </h3>
                            
                            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                                {latestExperience && (
                                    <span className="flex items-center gap-1.5">
                                        <Briefcase className="w-3.5 h-3.5" />
                                        {latestExperience.role}
                                    </span>
                                )}
                                {latestExperience && (
                                    <span className="flex items-center gap-1.5">
                                        <Building className="w-3.5 h-3.5" />
                                        {latestExperience.company}
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5 border-l border-line pl-4">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {candidate.location}
                                </span>
                            </div>
                        </div>

                        {/* Actions (Desktop) */}
                        <div className="hidden sm:flex flex-col gap-2 items-end shrink-0">
                            {candidate.unlocked ? (
                                <Button size="sm" variant="outline" className="w-full justify-start rounded-none h-8 text-xs border-line hover:border-foreground/30">
                                    <Mail className="w-3.5 h-3.5 mr-2" />
                                    {candidate.email}
                                </Button>
                            ) : (
                                <Button 
                                    size="sm" 
                                    onClick={handleUnlock}
                                    disabled={unlocking}
                                    className="w-full bg-foreground text-background hover:opacity-90 rounded-none h-8 text-xs font-medium"
                                >
                                    {unlocking ? <Sparkles className="w-3.5 h-3.5 mr-2 animate-pulse" /> : <Unlock className="w-3.5 h-3.5 mr-2" />}
                                    Unlock Email (-1)
                                </Button>
                            )}
                            
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => onPushToATS(candidate.id)}
                                className="w-full justify-start text-xs h-8 hover:bg-muted text-primary px-2 rounded-none"
                            >
                                <PlusCircle className="w-3.5 h-3.5 mr-2" />
                                Send to Pipeline
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <span className="text-xs font-medium bg-muted/50 px-2 py-1 border border-line">
                            {totalExp} Yrs Exp
                        </span>
                        
                        {candidate.skills.slice(0, 5).map(skill => (
                            <span key={skill} className="text-xs text-muted-foreground px-2 py-1 border border-line bg-muted/10">
                                {skill}
                            </span>
                        ))}
                        {candidate.skills.length > 5 && (
                            <span className="text-xs text-muted-foreground">+{candidate.skills.length - 5} more</span>
                        )}
                    </div>

                    {/* AI Highlight Snippet */}
                    <div className="mt-4 p-3 border-l-2 border-primary bg-primary/5">
                        <p className="text-sm text-foreground/80 leading-relaxed">
                            <strong className="text-foreground">AI Insight:</strong> {candidate.aiSummary.fit}
                        </p>
                    </div>

                    {/* View Full Profile Mobile Fallback + Trigger */}
                    <div className="pt-2">
                        <button 
                            onClick={() => onViewProfile(candidate.id)}
                            className="text-sm font-medium text-primary hover:underline underline-offset-4"
                        >
                            View Full Prospect Profile →
                        </button>
                    </div>
                </div>
                
            </div>
        </div>
    );
}

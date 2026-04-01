"use client";

import React, { useState } from 'react';
import { useTalentSearch } from '@/features/talent-prospect/hooks/use-talent-search';
import { FiltersPanel } from '@/features/talent-prospect/components/filters-panel';
import { CandidateResultCard } from '@/features/talent-prospect/components/candidate-result-card';
import { ProspectDrawer } from '@/features/talent-prospect/components/prospect-profile-drawer';
import { Search, Sparkles, Database, Loader2 } from 'lucide-react';
import { withAppGuard } from '@/lib/subscription/with-app-guard';
import { PremiumEmptyState } from '@/components/ui/empty-state';

function TalentProspectPage() {
    const {
        results,
        filters,
        setFilters,
        handleAIQuery,
        isSearching,
        credits,
        unlockProfile,
        pushToATS,
        totalDBSize
    } = useTalentSearch();

    const [queryInput, setQueryInput] = useState("");
    const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleAIQuery(queryInput);
    };

    const selectedProspect = React.useMemo(() => {
        return results.find(r => r.id === selectedProspectId) || null;
    }, [results, selectedProspectId]);

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
            
            {/* Top Toolbar (Navigation + AI Search + Credits) */}
            <div className="flex-none px-6 py-4 border-b border-line bg-card flex flex-col sm:flex-row gap-4 items-center justify-between z-20 sticky top-0">
                <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-primary" />
                    <h1 className="text-xl tracking-tight">Talent Prospect</h1>
                </div>

                {/* AI Search Engine Center */}
                <form 
                    onSubmit={handleSearchSubmit} 
                    className="flex-1 max-w-2xl w-full relative group"
                >
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <Search className="w-4 h-4 text-muted-foreground/50 group-focus-within:text-foreground" />
                    </div>
                    
                    <input 
                        type="text" 
                        value={queryInput}
                        onChange={(e) => setQueryInput(e.target.value)}
                        placeholder="E.g. Find 3 senior React engineers from early-stage startups..."
                        className="w-full h-11 border border-line bg-background pl-10 pr-[120px] rounded-none shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-medium"
                    />

                    <div className="absolute right-1 top-1/2 -translate-y-1/2">
                        <button 
                            type="submit"
                            disabled={isSearching}
                            className="bg-primary hover:opacity-90 text-primary-foreground px-4 h-9 flex items-center gap-2 text-xs font-semibold rounded-none disabled:opacity-50"
                        >
                            {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            AI Search
                        </button>
                    </div>
                </form>

                {/* Credit Score Bug */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="px-3 py-1.5 border border-line bg-muted/10 text-xs font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        {credits} Credits
                    </div>
                </div>
            </div>

            {/* Application Main Layout Wrapper */}
            <div className="flex flex-1 overflow-hidden relative">
                
                {/* Left Panel: Filters */}
                <FiltersPanel 
                    filters={filters} 
                    setFilters={setFilters} 
                    totalResults={results.length} 
                />

                {/* Center Core: Result Feed */}
                <div className="flex-1 overflow-y-auto bg-muted/5 p-6 relative">
                    
                    <div className="max-w-4xl mx-auto space-y-6">
                        
                        {/* Feed Logic */}
                        {isSearching ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                                <p className="text-muted-foreground font-medium animate-pulse text-sm">
                                    AI is finding optimal candidates matching "{queryInput}"...
                                </p>
                            </div>
                        ) : results.length === 0 ? (
                            <PremiumEmptyState
                                title="No matching candidates found"
                                description={`We searched through ${totalDBSize} indexed candidates. Try broadening your AI query or easing filters.`}
                                actionLabel="Clear all filters"
                                onAction={() => setFilters({ query: '', skills: [], location: [], minExperience: 0, maxExperience: 20, matchThreshold: 0, companies: [] })}
                                icon={<Database className="w-8 h-8 text-primary" />}
                            />
                        ) : (
                            <div className="space-y-4 pb-20">
                                {results.map((prospect) => (
                                    <CandidateResultCard
                                        key={prospect.id}
                                        candidate={prospect}
                                        onUnlock={unlockProfile}
                                        onViewProfile={setSelectedProspectId}
                                        onPushToATS={(id) => pushToATS(id, "TENTATIVE_JOB")}
                                    />
                                ))}
                            </div>
                        )}
                        
                    </div>
                </div>

                {/* Right: Drawer Abstraction for active Candidate Profile */}
                <ProspectDrawer
                    open={!!selectedProspectId}
                    onOpenChange={(op) => !op && setSelectedProspectId(null)}
                    candidate={selectedProspect}
                    onUnlock={unlockProfile}
                    onPushToATS={(id) => pushToATS(id, 'MOCK_PIPE')}
                />

            </div>
        </div>
    );
}

export default withAppGuard(TalentProspectPage, 'talent-prospect');

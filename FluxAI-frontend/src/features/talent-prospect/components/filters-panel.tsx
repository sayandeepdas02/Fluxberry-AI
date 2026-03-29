import React from 'react';
import { SearchFilters } from '../types';
import { Badge } from '@/components/ui/badge';
import { X, SlidersHorizontal } from 'lucide-react';

interface FiltersPanelProps {
    filters: SearchFilters;
    setFilters: (f: SearchFilters | ((prev: SearchFilters) => SearchFilters)) => void;
    totalResults: number;
}

export function FiltersPanel({ filters, setFilters, totalResults }: FiltersPanelProps) {
    const clearFilters = () => {
        setFilters({
            query: '',
            skills: [],
            location: [],
            minExperience: 0,
            maxExperience: 20,
            matchThreshold: 0,
            companies: []
        });
    };

    const toggleSkill = (skill: string) => {
        setFilters(prev => ({
            ...prev,
            skills: prev.skills.includes(skill)
                ? prev.skills.filter(s => s !== skill)
                : [...prev.skills, skill]
        }));
    };

    const popularSkills = ['React', 'Node.js', 'Python', 'AWS', 'TypeScript', 'Vue'];

    return (
        <div className="w-64 border-r border-line bg-card h-full flex flex-col shrink-0 overflow-y-auto hidden md:flex">
            <div className="p-4 border-b border-line flex items-center justify-between sticky top-0 bg-card z-10">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">Filters</h3>
                </div>
                <button 
                    onClick={clearFilters}
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
                >
                    Clear All
                </button>
            </div>

            <div className="p-4 space-y-6 flex-1">
                {/* Match Score Threshold */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Minimum Match
                        </label>
                        <span className="text-xs font-medium">{filters.matchThreshold}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={filters.matchThreshold}
                        onChange={(e) => setFilters(prev => ({ ...prev, matchThreshold: parseInt(e.target.value) }))}
                        className="w-full accent-primary h-1 bg-line rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Any</span>
                        <span>0%</span>
                        <span>100%</span>
                    </div>
                </div>

                {/* Experience */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Years Experience
                        </label>
                        <span className="text-xs font-medium">{filters.minExperience} - {filters.maxExperience} yrs</span>
                    </div>
                    <div className="flex gap-2 items-center">
                        <input 
                            type="number"
                            min="0"
                            className="w-16 h-8 text-sm px-2 border border-line bg-background text-center focus:outline-none focus:border-primary"
                            value={filters.minExperience}
                            onChange={(e) => setFilters(prev => ({ ...prev, minExperience: parseInt(e.target.value) || 0 }))}
                        />
                        <span className="text-muted-foreground">-</span>
                        <input 
                            type="number"
                            max="20"
                            className="w-16 h-8 text-sm px-2 border border-line bg-background text-center focus:outline-none focus:border-primary"
                            value={filters.maxExperience}
                            onChange={(e) => setFilters(prev => ({ ...prev, maxExperience: parseInt(e.target.value) || 20 }))}
                        />
                    </div>
                </div>

                {/* Skills */}
                <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Required Skills
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {popularSkills.map(skill => {
                            const active = filters.skills.includes(skill);
                            return (
                                <button
                                    key={skill}
                                    onClick={() => toggleSkill(skill)}
                                    className={`
                                        px-2.5 py-1 text-xs border transition-colors 
                                        ${active ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/30 text-muted-foreground border-line hover:border-foreground/30'}
                                    `}
                                >
                                    {skill}
                                    {active && <X className="w-3 h-3 inline ml-1 opacity-70" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-line bg-muted/10 text-center">
                <span className="text-xs font-medium text-muted-foreground tracking-wide">
                    {totalResults} candidates active
                </span>
            </div>
        </div>
    );
}

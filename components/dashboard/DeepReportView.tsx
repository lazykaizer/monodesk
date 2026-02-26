import React from 'react';
import {
    Target,
    Users,
    Search,
    BrainCircuit,
    ShieldAlert,
    Lightbulb,
    Zap,
    Rocket,
    TrendingUp,
    GanttChartSquare,
    LineChart,
    Timer,
    ShieldCheck,
    Coins,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface AnalysisModule {
    module_id: string;
    title: string;
    quick_view: {
        score: number;
        verdict: string;
        key_stats: string[];
    };
    deep_dive?: {
        critical_verdict: string;
        key_highlights: string[];
        critical_red_flags: string[];
        strategic_advice: string;
    };
}

interface DeepReportViewProps {
    result: {
        modules_analysis: AnalysisModule[];
    };
    selectedModules: string[];
}

const getModuleIcon = (title: string, id: string) => {
    const t = title.toLowerCase();
    const i = id.toLowerCase();
    if (t.includes('market') || i.includes('market')) return <Target className="text-cyan-400" size={24} />;
    if (t.includes('audience') || t.includes('persona') || i.includes('audience')) return <Users className="text-pink-400" size={24} />;
    if (t.includes('competitor') || i.includes('competitor')) return <Search className="text-blue-400" size={24} />;
    if (t.includes('monetization') || t.includes('pricing') || i.includes('monetization')) return <Coins className="text-yellow-400" size={24} />;
    if (t.includes('risk') || i.includes('risks')) return <ShieldAlert className="text-red-400" size={24} />;
    if (t.includes('technical') || t.includes('feasibility') || i.includes('technical')) return <Zap className="text-purple-400" size={24} />;
    if (t.includes('mvp') || t.includes('features') || i.includes('mvp')) return <Rocket className="text-orange-400" size={24} />;
    if (t.includes('marketing') || t.includes('acquisition') || i.includes('marketing')) return <TrendingUp className="text-green-400" size={24} />;
    if (t.includes('swot') || i.includes('swot')) return <GanttChartSquare className="text-indigo-400" size={24} />;
    if (t.includes('scalability') || i.includes('scalability')) return <LineChart className="text-cyan-500" size={24} />;
    if (t.includes('why now') || i.includes('why_now')) return <Timer className="text-amber-400" size={24} />;
    if (t.includes('investor') || i.includes('investor')) return <ShieldCheck className="text-emerald-400" size={24} />;
    return <BrainCircuit className="text-zinc-400" size={24} />;
};

const ScoreBadge = ({ score }: { score: number }) => {
    let colorClass = "text-red-500 border-red-500/30 bg-red-500/10";
    if (score >= 8) colorClass = "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
    else if (score >= 5) colorClass = "text-amber-500 border-amber-500/30 bg-amber-500/10";

    return (
        <div className={cn("flex flex-col items-center justify-center w-10 h-10 rounded-full border-2", colorClass)}>
            <span className="text-base font-bold">{score}</span>
        </div>
    );
};

export default function DeepReportView({ result, selectedModules }: DeepReportViewProps) {
    if (!result || !result.modules_analysis) return null;

    // STRICT MAPPING: Iterate user's selection to ensure 1:1 match
    const modulesToRender = selectedModules.map(moduleLabel => {
        const lowerLabel = moduleLabel.toLowerCase();

        // 1. Try exact match on ID or Title
        const match = result.modules_analysis.find(m =>
            m.title.toLowerCase() === lowerLabel ||
            (m.module_id && m.module_id.toLowerCase() === lowerLabel)
        );

        // 2. Fallback: Check if the AI returned title *contains* the label
        if (!match) {
            const fuzzyMatch = result.modules_analysis.find(m =>
                m.title.toLowerCase().includes(lowerLabel) ||
                lowerLabel.includes(m.title.toLowerCase())
            );
            if (fuzzyMatch) return fuzzyMatch;
        }

        if (match) return match;

        // 3. Fallback object if missing
        return {
            module_id: `missing-${moduleLabel}`,
            title: moduleLabel,
            quick_view: { score: 0, verdict: "MISSING", key_stats: [] },
            deep_dive: {
                critical_verdict: "DATA MISSING",
                key_highlights: [],
                critical_red_flags: [],
                strategic_advice: "Please re-run the analysis."
            }
        };
    });

    if (modulesToRender.length === 0) {
        return (
            <div className="text-center py-20 opacity-50">
                <ShieldAlert size={48} className="mx-auto mb-4 text-zinc-600" />
                <p className="text-zinc-400">No deep dive analysis generated.</p>
                <p className="text-xs text-zinc-600 mt-2">Try running the analysis again.</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-4 space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <ShieldAlert size={12} />
                    Deep Intelligence Report
                </div>
            </div>

            {modulesToRender.map((module, idx) => {
                if (!module.deep_dive) return null;

                return (
                    <div
                        key={idx}
                        className="relative bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden group hover:border-white/20 transition-all duration-500 shadow-2xl"
                    >
                        {/* Header Stripe */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 opacity-70" />

                        <div className="p-8 md:p-10">
                            {/* 1. Header Row */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
                                        {getModuleIcon(module.title, module.module_id)}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white tracking-tight uppercase font-oswald">{module.title}</h2>
                                    </div>
                                </div>
                                <ScoreBadge score={module.quick_view.score} />
                            </div>

                            {/* 2. The Verdict Headline */}
                            <div className="mb-8 pl-6 border-l-4 border-cyan-500">
                                <h3 className="text-xl md:text-2xl font-light text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 leading-tight">
                                    {module.deep_dive.critical_verdict}
                                </h3>
                            </div>

                            {/* 3. The Insight Grid (Scannable Intelligence) */}
                            <div className="grid md:grid-cols-2 gap-8 mb-8">
                                {/* Success Factors (Green) */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                                        <CheckCircle2 size={16} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Why it works</span>
                                    </div>
                                    <div className="space-y-2">
                                        {module.deep_dive.key_highlights && module.deep_dive.key_highlights.length > 0 ? (
                                            module.deep_dive.key_highlights.map((item, i) => (
                                                <div key={i} className="flex gap-3 items-start p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                                    <div className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                                                    <p className="text-sm text-zinc-300 font-medium leading-snug">{item}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-zinc-500 italic text-sm">No specific highlights found.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Threat Assessment (Red) */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-red-400 mb-2">
                                        <XCircle size={16} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Critical Risks</span>
                                    </div>
                                    <div className="space-y-2">
                                        {module.deep_dive.critical_red_flags && module.deep_dive.critical_red_flags.length > 0 ? (
                                            module.deep_dive.critical_red_flags.map((item, i) => (
                                                <div key={i} className="flex gap-3 items-start p-2.5 rounded-lg bg-red-500/5 border border-red-500/10">
                                                    <div className="mt-1.5 w-1 h-1 rounded-full bg-red-500 shrink-0" />
                                                    <p className="text-sm text-zinc-300 font-medium leading-snug">{item}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-zinc-500 italic text-sm">No critical risks flagged.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 4. Strategic Advice (Pro Tip) */}
                            <div className="inline-flex w-fit max-w-full relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-900/10 border border-amber-500/20 p-5 pr-8">
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

                                <div className="relative z-10 flex gap-4 items-center">
                                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500 shrink-0 shadow-lg border border-amber-500/20">
                                        <Lightbulb size={18} />
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest block mb-1">Strategic Pro-Tip</span>
                                        <p className="text-base font-medium text-white italic leading-relaxed">
                                            "{module.deep_dive.strategic_advice || "Focus on maximizing your unfair advantage in this area."}"
                                        </p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                );
            })}
        </div>
    );
}

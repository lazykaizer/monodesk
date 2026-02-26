"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    TrendingUp, Flame, Users, Crown,
    Clock, ShieldAlert, Cpu, BarChart3,
    ArrowUpRight, Target, Zap, CheckCircle2,
    ShieldCheck, AlertTriangle, Lightbulb,
    XCircle, Info, UserCircle2, Skull,
    Rocket, DollarSign, Timer, ChevronRight, Presentation
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Scroller } from "@/components/ui/scroller-1";

// Types for the dashboard
export interface AnalysisModule {
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

export interface AnalysisResult {
    dashboard_summary: {
        verdict?: 'NO_GO' | 'PIVOT' | 'GO';
        score?: number;
        title?: string;
        fatal_flaws?: string[];
        pivot_suggestion?: string;
        roadmap_tasks?: string[];
        pitch_deck_data?: { problem: string, solution: string };

        market_fit: any;
        competitors: any;
        feasibility: any;
    };
    modules_analysis: AnalysisModule[];
}

interface ValidatorDashboardProps {
    result: AnalysisResult;
    selectedModules: string[];
    onFixItPlan?: (tasks: string[]) => void;
    onDraftPitch?: (data: { problem: string, solution: string }) => void;
}

const DashboardCard = ({ id, title, data, summary }: { id: string, title: string, data: any, summary?: string }) => {
    if (!data) return null;

    // Background Blob Colors
    const blobColors: Record<string, string> = {
        'market_fit': 'from-cyan-500/20',
        'risks': 'from-rose-500/20',
        'feasibility': 'from-blue-500/20',
        'technical': 'from-purple-500/20',
        'swot': 'from-amber-500/20',
        'default': 'from-zinc-500/10'
    };
    const blobColor = blobColors[id] || blobColors.default;

    // Helper: Smart Score Scaling (If AI gives 8/10, treat as 80%)
    const rawScore = data.score || 0;
    const score = rawScore <= 10 && rawScore > 0 ? rawScore * 10 : rawScore;

    const renderContent = () => {
        switch (id) {
            case 'market_fit':
                return (
                    <div className="flex flex-col h-full">
                        {/* Donut Chart */}
                        <div className="flex-1 flex items-center justify-center relative">
                            <div className="relative w-32 h-32">
                                <svg className="w-full h-full -rotate-90">
                                    <circle cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                                    <motion.circle
                                        cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="8"
                                        strokeDasharray={364}
                                        initial={{ strokeDashoffset: 364 }}
                                        animate={{ strokeDashoffset: 364 - (364 * score) / 100 }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="text-cyan-500"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black text-white leading-none">{score}</span>
                                    <span className="text-[10px] font-bold text-cyan-500/60 uppercase">Score</span>
                                </div>
                            </div>
                        </div>
                        {/* 3 Horizontal Metrics with Icons */}
                        <div className="grid grid-cols-1 gap-2 mt-4">
                            <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5">
                                <Users size={14} className="text-cyan-400" />
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Audience</span>
                                <span className="text-[10px] font-black text-white ml-auto">BROAD</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5">
                                <TrendingUp size={14} className="text-emerald-400" />
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Demand</span>
                                <span className="text-[10px] font-black text-white ml-auto">HIGH</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5">
                                <Zap size={14} className="text-amber-400" />
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Urgency</span>
                                <span className="text-[10px] font-black text-white ml-auto">IMMEDIATE</span>
                            </div>
                        </div>
                    </div>
                );

            case 'competitors':
                // Robust Parsing: Handle Array<Object> OR Array<String>
                const rawComps = data.competitors || data.key_stats || [];
                const comps = Array.isArray(rawComps)
                    ? rawComps.map((c: any) => {
                        if (typeof c === 'object' && c.name) return c; // Already valid object
                        if (typeof c === 'string') {
                            // Try to parse "Name: Share%"
                            const match = c.match(/^(.+?)[:\s-]+(\d+)%?/);
                            if (match) return { name: match[1].trim(), share: parseInt(match[2]) };
                            return { name: c, share: 0 }; // Fallback
                        }
                        return { name: "Unknown", share: 0 };
                    })
                    : [];

                return (
                    <div className="flex flex-col h-full space-y-3 pt-2">
                        {comps.slice(0, 8).map((comp: any, idx: number) => (
                            <div key={idx} className="space-y-1 group/comp">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        {idx === 0 ? <Crown size={14} className="text-yellow-400" /> : <div className="w-1 h-1 rounded-full bg-zinc-600" />}
                                        <span className={cn("text-[11px] font-bold truncate max-w-[140px]", idx === 0 ? "text-white" : "text-zinc-500")}>
                                            {comp.name}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-zinc-600">{comp.share > 0 ? `${comp.share}%` : '-'}</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${comp.share}%` }}
                                        transition={{ duration: 1, delay: 0.2 * idx }}
                                        className={cn("h-full rounded-full transition-all", idx === 0 ? "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]" : "bg-zinc-800")}
                                    />
                                </div>
                            </div>
                        ))}
                        <div className="mt-auto pt-4 border-t border-white/5">
                            <p className="text-[10px] text-zinc-500 italic">Leaderboard reveals market dominance and gap analysis.</p>
                        </div>
                    </div>
                );

            case 'risks':
            case 'feasibility':
            case 'technical':
                const riskBlocks = Math.ceil((score || 50) / 20); // 1-5 blocks
                const isRisk = id === 'risks';
                const techStack = data.tech_stack || data.key_stats || []; // Fallback to key_stats if tech_stack missing

                return (
                    <div className="flex flex-col h-full space-y-6 pt-4">
                        {/* Segmented Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{isRisk ? 'Risk Index' : 'Feasibility'}</span>
                                <span className={cn("text-xs font-black", score > 70 ? "text-rose-500" : "text-emerald-500")}>{score}%</span>
                            </div>
                            <div className="flex gap-1.5 h-3">
                                {[1, 2, 3, 4, 5].map((b) => (
                                    <div key={b} className={cn(
                                        "flex-1 rounded-sm transition-colors duration-500",
                                        b <= riskBlocks
                                            ? (isRisk ? "bg-rose-500/60" : "bg-emerald-500/60")
                                            : "bg-white/5"
                                    )} />
                                ))}
                            </div>
                        </div>

                        {/* Timeline Graphic */}
                        <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 text-zinc-200">
                                <Timer size={14} className="text-blue-400" />
                                <span className="text-xs font-bold">Time to MVP</span>
                            </div>
                            <div className="relative pt-2">
                                <div className="absolute top-1/2 left-0 w-full h-px bg-white/10 -translate-y-1/2" />
                                <div className="flex justify-between relative z-10">
                                    {[1, 2, 3].map((m) => (
                                        <div key={m} className="flex flex-col items-center gap-1">
                                            <div className={cn("w-2 h-2 rounded-full", m === 1 ? "bg-blue-500" : "bg-white/10")} />
                                            <span className="text-[8px] font-mono text-zinc-600">M{m}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <p className="text-[10px] text-blue-400/80 font-mono text-center tracking-tighter">ESTIMATED LAUNCH: 90 DAYS</p>
                        </div>

                        <div className="mt-auto flex flex-wrap gap-1.5">
                            {(Array.isArray(techStack) ? techStack : []).slice(0, 3).map((t: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-[8px] border-white/10 text-zinc-500 uppercase tracking-tighter bg-white/5">{t}</Badge>
                            ))}
                        </div>
                    </div>
                );

            case 'swot':
                const swotItems = Array.isArray(data.key_stats) ? data.key_stats : ['Market Edge', 'Limited Labs', 'Global Scale', 'New Entrants'];
                return (
                    <div className="grid grid-cols-2 grid-rows-2 gap-3 h-full pt-1">
                        {[
                            { l: 'Strength', i: ShieldCheck, c: 'text-emerald-500', bg: 'bg-emerald-500/5' },
                            { l: 'Weakness', i: AlertTriangle, c: 'text-rose-500', bg: 'bg-rose-500/5' },
                            { l: 'Opportunities', i: Zap, c: 'text-blue-500', bg: 'bg-blue-500/5' },
                            { l: 'Threats', i: Skull, c: 'text-amber-500', bg: 'bg-amber-500/5' }
                        ].map((item, i) => (
                            <div key={i} className={cn("rounded-xl p-3 border border-white/5 flex flex-col justify-between", item.bg)}>
                                <item.i size={12} className={item.c} />
                                <div className="space-y-0.5">
                                    <span className={cn("text-[9px] font-black uppercase", item.c)}>{item.l}</span>
                                    <p className="text-[9px] text-zinc-400 line-clamp-2 leading-tight">{swotItems[i] || 'N/A'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                );

            default:
                const insights = Array.isArray(data.key_stats) ? data.key_stats : (data.stats || []);
                return (
                    <div className="space-y-3 pt-2">
                        {(Array.isArray(insights) ? insights : []).slice(0, 8).map((ins: any, i: number) => (
                            <div key={i} className="flex items-start gap-3 bg-white/5 p-2 rounded-lg border border-white/5">
                                <CheckCircle2 size={12} className="text-cyan-500 shrink-0 mt-0.5" />
                                <span className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                                    {typeof ins === 'string' ? ins : ins.label || ins.value}
                                </span>
                            </div>
                        ))}
                    </div>
                );
        }
    };

    // Use Scaled Score
    const displayScore = score;

    return (
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-3xl p-8 w-full h-[400px] flex flex-col relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-300 text-left">
            {/* Header */}
            <div className="mb-6 shrink-0 flex justify-between items-start">
                <h3 className="text-xs font-bold tracking-[0.2em] text-zinc-500 uppercase max-w-[70%]">{title}</h3>
                {displayScore > 0 && <p className="text-4xl font-black text-cyan-500 leading-none">{displayScore}%</p>}
                {displayScore === 0 && data.verdict && <p className="text-xs font-bold text-white uppercase tracking-wider">{data.verdict}</p>}
            </div>

            {/* Content Body */}
            <div className="flex-1 min-h-0 text-sm text-zinc-400 leading-relaxed flex flex-col">
                <div className="flex-1 overflow-hidden">
                    {renderContent()}
                </div>


            </div>

            {/* Radial Blob Accent */}
            <div className={cn(
                "absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[80px] bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none",
                blobColor
            )} />
        </div>
    );
};

export default function ValidatorDashboard({ result, selectedModules, onFixItPlan, onDraftPitch }: ValidatorDashboardProps) {
    if (!result) return null;

    const { dashboard_summary = {} as any, modules_analysis = [] } = result || {};
    const {
        verdict = 'NO_GO',
        score = 0,
        title = 'Untitled Assessment',
        fatal_flaws = [],
        pivot_suggestion = '',
        roadmap_tasks = [],
        pitch_deck_data
    } = dashboard_summary;

    const verdictConfig: any = {
        'NO_GO': { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-500', label: '⛔ DO NOT BUILD (Yet)', desc: "This idea has fatal flaws. Don't waste your time until you fix them." },
        'PIVOT': { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-500', label: '⚠️ GOOD PROBLEM, WRONG SOLUTION', desc: "There's potential here, but your current approach will likely fail." },
        'GO': { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-500', label: '🚀 INVESTABLE', desc: "Rare opportunity. Execution is the only risk now." }
    };

    const config = verdictConfig[verdict] || verdictConfig['NO_GO'];

    // STRICT MAPPING: We iterate the USER'S selection and find the matching data.
    const finalCards = selectedModules.map(moduleLabel => {
        const lowerLabel = moduleLabel.toLowerCase();

        // Find matching module in strict analysis list
        const strictMatch = modules_analysis.find(m =>
            m.title.toLowerCase().includes(lowerLabel) ||
            lowerLabel.includes(m.title.toLowerCase())
        );

        if (!strictMatch) {
            return {
                id: `missing-${moduleLabel}`,
                title: moduleLabel,
                data: {
                    score: 0,
                    verdict: 'NO DATA',
                    key_stats: ['Analysis failed for this topic', 'Please retry']
                },
                summary: "AI did not return data for this specific module."
            };
        }

        // Detect Card Type for Special Visualizations
        let cardId = strictMatch.module_id;
        if (lowerLabel.includes('market fit')) cardId = 'market_fit';
        else if (lowerLabel.includes('competitor')) cardId = 'competitors';
        else if (lowerLabel.includes('technical') || lowerLabel.includes('feasibility')) cardId = 'feasibility';
        else if (lowerLabel.includes('risk')) cardId = 'risks';
        else if (lowerLabel.includes('swot')) cardId = 'swot';

        return {
            id: cardId,
            title: strictMatch.title,
            data: strictMatch.quick_view,
            summary: strictMatch.deep_dive?.critical_verdict || strictMatch.deep_dive?.strategic_advice
        };
    });

    return (
        <div className="space-y-4 w-full pb-2">
            {/* 1. THE VERDICT BANNER */}
            {verdict && (
                <div className={cn("w-full rounded-2xl border relative overflow-hidden", config.border + "/30", "bg-zinc-900/40 backdrop-blur-sm")}>
                    {/* Background Glow */}
                    <div className={cn("absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[120px] opacity-10 pointer-events-none", config.bg)} />

                    <div className="relative z-10 p-8">
                        {/* Top Row: Badge + Score */}
                        <div className="flex items-start justify-between mb-6">
                            <Badge className={cn("px-4 py-1.5 text-xs font-bold uppercase tracking-widest", config.bg, "text-white border-0 shadow-lg")}>
                                {config.label}
                            </Badge>

                            {score !== undefined && (
                                <div className={cn("flex flex-col items-center justify-center w-20 h-20 rounded-full border-4", config.border, config.bg + "/10")}>
                                    <span className={cn("text-3xl font-black font-oswald", config.text)}>{score}</span>
                                    <span className="text-[10px] text-zinc-500 font-bold">/ 100</span>
                                </div>
                            )}
                        </div>

                        {/* Title */}
                        <h2 className="text-3xl font-bold text-white tracking-tight mb-3 max-w-2xl">
                            {title || "Cynical Analysis Complete"}
                        </h2>

                        {/* Description */}
                        <p className="text-zinc-400 text-base leading-relaxed max-w-2xl">
                            {config.desc}
                        </p>
                    </div>
                </div>
            )}

            {/* 2. PIVOT SUGGESTION (Separate Card) */}
            {verdict === 'PIVOT' && pivot_suggestion && (
                <div className="w-full p-6 bg-zinc-900/60 backdrop-blur-sm rounded-xl border border-orange-500/20 relative overflow-hidden">
                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-orange-500/10 blur-3xl rounded-full pointer-events-none" />

                    <div className="relative z-10 flex gap-4 items-start">
                        <div className="p-3 rounded-lg bg-orange-500/10 text-orange-400 shrink-0 border border-orange-500/20">
                            <Lightbulb size={20} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold uppercase tracking-widest text-orange-400">Pivot Idea</span>
                            </div>
                            <p className="text-base text-zinc-200 leading-relaxed italic">
                                "{pivot_suggestion}"
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. FATAL FLAWS CARD */}
            {fatal_flaws && fatal_flaws.length > 0 && (
                <div className="w-full bg-[#09090b] border border-red-900/30 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
                    <div className="flex flex-col gap-4 relative z-10">
                        <div className="flex items-center gap-2 text-red-500">
                            <ShieldAlert size={20} />
                            <h3 className="text-sm font-black uppercase tracking-[0.2em]">Why This Will Fail (Fatal Flaws)</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {fatal_flaws.map((flaw: string, i: number) => (
                                <div key={i} className="flex items-start gap-3 bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                                    <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                                    <span className="text-sm text-zinc-300 font-medium">{flaw}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 3. ORIGINAL SCROLLER */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Deep Dive Modules</h3>
                <Scroller overflow="x" height="440px" width="100%">
                    <div className="flex flex-row gap-8 pb-4 px-6 min-w-max no-scrollbar items-center">
                        {finalCards.map((card, idx) => (
                            <motion.div
                                key={`${card.id}-${idx}`}
                                className="w-[320px] shrink-0"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <DashboardCard id={card.id} title={card.title} data={card.data} summary={card.summary} />
                            </motion.div>
                        ))}
                    </div>
                </Scroller>
            </div>

            {/* 4. NEXT STEPS (Golden Path) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <button
                    onClick={() => roadmap_tasks && onFixItPlan?.(roadmap_tasks)}
                    disabled={!roadmap_tasks || roadmap_tasks.length === 0}
                    className="flex flex-col items-center justify-center p-6 rounded-2xl bg-transparent border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group gap-3 text-center"
                >
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <Rocket size={20} />
                    </div>
                    <div>
                        <h4 className="font-black text-lg text-white">Generate Fix-It Plan</h4>
                        <p className="text-xs text-zinc-500 mt-1">Auto-create {roadmap_tasks?.length || 0} tasks in Roadmap</p>
                    </div>
                </button>

                <button
                    onClick={() => pitch_deck_data && onDraftPitch?.(pitch_deck_data)}
                    disabled={!pitch_deck_data}
                    className="flex flex-col items-center justify-center p-6 rounded-2xl bg-transparent border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all group gap-3 text-center"
                >
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                        <Presentation size={20} />
                    </div>
                    <div>
                        <h4 className="font-black text-lg text-white">Draft Pitch Deck</h4>
                        <p className="text-xs text-zinc-500 mt-1">Pre-fill Problem & Solution slides</p>
                    </div>
                </button>
            </div>
        </div>
    );
}

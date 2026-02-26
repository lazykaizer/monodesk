"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { generateIdeaAnalysis } from "@/app/actions/gemini";
import { GlowCard } from "@/components/ui/spotlight-card";
import { createClient } from "@/lib/supabase/client";
import {
    Sparkles,
    BarChart3,
    Users,
    Zap,
    ArrowUpRight,
    Search,
    BrainCircuit,
    Cpu,
    History as HistoryIcon,
    ChevronRight,
    ChevronLeft,
    Loader2,
    X,
    Rocket,
    AlertCircle,
    Info,
    Check,
    Plus,
    ChevronDown,
    ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Scroller } from "@/components/ui/scroller-1";
import { cn } from "@/lib/utils";
import { useTaskStore } from "@/lib/store/useTaskStore";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { VALIDATION_MODULES } from "./validator/constants";
import ProjectSyncButton from "./ProjectSyncButton";
import ValidatorDashboard from "./ValidatorDashboard";
import { useRouter } from "next/navigation";
import { useRoadmapStore } from "@/lib/store/useRoadmapStore";
import DeepReportView from "./DeepReportView";
import GeneratingState from "./GeneratingState";

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

interface AnalysisResult {
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

export default function ValidatorClient() {
    const { tasks, startTask, completeTask, failTask, setTask } = useTaskStore();
    const { currentProject } = useProjectStore();
    const task = tasks['validator'];
    const router = useRouter();

    // Helper: Shorten idea title if too long
    const generateShortTitle = (idea: string): string => {
        if (!idea || idea.trim().length === 0) return 'Idea';
        const trimmed = idea.trim();
        if (trimmed.length <= 40) return trimmed;

        // Take first 5-6 words or up to 40 chars
        const words = trimmed.split(' ');
        let title = '';
        for (const word of words) {
            if ((title + word).length > 40) break;
            title += word + ' ';
        }
        return title.trim() || 'Idea';
    };

    // Helper: Select contextual emoji based on idea keywords
    const selectContextualEmoji = (idea: string): string => {
        const lower = idea.toLowerCase();

        // AI/Tech
        if (lower.match(/\b(ai|artificial intelligence|ml|machine learning|tech|software|app|platform|algorithm|neural|deep learning)\b/)) {
            return ['🤖', '💻', '⚡', '🧠'][Math.floor(Math.random() * 4)];
        }

        // Food/Beverage
        if (lower.match(/\b(food|coffee|restaurant|cafe|beverage|drink|meal|cuisine|culinary|chef|bean)\b/)) {
            return ['☕', '🍽️', '🌾', '🥐'][Math.floor(Math.random() * 4)];
        }

        // Finance
        if (lower.match(/\b(finance|money|payment|bank|invest|trading|crypto|fintech|wallet)\b/)) {
            return ['💰', '📈', '💳', '💵'][Math.floor(Math.random() * 4)];
        }

        // Health/Medical
        if (lower.match(/\b(health|medical|doctor|hospital|wellness|fitness|healthcare|therapy)\b/)) {
            return ['🏥', '💊', '❤️', '🩺'][Math.floor(Math.random() * 4)];
        }

        // Education
        if (lower.match(/\b(education|learning|school|course|training|teach|student|academy)\b/)) {
            return ['📚', '🎓', '🧠', '✏️'][Math.floor(Math.random() * 4)];
        }

        // Sustainability
        if (lower.match(/\b(green|sustainable|eco|environment|climate|renewable|solar|organic)\b/)) {
            return ['🌱', '♻️', '🌍', '🌿'][Math.floor(Math.random() * 4)];
        }

        // E-commerce/Retail
        if (lower.match(/\b(shop|store|retail|ecommerce|marketplace|sell|commerce|cart)\b/)) {
            return ['🛒', '🏪', '📦', '🛍️'][Math.floor(Math.random() * 4)];
        }

        // Travel/Tourism
        if (lower.match(/\b(travel|tourism|hotel|booking|trip|vacation|flight)\b/)) {
            return ['✈️', '🗺️', '🏨', '🌴'][Math.floor(Math.random() * 4)];
        }

        // Social/Communication
        if (lower.match(/\b(social|chat|messaging|community|network|connect)\b/)) {
            return ['💬', '👥', '🌐', '📱'][Math.floor(Math.random() * 4)];
        }

        // Default
        return ['🚀', '💡', '⭐', '🎯'][Math.floor(Math.random() * 4)];
    };

    const handleFixItPlan = (tasks: string[]) => {
        if (!tasks || tasks.length === 0) return;

        // 1. Get Roadmap Store Actions
        const actions = useRoadmapStore.getState();

        // 2. Generate dynamic title and emoji
        const ideaTitle = generateShortTitle(idea);
        const emoji = selectContextualEmoji(idea);
        const pageTitle = `${ideaTitle} - Action Plan`;

        // 3. Check for existing page to prevent duplicates
        const existingPage = actions.pages.find(p =>
            p.title.includes(ideaTitle) && p.title.includes('Action Plan')
        );

        if (existingPage) {
            // Navigate to existing page instead of creating duplicate
            actions.setActivePageId(existingPage.id);
            router.push('/dashboard/roadmap');
            return;
        }

        // 4. Create new page with dynamic title/emoji
        actions.addPage();
        const newPageId = useRoadmapStore.getState().activePageId;

        if (newPageId) {
            actions.updatePage(newPageId, { title: pageTitle, icon: emoji });
        }

        // 5. Add structured content

        // Header
        actions.addBlock('h1');
        let currentBlocks = useRoadmapStore.getState().blocks;
        let headerBlock = currentBlocks[currentBlocks.length - 1];
        if (headerBlock) {
            actions.updateBlock(headerBlock.id, { content: `Fix-It Plan: ${ideaTitle}` });
        }

        // Context paragraph
        actions.addBlock('text');
        currentBlocks = useRoadmapStore.getState().blocks;
        let contextBlock = currentBlocks[currentBlocks.length - 1];
        if (contextBlock) {
            actions.updateBlock(contextBlock.id, {
                content: '🎯 Critical tasks identified by AI Validator to address fatal flaws and improve viability. Track progress below.'
            });
        }

        // Divider
        actions.addBlock('divider');

        // Database for task tracking
        actions.addBlock('database');
        currentBlocks = useRoadmapStore.getState().blocks;
        const dbBlock = currentBlocks[currentBlocks.length - 1];

        if (dbBlock && dbBlock.data) {
            // Update database properties
            const statusProp: any = { id: 'p-status', key: 'status', label: 'Status', type: 'status' };
            const priorityProp: any = { id: 'p-priority', key: 'priority', label: 'Priority', type: 'priority' };
            const dueDateProp: any = { id: 'p-date', key: 'due_date', label: 'Due Date', type: 'date' };

            actions.updateBlock(dbBlock.id, {
                data: {
                    ...dbBlock.data,
                    properties: [
                        { id: 'p-title', key: 'title', label: 'Task', type: 'text' },
                        statusProp,
                        priorityProp,
                        dueDateProp
                    ],
                    rows: [],
                    views: [
                        { id: 'v-table', name: 'Table', type: 'Table', active: true },
                        { id: 'v-board', name: 'Board', type: 'Board', active: false }
                    ]
                }
            });

            // Populate database with tasks
            tasks.forEach((taskText, index) => {
                actions.addDatabaseRow(dbBlock.id, {
                    title: taskText,
                    status: 'Todo',
                    priority: index < 2 ? 'P1' : (index < 4 ? 'P2' : 'P3'),
                    due_date: ''
                });
            });
        }

        // 6. Navigate to roadmap
        router.push('/dashboard/roadmap');
    };

    const handleDraftPitchDeck = (data: { problem: string, solution: string }) => {
        // 1. Reset Pitch Deck Task Store to "Input Mode" (Idle)
        // We pass the idea so the Architect is pre-filled, but state is idle so it shows the setup screen.
        useTaskStore.getState().setTask('pitch', {
            status: 'idle',
            progress: 0,
            data: [], // Clear any old data/stubs
            input: idea // Pass the original idea as input context
        });

        // 2. Navigate to Pitch Deck Architect
        router.push('/dashboard/pitch');
    };

    const [idea, setIdea] = useState(task?.input || "");
    const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [isModuleSelectorOpen, setIsModuleSelectorOpen] = useState(false);
    const [analysisMode, setAnalysisMode] = useState<'dashboard' | 'deep'>('dashboard');
    const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
    const [customTopic, setCustomTopic] = useState("");

    const [history, setHistory] = useState<any[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [displayModules, setDisplayModules] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const supabase = useMemo(() => createClient(), []);

    const fetchHistory = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase.from('ideas').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (!error && data) setHistory(data);
    }, [supabase]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);
    const status = task?.status || "idle";

    // Derived states from task store (declare early so they can be used in useEffects)
    const analysisProgress = task?.progress || 0;
    const loadingStep = task?.loadingStep || "";
    const result = task?.data as AnalysisResult | null;
    // Auto-hydration from history removed to ensure a clean start.
    // Access history via the sidebar to resume previous validations.

    const handleClear = () => {
        setTask('validator', { status: 'idle', data: null, input: "", progress: 0 });
        setIdea("");
        setDisplayModules([]);
        setSelectedModules([]);
        setViewMode('overview');
    };

    // SYNC: Ensure local 'idea' picks up the store's input on navigation/refresh
    useEffect(() => {
        if (task?.input && !idea) {
            setIdea(task.input);
        }
    }, [task?.input]);

    // CRITICAL FIX: Restore displayModules from task data when component mounts with existing results
    // This ensures cards show correctly when user navigates back to validator page
    useEffect(() => {
        if (status === 'success' && result && result.modules_analysis) {
            const moduleLabels = result.modules_analysis.map(m => m.title);
            setDisplayModules(moduleLabels);
            // Also restore selectedModules to keep UI in sync
            if (selectedModules.length === 0) {
                setSelectedModules(moduleLabels);
            }
        }
    }, [status, result]); // Re-run when status or result changes

    // Derived states
    const isSelectionValid = selectedModules.length >= 3 && idea.trim().length > 0;
    const isAnalysisInProgress = status === 'loading';

    const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

    const toggleModule = (label: string) => {
        setSelectedModules(prev => {
            const isAlreadySelected = prev.includes(label);

            if (isAlreadySelected) {
                return prev.filter(m => m !== label);
            }

            // MAX LIMIT: 8
            if (prev.length >= 8) {
                alert("Max 8 topics allowed");
                return prev;
            }

            return [...prev, label];
        });
    };

    const addCustomTopic = () => {
        const topic = customTopic.trim();
        if (topic) {
            setSelectedModules(prev => {
                const isAlreadySelected = prev.includes(topic);

                if (isAlreadySelected) {
                    return prev;
                }

                // MAX LIMIT: 8
                if (prev.length >= 8) {
                    alert("Max 8 topics allowed");
                    return prev;
                }

                return [...prev, topic];
            });
            setCustomTopic("");
        }
    };

    const handleAnalyze = async () => {
        setError(null);
        if (status === 'loading') {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setTask('validator', { status: 'idle', progress: 0, data: null });
            return;
        }

        if (!isSelectionValid) return;

        startTask('validator', ["Scanning market data...", "Identifying competitors...", "Calculating feasibility...", "Synthesizing report..."]);
        setTask('validator', { input: idea, data: null });

        const steps = ["Scanning market data...", "Identifying competitors...", "Calculating feasibility...", "Synthesizing report..."];
        let currentStep = 0;

        intervalRef.current = setInterval(() => {
            const currentTask = useTaskStore.getState().tasks['validator'];
            if (!currentTask || currentTask.status !== 'loading') {
                if (intervalRef.current) clearInterval(intervalRef.current);
                return;
            }

            const nextProgress = currentTask.progress + 1;
            if (nextProgress >= 90) {
                if (intervalRef.current) clearInterval(intervalRef.current);
                return;
            }

            let nextStep = currentTask.loadingStep;
            if (nextProgress % 25 === 0 && currentStep < 3) {
                currentStep++;
                nextStep = steps[currentStep];
            }

            setTask('validator', { progress: nextProgress, loadingStep: nextStep });
        }, 150);

        try {
            const { summarizeProjectContext } = await import('@/lib/utils/project-context');
            const context = summarizeProjectContext(currentProject);

            const data = await generateIdeaAnalysis(idea, selectedModules, context, analysisMode);

            // Check if task was cancelled while waiting for API
            const currentStatus = useTaskStore.getState().tasks['validator']?.status;
            if (currentStatus !== 'loading') return;

            if ('error' in data && data.error) throw new Error(data.message as string);

            let finalResult = data as AnalysisResult;

            // ADAPTER: The new Cynical VC prompt returns a flat object, but the UI expects nested `dashboard_summary`
            if (!finalResult.dashboard_summary && (data as any).verdict) {
                finalResult = {
                    dashboard_summary: data as any,
                    modules_analysis: []
                };
            }

            completeTask('validator', finalResult);

            // Set view mode automatically based on result content and requested mode
            if (analysisMode === 'deep') {
                setViewMode('detailed');
            } else {
                // Default to overview for dashboard mode, unless only detailed data is available
                setViewMode('overview');
            }

            // Freeze the modules for display
            setDisplayModules(selectedModules);

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('ideas').upsert({
                    user_id: user.id,
                    title: idea.substring(0, 50) + (idea.length > 50 ? "..." : ""),
                    description: idea,
                    market_score: finalResult.dashboard_summary?.score ?? finalResult.dashboard_summary?.market_fit?.score ?? 0,
                    validation_report: finalResult
                });
                fetchHistory();
            }
        } catch (error: any) {
            const currentStatus = useTaskStore.getState().tasks['validator']?.status;
            if (currentStatus === 'loading') {
                failTask('validator', "Analysis failed.");
                setError(error.message || "An unexpected error occurred.");
            }
        } finally {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
    };

    return (
        <div className="px-8 pb-8 pt-12 font-sans flex-1 flex flex-col bg-transparent relative text-left">
            <div className="absolute top-4 right-8 flex items-center gap-3 z-20">
                <div className="flex items-center gap-4">
                    {(idea.trim() || status !== 'idle' || displayModules.length > 0) && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClear}
                            className="bg-red-500/5 border border-red-500/20 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all h-10 w-10 rounded-lg"
                            title="Clear Analysis"
                        >
                            <X size={18} />
                        </Button>
                    )}
                    <ProjectSyncButton module="validator" data={task?.data} disabled={!task?.data} context={{ name: idea.substring(0, 50), description: idea }} />
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsHistoryOpen(true)} className="text-zinc-500 hover:text-white">
                    <HistoryIcon size={18} className="mr-2" /> History
                </Button>
            </div>

            <div className="w-full max-w-3xl mx-auto space-y-4 mt-auto">
                {error && (
                    <div className="w-full bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={20} className="text-red-500 shrink-0" />
                        <div className="flex-1 text-sm">{error}</div>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-white transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                )}

                <div className="text-center space-y-4 mb-10">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">Idea Validator</h1>
                    <p className="text-zinc-400 text-sm max-w-md mx-auto">Input your concept below for an instant AI-driven market analysis.</p>
                </div>

                <div className="relative group rounded-xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm shadow-xl transition-all text-left">
                    <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${idea.length > 0 ? "bg-green-500 animate-pulse" : "bg-zinc-600"}`} />
                            <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase">Input Mode</span>
                        </div>
                    </div>
                    <div className="p-4">
                        {currentProject && !idea && (
                            <button
                                onClick={() => setIdea(currentProject.description || currentProject.name)}
                                className="mb-3 text-[10px] text-blue-400 hover:text-blue-300 font-bold tracking-widest uppercase flex items-center gap-2 transition-colors"
                            >
                                <Rocket size={12} />
                                Synchronize with {currentProject.name} concept
                            </button>
                        )}
                        <textarea value={idea} onChange={e => setIdea(e.target.value)} placeholder="Describe your product idea..." className="w-full h-28 bg-transparent text-zinc-200 resize-none focus:outline-none leading-relaxed" />
                        <div className="flex justify-between items-end pt-2">
                            <div className="relative">
                                {/* Floating Module Selector */}
                                <Button
                                    onClick={() => setIsModuleSelectorOpen(!isModuleSelectorOpen)}
                                    className={cn(
                                        "h-10 w-10 p-0 rounded-full transition-all border border-white/10 flex items-center justify-center",
                                        isModuleSelectorOpen ? "bg-zinc-800 rotate-45" : "bg-white/5 hover:bg-white/10"
                                    )}
                                >
                                    <Plus size={20} className="text-zinc-400" />
                                </Button>

                                {isModuleSelectorOpen && (
                                    <div className="absolute bottom-12 left-0 w-80 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-bottom-4 duration-200">
                                        <div className="p-4 border-b border-white/5 bg-white/5">
                                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-left">What should we analyze?</div>
                                            <div className={cn(
                                                "text-[10px] mt-1 font-bold tracking-tight text-left",
                                                selectedModules.length < 3 ? "text-amber-500" : selectedModules.length === 8 ? "text-red-400" : "text-blue-400"
                                            )}>
                                                {selectedModules.length < 3
                                                    ? `Select at least ${3 - selectedModules.length} more topic(s)`
                                                    : selectedModules.length === 8
                                                        ? "Max topics selected (8/8)"
                                                        : `${selectedModules.length}/8 topics selected`}
                                            </div>
                                        </div>
                                        <div className="max-h-80 overflow-y-auto scrollbar-hide py-2">
                                            {VALIDATION_MODULES.map((mod) => (
                                                <button
                                                    key={mod.id}
                                                    onClick={() => toggleModule(mod.label)}
                                                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors group text-left"
                                                >
                                                    <div className={cn(
                                                        "w-4 h-4 rounded border mt-0.5 flex items-center justify-center transition-all",
                                                        selectedModules.includes(mod.label) ? "bg-blue-600 border-blue-600" : "border-white/20 group-hover:border-white/40"
                                                    )}>
                                                        {selectedModules.includes(mod.label) && <Check size={10} className="text-white" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-zinc-200">{mod.label}</div>
                                                    </div>
                                                </button>
                                            ))}

                                            {/* Custom Topics (Dynamically Added) */}
                                            {selectedModules.filter(label => !VALIDATION_MODULES.some(m => m.label === label)).map((custom, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => toggleModule(custom)}
                                                    className="w-full px-4 py-3 flex items-start gap-3 bg-blue-500/5 hover:bg-blue-500/10 transition-colors group text-left"
                                                >
                                                    <div className="w-4 h-4 rounded border border-blue-600 bg-blue-600 mt-0.5 flex items-center justify-center">
                                                        <Check size={10} className="text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-blue-400">{custom}</div>
                                                        <div className="text-[10px] text-zinc-500 italic mt-0.5">Custom analysis topic</div>
                                                    </div>
                                                </button>
                                            ))}

                                            {/* Custom Input Option */}
                                            <div className="px-4 py-3 border-t border-white/5 bg-white/5 mt-2">
                                                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Other & Specific Analysis</div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={customTopic}
                                                        onChange={(e) => setCustomTopic(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && addCustomTopic()}
                                                        placeholder="Specify custom topic..."
                                                        className="flex-1 bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500/50 transition-all shadow-inner"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        onClick={addCustomTopic}
                                                        disabled={!customTopic.trim() || selectedModules.length >= 8}
                                                        className="h-8 w-8 p-0 rounded-lg bg-zinc-800 hover:bg-zinc-700"
                                                    >
                                                        <Plus size={14} className="text-zinc-400" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Mode Selector */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsModeSelectorOpen(!isModeSelectorOpen)}
                                        className="h-10 px-4 rounded-full bg-zinc-800/80 border border-white/10 text-zinc-300 text-sm font-medium flex items-center gap-2 hover:bg-zinc-800 transition-all"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        {analysisMode === 'dashboard' ? 'Dashboard View' : 'Deep Report'}
                                        <ChevronDown size={16} className={cn("transition-transform", isModeSelectorOpen && "rotate-180")} />
                                    </button>

                                    {isModeSelectorOpen && (
                                        <div className="absolute bottom-12 right-0 w-56 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-bottom-2 duration-200">
                                            <button
                                                onClick={() => {
                                                    setAnalysisMode('dashboard');
                                                    setIsModeSelectorOpen(false);
                                                }}
                                                className="w-full px-4 py-3 flex flex-col items-start gap-1 hover:bg-white/5 transition-colors text-left"
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="text-sm font-medium text-zinc-200">Dashboard View</span>
                                                    {analysisMode === 'dashboard' && <Check size={14} className="text-blue-500" />}
                                                </div>
                                                <span className="text-[10px] text-zinc-500">Quick metrics & summary charts</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setAnalysisMode('deep');
                                                    setIsModeSelectorOpen(false);
                                                }}
                                                className="w-full px-4 py-3 flex flex-col items-start gap-1 hover:bg-white/5 transition-colors text-left border-t border-white/5"
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="text-sm font-medium text-zinc-200">Deep Report</span>
                                                    {analysisMode === 'deep' && <Check size={14} className="text-blue-500" />}
                                                </div>
                                                <span className="text-[10px] text-zinc-500">Detailed critical analysis & risks</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    onClick={handleAnalyze}
                                    disabled={!isAnalysisInProgress && !isSelectionValid}
                                    className={cn(
                                        "transition-all duration-300 min-w-[140px] h-10 rounded-full",
                                        isAnalysisInProgress
                                            ? "bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/50"
                                            : !isSelectionValid
                                                ? "bg-zinc-800/50 text-zinc-600 border border-white/5 cursor-not-allowed opacity-50 shadow-none"
                                                : "bg-blue-600 hover:bg-blue-500 shadow-blue-900/40"
                                    )}
                                >
                                    {isAnalysisInProgress ? (
                                        <span className="flex items-center gap-2">
                                            <X size={16} /> Stop {analysisProgress}%
                                        </span>
                                    ) : idea.trim().length === 0 ? (
                                        <span className="flex items-center gap-2 text-zinc-500">
                                            <Info size={16} /> Describe Idea
                                        </span>
                                    ) : selectedModules.length < 3 ? (
                                        <span className="flex items-center gap-2 text-zinc-500">
                                            <Info size={16} /> Select 3-8 Topics
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2 text-white">
                                            <Sparkles size={16} /> Run Analysis
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                    {status === "loading" && <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${analysisProgress}%` }} />}
                </div>

                {status === "loading" && <GeneratingState projectName={currentProject?.name} />}

                {(status === "success") && result && (
                    <div className="relative animate-in fade-in slide-in-from-bottom-10 duration-700 space-y-8 mt-12">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTask('validator', { status: 'idle', data: null, input: "" })}
                            className="absolute top-0 right-0 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 z-20 transition-all rounded-full h-8 w-8"
                        >
                            <X size={16} />
                        </Button>

                        {viewMode === 'overview' ? (
                            <div className="w-full">
                                <ValidatorDashboard
                                    result={result}
                                    selectedModules={displayModules}
                                    onFixItPlan={handleFixItPlan}
                                    onDraftPitch={handleDraftPitchDeck}
                                />
                            </div>
                        ) : (
                            <div className="w-full">
                                <DeepReportView result={result} selectedModules={displayModules} />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isHistoryOpen && (
                <div className="fixed inset-0 z-[150] flex justify-end pt-16">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsHistoryOpen(false)} />
                    <div className="relative w-[450px] h-full bg-[#09090b] border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <HistoryIcon size={18} className="text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg text-white tracking-tight">Validation History</h2>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Previous Scans</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsHistoryOpen(false)} className="hover:bg-white/5 rounded-full">
                                <X size={20} className="text-zinc-500" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide text-left bg-[#09090b]">
                            {history.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-40 text-zinc-600 gap-2">
                                    <HistoryIcon size={24} className="opacity-20" />
                                    <p className="text-sm italic">No history yet.</p>
                                </div>
                            )}
                            {history.map((item) => {
                                const isDeep = !item.validation_report?.dashboard_summary;
                                const modeColor = isDeep ? "text-amber-400" : "text-blue-400";
                                const modeBorder = isDeep ? "group-hover:border-amber-500/30" : "group-hover:border-blue-500/30";
                                const modeLabel = isDeep ? "Deep Dive" : "Dashboard";

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => {
                                            setIdea(item.description);
                                            setTask('validator', { data: item.validation_report, status: 'success', input: item.description, progress: 100 });

                                            // Reconstruct displayed modules from the saved report to "freeze" the view
                                            const savedModules = item.validation_report?.modules_analysis?.map((m: any) => m.title) || [];
                                            // Also include core keys if present in summary to ensure they show up
                                            const summary = item.validation_report?.dashboard_summary;
                                            if (summary) {
                                                if (summary.market_fit) savedModules.push('Market Fit & Demand Score');
                                                if (summary.competitors) savedModules.push('Competitor Analysis (Direct & Indirect)');
                                                if (summary.feasibility) savedModules.push('Technical Feasibility & Tech Stack');
                                            }
                                            setDisplayModules(Array.from(new Set(savedModules)) as string[]); // Dedupe

                                            setIsHistoryOpen(false);
                                        }}
                                        className={cn(
                                            "group relative p-4 rounded-xl bg-zinc-900/50 border border-white/5 hover:bg-zinc-800 transition-all cursor-pointer flex items-center justify-between overflow-hidden",
                                            modeBorder
                                        )}
                                    >
                                        {/* Content */}
                                        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                            <h4 className="font-bold text-sm text-zinc-100 truncate group-hover:text-white transition-colors">
                                                {item.title || "Untitled Idea"}
                                            </h4>
                                            <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-medium">
                                                <span className={cn("uppercase tracking-wider font-bold text-[9px]", modeColor)}>
                                                    {modeLabel}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                                <span className="font-mono text-zinc-600 group-hover:text-zinc-500 transition-colors">
                                                    {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Delete Button */}
                                        <div className="shrink-0 flex items-center gap-2">
                                            <div className="opacity-100 transition-all duration-300">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 bg-transparent hover:bg-red-500/10 text-red-500/40 hover:text-red-500 rounded-full"
                                                    onClick={async (e) => {
                                                        e.stopPropagation(); // Prevent triggering the parent onClick
                                                        const { error } = await supabase.from('ideas').delete().eq('id', item.id);
                                                        if (!error) {
                                                            setHistory(prev => prev.filter(histItem => histItem.id !== item.id));
                                                        }
                                                    }}
                                                >
                                                    <div className="w-4 h-4 flex items-center justify-center">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M3 6h18" />
                                                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                            <line x1="10" x2="10" y1="11" y2="17" />
                                                            <line x1="14" x2="14" y1="11" y2="17" />
                                                        </svg>
                                                    </div>
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Hover Glow */}
                                        <div className={cn("absolute inset-y-0 left-0 w-1 bg-gradient-to-b opacity-0 group-hover:opacity-100 transition-opacity", isDeep ? "from-amber-500/50 to-amber-600/50" : "from-blue-500/50 to-blue-600/50")} />
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-4 border-t border-white/5 bg-zinc-900/50 text-center">
                            <p className="text-[10px] text-zinc-600">Select an item to restore full analysis</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

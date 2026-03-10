"use client";

import { useState, useEffect, useRef } from 'react';
import {
    Shield, Zap, Target, AlertTriangle, Plus,
    ArrowRight, Sparkles, MoreHorizontal, TrendingUp, X, Save,
    History as HistoryIcon, Trash2, Search, RefreshCw,
    ChevronDown, Check, LayoutGrid, ListTodo, Clipboard, ChevronUp,
    Crosshair, Terminal, Rocket, Loader2
} from 'lucide-react';
import { generateDetailedStrategicAnalysis } from "@/app/actions/gemini";
import { fetchStrategyHistory, saveStrategyToHistory, deleteStrategyFromHistory } from "@/app/actions/strategy";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/core/button";
import { Badge } from "@/components/ui/core/badge";
import { ScrollArea } from "@/components/ui/core/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTaskStore } from "@/lib/store/useTaskStore";
import { useProjectStore } from "@/lib/store/useProjectStore";
import ProjectSyncButton from "@/components/dashboard/layout/ProjectSyncButton";
import { motion, AnimatePresence } from "framer-motion";

// --- TYPES ---
type SwotItem = {
    id: string;
    type: 'strength' | 'weakness' | 'opportunity' | 'threat';
    title: string;
    description: string;
    impact: 'High' | 'Medium' | 'Low';
    actionPlan?: string;
};

type StrategyPair = {
    id: string;
    title: string;
    type: 'Growth' | 'Defense';
    description: string;
};

export default function StrategyClient() {
    const { tasks, startTask, completeTask, failTask, setTask } = useTaskStore();
    const { activeProjectId, currentProject } = useProjectStore();
    const task = tasks['strategy'];

    const [userInput, setUserInput] = useState(task?.input || "");
    const taskData = task?.data as any;
    const [projectName, setProjectName] = useState(taskData?.analysis_data?.projectName || "");

    // SYNC: Ensure local state picks up store values on navigation/refresh
    useEffect(() => {
        if (task?.input && !userInput) {
            setUserInput(task.input);
        }
        if (taskData?.analysis_data?.projectName && !projectName) {
            setProjectName(taskData.analysis_data.projectName);
        }
    }, [task?.input, task?.data]);

    // When project switches, clear input so sync button shows for new project
    const prevProjectIdRef = useRef(activeProjectId);
    useEffect(() => {
        if (prevProjectIdRef.current !== activeProjectId) {
            prevProjectIdRef.current = activeProjectId;
            setUserInput("");
        }
    }, [activeProjectId]);

    // --- STATE ---
    const swotData = taskData?.swot || [];
    const generatedStrategies = taskData?.strategies || [];
    const commanderIntent = taskData?.commanderIntent || "";

    const [history, setHistory] = useState<any[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const supabase = createClient();

    // Derived states
    const isAnalyzing = task?.status === 'loading';

    const fetchHistory = async () => {
        try {
            const data = await fetchStrategyHistory();
            setHistory(data);
        } catch (error) {
            console.error("fetchHistory Error:", error);
            // Don't toast error on mount, just log it.
        }
    };

    useEffect(() => {
        fetchHistory();

        // Listen for auth changes to refresh history
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                fetchHistory();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Auto-hydration from history removed to prevent "ghost" data on refresh.
    // Users can still load manually from history drawer.

    const loadFromHistory = (item: any) => {
        setProjectName(item.project_name);
        setTask('strategy', {
            data: {
                swot: item.swot_analysis || [],
                strategies: item.lean_canvas_data || [],
                commanderIntent: item.analysis_data?.commanderIntent || ""
            },
            status: 'success',
            input: item.project_name,
            progress: 100
        });
        setUserInput(item.project_name);
        setIsHistoryOpen(false);
    };

    const deleteFromHistory = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await deleteStrategyFromHistory(id);
            toast.success("Strategy purged from cache.");
            fetchHistory();
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Deletion failed.");
        }
    };

    const handleClear = () => {
        setTask('strategy', { status: 'idle', data: null, input: "", progress: 0 });
        setProjectName("");
        setUserInput("");
    };

    const handleAnalyze = async (forcedPrompt?: string) => {
        if (isAnalyzing) {
            setTask('strategy', { status: 'idle', data: null, progress: 0 });
            return;
        }

        const input = forcedPrompt || userInput;
        if (!input.trim()) return;

        startTask('strategy', ["MAPPING TACTICAL GRID...", "IDENTIFYING CRITICAL VECTORS...", "SYNTHESIZING COMMANDER'S INTENT..."]);
        setTask('strategy', { input: input, data: null });

        try {
            const { summarizeProjectContext } = await import('@/lib/utils/project-context');
            const context = summarizeProjectContext(currentProject);

            const data = await generateDetailedStrategicAnalysis(input, context, 'deep');

            // Check if cancelled
            const currentStatus = useTaskStore.getState().tasks['strategy']?.status;
            if (currentStatus !== 'loading') return;

            const newSwot: SwotItem[] = [
                ...data.swot.strengths.map((s: any, i: number) => ({ ...s, id: `s-${i}-${Date.now()}`, type: 'strength' })),
                ...data.swot.weaknesses.map((w: any, i: number) => ({ ...w, id: `w-${i}-${Date.now()}`, type: 'weakness' })),
                ...data.swot.opportunities.map((o: any, i: number) => ({ ...o, id: `o-${i}-${Date.now()}`, type: 'opportunity' })),
                ...data.swot.threats.map((t: any, i: number) => ({ ...t, id: `t-${i}-${Date.now()}`, type: 'threat' }))
            ];

            completeTask('strategy', {
                swot: newSwot,
                strategies: data.strategies,
                commanderIntent: data.commanderIntent
            });

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const name = input.substring(0, 30).toUpperCase();
                setProjectName(name);

                // Save strategy silently in background
                saveStrategyToHistory({
                    project_name: name,
                    swot_analysis: newSwot,
                    lean_canvas_data: data.strategies,
                    analysis_data: data
                }).then(() => {
                    fetchHistory();
                }).catch((err: any) => {
                    console.error("Strategy background save failed:", err);
                });
            } else {
                toast.warning("Logged out: Strategy won't be saved to history.");
            }
        } catch (error: any) {
            failTask('strategy', "Analysis failed.");
            toast.error("Analysis process failed: " + (error?.message || "Internal error"));
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="min-h-screen bg-[#020202] text-white px-3 pt-3 lg:p-8 font-sans pb-28 lg:pb-24 relative overflow-hidden">
            {/* TACTICAL GRID BACKGROUND */}
            <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

            <motion.div
                className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.1 }}
            >
                <motion.div
                    animate={{ x: ['0%', '100%', '0%'], y: ['0%', '100%', '0%'] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 left-0 text-cyan-500/50"
                >
                    <Crosshair size={40} className="animate-pulse" />
                </motion.div>
                <motion.div
                    animate={{ x: ['100%', '0%', '100%'], y: ['0%', '100%', '0%'] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 right-0 text-blue-500/50"
                >
                    <Crosshair size={30} className="animate-pulse" />
                </motion.div>
            </motion.div>

            {/* HEADER */}
            <header className="relative z-10 flex justify-between items-start mb-3 lg:mb-12 border-b border-white/5 pb-3 lg:pb-6 gap-3">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black font-mono tracking-tighter text-white flex items-center gap-2">
                            <Terminal size={24} className="text-orange-500" />
                            STRATEGY DECK
                        </h1>
                        {projectName && (
                            <div className="flex items-center gap-2 ml-8 mt-1 max-w-[160px] lg:max-w-none">
                                <span className="text-[10px] font-mono text-orange-500/50 uppercase tracking-[0.3em] hidden lg:inline">
                                    ACTIVE_INTEL:
                                </span>
                                <span className="text-[10px] font-mono text-white/70 uppercase tracking-widest font-bold truncate">
                                    {projectName}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {(swotData.length > 0 || userInput.trim() !== "" || projectName !== "") && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClear}
                            className="hidden lg:flex bg-red-500/5 border border-red-500/20 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all h-9 w-9 lg:h-10 lg:w-10 rounded-lg"
                            title="Clear Current Briefing"
                        >
                            <X size={16} />
                        </Button>
                    )}
                    <ProjectSyncButton module="strategy" data={task?.data} disabled={!task?.data} context={{ name: projectName || userInput.slice(0, 50), description: userInput }} />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsHistoryOpen(true)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 lg:px-4 h-9 lg:h-10 hover:bg-white/10 transition-all font-mono text-[10px] tracking-widest uppercase"
                    >
                        <HistoryIcon size={14} className="lg:mr-2" />
                        <span className="hidden lg:inline">Neural Cache</span>
                    </Button>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="relative z-10 max-w-6xl mx-auto space-y-4 lg:space-y-12">
                {/* INPUT SECTION (WAR ROOM) */}
                <section className="space-y-2 lg:space-y-6">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl blur opacity-10 group-focus-within:opacity-20 transition duration-500" />
                        <div className="relative bg-[#080808]/80 backdrop-blur-xl border border-white/10 rounded-xl lg:rounded-2xl p-1 lg:p-2 flex flex-col gap-1 lg:gap-2">
                            <div className="flex items-center px-4 pt-2">
                                <Terminal size={14} className="text-zinc-600 mr-2" />
                                <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Awaiting Command...</span>
                            </div>
                            <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                                <div className="flex-1">
                                    {currentProject && !userInput && (
                                        <button
                                            onClick={() => setUserInput(currentProject.description || currentProject.name)}
                                            className="px-4 py-1 text-[10px] text-blue-400 hover:text-blue-300 font-bold tracking-widest uppercase flex items-center gap-2 transition-colors mb-1"
                                        >
                                            <Rocket size={12} />
                                            Sync with {currentProject.name}
                                        </button>
                                    )}
                                    <textarea
                                        value={userInput}
                                        onChange={(e) => setUserInput(e.target.value)}
                                        placeholder="Describe the objective..."
                                        className="w-full bg-transparent border-none outline-none text-white px-4 py-2 font-mono text-sm placeholder-zinc-700 focus:ring-0 resize-none min-h-[48px] scrollbar-hide"
                                    />
                                </div>
                                <div className="flex items-center gap-2 px-4 pb-2 lg:pb-0">
                                    <Button
                                        onClick={() => handleAnalyze()}
                                        disabled={!userInput.trim() && !isAnalyzing}
                                        className={cn(
                                            "w-full lg:w-auto h-10 px-6 rounded-xl font-mono text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2",
                                            isAnalyzing
                                                ? "bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30"
                                                : "bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                        )}
                                    >
                                        {isAnalyzing ? <><X size={14} /> Abort</> : <><RefreshCw size={14} /> Execute Analysis</>}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mobile clear button — between input and output */}
                {swotData.length > 0 && (
                    <div className="flex lg:hidden justify-end">
                        <button
                            onClick={handleClear}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-red-400 bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-all"
                        >
                            <X size={12} /> Clear
                        </button>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {isAnalyzing ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-10 lg:py-20 space-y-4 lg:space-y-6"
                        >
                            <div className="relative w-24 h-24">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 border-2 border-dashed border-orange-500/30 rounded-full"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Search className="text-orange-500 animate-pulse" size={32} />
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-xs font-mono font-black text-white tracking-[0.3em] uppercase">{task?.loadingStep || "COMMENCING SCAN..."}</p>
                                <p className="text-[9px] font-mono text-zinc-600 tracking-[0.5em] uppercase animate-pulse">Establishing encrypted link</p>
                            </div>
                        </motion.div>
                    ) : swotData.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-16 lg:py-32 text-center"
                        >
                            <Shield size={64} className="mb-6 text-zinc-800 opacity-20" />
                            <h2 className="text-xl font-black font-mono text-zinc-800 uppercase tracking-[0.2em]">Strategy Engine Is Offline</h2>
                            <p className="text-xs font-mono text-zinc-600 mt-2 uppercase tracking-widest">Initialize mission objective above to activate tactical analysis.</p>
                            {!activeProjectId ? (
                                <p className="text-[10px] font-mono text-amber-500/50 mt-4 uppercase tracking-[0.2em]">
                                    Currently in Sandbox Mode. Select a project in the top bar to persist this strategy.
                                </p>
                            ) : (
                                <p className="text-[10px] font-mono text-blue-500/50 mt-4 uppercase tracking-[0.2em]">
                                    Connected to: <span className="text-blue-400">{currentProject?.name}</span>
                                </p>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4 lg:space-y-12"
                        >
                            {/* EXECUTIVE BRIEF (COMMANDER'S INTENT) */}
                            <section>
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/50 to-red-600/50 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500" />
                                    <div className="relative bg-[#0d0d0d] border border-orange-500/20 rounded-2xl p-5 lg:p-8 overflow-hidden shadow-2xl">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                            <Shield size={120} className="text-orange-500" />
                                        </div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <Sparkles className="text-orange-400" size={18} />
                                            <h2 className="text-sm font-black font-mono text-orange-400 tracking-[0.3em] uppercase">COMMANDER&apos;S_INTENT</h2>
                                        </div>
                                        {/* Mobile: no quotes */}
                                        <p className="lg:hidden text-base font-black text-white leading-relaxed italic pr-4">
                                            {(commanderIntent || "Strategic synthesis in progress. Standardizing operational objectives for immediate deployment.").replace(/^["\u201C]|["\u201D]$/g, '')}
                                        </p>
                                        {/* Desktop: no quotes */}
                                        <p className="hidden lg:block text-xl font-black text-white leading-relaxed italic pr-12">
                                            {commanderIntent || "Strategic synthesis in progress. Standardizing operational objectives for immediate deployment."}
                                        </p>
                                        <div className="mt-6 flex items-center justify-between">
                                            <div className="flex flex-row gap-2">
                                                <Badge variant="outline" className="text-[9px] font-mono border-zinc-800 text-zinc-500 uppercase tracking-widest w-fit">Confidence: 94%</Badge>
                                                <Badge variant="outline" className="text-[9px] font-mono border-zinc-800 text-zinc-500 uppercase tracking-widest w-fit">Risk Level: Moderate</Badge>
                                            </div>
                                            <div className="hidden lg:block text-[9px] font-mono text-zinc-700 uppercase">Operational Protocol: Active</div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* SWOT GRID (INTERACTIVE ACCORDIONS) */}
                            <section className="space-y-3 lg:space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-black font-mono text-zinc-500 tracking-[0.4em] uppercase flex items-center gap-2">
                                        <LayoutGrid size={14} /> SWOT_TACTICAL_GRID
                                    </h3>
                                    <div className="h-px flex-1 bg-white/5 mx-6" />
                                    <Badge className="bg-white/5 border-white/10 text-[9px] font-mono text-zinc-500 uppercase px-3">Filter: All</Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                                    <SwotSection
                                        title="STRENGTHS"
                                        items={swotData.filter((i: SwotItem) => i.type === 'strength')}
                                        color="text-emerald-500"
                                        bg="bg-emerald-500/5"
                                        border="border-emerald-500/20"
                                        icon={<Shield size={14} />}
                                    />
                                    <SwotSection
                                        title="WEAKNESSES"
                                        items={swotData.filter((i: SwotItem) => i.type === 'weakness')}
                                        color="text-rose-500"
                                        bg="bg-rose-500/5"
                                        border="border-rose-500/20"
                                        icon={<AlertTriangle size={14} />}
                                    />
                                    <SwotSection
                                        title="OPPORTUNITIES"
                                        items={swotData.filter((i: SwotItem) => i.type === 'opportunity')}
                                        color="text-blue-500"
                                        bg="bg-blue-500/5"
                                        border="border-blue-500/20"
                                        icon={<Target size={14} />}
                                    />
                                    <SwotSection
                                        title="THREATS"
                                        items={swotData.filter((i: SwotItem) => i.type === 'threat')}
                                        color="text-amber-500"
                                        bg="bg-amber-500/5"
                                        border="border-amber-500/20"
                                        icon={<Zap size={14} />}
                                    />
                                </div>
                            </section>

                            {/* ACTION PLAN (GRID) */}
                            <section className="space-y-3 lg:space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-black font-mono text-zinc-500 tracking-[0.4em] uppercase flex items-center gap-2">
                                        <ListTodo size={14} /> OPERATIONAL_ROADMAP
                                    </h3>
                                    <div className="h-px flex-1 bg-white/5 mx-6" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-6">
                                    {generatedStrategies.map((strat: StrategyPair) => (
                                        <ActionCard key={strat.id} strat={strat} onCopy={() => copyToClipboard(strat.description)} />
                                    ))}
                                </div>
                            </section>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* NEURAL CACHE (HISTORY SIDEBAR) */}
            <AnimatePresence>
                {isHistoryOpen && (
                    <div className="fixed inset-0 z-[100] flex justify-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setIsHistoryOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="relative w-full lg:w-96 h-full bg-[#080808] border-l border-white/10 shadow-2xl p-5 lg:p-8 flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h2 className="font-black font-mono text-xl tracking-tighter text-white uppercase">NEURAL_CACHE</h2>
                                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Operational Archives</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setIsHistoryOpen(false)} className="rounded-xl hover:bg-white/5">
                                    <X size={24} className="text-zinc-600" />
                                </Button>
                            </div>

                            <ScrollArea className="flex-1 -mr-4 pr-4">
                                <div className="space-y-4">
                                    {history.length === 0 ? (
                                        <div className="text-center py-20">
                                            <p className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">No cached logs found.</p>
                                        </div>
                                    ) : (
                                        history.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => loadFromHistory(item)}
                                                className="group p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-orange-500/50 hover:bg-white/10 transition-all cursor-pointer relative"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[9px] font-mono text-zinc-600 uppercase italic">{new Date(item.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <h4 className="font-bold font-mono text-xs text-zinc-100 uppercase tracking-tight group-hover:text-orange-400 transition-colors">{item.project_name}</h4>
                                                <div className="mt-3 flex gap-2">
                                                    <Badge variant="outline" className="text-[8px] font-mono border-white/5 text-zinc-600">{item.swot_analysis?.length || 0} VECTORS</Badge>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 h-8 w-8 text-zinc-600 hover:text-red-500 transition-all"
                                                    onClick={(e) => deleteFromHistory(e, item.id)}
                                                >
                                                    <Trash2 size={12} />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function SwotSection({ title, items, color, bg, border, icon }: any) {
    return (
        <div className={cn("rounded-2xl border p-4 flex flex-col gap-3", border, bg)}>
            <div className={cn("flex items-center gap-2", color)}>
                {icon}
                <span className="text-[10px] font-black font-mono tracking-[0.2em] uppercase">{title}</span>
                <span className="text-[9px] font-mono bg-white/5 px-2 py-0.5 rounded ml-auto">{items.length}</span>
            </div>
            <div className="space-y-2">
                {items.length === 0 ? (
                    <div className="py-8 text-center text-zinc-700 text-[10px] font-mono uppercase italic">Awaiting sectors...</div>
                ) : (
                    items.map((item: SwotItem) => (
                        <SwotAccordion key={item.id} item={item} color={color} border={border} />
                    ))
                )}
            </div>
        </div>
    );
}

function SwotAccordion({ item, color, border }: { item: SwotItem, color: string, border: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={cn("border bg-black/40 rounded-xl overflow-hidden transition-all", isOpen ? border : "border-white/5")}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors group"
            >
                <div className="flex items-center gap-3">
                    <span className={cn("text-xs font-black font-mono uppercase tracking-tight", isOpen ? color : "text-zinc-200")}>
                        {item.title}
                    </span>
                    <Badge variant="outline" className={cn("text-[8px] font-mono border-zinc-800",
                        item.impact === 'High' ? "text-rose-400" : item.impact === 'Medium' ? "text-amber-400" : "text-zinc-500"
                    )}>
                        {item.impact} IMPACT
                    </Badge>
                </div>
                {isOpen ? <ChevronUp size={12} className="text-zinc-500" /> : <ChevronDown size={12} className="text-zinc-700 group-hover:text-zinc-400" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <div className="px-4 pb-4 border-t border-white/5 mt-0 pt-3">
                            <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                                {item.description.replace(/^["\u201C]|["\u201D]$/g, '')}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ActionCard({ strat, onCopy }: { strat: StrategyPair, onCopy: () => void }) {
    return (
        <div className="bg-[#0d0d0d] border border-white/10 p-5 rounded-2xl hover:border-orange-500/30 transition-all group relative">
            <div className="flex items-center justify-between mb-3">
                <div className={cn("px-3 py-1 rounded-lg text-[9px] font-black font-mono uppercase",
                    strat.type === 'Growth' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                )}>
                    {strat.type} Protocol
                </div>
                <button
                    onClick={onCopy}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-lg text-zinc-500 transition-all font-mono"
                    title="Copy to Clipboard"
                >
                    <Clipboard size={14} />
                </button>
            </div>
            <h4 className="text-sm font-black text-white mb-2 uppercase tracking-tight">{strat.title}</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-mono">{strat.description}</p>
        </div>
    );
}

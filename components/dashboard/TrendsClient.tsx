"use client";

import { generateTrendHunterData } from "@/app/actions/gemini";
import { useState, useEffect } from "react";
import {
    Search,
    Globe,
    Activity,
    BrainCircuit,
    TrendingUp,
    AlertTriangle,
    Zap,
    Megaphone,
    History as HistoryIcon,
    Trash2,
    X,
    ChevronRight,
    Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

import { useTaskStore } from "@/lib/store/useTaskStore";
import { useProjectStore } from "@/lib/store/useProjectStore";
import ProjectSyncButton from "./ProjectSyncButton";

export default function TrendsClient() {
    const { tasks, startTask, completeTask, failTask, setTask } = useTaskStore();
    const { currentProject } = useProjectStore();
    const task = tasks['trends'];
    const [searchTerm, setSearchTerm] = useState(task?.input || "");

    // SYNC: Ensure local state picks up store values on navigation/refresh
    useEffect(() => {
        if (task?.input && !searchTerm) {
            setSearchTerm(task.input);
        }
    }, [task?.input]);

    const handleClear = () => {
        setTask('trends', { status: 'idle', data: null, input: "", progress: 0 });
        setSearchTerm("");
    };

    const [searchMode, setSearchMode] = useState<'GLOBAL' | 'NICHE'>('GLOBAL');

    // History State
    const [history, setHistory] = useState<any[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const supabase = createClient();

    // Derived states
    const isScanning = task?.status === 'loading';
    const apiData = task?.data;

    const fetchHistory = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('trends')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (!error && data) setHistory(data);
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    // Auto-hydration from history removed to prevent old search terms from returning on refresh.
    // Use the Neural Cache (History) to load previous scans manually.

    const loadFromHistory = (item: any) => {
        setSearchTerm(item.query);
        setTask('trends', { data: item.analysis_data, status: 'success', input: item.query, progress: 100 });
        setIsHistoryOpen(false);
    };

    const deleteFromHistory = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const { error } = await supabase.from('trends').delete().eq('id', id);
        if (!error) fetchHistory();
    };

    const handleSearch = async (e?: React.KeyboardEvent | React.MouseEvent, modeOverride?: 'GLOBAL' | 'NICHE', forcedTerm?: string) => {
        if (isScanning) {
            setTask('trends', { status: 'idle', data: null });
            return;
        }

        const currentMode = modeOverride || searchMode;
        const term = forcedTerm || searchTerm;

        if (!e || (e as React.KeyboardEvent).key === 'Enter' || (e as React.MouseEvent).type === 'click') {
            if (!term.trim()) return;

            startTask('trends', ["SCANNING GLOBAL NETWORK NODES...", "MAPPING TECH VECTORS...", "ANALYZING ADOPTION CURVES..."]);
            setTask('trends', { input: term, data: null });

            try {
                const { summarizeProjectContext } = await import('@/lib/utils/project-context');
                const context = summarizeProjectContext(currentProject);

                const results = await generateTrendHunterData(term, currentMode, context);

                // Check if cancelled
                const currentStatus = useTaskStore.getState().tasks['trends']?.status;
                if (currentStatus !== 'loading') return;

                completeTask('trends', results);

                // Save to DB
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase.from('trends').insert({
                        user_id: user.id,
                        query: term,
                        sector: results.mainTrend.tags?.[0] || term,
                        analysis_data: results
                    });
                    fetchHistory();
                }

            } catch (error) {
                const currentStatus = useTaskStore.getState().tasks['trends']?.status;
                if (currentStatus === 'loading') {
                    console.error("Trends Error:", error);
                    failTask('trends', "Search failed.");
                }
            }
        }
    };



    return (
        <div className="w-full flex-1 bg-[#0a0a0a] text-white flex flex-col overflow-hidden font-sans relative">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            {/* Glow Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full blur-[120px] pointer-events-none z-0" />

            {/* Page Header (Internal to Page, below Global Topbar) */}
            <div className="flex items-center justify-between pl-8 pr-4 pt-4 pb-6 relative z-20">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                        <TrendingUp size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-white uppercase">TREND HUNTER</h1>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] mt-1">Global Intelligence Command</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {(searchTerm.trim() || apiData) && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClear}
                            className="bg-red-500/5 border border-red-500/20 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all h-10 w-10 rounded-xl"
                            title="Clear Analysis"
                        >
                            <X size={18} />
                        </Button>
                    )}
                    <ProjectSyncButton module="trends" data={apiData} disabled={!apiData} context={{ name: searchTerm.slice(0, 50) || "Trend Analysis", description: apiData?.mainTrend?.analysis || searchTerm }} />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsHistoryOpen(true)}
                        className="flex items-center gap-2 px-4 h-10 bg-white/5 border border-white/10 rounded-xl group hover:bg-white/10 transition-all text-zinc-400 hover:text-white"
                    >
                        <HistoryIcon size={18} />
                        <span className="text-xs font-bold tracking-widest uppercase transition-colors">History</span>
                    </Button>
                </div>
            </div>
            {/* Main Content Area */}
            <main className="flex-1 relative flex overflow-hidden z-10">
                <AnimatePresence mode="wait">
                    {!apiData && !isScanning ? (
                        /* HERO SEARCH STATE */
                        <motion.div
                            key="hero"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="flex-1 flex flex-col items-center justify-center p-6 relative"
                        >
                            <div className="w-full max-w-3xl space-y-8 text-center">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                                        Hunting the <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">Future.</span>
                                    </h2>
                                    <p className="text-zinc-400 text-lg max-w-xl mx-auto font-medium">
                                        Scan global sectors and niche markets to discover exponential opportunities before they go mainstream.
                                    </p>
                                </motion.div>

                                <motion.div
                                    className="relative group w-full"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500" />
                                    <div className="relative flex items-center bg-[#0d0d0d]/80 backdrop-blur-xl border border-white/10 rounded-2xl h-16 px-6 ring-0 focus-within:ring-2 focus-within:ring-cyan-500/50 transition-all duration-300">
                                        <Search className="text-zinc-500 mr-4" size={24} />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                                            onKeyDown={(e) => handleSearch(e)}
                                            placeholder="Discover the next big opportunity... (e.g., 'Micro-SaaS for Dentists')"
                                            className="flex-1 bg-transparent border-none outline-none text-xl font-bold uppercase tracking-wider placeholder:text-zinc-700 text-white"
                                            autoFocus
                                        />
                                        <Button
                                            onClick={() => handleSearch()}
                                            disabled={!searchTerm.trim()}
                                            className="ml-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl px-6 h-10 font-bold tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                                        >
                                            <Rocket size={18} className="mr-2" />
                                            Scale
                                        </Button>
                                    </div>
                                </motion.div>



                                {currentProject ? (
                                    <motion.button
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        onClick={() => {
                                            const term = (currentProject.description || currentProject.name).toUpperCase();
                                            setSearchTerm(term);
                                            handleSearch(undefined, undefined, term);
                                        }}
                                        className="mt-12 group flex items-center gap-3 px-6 py-3 bg-blue-600/10 border border-blue-500/20 rounded-2xl hover:bg-blue-600/20 transition-all mx-auto"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                                            <Rocket size={16} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Connect Project</p>
                                            <p className="text-sm font-bold text-white uppercase">{currentProject.name}</p>
                                        </div>
                                    </motion.button>
                                ) : (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="mt-12 text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em] opacity-50"
                                    >
                                        Currently in Sandbox Mode. Select a project to persist findings.
                                    </motion.p>
                                )}
                            </div>

                            {/* Decorative Floating Elements */}
                            <div className="absolute top-20 left-20 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl animate-pulse" />
                            <div className="absolute bottom-40 right-40 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                        </motion.div>
                    ) : (
                        /* SEARCHING & RESULTS STATE */
                        <motion.div
                            key="results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-1 flex flex-col relative"
                        >
                            {/* Loading Overlay */}
                            <AnimatePresence>
                                {isScanning && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-[60] bg-[#0a0a0a]/90 backdrop-blur-xl flex flex-col items-center justify-center p-12 overflow-hidden"
                                    >
                                        {/* Scanner UI */}
                                        <div className="relative w-64 h-64 mb-12">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                                className="absolute inset-0 border-2 border-dashed border-cyan-500/30 rounded-full"
                                            />
                                            <motion.div
                                                animate={{ rotate: -360 }}
                                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                                className="absolute inset-4 border border-blue-500/20 rounded-full"
                                            />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-cyan-400 font-mono text-center">
                                                <Activity className="animate-pulse mb-2 text-cyan-400" size={32} />
                                                <span className="text-[10px] font-black tracking-[0.2em] uppercase">Sector Scan</span>
                                                <span className="text-2xl font-black mt-1">ACTIVE</span>
                                            </div>
                                            {/* Laser Line */}
                                            <motion.div
                                                animate={{ top: ['0%', '100%', '0%'] }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-[0_0_15px_rgba(6,182,212,0.8)] z-10"
                                            />
                                        </div>

                                        <div className="space-y-4 max-w-md w-full text-center">
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                                                    initial={{ width: "0%" }}
                                                    animate={{ width: "100%" }}
                                                    transition={{ duration: 10, ease: "easeInOut" }}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1 items-center">
                                                <motion.p
                                                    key={task?.loadingStep}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="text-xs font-bold text-white tracking-[0.2em] uppercase"
                                                >
                                                    {task?.loadingStep || "SCANNING GLOBAL NETWORK NODES..."}
                                                </motion.p>
                                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Query: <span className="text-cyan-400">{searchTerm}</span></p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleSearch()}
                                                className="mt-8 text-[10px] text-red-400 hover:text-red-300 font-black tracking-[0.3em] uppercase border border-red-500/20 px-8 rounded-xl h-10 transition-all hover:bg-red-500/10"
                                            >
                                                Abort Analysis
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Actual Content when Loaded */}
                            <div className="flex-1 flex overflow-hidden">
                                <div className="flex-1 flex flex-col border-r border-white/5 relative bg-transparent p-6 overflow-hidden">
                                    {/* Search Bar (Persistent when results are shown) */}
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="flex-1 relative group">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-0 group-focus-within:opacity-20 transition duration-300" />
                                            <div className="relative flex items-center bg-[#0d0d0d]/60 backdrop-blur-md border border-white/10 rounded-xl h-12 px-4 transition-all">
                                                <Search className="text-zinc-500 mr-3" size={18} />
                                                <input
                                                    type="text"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                                                    onKeyDown={(e) => handleSearch(e)}
                                                    className="flex-1 bg-transparent border-none outline-none text-sm font-bold uppercase tracking-wider text-white"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleSearch()}
                                                    className="text-cyan-400 font-bold text-[10px] tracking-widest uppercase h-8 hover:bg-cyan-500/10 rounded-lg"
                                                >
                                                    Run Scan
                                                </Button>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setTask('trends', { status: 'idle', data: null, input: "" })}
                                            className="h-12 w-12 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all rounded-xl border border-white/5"
                                        >
                                            <X size={20} />
                                        </Button>
                                    </div>

                                    {apiData && (
                                        <div className="flex-1 flex flex-col min-h-0 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                                                <div className="md:col-span-2 bg-white/5 rounded-[2rem] border border-white/10 p-6 relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                                                        <TrendingUp size={24} className="text-blue-500" />
                                                    </div>
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div>
                                                            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Momentum Index</h3>
                                                            <h2 className="text-lg font-black text-white uppercase tracking-tight">12-Month Trajectory</h2>
                                                        </div>
                                                        <Badge className={`px-4 py-1 rounded-full text-[10px] font-black ${(apiData?.mainTrend?.velocityStatus || 'STABLE') === 'EXPLODING' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]'}`}>
                                                            {apiData?.mainTrend?.velocityStatus || 'STABLE'} VELOCITY
                                                        </Badge>
                                                    </div>
                                                    <div className="h-40 w-full">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <LineChart data={apiData?.momentumGraph?.dataPoints || []}>
                                                                <XAxis dataKey="month" stroke="#333" fontSize={10} tickLine={false} axisLine={false} />
                                                                <YAxis hide domain={[0, 100]} />
                                                                <Tooltip
                                                                    contentStyle={{ backgroundColor: '#0d0d0d', border: '1px solid #333', borderRadius: '12px', fontSize: '10px', fontFamily: 'monospace' }}
                                                                    labelStyle={{ color: '#666', marginBottom: '4px' }}
                                                                />
                                                                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} dot={false} activeDot={{ r: 6, fill: '#60a5fa' }} />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>

                                                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2rem] border border-blue-400/20 p-6 flex flex-col justify-between shadow-[0_0_30px_rgba(37,99,235,0.2)]">
                                                    <div>
                                                        <p className="text-[10px] font-black text-blue-100 uppercase tracking-[0.2em] mb-4">Sentiment Score</p>
                                                        <div className="text-6xl font-black text-white">{apiData?.mainTrend?.score || 0}%</div>
                                                        <p className="text-xs text-blue-100/70 font-bold uppercase mt-2 tracking-widest">{apiData?.mainTrend?.score >= 70 ? 'Extreme Bullish' : 'Moderate Interest'}</p>
                                                    </div>
                                                    <div className="mt-4 space-y-2">
                                                        <div className="flex justify-between text-[10px] font-bold text-blue-100 uppercase tracking-widest">
                                                            <span>Global Alpha</span>
                                                            <span>{(apiData?.mainTrend?.score / 1.1).toFixed(1)}</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                                                            <div className="h-full bg-white transition-all duration-1000" style={{ width: `${apiData?.mainTrend?.score}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                                                {(apiData?.relatedSubTrends || []).map((trend: any, index: number) => (
                                                    <div key={index} className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/20 transition-all group cursor-default">
                                                        <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest block mb-2">{trend?.growth || "Emerging"}</span>
                                                        <span className="text-white font-black text-xs uppercase leading-tight group-hover:text-cyan-400 transition-colors">{trend?.name}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex-1 bg-[#0d0d0d]/40 rounded-[2rem] border border-white/5 p-6 min-h-0 flex flex-col">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-3 py-1 text-[10px] uppercase font-black tracking-widest">
                                                        AI Synapse Analysis
                                                    </Badge>
                                                </div>
                                                <ScrollArea className="flex-1 pr-4">
                                                    <p className="text-base text-zinc-300 leading-relaxed font-medium italic">
                                                        "{apiData?.mainTrend?.analysis || "Pending analytical synthesis..."}"
                                                    </p>
                                                </ScrollArea>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Strategy Panel */}
                                <aside className="w-[380px] border-l border-white/5 bg-[#0a0a0a]/50 backdrop-blur-sm p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                                    <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-2 text-center">Execution Vector</h2>

                                    {apiData ? (
                                        <div className="space-y-6">
                                            <div className="p-6 bg-gradient-to-br from-cyan-900/10 to-transparent rounded-3xl border border-cyan-500/10 shadow-[inner_0_0_20px_rgba(6,182,212,0.05)]">
                                                <div className="flex items-center gap-3 text-cyan-400 text-xs font-black tracking-widest uppercase mb-6">
                                                    <BrainCircuit size={18} /> GTM Roadmap
                                                </div>
                                                <ul className="space-y-4">
                                                    {(apiData?.strategyPlan?.gtm || []).map((step: any, idx: number) => (
                                                        <li key={idx} className="flex items-start gap-4">
                                                            <div className="mt-1 w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)] shrink-0" />
                                                            <p className="text-xs text-zinc-400 font-medium leading-relaxed">{step}</p>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 relative group overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
                                                    <Megaphone size={18} className="text-zinc-500" />
                                                </div>
                                                <span className="text-zinc-400 text-[10px] font-black tracking-widest uppercase mb-4 block">Market Entry Protocol</span>
                                                <p className="text-xs text-zinc-300 leading-relaxed font-medium italic">
                                                    "{apiData?.strategyPlan?.marketEntryAdvice || "Calibrating market entrance vectors..."}"
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-5 bg-green-500/10 backdrop-blur-md border border-green-500/20 rounded-3xl relative group overflow-hidden transition-all hover:bg-green-500/15 shadow-[0_0_20px_rgba(34,197,94,0.05)]">
                                                    <div className="absolute top-0 right-0 p-4 opacity-30 group-hover:scale-110 transition-transform">
                                                        <Zap size={16} className="text-green-500" />
                                                    </div>
                                                    <div className="flex items-center gap-2 text-green-400 mb-4">
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tailwinds</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {(apiData?.mainTrend?.drivers || []).map((d: string, i: number) => (
                                                            <Badge key={i} variant="outline" className="bg-green-500/5 border-green-500/10 text-green-400/90 text-[9px] font-bold uppercase py-1 px-3 rounded-lg">{d}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="p-5 bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-3xl relative group overflow-hidden transition-all hover:bg-red-500/15 shadow-[0_0_20px_rgba(239,68,68,0.05)]">
                                                    <div className="absolute top-0 right-0 p-4 opacity-30 group-hover:scale-110 transition-transform">
                                                        <AlertTriangle size={16} className="text-red-500" />
                                                    </div>
                                                    <div className="flex items-center gap-2 text-red-400 mb-4">
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Headwinds</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {(apiData?.mainTrend?.risks || []).map((r: string, i: number) => (
                                                            <Badge key={i} variant="outline" className="bg-red-500/5 border-red-500/10 text-red-400/90 text-[9px] font-bold uppercase py-1 px-3 rounded-lg">{r}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                                            <div className="w-12 h-12 border border-zinc-500 rounded-full flex items-center justify-center mb-4">
                                                <Activity size={24} />
                                            </div>
                                            <p className="text-[10px] font-black tracking-[0.3em] uppercase text-center">Systems Offline<br />Awaiting Scan</p>
                                        </div>
                                    )}
                                </aside>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Live Ticker Banner */}
            <footer className="h-10 border-t border-white/5 bg-black/40 backdrop-blur-sm z-50 flex items-center overflow-hidden whitespace-nowrap opacity-50 select-none pointer-events-none">
                <motion.div
                    animate={{ x: [0, -1000] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="flex gap-12 px-12 items-center"
                >
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className="flex gap-12 items-center">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-2">
                                <Activity size={10} className="text-cyan-500" /> Analyzing 50M+ Data Points...
                            </span>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-2">
                                <Globe size={10} className="text-blue-500" /> Tracking Emerging Niches...
                            </span>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-2">
                                <Zap size={10} className="text-cyan-500" /> Monitoring Social Signals...
                            </span>
                        </div>
                    ))}
                </motion.div>
            </footer>

            {/* History Sidebar */}
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
                            className="relative w-96 h-full bg-[#0d0d0d] border-l border-white/10 shadow-2xl p-8 flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                        <HistoryIcon size={24} />
                                    </div>
                                    <div>
                                        <h2 className="font-black text-xl tracking-tight text-white uppercase">Neural Cache</h2>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Archived Intelligence</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setIsHistoryOpen(false)} className="rounded-xl hover:bg-white/5">
                                    <X size={24} className="text-zinc-400" />
                                </Button>
                            </div>

                            <ScrollArea className="flex-1 -mr-4 pr-4">
                                <div className="space-y-4">
                                    {history.length === 0 ? (
                                        <div className="text-center py-20">
                                            <Activity size={40} className="mx-auto text-zinc-800 mb-4 opacity-20" />
                                            <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">No cached logs detected.</p>
                                        </div>
                                    ) : (
                                        history.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => loadFromHistory(item)}
                                                className="group p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all cursor-pointer relative"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{new Date(item.created_at).toLocaleDateString()}</span>
                                                    <Badge variant="outline" className="text-[9px] py-0 h-4 border-cyan-500/20 text-cyan-400 uppercase font-black tracking-widest">
                                                        {item.analysis_data?.mainTrend?.velocityStatus || 'SCAN'}
                                                    </Badge>
                                                </div>
                                                <h4 className="font-black text-sm text-zinc-100 line-clamp-2 mb-2 uppercase tracking-tight group-hover:text-blue-400 transition-colors">{item.query}</h4>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500/50" style={{ width: `${item.analysis_data?.mainTrend?.score || 0}%` }} />
                                                    </div>
                                                    <span className="text-[10px] font-mono text-zinc-500">{item.analysis_data?.mainTrend?.score || '0'}%</span>
                                                </div>
                                                <Button variant="ghost" size="icon" className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 h-8 w-8 text-zinc-600 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-all" onClick={(e) => deleteFromHistory(e, item.id)}>
                                                    <Trash2 size={14} />
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
        </div >
    );
}

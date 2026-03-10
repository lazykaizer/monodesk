"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Layout,
    Zap,
    BarChart3,
    Shield,
    Sparkles,
    MousePointer2,
    CheckCircle2,
    AlertTriangle,
    ArrowUpRight,
    Command,
    UserCircle2,
    Palette,
    Users2,
    Plus,
    Target,
    ChevronRight,
    ChevronLeft,
    TrendingUp,
    MessageSquareQuote,
    Activity,
    Search,
    LineChart,
    Cpu
} from "lucide-react";

const tabs = [
    { id: "persona", label: "User Personas", icon: <UserCircle2 className="w-4 h-4" /> },
    { id: "strategy", label: "Strategic Engine", icon: <Shield className="w-4 h-4" /> },
    { id: "creative", label: "Creative Studio", icon: <Palette className="w-4 h-4" /> },
];

const personas = [
    {
        id: "anya",
        name: "Anya Malhotra",
        role: "Luxury Brand Architect",
        desc: "D2C Scaling Specialist",
        feedback: "Neural synthesis has reduced our brand launch cycles by 85%. The visual consistency is terrifyingly perfect.",
        img: "/images/persona-gorgeous.png",
        badges: ["Visual Elite", "Growth"],
        color: "blue"
    },
    {
        id: "rohan",
        name: "Rohan Khanna",
        role: "SaaS Founder & CEO",
        desc: "Cloud Infrastructure Lead",
        feedback: "The automated strategic mapping caught a massive market gap we overlooked. Monodesk is our shadow-cofounder.",
        img: "/images/persona-male.png",
        badges: ["Stack Arch", "Velocity"],
        color: "emerald"
    }
];

const creativeAssets = [
    {
        label: "Strategic Report",
        type: "Business",
        img: "/images/studio-report.png",
        prompt: "Prompt: 'Minimalist corporate report cover with night city silhouette and bold typography'"
    },
    {
        label: "Market Grid Kit",
        type: "Social",
        img: "/images/studio-social.png",
        prompt: "Prompt: 'Hyper-realistic social media grid with high-fashion aesthetics and blue neon accents'"
    },
    {
        label: "Elite Hero Ad",
        type: "Marketing",
        img: "/images/studio-hero-male.png",
        prompt: "Prompt: 'Cinematic ad banner featuring male CEO and supercar with golden hour architectural lights'"
    }
];

export default function AppPreview() {
    const [activeTab, setActiveTab] = useState("persona");

    const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[6px] font-bold border transition-colors uppercase tracking-tight ${className}`}>
            {children}
        </span>
    );

    return (
        <section className="w-full pt-8 pb-12 px-6 md:px-12 bg-black flex flex-col items-center relative overflow-hidden font-sans">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[700px] bg-blue-500/[0.02] rounded-full blur-[150px] pointer-events-none" />

            {/* Header Area */}
            <div className="max-w-4xl text-center mb-16 space-y-4">
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white">The Neural Interface.</h2>
                <p className="text-zinc-600 text-lg max-w-2xl mx-auto font-medium">Command every vertical of your startup from a single, unified cognitive workspace.</p>
            </div>

            {/* Nav / Tabs */}
            <div className="flex items-center gap-3 p-1 bg-[#050505] border border-white/5 rounded-full mb-12 relative z-20 shadow-2xl">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            relative px-6 py-2 rounded-full text-[10px] font-bold transition-all duration-500 flex items-center gap-2
                            ${activeTab === tab.id ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}
                        `}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTabHighlight"
                                className="absolute inset-0 bg-white/[0.03] border border-white/10 rounded-full"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className={`relative z-10 transition-colors ${activeTab === tab.id ? 'text-blue-400' : ''}`}>
                            {tab.icon}
                        </span>
                        <span className="relative z-10 uppercase tracking-[0.2em] font-black">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Browser Frame - Ultra Compact */}
            <div className="w-full max-w-6xl aspect-[21/9] bg-[#020202] rounded-[40px] border border-white/[0.07] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.8)] relative overflow-hidden group">

                {/* Title Bar Masked */}
                <div className="h-10 border-b border-white/[0.03] flex items-center px-8 gap-10 bg-[#080808] relative z-30">
                    <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-zinc-900" />
                        <div className="w-2 h-2 rounded-full bg-zinc-900" />
                        <div className="w-2 h-2 rounded-full bg-zinc-900" />
                    </div>
                    <div className="flex-1 flex justify-center">
                        <div className="px-6 py-1 bg-white/[0.01] border border-white/[0.03] rounded-full text-[7px] font-mono text-zinc-700 tracking-[0.3em] font-black uppercase flex items-center gap-2">
                            <Activity size={7} className="text-zinc-800" /> SYSTEM://MONODESK.LABS/{activeTab}
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="absolute inset-0 pt-10">
                    <AnimatePresence mode="wait">
                        {activeTab === "persona" && (
                            <motion.div
                                key="persona"
                                initial={{ opacity: 0, scale: 0.99 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.99 }}
                                className="h-full p-8 flex flex-col gap-6"
                            >
                                <div className="flex items-center justify-between px-2">
                                    <div className="space-y-0.5">
                                        <h4 className="text-[7px] font-mono tracking-[0.5em] text-blue-500 uppercase font-black">Persona Protocol</h4>
                                        <h3 className="text-2xl font-black text-white tracking-tighter">Synchronized Founders</h3>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.03] bg-white/[0.01]">
                                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                            <span className="text-[7px] font-black font-mono text-zinc-500 uppercase tracking-widest">REALTIME_SYNC: ACTIVE</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
                                    {personas.map((persona) => (
                                        <div key={persona.id} className="bg-[#050506] border border-white/[0.03] rounded-3xl p-6 flex flex-col justify-between group/persona transition-all hover:bg-black relative overflow-hidden">

                                            {/* Feedback Highlight Line */}
                                            <div className="absolute top-0 bottom-0 left-0 w-[2px] bg-gradient-to-b from-blue-600/0 via-blue-500/40 to-blue-600/0 group-hover/persona:via-blue-400 transition-all duration-700" />

                                            <div className="flex items-start gap-6 relative z-10">
                                                <div className="w-24 bg-zinc-900 aspect-square rounded-2xl overflow-hidden border border-white/[0.05] transition-transform group-hover/persona:scale-105 duration-700 shrink-0">
                                                    <img
                                                        src={persona.img}
                                                        alt={persona.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                <div className="space-y-3 flex-1">
                                                    <div className="space-y-0.5">
                                                        <div className="text-lg font-black text-white tracking-tight">{persona.name}</div>
                                                        <div className="text-[7px] font-mono tracking-widest text-zinc-600 uppercase font-black">{persona.role}</div>
                                                    </div>
                                                    <div className="flex gap-1.5">
                                                        {persona.badges.map((b, i) => (
                                                            <Badge key={i} className={i === 0 ? "border-blue-500/20 text-blue-400 bg-blue-500/5" : "border-zinc-800 text-zinc-600"}>{b}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Feedback Block */}
                                            <div className="mt-6 p-4 rounded-xl bg-white/[0.01] border border-white/[0.02] flex items-start gap-3 relative group-hover/persona:bg-white/[0.02] transition-colors">
                                                <MessageSquareQuote size={12} className="text-blue-500/30 shrink-0 mt-0.5" />
                                                <p className="text-[10px] text-zinc-500 leading-relaxed font-medium italic group-hover/persona:text-zinc-400 transition-colors">
                                                    &quot;{persona.feedback}&quot;
                                                </p>

                                                {/* Blue highlight inside feedback */}
                                                <div className="absolute -left-[1px] top-4 bottom-4 w-[1px] bg-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "strategy" && (
                            <motion.div
                                key="strategy"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="h-full p-8 flex flex-col gap-5 overflow-hidden"
                            >
                                <div className="space-y-0.5">
                                    <h4 className="text-[7px] font-mono tracking-[0.5em] text-orange-500 uppercase font-black">Strategic Protocol</h4>
                                    <h3 className="text-2xl font-black text-white tracking-tighter">SWOT Matrix Engine</h3>
                                </div>

                                <div className="grid grid-cols-5 gap-5 flex-1 min-h-0">
                                    {/* 2x2 SWOT Grid - Spanning 3 Columns */}
                                    <div className="col-span-3 grid grid-cols-2 grid-rows-2 gap-3">
                                        {[
                                            { title: "Strengths", items: ["Unified UI Intelligence", "Zero Infrastructure Overhead"], color: "emerald", icon: <Shield size={10} /> },
                                            { title: "Weaknesses", items: ["High Domain Dependency", "Compute Intensity"], color: "rose", icon: <AlertTriangle size={10} /> },
                                            { title: "Opportunities", items: ["Market Automation Gap", "Vertical Integration"], color: "blue", icon: <Target size={10} /> },
                                            { title: "Threats", items: ["SaaS Fragmentation", "Legacy Competition"], color: "amber", icon: <Sparkles size={10} /> }
                                        ].map((box, i) => (
                                            <div key={i} className="p-4 rounded-2xl bg-[#050506] border border-white/5 hover:bg-black transition-colors flex flex-col gap-3 group relative overflow-hidden">
                                                {/* Highlight Line */}
                                                <div className="absolute top-0 bottom-0 left-0 w-[2px] bg-gradient-to-b from-transparent via-blue-500/20 to-transparent group-hover:via-blue-500/50 transition-all" />

                                                <div className={`flex items-center gap-2 text-${box.color}-400`}>
                                                    {box.icon}
                                                    <span className="text-[7px] font-mono font-black uppercase tracking-widest">{box.title}</span>
                                                </div>
                                                <div className="space-y-1.5 pt-1">
                                                    {box.items.map((item, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 text-[9px] text-zinc-600 font-mono font-bold leading-none">
                                                            <div className={`w-1 h-1 rounded-full bg-${box.color}-500/30`} />
                                                            {item}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Fake Info Panel - Spanning 2 Columns */}
                                    <div className="col-span-2 space-y-3">
                                        <div className="p-5 rounded-2xl bg-[#080808] border border-white/[0.03] flex flex-col gap-4 h-full relative group">
                                            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:15px_15px]" />

                                            <div className="space-y-1">
                                                <div className="text-[7px] font-mono font-black text-zinc-700 uppercase tracking-widest leading-none">Status Intelligence</div>
                                                <div className="text-base font-black text-white tracking-tight">Executive Summary</div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[8px] font-mono text-zinc-600 uppercase">Strategic Velocity</span>
                                                        <span className="text-[10px] font-black text-blue-400">92%</span>
                                                    </div>
                                                    <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                                                        <div className="h-full w-[92%] bg-blue-500" />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[8px] font-mono text-zinc-600 uppercase">Market Alignment</span>
                                                        <span className="text-[10px] font-black text-emerald-400">Optimal</span>
                                                    </div>
                                                    <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                                                        <div className="h-full w-[100%] bg-emerald-500" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-auto p-3 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Search size={10} className="text-zinc-600" />
                                                    <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">Neural Insights:</span>
                                                </div>
                                                <p className="text-[9px] text-zinc-500 italic leading-snug">
                                                    &quot;Vertical expansion prioritized for Q3. Subscription bloat neutralized across 12 sectors.&quot;
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "creative" && (
                            <motion.div
                                key="creative"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="h-full p-8 flex flex-col gap-6"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="space-y-0.5">
                                        <h4 className="text-[7px] font-mono tracking-[0.5em] text-cyan-400 uppercase font-black">Visual Synthesis</h4>
                                        <h3 className="text-2xl font-black text-white tracking-tighter">Production Studio</h3>
                                    </div>
                                    <Badge className="bg-cyan-500/5 border-cyan-500/10 text-cyan-400 text-[7px] px-3 py-1">GPU_ACTIVE</Badge>
                                </div>

                                <div className="grid grid-cols-3 gap-5 flex-1">
                                    {creativeAssets.map((asset, i) => (
                                        <div key={i} className="bg-[#050506] border border-white/[0.04] rounded-2xl p-2 flex flex-col group cursor-pointer transition-all hover:bg-black hover:border-white/10">
                                            <div className="flex-1 bg-zinc-900 rounded-xl mb-3 relative overflow-hidden aspect-[4/3]">
                                                <img
                                                    src={asset.img}
                                                    alt={asset.label}
                                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
                                                />
                                            </div>
                                            <div className="px-2 pb-2">
                                                <div className="text-[6px] font-mono text-zinc-600 uppercase tracking-widest mb-0.5">{asset.type} Asset</div>
                                                <div className="text-xs font-black text-zinc-300 uppercase tracking-tight group-hover:text-white transition-colors">{asset.label}</div>
                                                <div className="text-[6px] font-mono text-zinc-800 italic pt-1 leading-tight group-hover:text-zinc-600 transition-colors">{asset.prompt}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Bottom Status Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#080808] border-t border-white/[0.03] flex items-center px-10 justify-between z-30">
                    <div className="flex items-center gap-6">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => <div key={i} className="w-5 h-5 rounded-full bg-zinc-900 border-2 border-[#080808]" />)}
                        </div>
                        <span className="text-[7px] font-mono text-zinc-800 font-black uppercase tracking-widest">Active Render Streams: 08</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,1)] animate-pulse" />
                        <span className="text-[7px] font-black text-zinc-800 uppercase tracking-widest">Buffer Optimized</span>
                    </div>
                </div>

            </div>

            {/* Final Indicator */}
            <div className="mt-8 flex flex-col items-center gap-4">
                <div className="text-[8px] font-mono text-zinc-900 uppercase tracking-[0.6em] font-black italic">Core Processor Status: Optimal</div>
                <div className="w-px h-10 bg-gradient-to-b from-zinc-900 to-transparent" />
            </div>
        </section>
    );
}

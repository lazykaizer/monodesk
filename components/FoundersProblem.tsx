"use client";

import { motion } from "framer-motion";
import { BarChart3, Users2, LayoutDashboard, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { GlowCard } from "@/components/ui/effects/spotlight-card";

const dilemmaCards = [
    {
        icon: <BarChart3 className="w-8 h-8 text-blue-400" />,
        title: "Capital Efficiency",
        subtitle: "Shatter Subscription Bloat",
        text: "Stop bleeding margin to disjointed SaaS tools. Monodesk replaces $600/mo of technical overhead with a single, high-performance platform.",
        metric: "Save 30% on OpEx",
        glow: "blue" as const,
        points: ["Consolidated Billing", "Zero-Waste Seats", "Unified Data Layer"]
    },
    {
        icon: <Users2 className="w-8 h-8 text-indigo-400" />,
        title: "Virtual Scale",
        subtitle: "The Power of a Full Team",
        text: "Automate the heavy lifting of back-office operations. Scale your output to 10x without adding a single person to your payroll.",
        metric: "10x Output/Founder",
        glow: "purple" as const,
        points: ["Executive Automation", "AI-Managed Logistics", "Instant Deployments"]
    },
    {
        icon: <LayoutDashboard className="w-8 h-8 text-cyan-400" />,
        title: "Strategic Focus",
        subtitle: "Absolute Command",
        text: "Eliminate context switching. One stable, centralized command center for your entire business logic, from pitch to production.",
        metric: "99% Goal Alignment",
        glow: "green" as const,
        points: ["One Source of Truth", "Real-time Metrics", "Zero Context Fatigue"]
    },
];

export default function FoundersProblem() {
    return (
        <section className="w-full pt-16 pb-12 px-6 md:px-12 bg-black text-white flex flex-col items-center relative overflow-hidden">
            {/* Architectural Background Detail */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

            <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col items-center">
                {/* Heading Area - The CEO "Ask" */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col items-center mb-24 text-center"
                >
                    <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 backdrop-blur-md mb-8">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-white/30 text-[9px] uppercase tracking-[0.4em] font-black">Strategic Protocol</span>
                    </div>

                    <h2 className="text-4xl md:text-7xl font-bold mb-8 tracking-tighter leading-[0.9] max-w-5xl">
                        Optimize for Survival. <br />
                        <span className="text-white/20 italic font-medium">Scale Through Leverage.</span>
                    </h2>

                    <p className="text-zinc-500 text-lg md:text-2xl text-center max-w-3xl leading-tight font-light tracking-tight">
                        Monodesk is the force-multiplier for the solo-elite. Stop managing tools. Start leading <span className="text-white/60 font-medium">automated missions.</span>
                    </p>
                </motion.div>

                {/* The 3-Pillar Grid: Refined & Deep */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-7xl">
                    {dilemmaCards.map((card, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: idx * 0.1 }}
                            className="h-full group"
                        >
                            <GlowCard
                                customSize
                                glowColor={card.glow}
                                className="!bg-[#0D0D0E]/60 backdrop-blur-2xl border-white/[0.02] p-8 md:p-10 h-full flex flex-col relative transition-all duration-500 hover:scale-[1.01]"
                            >
                                {/* ROI Metric Badge */}
                                <div className="absolute top-5 right-5 px-2.5 py-1 rounded-md bg-blue-500/5 border border-blue-500/10 text-blue-400 text-[9px] font-mono tracking-wider flex items-center gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                                    {card.metric}
                                </div>

                                <div className="relative z-10 h-full flex flex-col">
                                    <div className="mb-8 w-14 h-14 rounded-xl flex items-center justify-center bg-white/[0.02] border border-white/5 transition-all duration-500 group-hover:bg-white/[0.05]">
                                        <div className="scale-75 opacity-70 group-hover:opacity-100 group-hover:scale-90 transition-all">{card.icon}</div>
                                    </div>

                                    <div className="space-y-2 mb-6">
                                        <h4 className="text-blue-400/30 font-mono text-[9px] uppercase tracking-[0.3em]">
                                            {card.title}
                                        </h4>
                                        <h3 className="text-2xl font-black text-white tracking-tight leading-none">
                                            {card.subtitle}
                                        </h3>
                                    </div>

                                    <p className="text-zinc-500 leading-relaxed font-medium text-sm mb-8 flex-grow">
                                        {card.text}
                                    </p>

                                    {/* System Points - High Detail */}
                                    <div className="space-y-3 mb-10">
                                        {card.points.map((point, i) => (
                                            <div key={i} className="flex items-center gap-2.5 text-[11px] text-zinc-600 transition-colors duration-500">
                                                <div className="w-1 h-1 rounded-full bg-blue-500/20 group-hover:bg-blue-500/50 transition-colors" />
                                                <span>{point}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-white/[0.03]">
                                        <span className="text-[8px] font-mono tracking-[0.2em] text-zinc-800 uppercase">Core Protocol</span>
                                        <div className="flex gap-1">
                                            {[1, 2, 3].map((_, i) => (
                                                <div key={i} className={`w-2.5 h-1 rounded-full ${i === idx ? 'bg-blue-500' : 'bg-zinc-900'} transition-all duration-500`} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </GlowCard>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

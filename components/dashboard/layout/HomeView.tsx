"use client";

import { motion } from 'framer-motion';
import { Clock, BookOpen, MoreHorizontal, FileText, Sparkles, Plus, Search, Trash2 } from 'lucide-react';
import { useRoadmapStore } from '@/lib/store/useRoadmapStore';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { GlowCard } from '@/components/ui/effects/spotlight-card';
import { PageContextMenu } from '@/components/dashboard/roadmap/PageContextMenu';

export const HomeView = () => {
    const { pages, setActivePageId, addPage, deletePage } = useRoadmapStore();

    return (
        <div className="w-full max-w-6xl mx-auto py-6 lg:py-12 px-4 lg:px-10 space-y-8 lg:space-y-16">
            {/* PREMIUM HEADER SECTION */}
            <section className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-[#121212] to-black border border-white/5 p-5 lg:p-12">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-500/5 to-transparent pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10 space-y-4 max-w-2xl">

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl lg:text-5xl font-black text-white tracking-tighter"
                    >
                        Command your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Vision Engine</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-zinc-500 text-base lg:text-lg leading-relaxed font-medium"
                    >
                        Architect executable pathways, synchronize core milestones, and ship products with precision. Your strategic workspace is synchronized.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center gap-4 pt-4"
                    >
                        <button
                            onClick={() => addPage()}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 shadow-xl shadow-white/5"
                        >
                            <Plus size={18} />
                            Deploy New Page
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* STRATEGIC PIPELINE */}
            <section className="space-y-5 lg:space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-zinc-100 font-black text-lg uppercase tracking-tighter">
                        <div className="p-2 rounded-lg bg-zinc-900 border border-white/5">
                            <Clock size={18} className="text-blue-500" />
                        </div>
                        <span>Strategic Pipeline</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                    {pages.map((page, index) => (
                        <motion.div
                            key={page.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 * index }}
                            className="h-full"
                        >
                            <GlowCard
                                customSize
                                className="h-full !bg-[#0D0D0D] hover:!bg-[#121212] border-white/5 cursor-pointer group transition-all duration-500"
                                glowColor="blue"
                            >
                                <div
                                    className="flex flex-col h-full gap-5 relative z-10"
                                    onClick={() => setActivePageId(page.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="text-4xl bg-zinc-900/80 w-14 h-14 rounded-2xl flex items-center justify-center border border-white/5 shadow-2xl group-hover:border-blue-500/30 transition-colors">
                                            {page.icon || '📄'}
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deletePage(page.id);
                                                }}
                                                className="text-zinc-700 hover:text-red-500 p-2 bg-white/5 hover:bg-red-500/10 rounded-xl transition-all"
                                                title="Delete page"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 flex-1">
                                        <h3 className="text-base font-black text-zinc-100 group-hover:text-blue-400 transition-colors truncate uppercase tracking-tight">
                                            {page.title || "Untitled Blueprint"}
                                        </h3>
                                        <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-black uppercase tracking-widest">
                                            <div className="flex items-center gap-1">
                                                <FileText size={10} className="text-blue-500/50" />
                                                <span>Protocol</span>
                                            </div>
                                            <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                            <span>{formatDistanceToNow(page.createdAt)} ago</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-[10px] text-zinc-700 font-mono uppercase tracking-[0.3em] font-black group-hover:text-blue-500/50 transition-colors">Infrastructure</span>
                                        <BookOpen size={10} className="text-zinc-800" />
                                    </div>
                                </div>
                            </GlowCard>
                        </motion.div>
                    ))}

                    {pages.length === 0 && (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[32px] bg-zinc-900/10">
                            <div className="w-20 h-20 bg-zinc-900/80 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-2xl">
                                <FileText className="text-zinc-700" size={32} />
                            </div>
                            <h3 className="text-zinc-200 font-black text-2xl mb-3 tracking-tighter uppercase">No Blueprints Initiated</h3>
                            <p className="text-zinc-600 text-sm max-w-sm mx-auto font-medium leading-relaxed">
                                Your mission control is empty. Synchronize your vision by initiating your first strategic blueprint.
                            </p>
                            <button
                                onClick={() => addPage()}
                                className="mt-8 px-8 py-3 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-[0.2em] hover:bg-blue-600/20 transition-all active:scale-95"
                            >
                                Initiate Deployment
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

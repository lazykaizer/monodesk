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
        <div className="w-full max-w-6xl mx-auto py-12 px-6 sm:px-10 space-y-16">
            {/* PREMIUM HEADER SECTION */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121212] to-black border border-white/5 p-8 sm:p-12">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-500/5 to-transparent pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10 space-y-4 max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wider uppercase"
                    >
                        <Sparkles size={12} />
                        Architect Mode
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl sm:text-5xl font-bold text-white tracking-tight"
                    >
                        Welcome back to your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Knowledge Hub</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-zinc-400 text-lg leading-relaxed"
                    >
                        Capture ideas, build roadmaps, and transform your vision into reality. Your workspace is ready.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center gap-4 pt-4"
                    >
                        <button
                            onClick={() => addPage()}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5"
                        >
                            <Plus size={18} />
                            New Page
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* RECENTLY VISITED */}
            <section className="space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-zinc-100 font-semibold text-lg">
                        <div className="p-2 rounded-lg bg-zinc-800/50 border border-white/5">
                            <Clock size={18} className="text-blue-400" />
                        </div>
                        <span>Recently visited</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
                                className="h-full !bg-[#121212] hover:!bg-[#181818] border-white/5 cursor-pointer group"
                                glowColor="blue"
                            >
                                <div
                                    className="flex flex-col h-full gap-5 relative z-10"
                                    onClick={() => setActivePageId(page.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="text-4xl bg-zinc-800/50 w-14 h-14 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner">
                                            {page.icon || '📄'}
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deletePage(page.id);
                                                }}
                                                className="text-zinc-600 hover:text-red-400 p-1.5 bg-white/5 hover:bg-red-500/10 rounded-xl transition-all"
                                                title="Delete page"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 flex-1">
                                        <h3 className="text-base font-bold text-zinc-100 group-hover:text-blue-400 transition-colors truncate">
                                            {page.title || "Untitled"}
                                        </h3>
                                        <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-medium">
                                            <div className="flex items-center gap-1">
                                                <FileText size={12} />
                                                <span>Page</span>
                                            </div>
                                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                            <span>{formatDistanceToNow(page.createdAt)} ago</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">Workspace</span>
                                        <BookOpen size={12} className="text-zinc-700" />
                                    </div>
                                </div>
                            </GlowCard>
                        </motion.div>
                    ))}

                    {pages.length === 0 && (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl bg-zinc-900/20">
                            <div className="w-16 h-16 bg-zinc-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                                <FileText className="text-zinc-600" size={32} />
                            </div>
                            <h3 className="text-zinc-200 font-bold text-lg mb-2">No pages yet</h3>
                            <p className="text-zinc-500 text-sm max-w-xs mx-auto">
                                Transform your screen into a powerful architect's canvas. Start by creating your first page.
                            </p>
                            <button
                                onClick={() => addPage()}
                                className="mt-6 px-6 py-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 text-sm font-bold hover:bg-blue-600/20 transition-all"
                            >
                                Get Started
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

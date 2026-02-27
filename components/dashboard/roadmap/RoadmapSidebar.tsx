"use client";

import React from 'react';
import {
    Search,
    Home,
    Plus,
    ChevronRight,
    MoreHorizontal,
    Sparkles,
    FileText,
    Settings,
    Clock,
    UserCircle,
    Trash2
} from 'lucide-react';
import { useRoadmapStore } from '@/lib/store/useRoadmapStore';
import { cn } from '@/lib/utils';
import { PageContextMenu } from '@/components/dashboard/roadmap/PageContextMenu';
import { motion, AnimatePresence } from 'framer-motion';

export default function RoadmapSidebar() {
    const {
        pages,
        activePageId,
        setActivePageId,
        addPage,
        deletePage,
        setSearchOpen
    } = useRoadmapStore();

    return (
        <aside className="w-64 fixed top-0 left-0 h-screen pt-16 bg-[#191919] border-r border-white/10 flex flex-col z-50 select-none text-zinc-400 group/sidebar">


            {/* Top Navigation */}
            <nav className="px-3 space-y-1 mb-6">
                <button
                    onClick={() => setSearchOpen(true)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-all text-left text-zinc-400 hover:text-white group/nav-item"
                >
                    <Search size={18} className="transition-transform group-hover/nav-item:scale-110" />
                    <span className="text-sm font-semibold tracking-wide">Search</span>
                </button>
                <button
                    onClick={() => setActivePageId(null)}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left group/nav-item",
                        !activePageId
                            ? "bg-white/10 text-white shadow-lg shadow-black/20"
                            : "text-zinc-400 hover:text-white hover:bg-white/10"
                    )}
                >
                    <Home size={18} className={cn(
                        "transition-transform group-hover/nav-item:scale-110",
                        !activePageId && "text-blue-400"
                    )} />
                    <span className="text-sm font-semibold tracking-wide">Home</span>
                </button>
            </nav>

            {/* Pages Section */}
            <div className="flex-1 overflow-y-auto px-3 space-y-6 custom-scrollbar">
                {/* Private Pages */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between px-2 mb-1 group/section">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">Private Pages</span>
                        <button
                            onClick={() => addPage()}
                            className="opacity-0 group-hover/section:opacity-100 transition-opacity p-1 hover:bg-white/5 rounded text-zinc-500"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    <div className="space-y-0.5">
                        <AnimatePresence initial={false}>
                            {pages.map((page) => (
                                <motion.div
                                    key={page.id}
                                    layout
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className={cn(
                                        "group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors relative",
                                        activePageId === page.id ? "bg-white/5 text-zinc-100" : "hover:bg-white/5"
                                    )}
                                    onClick={() => setActivePageId(page.id)}
                                >
                                    <ChevronRight
                                        size={14}
                                        className={cn(
                                            "text-zinc-600 transition-transform",
                                            activePageId === page.id ? "rotate-90" : ""
                                        )}
                                    />
                                    {page.isFavorite && (
                                        <Sparkles size={10} className="fill-blue-400 text-blue-400 shrink-0 -ml-1 mr-0.5" />
                                    )}
                                    <span className="text-base shrink-0">{page.icon}</span>
                                    <span className="text-sm font-medium truncate flex-1">
                                        {page.title || "Untitled"}
                                    </span>

                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deletePage(page.id);
                                            }}
                                            className="p-1 hover:bg-red-500/10 rounded text-zinc-500 hover:text-red-400 transition-colors"
                                            title="Delete page"
                                        >
                                            <Trash2 size={14} />
                                        </button>

                                        <PageContextMenu page={page} />

                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {pages.length === 0 && (
                            <p className="px-2 py-2 text-[10px] italic text-zinc-600">No pages yet.</p>
                        )}

                        <button
                            onClick={() => addPage()}
                            className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-left text-zinc-500 hover:text-zinc-400"
                        >
                            <Plus size={16} />
                            <span className="text-sm font-medium">New Page</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="p-3 bg-[#191919]">
                {/* Removed Settings section per user request */}
            </div>
        </aside>
    );
}

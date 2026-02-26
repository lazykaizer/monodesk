"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, FileText, ChevronRight } from 'lucide-react';
import { useRoadmapStore } from '@/lib/store/useRoadmapStore';
import { cn } from '@/lib/utils';

export const SearchModal = () => {
    const { isSearchOpen, setSearchOpen, pages, setActivePageId } = useRoadmapStore();
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter pages based on query
    const results = useMemo(() => {
        if (!query.trim()) return pages;
        const q = query.toLowerCase();
        return pages.filter(p =>
            p.title.toLowerCase().includes(q) ||
            (p.icon && p.icon.includes(q))
        );
    }, [pages, query]);

    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSearchOpen(false);
            if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
                e.preventDefault();
                setSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setSearchOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isSearchOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery("");
        }
    }, [isSearchOpen]);

    if (!isSearchOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSearchOpen(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    className="relative w-full max-w-2xl bg-[#202020] border border-white/10 rounded-xl shadow-2xl overflow-hidden shadow-black/50"
                >
                    {/* Search Header */}
                    <div className="p-4 border-b border-white/5 space-y-4">
                        <div className="flex items-center gap-3">
                            <Search className="text-zinc-500" size={20} />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search or ask a question..."
                                className="flex-1 bg-transparent border-none outline-none text-zinc-100 placeholder:text-zinc-600 text-lg"
                            />
                        </div>
                    </div>


                    {/* Results Area */}
                    <div className="max-h-[60vh] overflow-y-auto no-scrollbar px-2 py-4">
                        {results.length > 0 ? (
                            <div className="space-y-6">
                                {/* Group: Recently visited (as fallback for now) */}
                                <div className="space-y-1">
                                    <div className="px-3 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                        Recent Pages
                                    </div>
                                    {results.map((page) => (
                                        <button
                                            key={page.id}
                                            onClick={() => {
                                                setActivePageId(page.id);
                                                setSearchOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all group text-left"
                                        >
                                            <span className="text-xl shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                                                {page.icon || '📄'}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-zinc-200 truncate">
                                                    {page.title || "Untitled"}
                                                </div>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChevronRight size={14} className="text-zinc-600" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="py-20 text-center space-y-4">
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                                    <Search className="text-zinc-600" size={24} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-zinc-400 text-sm font-medium">No results found</p>
                                    <p className="text-zinc-600 text-xs">Try searching for something else</p>
                                </div>
                            </div>
                        )}
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
};

"use client";

import { useRoadmapStore } from '@/lib/store/useRoadmapStore';
import { motion, AnimatePresence } from 'framer-motion';
import { History, X, Clock, User, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const RoadmapHistory = ({ isOpen, onClose }: Props) => {
    const { history } = useRoadmapStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* BACKDROP - only on mobile */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[40] md:hidden"
                    />

                    {/* SIDEBAR */}
                    <motion.div
                        initial={{ x: -320 }}
                        animate={{ x: 0 }}
                        exit={{ x: -320 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 bottom-0 w-80 bg-[#09090b] border-r border-white/[0.03] z-[45] flex flex-col shadow-2xl"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-white/[0.03]">
                            <div className="flex items-center gap-3 text-zinc-400">
                                <History size={16} />
                                <span className="text-xs font-black uppercase tracking-widest">Activity Log</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/5 rounded-lg text-zinc-600 hover:text-white transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-zinc-700 space-y-2">
                                    <Clock size={24} className="opacity-20" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">No Activity Yet</span>
                                </div>
                            ) : (
                                <div className="relative border-l border-white/[0.03] ml-3 space-y-6">
                                    {history.map((item) => (
                                        <div key={item.id} className="relative pl-6">
                                            <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-700 group-hover:border-cyan-500 transition-colors" />

                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-zinc-300 leading-snug">
                                                    <span className="capitalize text-zinc-500">{item.action}:</span> {item.blockType === 'text' ? 'Text Block' : item.blockType}
                                                    {item.title && <span className="text-zinc-400"> - "{item.title}"</span>}
                                                </p>
                                                <div className="flex items-center gap-3 text-[10px] text-zinc-600 font-mono">
                                                    <span className="flex items-center gap-1">
                                                        <User size={10} /> You
                                                    </span>
                                                    <span>•</span>
                                                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

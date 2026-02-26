"use client";

import { useMemo, useState, useEffect } from 'react';
import {
    Plus, ChevronRight, ChevronLeft,
    MoreHorizontal, Search, Settings2,
    ChevronsRight, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRoadmapStore, RoadmapBlock, DatabaseRow } from '@/lib/store/useRoadmapStore';

interface Props {
    block: RoadmapBlock;
}

export const DatabaseTimeline = ({ block }: Props) => {
    const { addDatabaseRow, updateDatabaseRow } = useRoadmapStore();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Generate days for the current month view
    const daysInView = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        return Array.from({ length: daysInMonth }, (_, i) => {
            const d = new Date(year, month, i + 1);
            return {
                date: d,
                day: d.getDate(),
                dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
                isToday: new Date().toDateString() === d.toDateString()
            };
        });
    }, [currentDate]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    if (!mounted || !block.data) return null;

    return (
        <div className="flex flex-col h-[500px] mt-2 group/timeline">
            {/* TOOLBAR */}
            <div className="flex items-center justify-between px-0 py-2 pb-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm">
                        <ChevronsRight size={16} className="text-zinc-600" />
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                    <div className="flex items-center bg-[#2c2c2c] rounded-md overflow-hidden border border-[#373c3f]">
                        <button onClick={handleToday} className="px-2 py-0.5 text-xs text-zinc-300 hover:bg-[#373c3f] border-r border-[#373c3f] transition-colors">
                            Today
                        </button>
                        <button onClick={handlePrevMonth} className="px-1.5 py-0.5 text-zinc-300 hover:bg-[#373c3f] transition-colors">
                            <ChevronLeft size={14} />
                        </button>
                        <button onClick={handleNextMonth} className="px-1.5 py-0.5 text-zinc-300 hover:bg-[#373c3f] transition-colors">
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded transition-colors">
                        Month <ChevronRight size={12} className="rotate-90" />
                    </button>
                    <button className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-500 transition-colors">
                        New
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* LEFT SIDEBAR (TABLE) - MINIMIZED */}
                <div className="w-[180px] flex-shrink-0 flex flex-col z-20 border-r border-white/[0.03]">
                    {/* Header */}
                    <div className="h-10 flex items-center px-2 bg-[#0A0A0A]">
                        <span className="text-xs font-bold text-zinc-500 pl-2">Title</span>
                    </div>
                    {/* Rows */}
                    <div className="flex-1 overflow-hidden">
                        {block.data.rows.map(row => (
                            <div key={row.id} className="h-10 flex items-center px-1 group/row hover:bg-white/[0.02]">
                                <input
                                    value={row.values.title || ""}
                                    onChange={(e) => updateDatabaseRow(block.id, row.id, { values: { ...row.values, title: e.target.value } })}
                                    className="bg-transparent border-none text-[13px] font-medium text-zinc-300 focus:text-white focus:ring-0 outline-none w-full px-2 placeholder:text-zinc-700 transition-colors"
                                    placeholder="Untitled"
                                />
                                <button className="opacity-0 group-hover/row:opacity-100 text-zinc-600 hover:text-white px-2 transition-all">
                                    <span className="text-[10px]">OPEN</span>
                                </button>
                            </div>
                        ))}
                        <div
                            onClick={() => addDatabaseRow(block.id)}
                            className="h-10 flex items-center px-3 text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.02] cursor-pointer text-[13px] font-medium transition-colors"
                        >
                            <Plus size={14} className="mr-2" /> New
                        </div>
                    </div>
                </div>

                {/* RIGHT TIMELINE GRID */}
                <div className="flex-1 overflow-x-auto overflow-y-auto scrollbar-hide relative bg-[#0A0A0A]">
                    {/* Header: Days */}
                    <div className="flex h-10 sticky top-0 bg-[#0A0A0A] z-10 w-max border-b border-white/[0.03]">
                        {daysInView.map((d, i) => (
                            <div key={i} className="w-12 flex-shrink-0 flex flex-col items-center justify-center text-[10px] relative">
                                <span className={cn(
                                    "font-bold text-[10px] z-10",
                                    d.isToday ? "text-white" : "text-zinc-600"
                                )}>
                                    {d.day}
                                </span>
                                <span className="text-[8px] text-zinc-700 font-medium uppercase tracking-wider">{d.dayName}</span>
                                {d.isToday && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-red-500 rounded-full -z-0 opacity-20 blur-sm"></div>
                                )}
                                {d.isToday && (
                                    <div className="absolute top-2 w-6 h-6 border border-red-500 rounded-full z-0"></div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Timeline Rows Container */}
                    <div className="w-max relative min-h-full">
                        {/* Background Grid Lines */}
                        <div className="absolute inset-0 flex pointer-events-none">
                            {daysInView.map((d, i) => (
                                <div key={i} className={cn(
                                    "w-12 flex-shrink-0 border-r border-white/[0.02] h-full",
                                    d.isToday && "bg-red-500/[0.02]"
                                )} />
                            ))}
                            {/* Today Line */}
                            {daysInView.find(d => d.isToday) && (
                                <div
                                    className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none"
                                    style={{
                                        left: `${daysInView.findIndex(d => d.isToday) * 48 + 24}px`
                                    }}
                                />
                            )}
                        </div>

                        {/* Row Bars */}
                        <div className="pt-0">
                            {block.data.rows.map(row => (
                                <div key={row.id} className="h-10 flex items-center relative border-b border-white/[0.02] group/row">
                                    {/* Calculated Bar Position */}
                                    {(() => {
                                        // Mock Logic for demonstration if no explicit date range property exists
                                        // We will visually place them staggered to look like the reference image
                                        // In production, this would use row.values.startDate and row.values.endDate

                                        // Deterministic mock placement based on ID hash or index
                                        const hash = row.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
                                        const startOffset = (hash % 10);
                                        const duration = (hash % 5) + 2;

                                        const leftPos = startOffset * 48; // 48px per day
                                        const width = duration * 48;

                                        return (
                                            <div
                                                className="absolute h-7 rounded-sm bg-[#1e1e1e] border border-white/[0.05] hover:bg-[#2a2a2a] hover:border-zinc-500 transition-all flex items-center px-2 text-[11px] text-zinc-300 font-bold truncate cursor-pointer z-10 shadow-sm group-hover/row:brightness-110"
                                                style={{
                                                    left: `${leftPos + 24}px`, // Slight offset
                                                    width: `${width}px`
                                                }}
                                            >
                                                {row.values.title || "Untitled"}
                                            </div>
                                        );
                                    })()}
                                </div>
                            ))}
                            {/* Add New Row Grid Lines */}
                            <div className="h-10 border-b border-white/[0.02] w-full" />
                            <div className="h-10 border-b border-white/[0.02] w-full" />
                            <div className="h-10 border-b border-white/[0.02] w-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

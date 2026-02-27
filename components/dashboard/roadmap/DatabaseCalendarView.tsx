"use client";

import { useMemo, useState, useEffect, useRef } from 'react';
import {
    Plus, ChevronLeft, ChevronRight, Calendar, Trash2, FileText, X, GripVertical,
    Clock, Tag, Flag, Hash, User, Link, Mail, Phone, CheckSquare, AlignLeft, PieChart
} from 'lucide-react';
import { PropertyIcon } from './InlineDatabase';
import { CellRenderer } from './table/CellRenderer';
import { motion, AnimatePresence } from 'framer-motion';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay,
    isToday,
    parseISO,
    isValid
} from 'date-fns';
import { cn } from '@/lib/utils';
import { useRoadmapStore, RoadmapBlock as BlockData, DatabaseRow } from '@/lib/store/useRoadmapStore';

interface Props {
    block: BlockData;
}

export const DatabaseCalendarView = ({ block }: Props) => {
    const { addDatabaseRow, updateDatabaseRow, deleteDatabaseRow } = useRoadmapStore();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [mounted, setMounted] = useState(false);
    const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

    const selectedRow = useMemo(() =>
        block.data?.rows.find(r => r.id === selectedRowId),
        [block.data?.rows, selectedRowId]);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Find the primary date property
    const dateProperty = useMemo(() => {
        return block.data?.properties.find(p => p.type === 'date') ||
            block.data?.properties.find(p => p.key.toLowerCase().includes('date')) ||
            block.data?.properties.find(p => p.key.toLowerCase().includes('deadline'));
    }, [block.data?.properties]);

    // Calendar Generation
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = useMemo(() => {
        return eachDayOfInterval({
            start: startDate,
            end: endDate,
        });
    }, [startDate, endDate]);

    // Group rows by date
    const groupedRows = useMemo(() => {
        const groups: Record<string, DatabaseRow[]> = {};
        if (!dateProperty) return groups;

        block.data?.rows.forEach(row => {
            const dateValue = row.values[dateProperty.key];
            if (dateValue) {
                const date = parseISO(dateValue);
                if (isValid(date)) {
                    const key = format(date, 'yyyy-MM-dd');
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(row);
                }
            }
        });
        return groups;
    }, [block.data?.rows, dateProperty]);

    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleToday = () => setCurrentMonth(new Date());

    if (!mounted) return null;

    return (
        <div className="relative flex flex-col h-[750px] bg-[#0f0f0f] border border-white/[0.03] rounded-3xl overflow-hidden shadow-2xl mt-4">
            {/* CALENDAR HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.03]">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-black text-white tracking-tight">
                        {format(currentMonth, 'MMMM yyyy')}
                    </h2>
                    <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-lg border border-white/[0.05]">
                        <button
                            onClick={handlePrevMonth}
                            className="p-1.5 hover:bg-white/[0.05] rounded-md text-zinc-400 hover:text-white transition-all outline-none"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={handleToday}
                            className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                        >
                            Today
                        </button>
                        <button
                            onClick={handleNextMonth}
                            className="p-1.5 hover:bg-white/[0.05] rounded-md text-zinc-400 hover:text-white transition-all outline-none"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* WEEKDAY LABELS */}
            <div className="grid grid-cols-7 border-b border-white/[0.03] bg-white/[0.01]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 border-r border-white/[0.03] last:border-r-0 text-center">
                        {day}
                    </div>
                ))}
            </div>

            {/* CALENDAR GRID */}
            <div className="grid grid-cols-7 grid-rows-5 flex-1 overflow-y-auto min-h-0 bg-[#0f0f0f]">
                {calendarDays.map((day, idx) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const isTodayDate = isToday(day);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const dayRows = groupedRows[dateKey] || [];

                    return (
                        <div
                            key={idx}
                            className={cn(
                                "min-h-[140px] p-2 border-r border-b border-white/[0.03] last:border-r-0 group/day hover:bg-white/[0.01] transition-all relative overflow-hidden",
                                !isCurrentMonth && "bg-black/20"
                            )}
                        >
                            {/* DAY NUMBER */}
                            <div className="flex justify-start mb-2">
                                <span className={cn(
                                    "w-6 h-6 flex items-center justify-center text-[11px] font-mono font-bold rounded-full transition-all",
                                    isTodayDate
                                        ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                                        : isCurrentMonth ? "text-zinc-400 group-hover/day:text-white" : "text-zinc-800"
                                )}>
                                    {format(day, 'd')}
                                </span>
                            </div>

                            {/* TASKS */}
                            <div className="space-y-1 overflow-y-auto max-h-[100px] scrollbar-hide">
                                <AnimatePresence initial={false}>
                                    {dayRows.map(row => (
                                        <CalendarCard
                                            key={row.id}
                                            row={row}
                                            blockId={block.id}
                                            onClick={() => setSelectedRowId(row.id)}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>

                        </div>
                    );
                })}
            </div>

            {/* TASK DETAIL SIDE PANEL */}
            <AnimatePresence>
                {selectedRow && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedRowId(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-screen w-[450px] bg-[#0f0f0f] border-l border-white/10 z-[1001] shadow-2xl flex flex-col pt-12"
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.03]">
                                <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-cyan-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Edit Task</span>
                                </div>
                                <button
                                    onClick={() => setSelectedRowId(null)}
                                    className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                {/* TITLE */}
                                <div className="space-y-1">
                                    <textarea
                                        value={selectedRow.values.title || ''}
                                        onChange={(e) => updateDatabaseRow(block.id, selectedRow.id, { values: { ...selectedRow.values, title: e.target.value } })}
                                        placeholder="Add a title..."
                                        className="w-full bg-transparent border-none p-0 text-3xl font-black text-white placeholder:text-zinc-800 focus:ring-0 outline-none resize-none leading-tight"
                                        rows={2}
                                    />
                                </div>

                                {/* PROPERTIES LIST */}
                                <div className="space-y-4">
                                    {block.data?.properties.map(prop => (
                                        <div key={prop.id} className="flex grid grid-cols-[140px_1fr] items-start group">
                                            <div className="flex items-center gap-2 px-2 py-2 text-zinc-500 group-hover:bg-white/[0.02] rounded-l transition-colors h-full">
                                                <PropertyIcon type={prop.type} />
                                                <span className="text-[11px] font-black uppercase tracking-widest truncate">{prop.label}</span>
                                            </div>
                                            <div className="border-b border-white/[0.03] group-hover:border-white/10 transition-colors h-full flex items-center min-h-[40px]">
                                                <CellRenderer
                                                    blockId={block.id}
                                                    row={selectedRow}
                                                    property={prop}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* FOOTER ACTIONS */}
                                <div className="pt-8 flex flex-col gap-3">
                                    <button
                                        onClick={() => {
                                            if (confirm("Are you sure you want to delete this task?")) {
                                                deleteDatabaseRow(block.id, selectedRow.id);
                                                setSelectedRowId(null);
                                            }
                                        }}
                                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[11px] font-black uppercase tracking-widest transition-all"
                                    >
                                        <Trash2 size={16} /> Delete Task
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

const CalendarCard = ({ row, blockId, isSidebar, onClick }: { row: DatabaseRow, blockId: string, isSidebar?: boolean, onClick?: () => void }) => {
    // Helper to get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Done': return "bg-[#52ba78]";
            case 'In Progress': return "bg-[#337ea9]";
            default: return "bg-zinc-700";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High': return "text-rose-400";
            case 'Medium': return "text-amber-400";
            default: return "text-zinc-600";
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
            className={cn(
                "group/card relative bg-[#1c1c1c] hover:bg-[#222] border border-white/[0.05] hover:border-white/[0.1] rounded-lg transition-all cursor-pointer shadow-lg active:scale-[0.98] overflow-hidden",
                isSidebar && "hover:ring-1 hover:ring-cyan-500/30"
            )}
        >
            {/* Status Indicator Strip */}
            <div className={cn("absolute left-0 top-0 bottom-0 w-[2px]", getStatusColor(row.values.status))} />

            <div className="p-2 pl-3 flex flex-col gap-1.5">
                <div className="flex items-start gap-1.5">
                    <FileText size={10} className="mt-0.5 text-zinc-600 shrink-0" />
                    <span className="text-[11px] font-bold text-zinc-100 leading-[1.4] line-clamp-3">
                        {row.values.title || 'Untitled Task'}
                    </span>
                </div>

                <div className="flex items-center justify-between gap-1 mt-0.5">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                        <div className={cn("w-1 h-1 rounded-full shrink-0", getStatusColor(row.values.status))} />
                        <span className="text-[8.5px] font-black uppercase tracking-[0.1em] text-zinc-500 truncate">
                            {row.values.status}
                        </span>
                    </div>
                    {row.values.priority && row.values.priority !== 'None' && (
                        <span className={cn("text-[8.5px] font-black uppercase tracking-[0.1em]", getPriorityColor(row.values.priority))}>
                            {row.values.priority[0]}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

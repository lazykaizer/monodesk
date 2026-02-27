"use client";

import { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useRoadmapStore, RoadmapBlock } from '@/lib/store/useRoadmapStore';
import { PieChart as PieChartIcon, MoreHorizontal, Table as TableIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Props {
    block: RoadmapBlock;
}

// COLORS matching the Kanban/Table views (Text colors)
const COLORS: Record<string, string> = {
    'Todo': '#e4e4e7',        // Zinc 200 (Not started - matching image)
    'In Progress': '#3b82f6', // Blue 500 (In progress)
    'Done': '#22c55e',        // Green 500 (Done)
    'Unknown': '#2c2c2c'
};

const LABEL_COLORS: Record<string, string> = {
    'Todo': '#a1a1aa',
    'In Progress': '#60a5fa',
    'Done': '#34d399'
};

export const DatabaseChart = ({ block }: Props) => {
    // ------------------------------------------------------------------
    // 1. DATA SOURCE SELECTION
    // ------------------------------------------------------------------
    const allBlocks = useRoadmapStore((state) => state.blocks);
    const updateBlock = useRoadmapStore((state) => state.updateBlock);

    // Find all potential database sources on the current page
    const availableDatabases = useMemo(() => {
        return allBlocks.filter(b =>
            b.type === 'database' &&
            b.pageId === block.pageId &&
            b.id !== block.id // Don't link to self if chart is inside a database block (unlikely but safe)
        );
    }, [allBlocks, block.pageId, block.id]);

    // Determine the active source block
    const sourceBlock = useMemo(() => {
        // 1. Check explicit link
        if (block.sourceBlockId) {
            const linked = allBlocks.find(b => b.id === block.sourceBlockId);
            if (linked) return linked;
        }

        // 2. Check if this block has its own data (self-sufficient)
        if (block.data?.rows && block.data.rows.length > 0) return block;

        // 3. Auto-fallback: Find the first database on the page (to preserve existing behavior if choice isn't made)
        return availableDatabases.find(db => db.data?.rows && db.data.rows.length > 0) || block;
    }, [allBlocks, block, availableDatabases]);

    const [isSelectingSource, setIsSelectingSource] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // ------------------------------------------------------------------
    // 2. DATA AGGREGATION
    // ------------------------------------------------------------------
    const data = useMemo(() => {
        if (!sourceBlock?.data?.rows) return [];

        const counts = { 'Todo': 0, 'In Progress': 0, 'Done': 0 };
        const validRows = sourceBlock.data.rows.filter(row => row.values.title?.trim().length > 0);

        validRows.forEach(row => {
            const s = (row.values.status || 'Todo').toLowerCase();
            if (s === 'not started' || s === 'todo') counts['Todo']++;
            else if (s === 'in progress') counts['In Progress']++;
            else if (s === 'done' || s === 'completed') counts['Done']++;
            else counts['Todo']++;
        });

        return [
            { name: 'Todo', value: counts['Todo'], color: '#e5e7eb', label: 'To Do' },
            { name: 'In Progress', value: counts['In Progress'], color: '#3b82f6', label: 'In Progress' },
            { name: 'Done', value: counts['Done'], color: '#10b981', label: 'Done' }
        ];
    }, [sourceBlock]);

    const totalCount = useMemo(() =>
        sourceBlock?.data?.rows?.filter(r => r.values.title?.trim().length > 0).length || 0
        , [sourceBlock]);

    if (!mounted) return null;

    const renderSourcePicker = () => (
        <div className="absolute top-4 left-4 z-50">
            <button
                onClick={() => setIsSelectingSource(!isSelectingSource)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all shadow-xl"
            >
                <TableIcon size={12} className="text-cyan-500" />
                {sourceBlock.id === block.id ? "Select Source" : (sourceBlock.content || "Untitled Database")}
            </button>

            <AnimatePresence>
                {isSelectingSource && (
                    <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        className="absolute top-full left-0 mt-2 w-64 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-2 z-[100]"
                    >
                        <div className="px-2 py-1.5 text-[9px] font-black text-zinc-600 uppercase tracking-widest border-b border-white/[0.03] mb-1">
                            Link to Database
                        </div>
                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                            {availableDatabases.length === 0 ? (
                                <div className="p-4 text-center text-[10px] text-zinc-700 italic">No databases found on this page</div>
                            ) : (
                                availableDatabases.map(db => (
                                    <button
                                        key={db.id}
                                        onClick={() => {
                                            updateBlock(block.id, { sourceBlockId: db.id });
                                            setIsSelectingSource(false);
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all group",
                                            block.sourceBlockId === db.id ? "bg-cyan-500/10 text-cyan-400" : "text-zinc-500 hover:bg-white/5 hover:text-white"
                                        )}
                                    >
                                        <div className="w-6 h-6 rounded bg-black/40 flex items-center justify-center shrink-0">
                                            <TableIcon size={12} />
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-xs font-bold truncate">{db.content || "Untitled Database"}</span>
                                            <span className="text-[8px] font-black uppercase tracking-tighter opacity-30">ID: {db.id.split('-').pop()}</span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    if (totalCount === 0) {
        return (
            <div className="h-[400px] flex flex-col items-center justify-center text-[#5a5a5a] border border-[#373c3f] rounded-lg bg-[#191919] mt-2 relative group/chart">
                {renderSourcePicker()}
                <PieChartIcon size={32} className="opacity-20 mb-3" />
                <span className="text-xs font-medium uppercase tracking-widest opacity-40">No Data Observed</span>
                <p className="text-[9px] uppercase tracking-tighter opacity-20 mt-2">Connect a database using the selector above</p>
            </div>
        );
    }

    return (
        <div className="border border-[#373c3f] rounded-lg bg-[#191919] mt-2 shadow-sm p-6 pt-16 min-h-[400px] flex flex-col items-center justify-center relative group/chart">
            {renderSourcePicker()}

            {/* CHART LAYER */}
            <div className="relative w-[220px] h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={4}
                            startAngle={90}
                            endAngle={-270}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1c1c1c', borderColor: '#373c3f', borderRadius: '8px', fontSize: '12px' }}
                            itemStyle={{ color: '#e3e2e0' }}
                            formatter={(value: any, name: any) => [value, name]}
                        />
                    </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-4xl font-black text-white">{totalCount}</span>
                    <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Total Tasks</span>
                </div>
            </div>

            {/* LEGEND TABLE */}
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-8">
                {data.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-xs font-medium text-zinc-400">
                            {entry.label} <span className="text-zinc-600 ml-1">({entry.value})</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

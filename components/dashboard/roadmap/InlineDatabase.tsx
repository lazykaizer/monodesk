"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Plus, ChevronRight, ChevronDown, Trash2,
    Calendar, Clock, AlertCircle, Sparkles,
    CheckCircle2, Circle, MoreHorizontal, HelpCircle,
    Layout, Kanban, List, Table as TableIcon, PieChart,
    Settings2, Search, Filter, ArrowUpDown,
    PlusSquare, Type, Hash, Star, LayoutGrid,
    Target, Flag, CalendarDays, GripVertical, Check, X,
    RotateCcw, Link, Mail, Phone, User, File as FileIcon,
    CheckSquare, AlignLeft, MousePointerClick
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRoadmapStore, RoadmapBlock, DatabaseRow, Priority, PropertyType, ViewType } from '@/lib/store/useRoadmapStore';
import { Badge } from '@/components/ui/core/badge';
import { Button } from '@/components/ui/core/button';
import { refineBlock } from '@/app/actions/gemini';
import { toast } from 'sonner';
import { DatabaseBoard } from './DatabaseBoard';
import { DatabaseTimeline } from './DatabaseTimeline';
import { DatabaseChart } from './DatabaseChart';
import { DatabaseCalendarView } from './DatabaseCalendarView';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ColumnHeader } from './table/ColumnHeader';
import { CellRenderer } from './table/CellRenderer';

// ... (existing helper functions)

export const PropertyIcon = ({ type }: { type: PropertyType }) => {
    switch (type) {
        case 'text': return <AlignLeft size={14} />;
        case 'number': return <Hash size={14} />;
        case 'select': return <ChevronDown size={14} />;
        case 'multi-select': return <List size={14} />;
        case 'status': return <PieChart size={14} />;
        case 'date': return <Calendar size={14} />;
        case 'person': return <User size={14} />;
        case 'file': return <FileIcon size={14} />;
        case 'checkbox': return <CheckSquare size={14} />;
        case 'url': return <Link size={14} />;
        case 'email': return <Mail size={14} />;
        case 'phone': return <Phone size={14} />;
        case 'priority': return <Flag size={14} />;
        default: return <Type size={14} />;
    }
};

const DatabasePropertyMenu = ({ onClose, onSelect, triggerRect }: { onClose: () => void, onSelect: (name: string, type: PropertyType) => void, triggerRect: any }) => {
    const [name, setName] = useState("");
    const [mounted, setMounted] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
        inputRef.current?.focus();
    }, []);

    if (!mounted || !triggerRect) return null;

    const types: { type: PropertyType, label: string }[] = [
        { type: 'text', label: 'Text' },
        { type: 'number', label: 'Number' },
        { type: 'select', label: 'Select' },
        { type: 'multi-select', label: 'Multi-select' },
        { type: 'status', label: 'Status' },
        { type: 'priority', label: 'Priority' },
        { type: 'date', label: 'Date' },
        { type: 'person', label: 'Person' },
        { type: 'file', label: 'Files & media' },
        { type: 'checkbox', label: 'Checkbox' },
        { type: 'url', label: 'URL' },
        { type: 'email', label: 'Email' },
        { type: 'phone', label: 'Phone' },
    ];

    return createPortal(
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[9999] w-64 bg-[#1c1c1c] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col"
            style={{
                top: triggerRect.top + triggerRect.height + 8,
                left: triggerRect.left - 256 + triggerRect.width, // Align to right of trigger
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="p-3 border-b border-zinc-800">
                <input
                    ref={inputRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Type property name..."
                    className="w-full bg-transparent border-none text-sm text-white placeholder:text-zinc-500 focus:ring-0 outline-none p-1 font-bold"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && name) {
                            onSelect(name, 'text'); // Default to text on Enter
                            onClose();
                        }
                    }}
                />
            </div>
            <div className="flex-1 overflow-y-auto max-h-[300px] p-1 scrollbar-hide">
                <div className="px-2 py-1.5 text-[10px] font-black text-zinc-400 uppercase tracking-wider">Select Type</div>
                {types.map((t) => (
                    <button
                        key={t.type}
                        onClick={() => {
                            onSelect(name || t.label, t.type);
                            onClose();
                        }}
                        className="w-full flex items-center gap-3 px-2 py-1.5 rounded hover:bg-zinc-800 text-white transition-colors text-left group"
                    >
                        <div className="p-1 rounded bg-zinc-800/50 text-white group-hover:bg-zinc-700 transition-colors">
                            <PropertyIcon type={t.type} />
                        </div>
                        <span className="text-sm font-medium">{t.label}</span>
                    </button>
                ))}
            </div>
        </motion.div>,
        document.body
    );
};

interface Props {
    block: RoadmapBlock;
}

export const InlineDatabase = ({ block }: Props) => {
    const {
        addDatabaseRow, updateDatabaseRow, deleteDatabaseRow,
        addDatabaseView, deleteDatabaseView, setActiveView, addHistory, setFocusedId,
        updateBlock
    } = useRoadmapStore();

    const [mounted, setMounted] = useState(false);
    const [isAddingView, setIsAddingView] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const activeView = useMemo(() =>
        block.data?.views.find(v => v.active) || block.data?.views[0],
        [block.data?.views]);

    const [hasScrolled, setHasScrolled] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setHasScrolled(e.currentTarget.scrollLeft > 0);
    };

    if (!block.data) return null;

    return (
        <div
            onClick={() => {
                setFocusedId(block.id);
            }}
            className="my-4 space-y-4 group/db"
        >
            {/* DATABASE TITLE */}
            <div className="px-1">
                <input
                    value={block.content || ''}
                    onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                    placeholder="Untitled Database"
                    className="w-full bg-transparent border-none p-0 text-xl font-black text-white placeholder:text-zinc-800 focus:ring-0 outline-none transition-all"
                />
            </div>

            {/* VIEW BAR */}
            <div className="flex items-center justify-between border-b border-white/[0.03] pb-0.5">
                <div className="flex items-center gap-1">
                    {block.data.views.map((view) => (
                        <div key={view.id} className="group/view relative flex items-center">
                            <button
                                onClick={() => setActiveView(block.id, view.id)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-t-sm text-[10px] font-black uppercase tracking-widest transition-all",
                                    view.active
                                        ? "text-white border-b border-white"
                                        : "text-zinc-700 hover:text-zinc-500 hover:bg-white/[0.01]",
                                    block.data!.views.length > 1 && "pr-7"
                                )}
                            >
                                {view.type === 'Table' && <TableIcon size={12} />}
                                {view.type === 'Board' && <Kanban size={12} />}
                                {view.type === 'Calendar' && <Calendar size={12} />}
                                {view.type === 'Chart' && <PieChart size={12} />}
                                {view.name}
                            </button>
                            {block.data!.views.length > 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteDatabaseView(block.id, view.id);
                                    }}
                                    className="absolute right-1.5 p-1 opacity-0 group-hover/view:opacity-100 hover:bg-rose-500/10 hover:text-rose-500 rounded text-zinc-700 transition-all"
                                    title="Delete view"
                                >
                                    <X size={10} />
                                </button>
                            )}
                        </div>
                    ))}
                    {/* ADD VIEW BUTTON */}
                    {(() => {
                        const existingTypes = block.data!.views.map(v => v.type);
                        const availableViews = [
                            { type: 'Table', icon: TableIcon },
                            { type: 'Board', icon: Kanban },
                            { type: 'Calendar', icon: Calendar },
                            { type: 'Chart', icon: PieChart },
                            { type: 'List', icon: Layout }
                        ].filter(v => !existingTypes.includes(v.type as ViewType));

                        if (availableViews.length === 0) return null;

                        return (
                            <div className="relative flex items-center">
                                <button
                                    onClick={() => setIsAddingView(!isAddingView)}
                                    className={cn(
                                        "p-1.5 rounded-lg transition-all",
                                        isAddingView ? "bg-white/10 text-cyan-400" : "text-zinc-800 hover:text-cyan-500"
                                    )}
                                    title="Add View"
                                >
                                    <Plus size={14} />
                                </button>

                                <AnimatePresence>
                                    {isAddingView && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            exit={{ opacity: 0, x: -10, scale: 0.95 }}
                                            className="absolute left-full ml-2 flex items-center gap-1 bg-[#1a1a1a] border border-white/5 p-1 rounded-xl shadow-2xl z-50 whitespace-nowrap"
                                        >
                                            {availableViews.map((v) => (
                                                <button
                                                    key={v.type}
                                                    onClick={() => {
                                                        addDatabaseView(block.id, v.type, v.type as ViewType);
                                                        setIsAddingView(false);
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 rounded-lg transition-all text-[10px] font-bold text-zinc-400 hover:text-white"
                                                >
                                                    <v.icon size={12} />
                                                    {v.type}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => setIsAddingView(false)}
                                                className="p-1 px-2 border-l border-white/5 text-zinc-700 hover:text-white transition-colors"
                                            >
                                                <X size={12} />
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })()}
                </div>

            </div>

            {/* VIEW CONTENT */}
            <div className="relative">
                {!mounted ? (
                    <div className="h-40 flex items-center justify-center">
                        <RotateCcw className="animate-spin text-zinc-800" size={24} />
                    </div>
                ) : (
                    <>
                        {activeView?.type === 'Table' && <DatabaseTableView block={block} hasScrolled={hasScrolled} handleScroll={handleScroll} scrollContainerRef={scrollContainerRef} />}
                        {activeView?.type === 'Board' && <DatabaseBoard block={block} />}
                        {activeView?.type === 'List' && <DatabaseListView block={block} />}
                        {activeView?.type === 'Calendar' && <DatabaseCalendarView block={block} />}
                        {activeView?.type === 'Chart' && <DatabaseChart block={block} />}
                    </>
                )}
            </div>
        </div>
    );
};

const DatabaseListView = ({ block }: { block: RoadmapBlock }) => {
    const { addDatabaseRow } = useRoadmapStore();
    return (
        <div className="space-y-2 py-4">
            {block.data!.rows.map(row => (
                <div key={row.id} className="flex items-center gap-4 p-4 bg-white/[0.01] border border-white/[0.03] rounded-2xl hover:bg-white/[0.02] transition-colors group">
                    <div className="w-2 h-2 rounded-full bg-cyan-500/40 group-hover:bg-cyan-500 transition-colors" />
                    <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">{row.values.title || "Untitled"}</span>
                    {row.values.status && (
                        <span className="ml-auto text-[10px] uppercase font-black tracking-widest text-zinc-600">{row.values.status}</span>
                    )}
                </div>
            ))}
            <button
                onClick={() => addDatabaseRow(block.id)}
                className="w-full p-4 border border-dashed border-white/5 rounded-2xl flex items-center gap-3 text-zinc-800 hover:text-zinc-600 hover:border-white/10 transition-all group mt-4"
            >
                <Plus size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-800 group-hover:text-zinc-600">Add Item</span>
            </button>
        </div>
    );
};


const DatabaseTableView = ({ block, hasScrolled, handleScroll, scrollContainerRef }: { block: RoadmapBlock, hasScrolled: boolean, handleScroll: (e: React.UIEvent<HTMLDivElement>) => void, scrollContainerRef: React.RefObject<HTMLDivElement | null> }) => {
    const { addDatabaseRow, addDatabaseProperty, deleteDatabaseProperty, reorderDatabaseRows, reorderDatabaseProperties } = useRoadmapStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const [sortMenuOpen, setSortMenuOpen] = useState(false);
    const [filters, setFilters] = useState<{ key: string, value: any }[]>([]);
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);
    const [triggerRect, setTriggerRect] = useState<any>(null);
    const addButtonRef = useRef<HTMLTableHeaderCellElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const sortButtonRef = useRef<HTMLButtonElement>(null);
    const filterButtonRef = useRef<HTMLButtonElement>(null);

    const processedRows = useMemo(() => {
        let result = [...block.data!.rows];

        // Search logic
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(row =>
                Object.values(row.values).some(val =>
                    String(val).toLowerCase().includes(query)
                )
            );
        }

        // Filter logic
        if (filters.length > 0) {
            result = result.filter(row =>
                filters.every(f => {
                    const prop = block.data!.properties.find(p => p.key === f.key);
                    let val = row.values[f.key];
                    if (!val) {
                        if (prop?.type === 'status') val = 'To Do';
                        else if (prop?.type === 'priority') val = 'None';
                        else val = '';
                    }
                    return val === f.value;
                })
            );
        }

        // Sort logic
        if (sortConfig) {
            result.sort((a, b) => {
                const prop = block.data!.properties.find(p => p.key === sortConfig.key);
                let aVal = a.values[sortConfig.key];
                let bVal = b.values[sortConfig.key];

                if (!aVal) {
                    if (prop?.type === 'status') aVal = 'To Do';
                    else if (prop?.type === 'priority') aVal = 'None';
                    else aVal = '';
                }
                if (!bVal) {
                    if (prop?.type === 'status') bVal = 'To Do';
                    else if (prop?.type === 'priority') bVal = 'None';
                    else bVal = '';
                }

                aVal = String(aVal).toLowerCase();
                bVal = String(bVal).toLowerCase();

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [block.data!.rows, searchQuery, sortConfig, filters]);

    const internalHandleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        handleScroll(e);
        if (isMenuOpen && addButtonRef.current) {
            const rect = addButtonRef.current.getBoundingClientRect();
            setTriggerRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
        }
    };

    const handleAddClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (addButtonRef.current) {
            const rect = addButtonRef.current.getBoundingClientRect();
            setTriggerRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
        }
        setIsMenuOpen(!isMenuOpen);
    };

    const onDragEnd = (result: any) => {
        if (!result.destination) return;

        if (result.type === 'COLUMN') {
            reorderDatabaseProperties(block.id, result.source.index, result.destination.index);
        } else {
            // Find the actual indices of the rows in the original array
            const sourceRowId = processedRows[result.source.index].id;
            const destinationRowId = processedRows[result.destination.index].id;

            const originalSourceIndex = block.data!.rows.findIndex(r => r.id === sourceRowId);
            const originalDestinationIndex = block.data!.rows.findIndex(r => r.id === destinationRowId);

            if (originalSourceIndex !== -1 && originalDestinationIndex !== -1) {
                reorderDatabaseRows(block.id, originalSourceIndex, originalDestinationIndex);
            }
        }
    };

    const totalWidth = 64 + block.data!.properties.reduce((acc, p) => acc + (p.key === 'title' ? (p.width || 300) : (p.width || 150)), 0) + 40;

    return (
        <div className="w-full px-2 py-4">
            {/* Portals for Menus */}
            {filterMenuOpen && triggerRect && createPortal(
                <div className="fixed inset-0 z-[10000]">
                    <div className="absolute inset-0 bg-black/5" onClick={() => setFilterMenuOpen(false)} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="absolute z-[10001] w-64 bg-[#1c1c1c] border border-zinc-800 rounded-xl shadow-2xl p-1"
                        style={{
                            top: triggerRect.top + triggerRect.height + 8,
                            left: Math.max(10, triggerRect.left - 200 + triggerRect.width),
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-3 py-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800 mb-1 flex justify-between items-center">
                            <span>Filters</span>
                            {filters.length > 0 && (
                                <button onClick={() => setFilters([])} className="text-zinc-700 hover:text-zinc-400">Clear all</button>
                            )}
                        </div>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                            {filters.length === 0 ? (
                                <div className="p-4 text-center text-[11px] text-zinc-600">No filters applied</div>
                            ) : (
                                <div className="space-y-1 mb-2">
                                    {filters.map((f, i) => {
                                        const prop = block.data!.properties.find(p => p.key === f.key);
                                        return (
                                            <div key={i} className="flex items-center justify-between gap-2 px-2 py-1.5 bg-white/5 rounded-md">
                                                <div className="flex items-center gap-2 text-[11px] text-zinc-300">
                                                    <span className="font-bold">{prop?.label}:</span>
                                                    <span>{String(f.value)}</span>
                                                </div>
                                                <button onClick={() => setFilters(filters.filter((_, idx) => idx !== i))}>
                                                    <X size={10} className="text-zinc-700 hover:text-zinc-400" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="border-t border-zinc-800 mt-1 pt-1">
                                <div className="px-2 py-1.5 text-[10px] text-zinc-600 font-bold uppercase">Add filter</div>
                                {block.data!.properties.filter(p => p.type === 'status' || p.type === 'priority').map(prop => (
                                    <div key={prop.id} className="group relative">
                                        <div className="px-2 py-1 text-[11px] text-zinc-400 font-bold">{prop.label}</div>
                                        <div className="flex flex-wrap gap-1 p-1">
                                            {(prop.type === 'status' ? ['To Do', 'In Progress', 'Done'] : ['High', 'Medium', 'Low']).map(val => (
                                                <button
                                                    key={val}
                                                    onClick={() => {
                                                        if (!filters.find(f => f.key === prop.key && f.value === val)) {
                                                            setFilters([...filters, { key: prop.key, value: val }]);
                                                        }
                                                        setFilterMenuOpen(false);
                                                    }}
                                                    className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 hover:bg-zinc-700 transition-colors"
                                                >
                                                    {val}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}

            {sortMenuOpen && triggerRect && createPortal(
                <div className="fixed inset-0 z-[10000]">
                    <div className="absolute inset-0 bg-black/5" onClick={() => setSortMenuOpen(false)} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="absolute z-[10001] w-56 bg-[#1c1c1c] border border-zinc-800 rounded-xl shadow-2xl p-1"
                        style={{
                            top: triggerRect.top + triggerRect.height + 8,
                            left: Math.max(10, triggerRect.left - 200 + triggerRect.width),
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-3 py-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800 mb-1">
                            Sort by
                        </div>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            <button
                                onClick={() => { setSortConfig(null); setSortMenuOpen(false); }}
                                className="w-full text-left px-3 py-2 rounded-md text-[11px] text-zinc-400 hover:bg-white/5 transition-colors"
                            >
                                None
                            </button>
                            {block.data!.properties.map(prop => (
                                <div key={prop.id} className="group/item">
                                    <button
                                        onClick={() => {
                                            const dir = (sortConfig?.key === prop.key && sortConfig.direction === 'asc') ? 'desc' : 'asc';
                                            setSortConfig({ key: prop.key, direction: dir });
                                            setSortMenuOpen(false);
                                        }}
                                        className={cn(
                                            "w-full text-left px-3 py-2 rounded-md text-[11px] transition-colors flex items-center justify-between",
                                            sortConfig?.key === prop.key ? "text-cyan-400 bg-cyan-500/5" : "text-zinc-300 hover:bg-white/5"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <PropertyIcon type={prop.type} />
                                            {prop.label}
                                        </div>
                                        {sortConfig?.key === prop.key && (
                                            <span className="text-[9px] font-bold uppercase opacity-60">
                                                {sortConfig.direction}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}

            <div
                ref={scrollContainerRef}
                onScroll={internalHandleScroll}
                className="overflow-x-auto border border-white/10 rounded-lg bg-[#0F0F0F] shadow-2xl custom-scrollbar"
            >
                <div className="sticky left-0 right-0 z-[40] bg-[#0F0F0F] border-b border-white/5">
                    {/* Unified Toolbar */}
                    <div className="flex items-center justify-end gap-3 p-2 px-4 h-10">
                        <AnimatePresence>
                            {showSearch && (
                                <motion.div
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 220, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    className="relative flex items-center"
                                >
                                    <Search size={12} className="absolute left-2 text-zinc-500" />
                                    <input
                                        ref={searchInputRef}
                                        autoFocus
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search..."
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-md py-1 pl-7 pr-7 text-[11px] text-white placeholder:text-zinc-600 focus:ring-0 outline-none"
                                    />
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery("")} className="absolute right-2 text-zinc-500 hover:text-white">
                                            <X size={10} />
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            onClick={() => {
                                setShowSearch(!showSearch);
                                if (!showSearch) setTimeout(() => searchInputRef.current?.focus(), 100);
                            }}
                            className={cn(
                                "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors",
                                showSearch || searchQuery ? "text-cyan-400" : "text-zinc-500 hover:text-white"
                            )}
                        >
                            <Search size={12} /> Search
                        </button>

                        <div className="relative">
                            <button
                                ref={filterButtonRef}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toast.info("Opening Filters...");
                                    if (filterButtonRef.current) {
                                        const rect = filterButtonRef.current.getBoundingClientRect();
                                        setTriggerRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
                                    }
                                    setFilterMenuOpen(!filterMenuOpen);
                                    setSortMenuOpen(false);
                                }}
                                className={cn(
                                    "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors",
                                    filters.length > 0 ? "text-cyan-400" : "text-zinc-500 hover:text-white"
                                )}
                            >
                                <Filter size={12} /> Filter
                            </button>
                        </div>

                        <div className="relative">
                            <button
                                ref={sortButtonRef}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toast.info("Opening Sort...");
                                    if (sortButtonRef.current) {
                                        const rect = sortButtonRef.current.getBoundingClientRect();
                                        setTriggerRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
                                    }
                                    setSortMenuOpen(!sortMenuOpen);
                                    setFilterMenuOpen(false);
                                }}
                                className={cn(
                                    "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors",
                                    sortConfig ? "text-cyan-400" : "text-zinc-500 hover:text-white"
                                )}
                            >
                                <ArrowUpDown size={12} /> Sort
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-0">
                    <DragDropContext onDragEnd={onDragEnd}>
                        <table
                            className="text-left border-collapse table-fixed w-full min-w-full bg-[#0F0F0F]"
                            style={{ width: totalWidth }}
                        >
                            <thead className="sticky top-0 z-[40]">
                                <Droppable droppableId={`column-headers-${block.id}`} direction="horizontal" type="COLUMN">
                                    {(provided) => (
                                        <tr
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="bg-[#0F0F0F] border-b border-white/10 text-[11px] text-zinc-500 font-black uppercase tracking-widest h-10"
                                        >
                                            <th className={cn(
                                                "w-16 sticky left-0 z-50 bg-[#0F0F0F] border-b border-white/10 border-r border-white/10 transition-shadow duration-300",
                                                hasScrolled && "shadow-[4px_0_12px_rgba(0,0,0,0.6)]"
                                            )}></th>
                                            {(() => {
                                                let currentOffset = 64; // baseline for drag handle (64px = w-16)
                                                const frozenProps = block.data!.properties.filter(p => p.isFrozen);
                                                const lastFrozenId = frozenProps.length > 0 ? frozenProps[frozenProps.length - 1].id : null;

                                                return block.data!.properties.map((prop, index) => {
                                                    const propWidth = prop.key === 'title' ? (prop.width || 300) : (prop.width || 150);
                                                    const offset = prop.isFrozen ? currentOffset : undefined;
                                                    if (prop.isFrozen) currentOffset += propWidth;

                                                    return (
                                                        <ColumnHeader
                                                            key={prop.id}
                                                            property={prop}
                                                            blockId={block.id}
                                                            index={index}
                                                            stickyOffset={offset}
                                                            isLastFrozen={prop.id === lastFrozenId}
                                                        />
                                                    );
                                                });
                                            })()}
                                            {provided.placeholder}
                                            <th
                                                ref={addButtonRef}
                                                className={cn(
                                                    "w-10 px-1 transition-colors cursor-pointer relative hover:bg-white/5",
                                                    isMenuOpen && "z-[60]"
                                                )}
                                                onClick={handleAddClick}
                                            >
                                                <div className="flex items-center justify-center text-[#919191]">
                                                    <Plus size={14} />
                                                </div>
                                                <AnimatePresence>
                                                    {isMenuOpen && (
                                                        <DatabasePropertyMenu
                                                            onClose={() => setIsMenuOpen(false)}
                                                            onSelect={(name, type) => addDatabaseProperty(block.id, name || type, type)}
                                                            triggerRect={triggerRect}
                                                        />
                                                    )}
                                                </AnimatePresence>
                                            </th>
                                        </tr>
                                    )}
                                </Droppable>
                            </thead>
                            <Droppable droppableId={`db-table-${block.id}`} type="ROW">
                                {(provided) => (
                                    <tbody
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="divide-y divide-white/[0.02]"
                                    >
                                        {processedRows.map((row, index) => (
                                            <Draggable key={row.id} draggableId={row.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <DatabaseRowRenderer
                                                        block={block}
                                                        row={row}
                                                        dragHandleProps={provided.dragHandleProps}
                                                        draggableProps={provided.draggableProps}
                                                        innerRef={provided.innerRef}
                                                        isDragging={snapshot.isDragging}
                                                        hasScrolled={hasScrolled}
                                                    />
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </tbody>
                                )}
                            </Droppable>
                        </table>
                    </DragDropContext>
                </div>
                <div
                    onClick={() => addDatabaseRow(block.id)}
                    className="flex items-center gap-2 px-3 py-3 text-[11px] font-black uppercase tracking-widest text-zinc-600 hover:text-white hover:bg-white/[0.02] cursor-pointer border-t-0 border-white/[0.03] transition-all"
                >
                    <Plus size={14} /> New Item
                </div>
            </div >
        </div >
    );
};

const DatabaseRowRenderer = ({ block, row, dragHandleProps, draggableProps, innerRef, isDragging, hasScrolled }: {
    block: RoadmapBlock,
    row: DatabaseRow,
    dragHandleProps?: any,
    draggableProps?: any,
    innerRef?: (element: HTMLElement | null) => void,
    isDragging?: boolean,
    hasScrolled: boolean
}) => {
    const { deleteDatabaseRow, updateDatabaseRow, addSubtask, toggleSubtask, deleteSubtask, updateSubtask, setFocusedRowId } = useRoadmapStore();
    const [isHovered, setIsHovered] = useState(false);
    const [isRefining, setIsRefining] = useState(false);

    const handleAiRefine = async () => {
        const title = row.values.title;
        if (!title) {
            toast.error("Please enter a title first.");
            return;
        }

        setIsRefining(true);
        toast.info("AI Architect is analyzing row...");

        try {
            const context = row.notes || "";
            const result = await refineBlock(title, context);

            updateDatabaseRow(block.id, row.id, {
                values: {
                    ...row.values,
                    priority: result.suggestedPriority as Priority,
                    effort: result.suggestedEffort
                },
                subtasks: [
                    ...(row.subtasks || []),
                    ...result.subtasks.map((s: string) => ({ id: Math.random().toString(36).substr(2, 5), title: s, completed: false }))
                ],
                notes: (row.notes ? row.notes + "\n\n" : "") + "AI ARCHITECT INSIGHT: " + result.aiInsight
            });
            toast.success("Row refined successfully.");
        } catch (error) {
            toast.error("Refinement failed.");
        } finally {
            setIsRefining(false);
        }
    };

    return (
        <tr
            ref={innerRef}
            {...draggableProps}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => {
                setFocusedRowId(row.id, block.id);
            }}
            className={cn(
                "group h-10 transition-colors border-b border-white/[0.03] bg-transparent hover:bg-white/[0.01] relative",
                isDragging && "bg-[#1A1A1A] shadow-xl z-50 opacity-90 border-transparent"
            )}
        >
            <td className={cn(
                "w-16 sticky left-0 z-20 bg-[#0F0F0F] transition-shadow duration-300 border-r border-white/10",
                hasScrolled && "shadow-[4px_0_12px_rgba(0,0,0,0.6)]"
            )}>
                <div className="flex items-center gap-1 justify-center px-1">
                    <div {...dragHandleProps} className="p-1 hover:bg-white/5 rounded cursor-grab text-[#5a5a5a] hover:text-white transition-colors">
                        <GripVertical size={14} />
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteDatabaseRow(block.id, row.id);
                        }}
                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 text-zinc-700 hover:text-rose-500 rounded transition-all"
                        title="Delete row"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </td>

            {(() => {
                let currentOffset = 64; // baseline for drag handle (64px = w-16)
                const frozenProps = block.data!.properties.filter(p => p.isFrozen);
                const lastFrozenId = frozenProps.length > 0 ? frozenProps[frozenProps.length - 1].id : null;

                return block.data!.properties.map(prop => {
                    const propWidth = prop.key === 'title' ? (prop.width || 300) : (prop.width || 150);
                    const offset = prop.isFrozen ? currentOffset : undefined;
                    if (prop.isFrozen) currentOffset += propWidth;

                    return (
                        <td
                            key={prop.id}
                            className={cn(
                                "h-full relative border-r border-white/[0.02] last:border-r-0",
                                prop.isFrozen && "sticky z-20 bg-[#0F0F0F] border-r border-white/10",
                                (prop.id === lastFrozenId && hasScrolled) && "shadow-[4px_0_12px_rgba(0,0,0,0.6)] z-20"
                            )}
                            style={{
                                width: propWidth,
                                minWidth: propWidth,
                                left: offset
                            }}
                        >
                            <CellRenderer
                                blockId={block.id}
                                row={row}
                                property={prop}
                            />
                        </td>
                    );
                });
            })()}

            <td className="w-10 px-1 flex items-center justify-center h-full">
                {/* Expansion removed by user request */}
            </td>
        </tr>
    );
};

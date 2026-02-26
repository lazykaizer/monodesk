"use client";

import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Trash2, Calendar, Clock, Tag as TagIcon,
    ChevronDown, Plus, Sparkles, CheckCircle2, Circle,
    Type as TypeIcon, Hash, AlignLeft, Info, AlertCircle,
    Star, Database, List as ListIcon, HelpCircle, Zap
} from 'lucide-react';
import { useRoadmapStore, RoadmapEntity, BlockType, Priority, EntityStatus } from '@/lib/store/useRoadmapStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { refineBlock } from '@/app/actions/gemini';
import { toast } from 'sonner';

export default function EntityDetailPanel() {
    const { activeEntityId, entities, setActiveEntity, upsertEntity, deleteEntity, statusColumns } = useRoadmapStore();
    const entity = entities.find(e => e.id === activeEntityId);

    const [subtaskInput, setSubtaskInput] = useState("");
    const [isRefining, setIsRefining] = useState(false);

    if (!entity) return null;

    const handleUpdate = (updates: Partial<RoadmapEntity>) => {
        upsertEntity({ id: entity.id, ...updates });
    };

    const handleAiRefine = async () => {
        setIsRefining(true);
        toast.info("AI Assistant is analyzing this block...");
        try {
            const data = await refineBlock(entity.title, entity.notes);
            handleUpdate({
                subtasks: [...entity.subtasks, ...data.subtasks.map((s: string) => ({ id: Math.random().toString(36).substr(2, 5), title: s, completed: false }))],
                priority: data.suggestedPriority as Priority,
                effort: data.suggestedEffort,
                notes: entity.notes + (entity.notes ? "\n\n" : "") + "AI Insight: " + data.aiInsight
            });
            toast.success("AI Refinement complete.");
        } catch (error) {
            toast.error("Refinement failed.");
        } finally {
            setIsRefining(false);
        }
    };

    const addSubtask = () => {
        if (!subtaskInput.trim()) return;
        handleUpdate({
            subtasks: [...entity.subtasks, { id: Math.random().toString(36).substr(2, 9), title: subtaskInput, completed: false }]
        });
        setSubtaskInput("");
    };

    const toggleSubtask = (id: string) => {
        handleUpdate({
            subtasks: entity.subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s)
        });
    };

    const removeSubtask = (id: string) => {
        handleUpdate({
            subtasks: entity.subtasks.filter(s => s.id !== id)
        });
    };

    return (
        <AnimatePresence mode="wait">
            {activeEntityId && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setActiveEntity(null)}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed top-0 right-0 h-screen w-full max-w-xl bg-black border-l border-white/5 z-[70] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)]"
                    >
                        {/* HEADER TOOLBAR */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-zinc-950/50">
                            <div className="flex items-center gap-3">
                                <select
                                    value={entity.blockType}
                                    onChange={(e) => handleUpdate({ blockType: e.target.value as BlockType })}
                                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 outline-none hover:border-zinc-700 transition-colors"
                                >
                                    <option value="text">Text Block</option>
                                    <option value="milestone">Milestone</option>
                                    <option value="checklist">Checklist</option>
                                    <option value="database">Database Item</option>
                                    <option value="heading">Heading</option>
                                </select>
                                <span className="text-[10px] font-mono text-zinc-800">|</span>
                                <span className="text-[10px] font-mono text-zinc-700">ENTITY_{entity.id.toUpperCase().substr(0, 4)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleAiRefine}
                                    disabled={isRefining}
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 gap-2 text-cyan-500 hover:bg-cyan-500/10 font-black uppercase text-[10px] tracking-widest disabled:opacity-50"
                                >
                                    <Sparkles size={14} className={isRefining ? "animate-spin" : ""} />
                                    {isRefining ? "Analyzing..." : "AI Assistant"}
                                </Button>
                                <div className="w-px h-6 bg-white/5 mx-2" />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/5 transition-all"
                                    onClick={() => { deleteEntity(entity.id); setActiveEntity(null); }}
                                >
                                    <Trash2 size={18} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
                                    onClick={() => setActiveEntity(null)}
                                >
                                    <X size={20} />
                                </Button>
                            </div>
                        </div>

                        {/* WORKSPACE AREA */}
                        <div className="flex-1 overflow-y-auto p-10 space-y-12 scrollbar-hide">
                            {/* TITLE & ARCHITECTURE NOTES */}
                            <div className="space-y-6">
                                <textarea
                                    value={entity.title}
                                    onChange={(e) => handleUpdate({ title: e.target.value })}
                                    placeholder="Entity Title..."
                                    className="w-full bg-transparent border-none text-3xl font-black text-white focus:ring-0 resize-none overflow-hidden h-auto p-0 placeholder:text-zinc-800"
                                    rows={1}
                                />

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-zinc-600">
                                        <AlignLeft size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Context & Specification</span>
                                    </div>
                                    <textarea
                                        value={entity.notes}
                                        onChange={(e) => handleUpdate({ notes: e.target.value })}
                                        placeholder="Add structural details, technical specs, or strategic context..."
                                        className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-sm text-zinc-400 focus:border-cyan-500/30 outline-none transition-all h-48 resize-none leading-relaxed placeholder:text-zinc-800"
                                    />
                                </div>
                            </div>

                            {/* STRUCTURED PROPERTIES */}
                            <div className="grid grid-cols-2 gap-y-10 gap-x-16 border-t border-white/5 pt-12">
                                <PropertyItem icon={<Clock size={14} />} label="Execution Status">
                                    <select
                                        value={entity.status}
                                        onChange={(e) => handleUpdate({ status: e.target.value })}
                                        className="bg-transparent text-sm font-bold text-zinc-300 outline-none cursor-pointer hover:text-white transition-colors"
                                    >
                                        {statusColumns.map(col => (
                                            <option key={col} value={col}>{col}</option>
                                        ))}
                                    </select>
                                </PropertyItem>

                                <PropertyItem icon={<AlertCircle size={14} />} label="Priority Rank">
                                    <select
                                        value={entity.priority}
                                        onChange={(e) => handleUpdate({ priority: e.target.value as Priority })}
                                        className="bg-transparent text-sm font-bold text-zinc-300 outline-none cursor-pointer hover:text-white transition-colors"
                                    >
                                        <option value="P1">P1 (Mission Critical)</option>
                                        <option value="P2">P2 (Required)</option>
                                        <option value="P3">P3 (Minor)</option>
                                        <option value="None">None</option>
                                    </select>
                                </PropertyItem>

                                <PropertyItem icon={<Calendar size={14} />} label="Target Date">
                                    <input
                                        type="date"
                                        value={entity.deadline || ''}
                                        onChange={(e) => handleUpdate({ deadline: e.target.value })}
                                        className="bg-transparent text-sm font-bold text-zinc-300 outline-none cursor-pointer hover:text-white transition-colors [color-scheme:dark]"
                                    />
                                </PropertyItem>

                                <PropertyItem icon={<Hash size={14} />} label="Manual Effort">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            value={entity.effort}
                                            onChange={(e) => handleUpdate({ effort: parseInt(e.target.value) || 0 })}
                                            className="bg-transparent text-sm font-black text-zinc-300 outline-none w-14 hover:text-white transition-colors border-b border-white/5 pb-0.5"
                                        />
                                        <span className="text-[10px] text-zinc-700 font-black uppercase tracking-widest">hours</span>
                                    </div>
                                </PropertyItem>
                            </div>

                            {/* SUBTASK ARCHITECTURE */}
                            <div className="space-y-6 pt-6 animate-in slide-in-from-bottom-2 duration-500">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-zinc-600">
                                        <CheckCircle2 size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Actionable Sub-blocks</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-zinc-800 bg-white/5 px-3 py-1 rounded-full">
                                        {entity.subtasks.filter(s => s.completed).length} / {entity.subtasks.length} COMPLETE
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {entity.subtasks.map(subtask => (
                                        <div key={subtask.id} className="flex items-center justify-between group/item p-4 bg-white/[0.01] border border-white/5 rounded-2xl hover:bg-white/[0.03] hover:border-white/10 transition-all">
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => toggleSubtask(subtask.id)}
                                                    className={cn("transition-all scale-110", subtask.completed ? "text-cyan-500" : "text-zinc-800 hover:text-zinc-600")}
                                                >
                                                    {subtask.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                                </button>
                                                <span className={cn("text-xs font-bold transition-all", subtask.completed ? "text-zinc-700 line-through" : "text-zinc-300 group-hover/item:text-white")}>
                                                    {subtask.title}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => removeSubtask(subtask.id)}
                                                className="opacity-0 group-hover/item:opacity-100 text-zinc-800 hover:text-rose-500 transition-all p-1"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}

                                    <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl group focus-within:border-cyan-500/50 transition-all">
                                        <div className="text-zinc-800 group-focus-within:text-cyan-500/50">
                                            <Plus size={18} />
                                        </div>
                                        <input
                                            value={subtaskInput}
                                            onChange={(e) => setSubtaskInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                                            placeholder="Manually architect a sub-block..."
                                            className="flex-1 bg-transparent border-none text-xs font-bold text-zinc-500 focus:ring-0 outline-none placeholder:text-zinc-800"
                                        />
                                        {subtaskInput && (
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-cyan-500 hover:bg-cyan-500/10" onClick={addSubtask}>
                                                <ArrowRight size={16} />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* STATUS BAR */}
                        <div className="p-6 border-t border-white/5 bg-[#050505]">
                            <div className="flex items-center gap-4 text-zinc-500 px-4 py-3 bg-white/[0.02] rounded-2xl border border-white/5">
                                <div className="p-1.5 bg-zinc-900 border border-white/5 rounded-lg">
                                    <HelpCircle size={14} className="text-zinc-600" />
                                </div>
                                <p className="text-[11px] font-medium leading-relaxed italic text-zinc-600">
                                    "Architecture looks solid. Consider adding a Milestone block for the beta phase."
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function PropertyItem({ icon, label, children }: { icon: any, label: string, children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3 text-zinc-700 text-[10px] font-black uppercase tracking-[0.2em]">
                {icon} {label}
            </div>
            <div className="pl-7">
                {children}
            </div>
        </div>
    );
}

function ArrowRight({ size, className }: { size: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
    );
}

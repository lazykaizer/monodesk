"use client";

import { useState } from 'react';
import {
    Clock, MoreHorizontal, CheckCircle2, Circle,
    AlertCircle, Sparkles, Trash2, Edit2, ChevronDown, ChevronUp,
    Calendar, Tag as TagIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/core/button';
import { Badge } from '@/components/ui/core/badge';
import { generateSubtasks } from '@/app/actions/gemini';
import { toast } from 'sonner';

export type TaskStatus = 'backlog' | 'todo' | 'in-progress' | 'done';
export type Priority = 'low' | 'medium' | 'high';

export type Subtask = {
    title: string;
    completed: boolean;
};

export type Task = {
    id: string;
    title: string;
    status: TaskStatus;
    priority: Priority;
    dueDate: string | null;
    subtasks: Subtask[];
    tags: string[];
};

interface TaskCardProps {
    task: Task;
    view: 'board' | 'list';
    onUpdate: (updatedTask: Task) => void;
    onDelete: (id: string) => void;
    onEdit: (task: Task) => void;
}

export default function TaskCard({ task, view, onUpdate, onDelete, onEdit }: TaskCardProps) {
    const [isBreakingDown, setIsBreakingDown] = useState(false);
    const [showSubtasks, setShowSubtasks] = useState(false);

    const completedSubtasks = task.subtasks.filter(s => s.completed).length;
    const totalSubtasks = task.subtasks.length;
    const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

    const handleAutoBreakdown = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsBreakingDown(true);
        try {
            const generated = await generateSubtasks(task.title);
            const newSubtasks: Subtask[] = generated.map((title: string) => ({ title, completed: false }));
            onUpdate({ ...task, subtasks: [...task.subtasks, ...newSubtasks] });
            setShowSubtasks(true);
            toast.success("AI broke down your task!");
        } catch (error) {
            toast.error("AI breakdown failed");
        } finally {
            setIsBreakingDown(false);
        }
    };

    const toggleSubtask = (index: number) => {
        const newSubtasks = [...task.subtasks];
        newSubtasks[index].completed = !newSubtasks[index].completed;
        onUpdate({ ...task, subtasks: newSubtasks });
    };

    const priorityColors = {
        low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        high: "bg-rose-500/10 text-rose-400 border-rose-500/20"
    };

    if (view === 'list') {
        return (
            <motion.div
                layout
                className="group flex items-center gap-4 p-3 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl transition-all"
            >
                <div className="flex-1 flex items-center gap-3">
                    <button
                        onClick={() => onUpdate({ ...task, status: task.status === 'done' ? 'todo' : 'done' })}
                        className="text-zinc-600 hover:text-cyan-400 transition-colors"
                    >
                        {task.status === 'done' ? <CheckCircle2 size={18} className="text-cyan-400" /> : <Circle size={18} />}
                    </button>
                    <span className={cn("text-sm font-medium", task.status === 'done' && "text-zinc-500 line-through")}>
                        {task.title}
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    <Badge variant="outline" className={cn("text-[10px] uppercase font-mono px-2", priorityColors[task.priority])}>
                        {task.priority}
                    </Badge>

                    <div className={cn("flex items-center gap-1.5 text-[10px] font-mono", isOverdue ? "text-rose-500" : "text-zinc-500")}>
                        <Calendar size={12} />
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white" onClick={() => onEdit(task)}>
                            <Edit2 size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-rose-500" onClick={() => onDelete(task.id)}>
                            <Trash2 size={14} />
                        </Button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            layout
            className="group bg-[#111] border border-white/5 hover:border-cyan-500/30 rounded-2xl p-4 space-y-4 transition-all"
        >
            <div className="flex justify-between items-start gap-2">
                <Badge variant="outline" className={cn("text-[9px] uppercase font-black tracking-widest px-2 py-0.5", priorityColors[task.priority])}>
                    {task.priority}
                </Badge>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-600 hover:text-white" onClick={() => onEdit(task)}>
                        <Edit2 size={12} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-600 hover:text-rose-400" onClick={() => onDelete(task.id)}>
                        <Trash2 size={12} />
                    </Button>
                </div>
            </div>

            <h4 className={cn("text-sm font-bold text-zinc-200 leading-snug", task.status === 'done' && "text-zinc-500 line-through")}>
                {task.title}
            </h4>

            {task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {task.tags.map(tag => (
                        <span key={tag} className="text-[9px] font-mono text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between text-[10px] font-mono">
                <div className={cn("flex items-center gap-1.5", isOverdue ? "text-rose-500" : "text-zinc-500")}>
                    <Clock size={12} />
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                </div>
                {totalSubtasks > 0 && (
                    <div className="text-zinc-500">
                        {completedSubtasks}/{totalSubtasks} done
                    </div>
                )}
            </div>

            {totalSubtasks > 0 && (
                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-cyan-500"
                    />
                </div>
            )}

            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAutoBreakdown}
                    disabled={isBreakingDown}
                    className="h-8 text-[10px] font-black uppercase tracking-widest text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10 gap-2 shrink-0"
                >
                    {isBreakingDown ? <RefreshCw className="animate-spin" size={12} /> : <Sparkles size={12} />}
                    Auto-Breakdown
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSubtasks(!showSubtasks)}
                    className={cn("h-8 w-8 text-zinc-600 transition-transform", showSubtasks && "rotate-180")}
                >
                    <ChevronDown size={14} />
                </Button>
            </div>

            <AnimatePresence>
                {showSubtasks && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-2 pt-2"
                    >
                        {task.subtasks.map((sub, idx) => (
                            <div key={idx} className="flex items-center gap-2 group/sub">
                                <button
                                    onClick={() => toggleSubtask(idx)}
                                    className="text-zinc-700 hover:text-cyan-500 transition-colors"
                                >
                                    {sub.completed ? <CheckCircle2 size={14} className="text-cyan-500" /> : <Circle size={14} />}
                                </button>
                                <span className={cn("text-[11px] text-zinc-400 flex-1", sub.completed && "text-zinc-600 line-through")}>
                                    {sub.title}
                                </span>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function RefreshCw(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
        </svg>
    )
}

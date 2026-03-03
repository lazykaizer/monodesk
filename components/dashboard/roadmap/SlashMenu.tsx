"use client";

import { useState, useEffect } from 'react';
import { useRoadmapStore, BlockType, ViewType } from '@/lib/store/useRoadmapStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    Type, AlignLeft, CheckCircle2, List, ListOrdered, ToggleLeft,
    Quote, Divide, Lightbulb, Code as CodeIcon, Image as ImageIcon,
    Database, Kanban, Calendar, PieChart, Search, X, Trash2
} from 'lucide-react';

interface Props {
    position: { blockId: string; x: number; y: number };
    onClose: () => void;
    targetIndex: number;
    parentId?: string | null;
    triggerBlockId?: string;
}

export const SlashMenu = ({ position, onClose, targetIndex, parentId, triggerBlockId }: Props) => {
    const { blocks, addBlock, updateBlock, deleteBlock, slashQuery } = useRoadmapStore();
    const [activeIndex, setActiveIndex] = useState(0);

    const commands: { type: BlockType | 'chart-view' | 'board-view' | 'calendar-view'; label: string; icon: any; desc: string }[] = [
        // BASIC BLOCKS
        { type: 'text', label: 'Text', icon: <AlignLeft size={16} />, desc: 'Plain text block.' },
        { type: 'h1', label: 'Heading 1', icon: <Type size={16} />, desc: 'Large heading.' },
        { type: 'h2', label: 'Heading 2', icon: <Type size={16} />, desc: 'Medium heading.' },
        { type: 'h3', label: 'Heading 3', icon: <Type size={16} />, desc: 'Small heading.' },
        { type: 'checklist', label: 'To-do List', icon: <CheckCircle2 size={16} />, desc: 'Track tasks.' },
        { type: 'bullet', label: 'Bulleted List', icon: <List size={16} />, desc: 'Simple list.' },
        { type: 'numbered', label: 'Numbered List', icon: <ListOrdered size={16} />, desc: 'Sequential list.' },
        { type: 'toggle', label: 'Toggle List', icon: <ToggleLeft size={16} />, desc: 'Collapsible content.' },
        { type: 'quote', label: 'Quote', icon: <Quote size={16} />, desc: 'Capture a quote.' },
        { type: 'divider', label: 'Divider', icon: <Divide size={16} />, desc: 'Visual break.' },
        { type: 'callout', label: 'Callout', icon: <Lightbulb size={16} />, desc: 'Stand out text.' },
        { type: 'code', label: 'Code', icon: <CodeIcon size={16} />, desc: 'Code snippet.' },
        { type: 'image', label: 'Image', icon: <ImageIcon size={16} />, desc: 'Upload images.' },
        { type: 'database', label: 'Table', icon: <Database size={16} />, desc: 'Inline table.' },
        { type: 'board-view', label: 'Board', icon: <Kanban size={16} />, desc: 'Kanban board.' },
        { type: 'calendar-view', label: 'Calendar', icon: <Calendar size={16} />, desc: 'Schedule & events.' },
        { type: 'chart-view', label: 'Donut Chart', icon: <PieChart size={16} />, desc: 'Data visualization.' },
        { type: 'text', label: 'Delete', icon: <Trash2 size={16} className="text-rose-500" />, desc: 'Remove this block.' },
    ];

    const filtered = commands.filter(c => c.label.toLowerCase().includes(slashQuery.toLowerCase()));

    const executeCommand = (cmd: typeof commands[0]) => {
        const targetBlock = triggerBlockId ? blocks.find(b => b.id === triggerBlockId) : null;
        let content = targetBlock?.content || '';

        // Remove trigger char (/ or .) and following query from content
        const lastSlash = content.lastIndexOf('/');
        const lastDot = content.lastIndexOf('.');
        const triggerPos = Math.max(lastSlash, lastDot);
        if (triggerPos !== -1) {
            content = content.slice(0, triggerPos).trim();
        }

        if (['database', 'board-view', 'calendar-view', 'chart-view'].includes(cmd.type)) {
            if (triggerBlockId && targetBlock) {
                deleteBlock(triggerBlockId);
                const idx = targetBlock.order;

                let viewType: ViewType = 'Table';
                if (cmd.type === 'board-view') viewType = 'Board';
                else if (cmd.type === 'calendar-view') viewType = 'Calendar';
                else if (cmd.type === 'chart-view') viewType = 'Chart';

                addBlock('database', idx, parentId, viewType);
            } else {
                let viewType: ViewType = 'Table';
                if (cmd.type === 'board-view') viewType = 'Board';
                else if (cmd.type === 'calendar-view') viewType = 'Calendar';
                else if (cmd.type === 'chart-view') viewType = 'Chart';

                addBlock('database', targetIndex, parentId, viewType);
            }
        } else if (cmd.label === 'Delete') {
            if (triggerBlockId) {
                deleteBlock(triggerBlockId);
            }
        } else {
            if (triggerBlockId) {
                updateBlock(triggerBlockId, { type: cmd.type as BlockType, content });
            } else {
                addBlock(cmd.type as BlockType, targetIndex, parentId);
            }
        }
        onClose();
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => (prev + 1) % filtered.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => (prev - 1 + filtered.length) % filtered.length);
            } else if (e.key === 'Enter' && filtered.length > 0) {
                e.preventDefault();
                executeCommand(filtered[activeIndex]);
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [filtered, activeIndex, onClose]);

    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        const menuHeight = 400; // Expected max height
        const spaceBelow = window.innerHeight - position.y;
        if (spaceBelow < menuHeight) {
            setIsFlipped(true);
        }
    }, [position.y]);

    if (filtered.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: isFlipped ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isFlipped ? 5 : -5 }}
            className="fixed z-[100] w-72 bg-[#1c1c1c] border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
            style={{
                left: position.x,
                top: isFlipped ? undefined : position.y,
                bottom: isFlipped ? window.innerHeight - (position.y - 20) : undefined,
            }}
        >
            <div className="max-h-[min(400px,70vh)] overflow-y-auto p-2">
                {filtered.map((cmd, idx) => (
                    <button
                        key={cmd.label}
                        onClick={() => executeCommand(cmd)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left",
                            activeIndex === idx ? "bg-white/10 text-white" : "text-zinc-500 hover:bg-white/5"
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-md flex items-center justify-center shrink-0 border border-white/5 transition-colors",
                            idx === activeIndex ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" : "bg-zinc-800 text-zinc-500"
                        )}>
                            {cmd.icon}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[13px] font-bold truncate leading-none mb-0.5">{cmd.label}</span>
                            <span className="text-[10px] text-zinc-600 truncate leading-none">{cmd.desc}</span>
                        </div>
                    </button>
                ))}
            </div>
        </motion.div>
    );
};

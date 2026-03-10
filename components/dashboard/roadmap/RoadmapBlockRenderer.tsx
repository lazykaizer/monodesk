"use client";

import { useState, useRef, useEffect } from 'react';
import {
    Plus, GripVertical, Trash2, ChevronRight,
    MoreHorizontal, CheckCircle2, Circle, Sparkles,
    Database, Kanban, Calendar, Star, Type, MessageSquare,
    Check, Quote as QuoteIcon, Code as CodeIcon,
    ChevronDown, Image as ImageIcon, Copy, Maximize2,
    Eye, EyeOff, List, ListOrdered, Info, AlertTriangle, Lightbulb, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRoadmapStore, BlockType, RoadmapBlock as BlockData } from '@/lib/store/useRoadmapStore';
import { InlineDatabase } from './InlineDatabase';
import { Button } from '@/components/ui/core/button';

interface Props {
    block: BlockData;
    dragHandleProps?: any;
}

export const RoadmapBlockRenderer = ({ block, dragHandleProps }: Props) => {
    const { blocks, updateBlock, deleteBlock, addBlock, duplicateBlock, addHistory, setSlashQuery, slashMenuState, setSlashMenuState, setFocusedId } = useRoadmapStore();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const children = blocks.filter(b => b.parentId === block.id).sort((a, b) => a.order - b.order);

    useEffect(() => {
        // Auto-resize textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [block.content]);

    // Auto-focus textarea when block TYPE changes (e.g. after selecting command from menu)
    useEffect(() => {
        if (['h1', 'h2', 'h3', 'quote', 'callout', 'toggle', 'bullet', 'numbered', 'checklist', 'code', 'text'].includes(block.type)) {
            // Small timeout so the new DOM element has mounted
            const t = setTimeout(() => {
                textareaRef.current?.focus();
            }, 50);
            return () => clearTimeout(t);
        }
    }, [block.type]);

    const handleContentChange = (content: string) => {
        updateBlock(block.id, { content });

        // Detect "/" (desktop) or "." (mobile/touch) as command trigger
        const isTouchDevice = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
        const slashIndex = content.lastIndexOf('/');
        const dotIndex = isTouchDevice ? content.lastIndexOf('.') : -1;
        // Use whichever trigger appeared last in the string
        const triggerIndex = dotIndex > slashIndex ? dotIndex : slashIndex;

        if (triggerIndex !== -1) {
            const query = content.slice(triggerIndex + 1);
            // Only trigger if char is at start or preceded by a space
            if (triggerIndex === 0 || content[triggerIndex - 1] === ' ') {
                setSlashQuery(query);

                // If menu isn't open for this block, open it
                if (!slashMenuState || slashMenuState.blockId !== block.id) {
                    const rect = textareaRef.current?.getBoundingClientRect();
                    if (rect) {
                        setSlashMenuState({
                            blockId: block.id,
                            x: rect.left,
                            y: rect.bottom + 8
                        });
                    }
                }
            } else {
                setSlashQuery("");
                if (slashMenuState?.blockId === block.id) setSlashMenuState(null);
            }
        } else {
            setSlashQuery("");
            if (slashMenuState?.blockId === block.id) setSlashMenuState(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && block.type !== 'database') {
            e.preventDefault();
            // Preserve list type for bullet, numbered, and checklist
            const nextType = ['bullet', 'numbered', 'checklist'].includes(block.type) ? block.type : 'text';
            addBlock(nextType, block.order + 1, block.parentId);
        }
        if (e.key === 'Backspace' && block.content === '' && block.type !== 'text') {
            e.preventDefault();
            updateBlock(block.id, { type: 'text' });
        }
    };

    const renderContent = () => {
        switch (block.type) {
            case 'h1':
                return (
                    <textarea
                        ref={textareaRef}
                        value={block.content}
                        onChange={(e) => {
                            handleContentChange(e.target.value);
                            addHistory(block.id, e.target.value, 'updated', 'h1');
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Heading 1"
                        onFocus={() => setFocusedId(block.id)}
                        className="w-full bg-transparent border-none text-4xl font-black focus:ring-0 outline-none resize-none placeholder:text-zinc-800 leading-normal py-2"
                        style={{ color: '#ffffff' }}
                        rows={1}
                    />
                );
            case 'h2':
                return (
                    <textarea
                        ref={textareaRef}
                        value={block.content}
                        onChange={(e) => {
                            handleContentChange(e.target.value);
                            addHistory(block.id, e.target.value, 'updated', 'h2');
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Heading 2"
                        onFocus={() => setFocusedId(block.id)}
                        className="w-full bg-transparent border-none text-2xl font-black focus:ring-0 outline-none resize-none placeholder:text-zinc-800 leading-tight py-1.5"
                        style={{ color: '#ffffff' }}
                        rows={1}
                    />
                );
            case 'h3':
                return (
                    <textarea
                        ref={textareaRef}
                        value={block.content}
                        onChange={(e) => {
                            handleContentChange(e.target.value);
                            addHistory(block.id, e.target.value, 'updated', 'h3');
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Heading 3"
                        onFocus={() => setFocusedId(block.id)}
                        className="w-full bg-transparent border-none text-lg font-black focus:ring-0 outline-none resize-none placeholder:text-zinc-800 leading-tight py-1"
                        style={{ color: '#ffffff' }}
                        rows={1}
                    />
                );
            case 'quote':
                return (
                    <div className="flex gap-4 border-l-2 border-cyan-500/50 pl-6 my-4 italic">
                        <textarea
                            ref={textareaRef}
                            value={block.content}
                            onChange={(e) => handleContentChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a quote..."
                            onFocus={() => setFocusedId(block.id)}
                            className="w-full bg-transparent border-none text-xl font-medium focus:ring-0 outline-none resize-none placeholder:text-zinc-800 leading-relaxed"
                            style={{ color: '#ffffff' }}
                            rows={1}
                        />
                    </div>
                );
            case 'code':
                return (
                    <div className="bg-zinc-950 border border-white/5 rounded-2xl p-6 my-4 relative group/code font-mono">
                        <div className="absolute right-4 top-4 flex items-center gap-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                            <span className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest">{block.language || 'typescript'}</span>
                            <CodeIcon size={14} className="text-zinc-700" />
                        </div>
                        <textarea
                            ref={textareaRef}
                            value={block.content}
                            onChange={(e) => handleContentChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="// Code goes here..."
                            className="w-full bg-transparent border-none text-sm focus:ring-0 outline-none resize-none placeholder:text-zinc-400"
                            style={{ color: '#ffffff' }}
                            rows={1}
                        />
                    </div>
                );
            case 'toggle':
                return (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 group/toggle">
                            <button
                                onClick={() => updateBlock(block.id, { isToggled: !block.isToggled })}
                                className={cn("text-zinc-600 transition-transform", block.isToggled && "rotate-90")}
                            >
                                <ChevronRight size={18} />
                            </button>
                            <textarea
                                ref={textareaRef}
                                value={block.content}
                                onChange={(e) => handleContentChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Toggle heading..."
                                onFocus={() => setFocusedId(block.id)}
                                className="flex-1 bg-transparent border-none text-base font-bold focus:ring-0 outline-none resize-none placeholder:text-zinc-800"
                                style={{ color: '#ffffff' }}
                                rows={1}
                            />
                        </div>
                        <AnimatePresence>
                            {block.isToggled && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="pl-8 border-l border-white/5 ml-2 pt-2"
                                >
                                    <div className="space-y-1">
                                        {children.map(child => (
                                            <RoadmapBlockRenderer
                                                key={child.id}
                                                block={child}
                                            />
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => addBlock('text', undefined, block.id)}
                                        className="flex items-center gap-2 px-2 py-1 text-[10px] uppercase font-black tracking-widest text-zinc-800 hover:text-cyan-500 transition-colors mt-4 bg-white/[0.02] border border-white/5 rounded-lg w-fit"
                                    >
                                        <Plus size={10} /> Add Sub-block
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            case 'checklist':
                return (
                    <div className="flex items-start gap-3 w-full py-1">
                        <button
                            onClick={() => updateBlock(block.id, { checked: !block.checked })}
                            className={cn(
                                "mt-1.5 transition-colors",
                                block.checked ? "text-cyan-500" : "text-zinc-700 hover:text-zinc-500"
                            )}
                        >
                            {block.checked ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                        </button>
                        <textarea
                            ref={textareaRef}
                            value={block.content}
                            onChange={(e) => handleContentChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="To-do"
                            className={cn(
                                "flex-1 bg-transparent border-none text-base font-medium focus:ring-0 outline-none resize-none placeholder:text-zinc-400 transition-all",
                                block.checked ? "text-zinc-600 line-through" : ""
                            )}
                            style={{ color: block.checked ? undefined : '#ffffff' }}
                            rows={1}
                        />
                    </div>
                );
            case 'image':
                return (
                    <div className="my-6 relative group/image border border-white/5 rounded-3xl overflow-hidden bg-white/[0.01]">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id={`image-upload-${block.id}`}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (re) => {
                                        const url = re.target?.result as string;
                                        updateBlock(block.id, { url });
                                        addHistory(block.id, 'Image Uploaded', 'updated', 'image');
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                        {block.url ? (
                            <div className="group/img relative inline-block max-w-full" style={{ width: `${block.width || 100}%` }}>
                                <img
                                    src={block.url}
                                    alt="Roadmap block"
                                    className="rounded-2xl border border-white/5 shadow-2xl w-full"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-4 rounded-2xl">
                                    <button
                                        onClick={() => {
                                            const url = prompt('Enter image URL:', block.url);
                                            if (url) {
                                                updateBlock(block.id, { url });
                                                addHistory(block.id, 'Image URL Updated', 'updated', 'image');
                                            }
                                        }}
                                        className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md"
                                    >
                                        <Copy size={20} />
                                    </button>
                                    <button
                                        onClick={() => deleteBlock(block.id)}
                                        className="p-3 bg-rose-500/20 hover:bg-rose-500/40 rounded-full text-rose-500 transition-all backdrop-blur-md"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                                {/* RESIZE HANDLE */}
                                <div
                                    className="absolute -right-1 top-0 bottom-0 w-2 cursor-col-resize hover:bg-cyan-500/50 transition-colors opacity-0 group-hover/img:opacity-100 group/handle flex flex-col items-center justify-center gap-1"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        const startX = e.clientX;
                                        const startWidth = block.width || 100;
                                        const parent = (e.currentTarget.parentElement?.parentElement as HTMLElement);
                                        const parentWidth = parent?.clientWidth || 1;

                                        const moveHandler = (moveEvent: MouseEvent) => {
                                            const deltaX = moveEvent.clientX - startX;
                                            const deltaPercent = (deltaX / parentWidth) * 100;
                                            const newWidth = Math.min(100, Math.max(10, startWidth + deltaPercent));
                                            updateBlock(block.id, { width: newWidth });
                                        };

                                        const upHandler = () => {
                                            window.removeEventListener('mousemove', moveHandler);
                                            window.removeEventListener('mouseup', upHandler);
                                        };

                                        window.addEventListener('mousemove', moveHandler);
                                        window.addEventListener('mouseup', upHandler);
                                    }}
                                >
                                    <div className="w-1 h-8 bg-white/20 rounded-full group-hover/handle:bg-cyan-500" />
                                </div>
                            </div>
                        ) : (
                            <div className="p-20 flex flex-col items-center justify-center text-zinc-800 gap-4">
                                <ImageIcon size={48} className="opacity-20" />
                                <div className="text-center">
                                    <p className="text-xs font-black uppercase tracking-widest text-zinc-700">Image Asset</p>
                                    <p className="text-[10px] font-bold mt-1 text-zinc-800 italic">Proprietary vision component</p>
                                </div>
                                <label
                                    htmlFor={`image-upload-${block.id}`}
                                    className="cursor-pointer px-8 py-3 bg-zinc-950 border border-white/5 rounded-xl text-[10px] uppercase font-black tracking-widest text-zinc-600 hover:text-white hover:border-white/10 transition-all shadow-2xl"
                                >
                                    Upload Local File
                                </label>
                            </div>
                        )}
                    </div>
                );
            case 'divider':
                return (
                    <div className="py-6 w-full relative group/divider">
                        <div className="h-px bg-white/[0.03] group-hover/divider:bg-cyan-500/20 transition-colors w-full shadow-inner" />
                    </div>
                );
            case 'bullet':
                return (
                    <div className="flex items-start gap-2 w-full py-1">
                        <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-zinc-700 shrink-0" />
                        <textarea
                            ref={textareaRef}
                            value={block.content}
                            onChange={(e) => handleContentChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder=""
                            className="flex-1 bg-transparent border-none text-base font-medium focus:ring-0 outline-none resize-none placeholder:text-zinc-400 leading-relaxed"
                            style={{ color: '#ffffff' }}
                            rows={1}
                        />
                    </div>
                );
            case 'numbered':
                return (
                    <div className="flex items-start gap-2 w-full py-1">
                        <span className="mt-1 text-base font-medium text-zinc-600 font-mono select-none w-6 text-right">
                            {/* Calculate sequential number based on previous sibling blocks */}
                            {(() => {
                                const siblings = blocks.filter(b => b.parentId === block.parentId).sort((a, b) => a.order - b.order);
                                const myIndex = siblings.findIndex(b => b.id === block.id);
                                let count = 1;
                                // Look backwards from current position
                                for (let i = myIndex - 1; i >= 0; i--) {
                                    if (siblings[i].type === 'numbered') {
                                        count++;
                                    } else {
                                        break; // Stop counting if sequence is broken
                                    }
                                }
                                return count + ".";
                            })()}
                        </span>
                        <textarea
                            ref={textareaRef}
                            value={block.content}
                            onChange={(e) => handleContentChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder=""
                            className="flex-1 bg-transparent border-none text-base font-medium focus:ring-0 outline-none resize-none placeholder:text-zinc-400 leading-relaxed"
                            style={{ color: '#ffffff' }}
                            rows={1}
                        />
                    </div >
                );
            case 'callout':
                return (
                    <div className="flex gap-4 p-4 my-4 bg-zinc-900/50 border border-white/5 rounded-xl text-zinc-300">
                        <div className="shrink-0 mt-1">
                            <Lightbulb size={24} className="text-amber-500" />
                        </div>
                        <textarea
                            ref={textareaRef}
                            value={block.content}
                            onChange={(e) => handleContentChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Add a callout note..."
                            onFocus={() => setFocusedId(block.id)}
                            className="w-full bg-transparent border-none text-base font-medium focus:ring-0 outline-none resize-none placeholder:text-zinc-700 leading-relaxed"
                            style={{ color: '#ffffff' }}
                            rows={1}
                        />
                    </div>
                );
            case 'database':
                return <InlineDatabase block={block} />;
            default:
                return (
                    <textarea
                        ref={textareaRef}
                        value={block.content}
                        onChange={(e) => handleContentChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder=""
                        onFocus={() => setFocusedId(block.id)}
                        className="w-full bg-transparent border-none text-base font-medium focus:ring-0 outline-none resize-none placeholder:text-zinc-400 leading-relaxed py-1"
                        style={{ color: '#ffffff' }}
                        rows={1}
                    />
                );
        }
    };

    return (
        <div
            onClick={() => setFocusedId(block.id)}
            className="group relative flex items-start w-full transition-all group/block"
        >
            {/* LEFT ACTIONS (Drag, Delete, Copy) - Moved closer to content */}
            <div className="absolute -left-14 top-0 h-full flex flex-col items-center pt-2 px-1 gap-1 opacity-0 group-hover/block:opacity-100 transition-all duration-200">
                <div
                    {...dragHandleProps}
                    className="p-1.5 hover:bg-white/10 rounded-md cursor-grab active:cursor-grabbing text-zinc-600 hover:text-white transition-all transform hover:scale-110"
                    title="Drag to reorder"
                >
                    <GripVertical size={16} />
                </div>
                <button
                    onClick={() => deleteBlock(block.id)}
                    className="p-1.5 hover:bg-rose-500/20 rounded-md text-zinc-600 hover:text-rose-400 transition-all transform hover:scale-110"
                    title="Delete block"
                >
                    <Trash2 size={14} />
                </button>
                <button
                    onClick={() => duplicateBlock(block.id)}
                    className="p-1.5 hover:bg-white/10 rounded-md text-zinc-600 hover:text-white transition-all transform hover:scale-110"
                    title="Duplicate block"
                >
                    <Copy size={14} />
                </button>
            </div>

            {/* BLOCK CONTENT */}
            <div className="w-full relative group-hover/block:bg-white/[0.02] rounded-xl transition-colors">
                {renderContent()}
            </div>
        </div>
    );
};

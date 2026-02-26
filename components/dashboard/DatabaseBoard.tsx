"use client";

import { useMemo, useState, useEffect, useRef } from 'react';
import {
    Plus, FileText, CheckCircle2, Circle, Clock, Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRoadmapStore, RoadmapBlock as BlockData, DatabaseRow } from '@/lib/store/useRoadmapStore';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface Props {
    block: BlockData;
}

export const DatabaseBoard = ({ block }: { block: BlockData }) => {
    const { addDatabaseRow, updateDatabaseRow } = useRoadmapStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // NOTION STANDARD STATUSES
    const columns = [
        { id: 'Todo', label: 'Not started', color: 'bg-zinc-800 text-zinc-400' },
        { id: 'In Progress', label: 'In progress', color: 'bg-blue-900/40 text-blue-400' },
        { id: 'Done', label: 'Done', color: 'bg-emerald-900/40 text-emerald-400' }
    ];

    const groupedRows = useMemo(() => {
        const groups: Record<string, DatabaseRow[]> = {
            'Todo': [],
            'In Progress': [],
            'Done': []
        };
        block.data?.rows.forEach(row => {
            // Normalize status
            let status = row.values.status || 'Todo';
            // Map old or variations to standard keys
            if (status === 'Not started') status = 'Todo';
            if (status === 'In progress') status = 'In Progress';

            if (groups[status]) {
                groups[status].push(row);
            } else {
                groups['Todo'].push(row);
            }
        });
        return groups;
    }, [block.data?.rows]);

    const onDragEnd = (result: any) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        updateDatabaseRow(block.id, draggableId, {
            values: {
                ...block.data?.rows.find(r => r.id === draggableId)?.values,
                status: destination.droppableId
            }
        });
    };

    if (!mounted) return null;

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-0 pt-4">
                {columns.map((col) => (
                    <div key={col.id} className="w-[260px] flex-shrink-0 flex flex-col gap-3">
                        {/* COLUMN HEADER */}
                        <div className="flex items-center justify-between px-1 h-8">
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "px-2 py-1 rounded-full text-[12px] font-medium flex items-center gap-2",
                                    col.color
                                )}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80"></span>
                                    {col.label}
                                    <span className="ml-1 opacity-60 text-[10px]">{groupedRows[col.id].length}</span>
                                </span>
                            </div>
                        </div>

                        <Droppable droppableId={col.id}>
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={cn(
                                        "flex-1 flex flex-col gap-2 min-h-[100px] transition-colors rounded-lg",
                                        snapshot.isDraggingOver && "bg-white/[0.02]"
                                    )}
                                >
                                    {groupedRows[col.id].map((row, idx) => (
                                        <Draggable key={row.id} draggableId={row.id} index={idx}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={cn("outline-none transition-all", snapshot.isDragging && "z-50 scale-105 opacity-90 rotate-2")}
                                                >
                                                    <BoardCard
                                                        blockId={block.id}
                                                        row={row}
                                                    />
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}

                                    {/* NEW BUTTON AT BOTTOM */}
                                    <button
                                        onClick={() => addDatabaseRow(block.id, { status: col.id })}
                                        className="flex items-center gap-2 px-2 py-2 text-zinc-500 hover:text-white hover:bg-white/[0.04] rounded-md transition-all text-[13px] group/new mt-1"
                                    >
                                        <Plus size={14} />
                                        <span>New</span>
                                    </button>
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}

            </div>
        </DragDropContext>
    );
};

const BoardCard = ({ blockId, row }: { blockId: string, row: DatabaseRow }) => {
    const { updateDatabaseRow, deleteDatabaseRow } = useRoadmapStore();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [row.values.title]);

    return (
        <motion.div
            layoutId={row.id}
            className="group relative bg-[#1e1e1e] hover:bg-[#252525] rounded-lg shadow-sm border border-[#303030] hover:border-[#404040] overflow-hidden cursor-pointer transition-all pr-8"
        >
            <div className="p-3 space-y-2">
                <div className="flex items-start gap-2">
                    <div className="mt-1 text-zinc-500 group-hover:text-zinc-400 transition-colors">
                        <FileText size={14} />
                    </div>
                    <textarea
                        ref={textareaRef}
                        value={row.values.title || ""}
                        onChange={(e) => updateDatabaseRow(blockId, row.id, { values: { ...row.values, title: e.target.value } })}
                        placeholder="Type a name..."
                        className="bg-transparent border-none text-[14px] font-medium text-zinc-200 group-hover:text-white focus:text-white focus:ring-0 outline-none w-full p-0 placeholder:text-zinc-600 leading-snug transition-colors resize-none overflow-hidden h-auto"
                        rows={1}
                    />
                </div>

                {/* PROPERTIES */}
                <div className="pl-6 space-y-1">
                    {row.values.tags && row.values.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                                {row.values.tags}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* DELETE ACTION - Visible on Hover */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this specific task?')) {
                        deleteDatabaseRow(blockId, row.id);
                    }
                }}
                className="absolute top-2 right-2 p-1.5 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded opacity-0 group-hover:opacity-100 transition-all z-10"
                title="Delete Task"
            >
                <Trash2 size={13} />
            </button>
        </motion.div>
    );
};

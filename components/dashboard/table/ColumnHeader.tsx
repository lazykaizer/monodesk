import React, { useState, useRef, useEffect } from 'react';
import { DatabaseProperty, PropertyType, useRoadmapStore } from '@/lib/store/useRoadmapStore';
import { Draggable } from '@hello-pangea/dnd';
import {
    MoreHorizontal, Type, Hash, ChevronDown, List, PieChart,
    Calendar, User, File as FileIcon, CheckSquare, Link, Mail, Phone,
    Trash2, Copy, Pin, Edit3, ArrowLeftRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PropertyIcon } from '../InlineDatabase';

interface ColumnHeaderProps {
    property: DatabaseProperty;
    blockId: string;
    index: number;
    stickyOffset?: number;
    isLastFrozen?: boolean;
}

export const ColumnHeader = ({ property, blockId, index, stickyOffset = 0, isLastFrozen = false }: ColumnHeaderProps) => {
    const { updateDatabaseProperty, deleteDatabaseProperty, duplicateDatabaseProperty, deleteBlock } = useRoadmapStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [tempLabel, setTempLabel] = useState(property.label);
    const inputRef = useRef<HTMLInputElement>(null);
    const headerRef = useRef<HTMLTableCellElement>(null);

    useEffect(() => {
        if (isRenaming) {
            inputRef.current?.focus();
        }
    }, [isRenaming]);

    const handleRename = () => {
        updateDatabaseProperty(blockId, property.id, { label: tempLabel });
        setIsRenaming(false);
    };

    const toggleFreeze = () => {
        updateDatabaseProperty(blockId, property.id, { isFrozen: !property.isFrozen });
        setIsMenuOpen(false);
    };

    // --- RESIZE LOGIC ---
    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startWidth = headerRef.current?.getBoundingClientRect().width || (property.width || 150);

        const onMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const newWidth = Math.max(100, startWidth + deltaX);
            updateDatabaseProperty(blockId, property.id, { width: newWidth });
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    return (
        <Draggable draggableId={property.id} index={index}>
            {(provided, snapshot) => (
                <th
                    ref={(el) => {
                        provided.innerRef(el);
                        // @ts-ignore
                        headerRef.current = el;
                    }}
                    {...provided.draggableProps}
                    className={cn(
                        "text-left font-normal group/header relative h-10 border-b border-white/10 select-none p-0",
                        property.isFrozen && "sticky z-20 bg-[#0F0F0F] border-r border-white/10",
                        isLastFrozen && "shadow-[4px_0_12px_rgba(0,0,0,0.6)] z-20",
                        isMenuOpen && "z-[60]",
                        snapshot.isDragging && "bg-[#1c1c1c] opacity-80"
                    )}
                    style={{
                        ...provided.draggableProps.style,
                        width: property.width || 150,
                        minWidth: property.width || 150,
                        left: property.isFrozen ? stickyOffset : undefined
                    }}
                >
                    {/* DRAG HANDLE AREA */}
                    <div
                        {...provided.dragHandleProps}
                        className="flex items-center justify-between w-full h-full px-3 cursor-grab active:cursor-grabbing"
                    >
                        <div className="flex items-center gap-2 text-[#9d9d9d] w-full min-w-0 pointer-events-none">
                            <div className="text-zinc-400 shrink-0">
                                <PropertyIcon type={property.type} />
                            </div>

                            {isRenaming ? (
                                <input
                                    ref={inputRef}
                                    value={tempLabel}
                                    onChange={(e) => setTempLabel(e.target.value)}
                                    onBlur={handleRename}
                                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                                    className="bg-transparent text-white text-[12px] font-medium outline-none w-full pointer-events-auto"
                                />
                            ) : (
                                <span className="text-[12px] text-zinc-100 font-medium truncate flex-1 cursor-text pointer-events-auto" onClick={() => setIsRenaming(true)}>
                                    {property.label}
                                </span>
                            )}
                        </div>

                        <div className="relative shrink-0 flex items-center pointer-events-auto">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMenuOpen(!isMenuOpen);
                                }}
                                className={cn(
                                    "p-1 rounded opacity-0 group-hover/header:opacity-100 transition-opacity hover:bg-white/10 text-zinc-400 hover:text-white mr-1",
                                    isMenuOpen && "opacity-100 bg-white/10 text-white"
                                )}
                            >
                                <MoreHorizontal size={14} />
                            </button>

                            <AnimatePresence>
                                {isMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setIsMenuOpen(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                            className="absolute right-0 top-full mt-1 z-50 w-48 bg-[#1c1c1c] border border-zinc-800 rounded-lg shadow-xl overflow-hidden py-1"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="px-2 py-1.5 border-b border-zinc-800 mb-1">
                                                <input
                                                    value={tempLabel}
                                                    onChange={(e) => {
                                                        setTempLabel(e.target.value);
                                                        updateDatabaseProperty(blockId, property.id, { label: e.target.value });
                                                    }}
                                                    className="w-full bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none font-medium"
                                                    placeholder="Property name"
                                                />
                                            </div>

                                            <MenuItem
                                                icon={<Edit3 size={14} />}
                                                label="Rename"
                                                onClick={() => {
                                                    setIsRenaming(true);
                                                    setIsMenuOpen(false);
                                                }}
                                            />
                                            <MenuItem
                                                icon={<Pin size={14} className={property.isFrozen ? "text-cyan-400" : ""} />}
                                                label={property.isFrozen ? "Unfreeze Column" : "Freeze Column"}
                                                onClick={toggleFreeze}
                                            />
                                            <MenuItem
                                                icon={<Copy size={14} />}
                                                label="Duplicate"
                                                onClick={() => {
                                                    duplicateDatabaseProperty(blockId, property.id);
                                                    setIsMenuOpen(false);
                                                }}
                                            />
                                            <div className="h-px bg-zinc-800 my-1" />

                                            {property.key !== 'title' && (
                                                <MenuItem
                                                    icon={<Trash2 size={14} />}
                                                    label="Delete Property"
                                                    onClick={() => deleteDatabaseProperty(blockId, property.id)}
                                                    variant="danger"
                                                />
                                            )}

                                            <MenuItem
                                                icon={<Trash2 size={14} />}
                                                label="Delete Database"
                                                onClick={() => deleteBlock(blockId)}
                                                variant="danger"
                                            />
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* RESIZE HANDLE */}
                    <div
                        onMouseDown={handleResizeStart}
                        className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize z-50 group/handle flex justify-center hover:bg-cyan-500/10 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-px h-full bg-white/5 group-hover/handle:bg-cyan-500 transition-colors sticky right-0" />
                    </div>
                </th>
            )}
        </Draggable>
    );
};

interface MenuItemProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'danger';
}

const MenuItem = ({ icon, label, onClick, variant = 'default' }: MenuItemProps) => (
    <button
        onClick={onClick}
        className={cn(
            "w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-white/5 mx-1 rounded-md max-w-[95%]",
            variant === 'danger' ? "text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" : "text-zinc-300 hover:text-white"
        )}
    >
        {icon}
        <span>{label}</span>
    </button>
);

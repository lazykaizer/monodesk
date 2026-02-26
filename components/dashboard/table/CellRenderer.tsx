import React, { useState, useRef, useEffect } from 'react';
import { DatabaseProperty, DatabaseRow, useRoadmapStore } from '@/lib/store/useRoadmapStore';
import {
    Check, ChevronDown, Link, Mail, Phone, Calendar, FileIcon, Paperclip, User, Settings2, X, Search, GripVertical, Plus, Trash2, Maximize2, Download, ExternalLink, Eye, MoreHorizontal
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CellRendererProps {
    blockId: string;
    row: DatabaseRow;
    property: DatabaseProperty;
}

export const CellRenderer = ({ blockId, row, property }: CellRendererProps) => {
    const { updateDatabaseRow, addDatabasePropertyOption } = useRoadmapStore();
    const value = row.values[property.key];
    const isRowChecked = Object.values(row.values).some(v => v === true);

    const updateTaskField = async (newValue: any) => {
        // Instant Save: Updates local state immediately
        updateDatabaseRow(blockId, row.id, {
            values: { ...row.values, [property.key]: newValue }
        });

        // TODO: Implement Supabase sync here
        // await supabase.from('tasks').update({ [property.key]: newValue }).eq('id', row.id);
    };

    // Render based on Property Type
    switch (property.type) {
        case 'status':
            return (
                <StatusCell
                    value={value}
                    onChange={updateTaskField}
                />
            );
        case 'priority':
            return (
                <PriorityCell
                    value={value}
                    onChange={updateTaskField}
                />
            );
        case 'select':
        case 'multi-select':
            return (
                <SelectCell
                    blockId={blockId}
                    value={value}
                    property={property}
                    onChange={updateTaskField}
                    multi={property.type === 'multi-select'}
                />
            );
        case 'number':
            return (
                <div className="flex items-center justify-end h-full w-full pr-2">
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                                updateTaskField(val);
                            }
                        }}
                        placeholder="0"
                        className="w-full bg-transparent border-none text-[13px] text-zinc-100 placeholder:text-zinc-800 focus:ring-0 outline-none h-full py-1.5 font-medium text-right font-mono"
                    />
                </div>
            );
        case 'checkbox':
            return (
                <CheckboxCell
                    value={value}
                    onChange={updateTaskField}
                />
            );
        case 'url':
            return (
                <div className="flex items-center gap-2 h-full group/cell px-1">
                    <a
                        href={value?.startsWith('http') ? value : `https://${value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn("p-1 rounded hover:bg-white/5 transition-colors", !value && "pointer-events-none opacity-20")}
                    >
                        <Link size={12} className="text-zinc-600 group-hover/cell:text-cyan-400 transition-colors" />
                    </a>
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => updateTaskField(e.target.value)}
                        placeholder="https://"
                        className="w-full bg-transparent border-none text-[13px] text-zinc-100 placeholder:text-zinc-700 focus:ring-0 outline-none h-full py-1.5 underline decoration-transparent hover:decoration-zinc-700 focus:decoration-zinc-700 transition-all font-medium"
                    />
                </div>
            );
        case 'email':
            return (
                <EmailCell
                    value={value}
                    onChange={updateTaskField}
                />
            );
        case 'phone':
            return (
                <PhoneCell
                    value={value}
                    onChange={updateTaskField}
                />
            );
        case 'date':
            return (
                <div className="flex items-center gap-2 h-full px-1">
                    <Calendar size={12} className="text-zinc-700" />
                    <input
                        type="date"
                        value={value || ''}
                        onChange={(e) => updateTaskField(e.target.value)}
                        className="w-full bg-transparent border-none text-[12px] text-zinc-100 focus:ring-0 outline-none h-full py-1.5 uppercase font-mono tracking-wider cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-10 [&::-webkit-calendar-picker-indicator]:hover:opacity-50 [&::-webkit-calendar-picker-indicator]:invert"
                    />
                </div>
            );
        case 'file':
            return (
                <FileCell
                    value={value}
                    onChange={updateTaskField}
                />
            );
        case 'person':
            return (
                <PersonCell
                    blockId={blockId}
                    property={property}
                    value={value}
                    onChange={updateTaskField}
                />
            );
        default:
            return (
                <div className="flex items-center h-full w-full px-1 group/title">
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => updateTaskField(e.target.value)}
                        placeholder={property.key === 'title' ? "Untitled" : ""}
                        className={cn(
                            "w-full bg-transparent border-none text-[13px] focus:ring-0 outline-none h-full py-1.5 font-medium transition-all",
                            property.key === 'title' ? "font-bold text-white placeholder:text-zinc-700" : "text-zinc-100 placeholder:text-zinc-700",
                            isRowChecked && property.key === 'title' && "line-through text-zinc-500 opacity-60 decoration-zinc-500/50 decoration-2"
                        )}
                    />
                </div>
            );
    }
};

// Sub-components for Status and Priority (High-Fidelity Custom Dropdowns)
const StatusCell = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const groups = [
        { label: 'To-do', options: ['To Do'] },
        { label: 'In progress', options: ['In Progress'] },
        { label: 'Complete', options: ['Done'] }
    ];

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Done': return "bg-[#1d2a23] text-[#42624e] border-[#42624e]/20";
            case 'In Progress': return "bg-[#253949] text-[#529cca] border-[#529cca]/20";
            case 'To Do': return "bg-[#262626] text-[#9b9b9b] border-[#9b9b9b]/20";
            default: return "bg-[#262626] text-[#9b9b9b] border-[#9b9b9b]/20";
        }
    };

    const getIconColor = (status: string) => {
        switch (status) {
            case 'Done': return "#52ba78";
            case 'In Progress': return "#337ea9";
            default: return "#91918e";
        }
    };

    const toggleMenu = () => {
        if (!isOpen && buttonRef.current) {
            setTriggerRect(buttonRef.current.getBoundingClientRect());
        }
        setIsOpen(!isOpen);
    };

    const activeStatus = value || 'To Do';

    return (
        <div className="relative h-full flex items-center px-1">
            <button
                ref={buttonRef}
                onClick={(e) => {
                    e.stopPropagation();
                    toggleMenu();
                }}
                className={cn(
                    "px-2 py-1 rounded-full text-[11px] font-semibold border transition-all hover:brightness-110 flex items-center gap-1.5",
                    getStatusStyles(activeStatus)
                )}
            >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getIconColor(activeStatus) }} />
                {activeStatus}
            </button>

            {isOpen && triggerRect && createPortal(
                <>
                    <div className="fixed inset-0 z-[10000]" onClick={() => setIsOpen(false)} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                        className="fixed z-[10001] w-[260px] bg-[#1c1c1c] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans"
                        style={{
                            top: triggerRect.top + triggerRect.height + 4,
                            left: triggerRect.left,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header with Search and Current Tag (Notion Style) */}
                        <div className="p-2 border-b border-zinc-800 flex items-center gap-1.5">
                            <div className={cn(
                                "flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap",
                                getStatusStyles(activeStatus)
                            )}>
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getIconColor(activeStatus) }} />
                                {activeStatus}
                                <X size={12} className="ml-0.5 opacity-50 hover:opacity-100 cursor-pointer" onClick={(e) => {
                                    e.stopPropagation();
                                    onChange('To Do');
                                }} />
                            </div>
                            <div className="w-px h-5 bg-zinc-800 mx-0.5" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search..."
                                className="flex-1 bg-transparent border-none text-[12px] text-zinc-100 placeholder:text-zinc-600 focus:ring-0 outline-none p-0"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>

                        {/* Grouped Options */}
                        <div className="p-1 max-h-[350px] overflow-y-auto custom-scrollbar">
                            {groups.map(group => (
                                <div key={group.label} className="mt-3 first:mt-1">
                                    <div className="px-3 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                        {group.label}
                                    </div>
                                    <div className="mt-1 space-y-0.5">
                                        {group.options.map(opt => (
                                            <button
                                                key={opt}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onChange(opt);
                                                    setIsOpen(false);
                                                }}
                                                className="w-full text-left px-3 py-2 rounded-md hover:bg-white/5 transition-colors flex items-center group"
                                            >
                                                <div className={cn(
                                                    "px-2 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5",
                                                    getStatusStyles(opt)
                                                )}>
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getIconColor(opt) }} />
                                                    {opt}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer Action */}
                        <div className="border-t border-zinc-800/50 p-1.5 bg-black/10">
                            <button className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-2 group">
                                <Settings2 size={12} className="opacity-70 group-hover:opacity-100" />
                                <span>Edit property</span>
                            </button>
                        </div>
                    </motion.div>
                </>,
                document.body
            )}
        </div>
    );
};

const PriorityCell = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const options = [
        { label: 'High', color: 'bg-[#4c2825] text-[#eb5757] border-[#eb5757]/20' },
        { label: 'Medium', color: 'bg-[#4d3b22] text-[#e1a93c] border-[#e1a93c]/20' },
        { label: 'Low', color: 'bg-[#262626] text-[#9b9b9b] border-[#9b9b9b]/20' }
    ];

    const getPriorityStyles = (priority: string) => {
        switch (priority) {
            case 'High': return "bg-[#4c2825] text-[#eb5757] border-[#eb5757]/20";
            case 'Medium': return "bg-[#4d3b22] text-[#e1a93c] border-[#e1a93c]/20";
            case 'Low': return "bg-[#262626] text-[#9b9b9b] border-[#9b9b9b]/20";
            default: return "bg-zinc-800/50 text-zinc-500 border-zinc-700/50";
        }
    };

    const toggleMenu = () => {
        if (!isOpen && buttonRef.current) {
            setTriggerRect(buttonRef.current.getBoundingClientRect());
        }
        setIsOpen(!isOpen);
    };

    const activePriority = value || 'None';

    return (
        <div className="relative h-full flex items-center px-1 font-sans">
            <button
                ref={buttonRef}
                onClick={(e) => {
                    e.stopPropagation();
                    toggleMenu();
                }}
                className={cn(
                    "px-2 py-0.5 rounded text-[11px] font-bold border transition-all hover:brightness-110",
                    getPriorityStyles(activePriority)
                )}
            >
                {activePriority}
            </button>

            {isOpen && triggerRect && createPortal(
                <>
                    <div className="fixed inset-0 z-[10000]" onClick={() => setIsOpen(false)} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                        className="fixed z-[10001] w-[220px] bg-[#1c1c1c] border border-zinc-800 rounded-xl shadow-2xl p-1 overflow-hidden"
                        style={{
                            top: triggerRect.top + triggerRect.height + 4,
                            left: triggerRect.left,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-2 flex items-center gap-2 border-b border-zinc-800/50 mb-1">
                            <div className={cn("px-2 py-0.5 rounded text-[11px] font-bold border flex items-center gap-1", getPriorityStyles(activePriority))}>
                                {activePriority}
                                {activePriority !== 'None' && (
                                    <X size={10} className="ml-1 opacity-50 hover:opacity-100 cursor-pointer" onClick={(e) => {
                                        e.stopPropagation();
                                        onChange('None');
                                    }} />
                                )}
                            </div>
                        </div>

                        <div className="px-3 py-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                            Select an option
                        </div>

                        <div className="space-y-0.5">
                            {options.map(opt => (
                                <button
                                    key={opt.label}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChange(opt.label);
                                        setIsOpen(false);
                                    }}
                                    className="w-full text-left px-2 py-2 rounded-md flex items-center gap-2 hover:bg-white/5 transition-colors group"
                                >
                                    <GripVertical size={12} className="text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className={cn("px-2 py-0.5 rounded text-[11px] font-bold border", opt.color)}>
                                        {opt.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </>,
                document.body
            )}
        </div>
    );
};

const getTagColor = (tag: string) => {
    const colors = [
        "bg-blue-500/10 text-blue-400 border-blue-500/20",
        "bg-purple-500/10 text-purple-400 border-purple-500/20",
        "bg-pink-500/10 text-pink-400 border-pink-500/20",
        "bg-orange-500/10 text-orange-400 border-orange-500/20",
        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    ];
    const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
};

const SelectCell = ({ blockId, value, onChange, multi, property }: { blockId: string, value: any, onChange: (val: any) => void, multi?: boolean, property: DatabaseProperty }) => {
    const { addDatabasePropertyOption } = useRoadmapStore();
    const [isOpen, setIsOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const availableOptions = property.options || ['Product', 'Design', 'Marketing', 'Engineering', 'Sales'];
    const selectedValues = multi ? (Array.isArray(value) ? value : []) : (value ? [value] : []);

    const toggleMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (buttonRef.current) {
            setTriggerRect(buttonRef.current.getBoundingClientRect());
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative h-full w-full flex items-center p-0">
            <button
                ref={buttonRef}
                onClick={toggleMenu}
                type="button"
                className={cn(
                    "flex flex-wrap gap-1 items-center w-full h-full min-h-[40px] px-2 py-1 rounded-none transition-all text-left outline-none border-none bg-transparent",
                    isOpen
                        ? "bg-white/10 ring-2 ring-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.4)] z-[50]"
                        : "hover:bg-white/[0.04]"
                )}
            >
                {selectedValues.length === 0 && (
                    <span className="text-zinc-600 text-[13px] italic select-none">Empty</span>
                )}
                {selectedValues.map(val => (
                    <span key={val} className={cn("px-2 py-0.5 rounded text-[11px] font-medium border shadow-sm whitespace-nowrap", getTagColor(val))}>
                        {val}
                    </span>
                ))}
            </button>

            {/* DIRECT PORTAL - NO ANIMATION HANGUPS */}
            {isOpen && triggerRect && createPortal(
                <div
                    className="fixed inset-0 z-[999999]"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(false);
                    }}
                >
                    <div
                        className="absolute w-72 bg-[#1c1c1c] border-2 border-zinc-700 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
                        style={{
                            top: triggerRect.top + triggerRect.height + 300 > window.innerHeight
                                ? Math.max(10, triggerRect.top - 308)
                                : triggerRect.top + triggerRect.height + 4,
                            left: Math.min(window.innerWidth - 300, triggerRect.left),
                            maxHeight: '300px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* SEARCH & ADD HEADER */}
                        <div className="p-3 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-2">
                            <Search size={14} className="text-zinc-500" />
                            <input
                                autoFocus
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                placeholder="Search or type to create..."
                                className="flex-1 bg-transparent border-none text-[13px] text-white placeholder:text-zinc-600 focus:ring-0 outline-none p-0"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && searchValue) {
                                        const exists = availableOptions.find(o => o.toLowerCase() === searchValue.toLowerCase());
                                        if (exists) {
                                            if (multi) {
                                                if (!selectedValues.includes(exists)) onChange([...selectedValues, exists]);
                                            } else {
                                                onChange(exists);
                                                setIsOpen(false);
                                            }
                                        } else {
                                            addDatabasePropertyOption(blockId, property.id, searchValue);
                                            if (multi) onChange([...selectedValues, searchValue]);
                                            else {
                                                onChange(searchValue);
                                                setIsOpen(false);
                                            }
                                        }
                                        setSearchValue("");
                                    }
                                }}
                            />
                        </div>

                        {/* OPTIONS LIST */}
                        <div className="flex-1 overflow-y-auto p-1 custom-scrollbar min-h-[100px]">
                            <div className="px-2 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Options</div>
                            {availableOptions.filter(o => o.toLowerCase().includes(searchValue.toLowerCase())).map(opt => (
                                <button
                                    key={opt}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (multi) {
                                            const next = selectedValues.includes(opt)
                                                ? selectedValues.filter(v => v !== opt)
                                                : [...selectedValues, opt];
                                            onChange(next);
                                        } else {
                                            onChange(opt);
                                            setIsOpen(false);
                                        }
                                    }}
                                    className="w-full text-left px-2 py-2 rounded-lg text-sm text-zinc-300 hover:bg-white/10 transition-colors flex items-center justify-between group"
                                >
                                    <span className={cn("px-2 py-0.5 rounded text-[11px] font-medium border shadow-sm", getTagColor(opt))}>{opt}</span>
                                    {selectedValues.includes(opt) && <Check size={14} className="text-cyan-500" strokeWidth={3} />}
                                </button>
                            ))}

                            {/* CREATE OPTION BUTTON */}
                            {searchValue && !availableOptions.some(o => o.toLowerCase() === searchValue.toLowerCase()) && (
                                <button
                                    onClick={() => {
                                        addDatabasePropertyOption(blockId, property.id, searchValue);
                                        if (multi) onChange([...selectedValues, searchValue]);
                                        else {
                                            onChange(searchValue);
                                            setIsOpen(false);
                                        }
                                        setSearchValue("");
                                    }}
                                    className="w-full text-left px-3 py-3 rounded-lg text-[12px] text-cyan-400 hover:bg-cyan-400/10 transition-colors flex items-center gap-2 mt-2 border border-dashed border-cyan-400/40 bg-zinc-900/50"
                                >
                                    <Plus size={14} strokeWidth={3} />
                                    <span className="font-bold">Create "{searchValue}"</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
const PersonCell = ({ blockId, property, value, onChange }: { blockId: string, property: DatabaseProperty, value: string, onChange: (val: string) => void }) => {
    const { addDatabasePropertyOption } = useRoadmapStore();
    const [isOpen, setIsOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const availablePeople = property.options || ['Alex', 'Sarah', 'Ivan', 'Mia', 'John'];

    const toggleMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (buttonRef.current) {
            setTriggerRect(buttonRef.current.getBoundingClientRect());
        }
        setIsOpen(!isOpen);
    };

    const colors = [
        'from-indigo-500 to-purple-500',
        'from-emerald-500 to-teal-500',
        'from-rose-500 to-pink-500',
        'from-amber-500 to-orange-500',
        'from-cyan-500 to-blue-500',
        'from-fuchsia-500 to-purple-600',
    ];

    const getGradient = (name: string) => {
        if (!name) return 'from-zinc-800 to-zinc-900';
        const index = Math.abs(name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
        return colors[index];
    };

    return (
        <div className="relative h-full w-full flex items-center px-1">
            <button
                ref={buttonRef}
                onClick={toggleMenu}
                type="button"
                className={cn(
                    "flex items-center gap-2 w-full h-full min-h-[32px] px-2 py-1 rounded transition-all text-left outline-none group/btn",
                    isOpen ? "bg-white/10 ring-1 ring-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]" : "hover:bg-white/5"
                )}
            >
                <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-xl border border-white/10 shrink-0 bg-gradient-to-br transition-transform group-hover/btn:scale-110",
                    getGradient(value)
                )}>
                    {value ? value.substring(0, 1).toUpperCase() : <User size={12} className="text-zinc-600" />}
                </div>
                {value ? (
                    <span className="text-[13px] text-zinc-100 font-bold truncate">{value}</span>
                ) : (
                    <span className="text-zinc-700 text-[13px] font-medium">Assignee...</span>
                )}
            </button>

            {isOpen && triggerRect && createPortal(
                <div
                    className="fixed inset-0 z-[999999]"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="absolute w-64 bg-[#1c1c1c] border border-zinc-800 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
                        style={{
                            top: triggerRect.top + triggerRect.height + 300 > window.innerHeight
                                ? Math.max(10, triggerRect.top - 308)
                                : triggerRect.top + triggerRect.height + 4,
                            left: Math.min(window.innerWidth - 270, triggerRect.left),
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-3 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-2">
                            <Search size={14} className="text-zinc-500" />
                            <input
                                autoFocus
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                placeholder="Search or add person..."
                                className="flex-1 bg-transparent border-none text-[13px] text-white placeholder:text-zinc-600 focus:ring-0 outline-none p-0"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && searchValue) {
                                        const exists = availablePeople.find(p => p.toLowerCase() === searchValue.toLowerCase());
                                        if (exists) onChange(exists);
                                        else {
                                            addDatabasePropertyOption(blockId, property.id, searchValue);
                                            onChange(searchValue);
                                        }
                                        setIsOpen(false);
                                        setSearchValue("");
                                    }
                                }}
                            />
                        </div>
                        <div className="max-h-[220px] overflow-y-auto p-1 custom-scrollbar min-h-[100px]">
                            <div className="px-2 py-1.5 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Team Members</div>
                            {availablePeople.filter(p => p.toLowerCase().includes(searchValue.toLowerCase())).map(person => (
                                <button
                                    key={person}
                                    onClick={() => {
                                        onChange(person);
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-zinc-300 hover:bg-white/10 transition-colors group/row"
                                >
                                    <div className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br shadow-md border border-white/5 transition-transform group-hover/row:scale-110",
                                        getGradient(person)
                                    )}>
                                        {person.substring(0, 1).toUpperCase()}
                                    </div>
                                    <span className="flex-1 text-left font-medium">{person}</span>
                                    {value === person && <Check size={14} className="text-cyan-500" strokeWidth={3} />}
                                </button>
                            ))}
                            {searchValue && !availablePeople.some(p => p.toLowerCase() === searchValue.toLowerCase()) && (
                                <button
                                    onClick={() => {
                                        addDatabasePropertyOption(blockId, property.id, searchValue);
                                        onChange(searchValue);
                                        setIsOpen(false);
                                        setSearchValue("");
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-[12px] text-cyan-400 hover:bg-cyan-400/10 transition-colors mt-2 border border-dashed border-cyan-400/40 bg-zinc-900/50"
                                >
                                    <Plus size={14} />
                                    <span className="font-bold">Add "{searchValue}"</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

const FileCell = ({ value, onChange }: { value: any, onChange: (val: any) => void }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
    const settingsBtnRef = useRef<HTMLButtonElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onChange({
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified,
                url: URL.createObjectURL(file)
            });
        }
    };

    const removeFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
        setIsOpen(false);
    };

    const togglePopup = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (settingsBtnRef.current) {
            setTriggerRect(settingsBtnRef.current.getBoundingClientRect());
        }
        setIsOpen(!isOpen);
    };

    const formatSize = (bytes: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="flex items-center gap-2 h-full px-1 group/file overflow-hidden">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />
            {value ? (
                <div className="flex items-center gap-0 w-full max-w-full group/badge-container h-7">
                    {/* QUICK OPEN PART */}
                    <a
                        href={value.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Click to open file"
                        className={cn(
                            "flex items-center gap-2 px-2 py-1 rounded-l h-full bg-zinc-800/80 border border-zinc-700/50 text-zinc-100 hover:bg-zinc-700 hover:text-cyan-400 transition-all cursor-pointer overflow-hidden border-r-0",
                            isOpen && "bg-zinc-700 ring-1 ring-cyan-500/50 border-cyan-500/50"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <FileIcon size={12} className="shrink-0" />
                        <span className="text-[11px] font-bold truncate max-w-[100px]">{value.name || value}</span>
                        <Eye size={10} className="opacity-0 group-hover/badge-container:opacity-100 transition-opacity ml-1" />
                    </a>

                    {/* SETTINGS TRIGGER */}
                    <button
                        ref={settingsBtnRef}
                        onClick={togglePopup}
                        className={cn(
                            "flex items-center justify-center w-7 h-full rounded-r bg-zinc-800/80 border border-zinc-700/50 border-l-0 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-all",
                            isOpen && "bg-zinc-700 border-cyan-500/50"
                        )}
                    >
                        <MoreHorizontal size={14} />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5 text-zinc-700 hover:text-zinc-500 transition-all border border-transparent hover:border-white/5 w-full text-left"
                >
                    <Paperclip size={12} />
                    <span className="text-[11px] font-medium">Add file</span>
                </button>
            )}

            {/* DETAILS POPUP */}
            {isOpen && triggerRect && createPortal(
                <div
                    className="fixed inset-0 z-[999999]"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="absolute w-80 bg-[#1c1c1c] border border-zinc-700 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col p-4"
                        style={{
                            top: triggerRect.top + triggerRect.height + 4,
                            left: Math.min(window.innerWidth - 330, triggerRect.left - 250),
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800 shrink-0 shadow-inner">
                                <FileIcon size={24} className="text-cyan-400" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-[14px] font-bold text-white truncate leading-tight">{value.name || "Unknown File"}</p>
                                <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest mt-1">
                                    {formatSize(value.size)} • {value.type?.split('/')[1] || 'FILE'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2 mb-4">
                            {value.url && (
                                <a
                                    href={value.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg text-xs font-black transition-all shadow-lg active:scale-95"
                                >
                                    <ExternalLink size={14} strokeWidth={3} />
                                    OPEN FULL VIEW
                                </a>
                            )}
                            <a
                                href={value.url}
                                download={value.name}
                                className="flex items-center justify-center gap-2 w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold border border-zinc-700 transition-all active:scale-95"
                            >
                                <Download size={14} />
                                DOWNLOAD
                            </a>
                        </div>

                        <div className="h-px bg-zinc-800/50 mb-4" />

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    fileInputRef.current?.click();
                                }}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-transparent hover:bg-white/5 text-zinc-400 rounded-lg text-[11px] font-bold border border-zinc-800 transition-colors"
                            >
                                <Paperclip size={12} />
                                Change
                            </button>
                            <button
                                onClick={removeFile}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-transparent hover:bg-rose-500/10 text-rose-500/50 hover:text-rose-500 rounded-lg text-[11px] font-bold border border-zinc-800 hover:border-rose-500/20 transition-colors"
                            >
                                <Trash2 size={12} />
                                Remove
                            </button>
                        </div>

                        {value.url && (value.type?.startsWith('image/') || value.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) && (
                            <div className="mt-5 rounded-lg overflow-hidden border border-zinc-800 bg-black/20 group/preview relative">
                                <img src={value.url} alt="Preview" className="w-full h-auto max-h-[180px] object-contain opacity-80 group-hover/preview:opacity-100 transition-opacity" />
                                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity">
                                    <a
                                        href={value.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black text-white hover:bg-white/20 flex items-center gap-1.5"
                                    >
                                        <Maximize2 size={10} />
                                        PREVIEW
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
const EmailCell = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const [localValue, setLocalValue] = useState(value || '');
    const [isValid, setIsValid] = useState(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    useEffect(() => {
        setLocalValue(value || '');
        setIsValid(true);
    }, [value]);

    const handleBlur = () => {
        if (localValue === '') {
            onChange('');
            setIsValid(true);
            return;
        }

        if (emailRegex.test(localValue)) {
            onChange(localValue);
            setIsValid(true);
        } else {
            setIsValid(false);
            // Revert or keep? User says "nahi le entry". I'll keep local invalid but don't call onChange (persistence)
        }
    };

    return (
        <div className={cn(
            "flex items-center gap-2 h-full group/cell px-1 transition-all duration-300",
            !isValid && "bg-red-500/5 ring-1 ring-red-500/50"
        )}>
            <a
                href={isValid && localValue ? `mailto:${localValue}` : undefined}
                className={cn(
                    "p-1 rounded hover:bg-white/5 transition-colors",
                    (!localValue || !isValid) && "pointer-events-none opacity-20"
                )}
            >
                <Mail
                    size={12}
                    className={cn(
                        "transition-colors",
                        isValid ? "text-zinc-600 group-hover/cell:text-emerald-400" : "text-red-400"
                    )}
                />
            </a>
            <input
                type="text"
                value={localValue}
                onChange={(e) => {
                    setLocalValue(e.target.value);
                    if (!isValid) setIsValid(true); // Clear error while typing
                }}
                onBlur={handleBlur}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleBlur();
                }}
                placeholder="user@example.com"
                className={cn(
                    "w-full bg-transparent border-none text-[13px] placeholder:text-zinc-700 focus:ring-0 outline-none h-full py-1.5 font-medium transition-colors",
                    isValid ? "text-zinc-100" : "text-red-400"
                )}
            />
        </div>
    );
};

const PhoneCell = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const [localValue, setLocalValue] = useState(value || '');
    const [isValid, setIsValid] = useState(true);

    // Regex: 10+ digits OR +countryCode [space] 10+ digits
    const phoneRegex = /^(\d{10,}|\+\d{1,4}\s\d{10,})$/;

    useEffect(() => {
        setLocalValue(value || '');
        setIsValid(true);
    }, [value]);

    const handleBlur = () => {
        if (localValue === '') {
            onChange('');
            setIsValid(true);
            return;
        }

        if (phoneRegex.test(localValue)) {
            onChange(localValue);
            setIsValid(true);
        } else {
            setIsValid(false);
            // Don't persist invalid data
        }
    };

    return (
        <div className={cn(
            "flex items-center gap-2 h-full group/cell px-1 transition-all duration-300",
            !isValid && "bg-red-500/5 ring-1 ring-red-500/50"
        )}>
            <a
                href={isValid && localValue ? `tel:${localValue}` : undefined}
                className={cn(
                    "p-1 rounded hover:bg-white/5 transition-colors",
                    (!localValue || !isValid) && "pointer-events-none opacity-20"
                )}
            >
                <Phone
                    size={12}
                    className={cn(
                        "transition-colors",
                        isValid ? "text-zinc-600 group-hover/cell:text-blue-400" : "text-red-400"
                    )}
                />
            </a>
            <input
                type="text"
                value={localValue}
                onChange={(e) => {
                    setLocalValue(e.target.value);
                    if (!isValid) setIsValid(true);
                }}
                onBlur={handleBlur}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleBlur();
                }}
                placeholder="+91 9876543210"
                className={cn(
                    "w-full bg-transparent border-none text-[13px] placeholder:text-zinc-700 focus:ring-0 outline-none h-full py-1.5 font-medium transition-colors",
                    isValid ? "text-zinc-100" : "text-red-400"
                )}
            />
        </div>
    );
};

const CheckboxCell = ({ value, onChange }: { value: any, onChange: (val: any) => void }) => {
    return (
        <div className="flex items-center justify-center h-full w-full">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onChange(!value);
                }}
                className="relative group p-1"
            >
                <div className={cn(
                    "w-[22px] h-[22px] rounded-[7px] border-2 flex items-center justify-center transition-all duration-500 relative overflow-hidden",
                    value
                        ? "bg-gradient-to-br from-cyan-400 to-blue-600 border-transparent shadow-[0_0_20px_rgba(6,182,212,0.5),inset_0_0_8px_rgba(255,255,255,0.3)] scale-110"
                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
                )}>
                    <AnimatePresence>
                        {value && (
                            <motion.svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-white drop-shadow-md"
                                initial="initial"
                                animate="animate"
                                exit="exit"
                            >
                                <motion.path
                                    d="M20 6L9 17L4 12"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{
                                        pathLength: 1,
                                        opacity: 1,
                                        transition: { delay: 0.1, duration: 0.4, ease: "easeOut" }
                                    }}
                                    exit={{ pathLength: 0, opacity: 0, transition: { duration: 0.2 } }}
                                />
                            </motion.svg>
                        )}
                    </AnimatePresence>

                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 rounded-md bg-cyan-400 opacity-0 group-hover:opacity-10 transition-opacity" />
                </div>

                {/* Orbital Particle Animation */}
                {value && (
                    <motion.div
                        className="absolute inset-0 rounded-full border border-cyan-500/50"
                        initial={{ scale: 0.8, opacity: 0.8 }}
                        animate={{ scale: 2.2, opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                )}
            </button>
        </div>
    );
};

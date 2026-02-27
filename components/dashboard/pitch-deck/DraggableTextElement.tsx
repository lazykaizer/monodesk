"use client";

import { useState, useRef, useEffect } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { Move } from 'lucide-react';

interface DraggableTextElementProps {
    x: number;
    y: number;
    content: string;
    isEditing: boolean;
    onContentChange: (content: string) => void;
    onPositionChange: (x: number, y: number) => void;
    onEditModeChange: (isEditing: boolean) => void;
    layout?: 'left' | 'right' | 'bg' | 'hero_center' | 'split_editorial' | 'feature_grid';
    bgOpacity?: number;
}

export default function DraggableTextElement({
    x,
    y,
    content,
    isEditing,
    onContentChange,
    onPositionChange,
    onEditModeChange,
    layout = 'bg',
    bgOpacity = 80,
}: DraggableTextElementProps) {
    const nodeRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isSelected, setIsSelected] = useState(false);
    const isFocused = useRef(false);

    // Sync isEditing with isSelected for visual feedback
    useEffect(() => {
        if (isEditing) setIsSelected(true);
    }, [isEditing]);

    const handleDragStop = (e: DraggableEvent, data: DraggableData) => {
        setTimeout(() => setIsDragging(false), 200);
        onPositionChange(data.x, data.y);
    };

    const handleDragStart = () => {
        setIsDragging(true);
        setIsSelected(true);
    };

    // Click outside to deselect
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (nodeRef.current && !nodeRef.current.contains(e.target as Node)) {
                setIsSelected(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Initial content setup - only happens once or when slide fundamentally changes
    // CRITICAL: We don't overwrite innerHTML if the user is currently focusing/editing!
    useEffect(() => {
        if (editorRef.current && !isFocused.current && editorRef.current.innerHTML !== content) {
            editorRef.current.innerHTML = content;
        }
    }, [content]);

    return (
        <Draggable
            nodeRef={nodeRef as any}
            position={{ x, y }}
            onStart={handleDragStart}
            onStop={handleDragStop}
            handle=".drag-handle"
            bounds="parent"
        >
            <div
                ref={nodeRef}
                className={`
                    absolute group/draggable
                    ${isEditing ? 'z-[100]' : (isSelected ? 'z-50' : 'z-10')}
                    ${isSelected && !isEditing ? 'ring-2 ring-cyan-500/50 rounded-xl transition-all' : ''}
                `}
                onClick={() => setIsSelected(true)}
            >
                {/* TOOLBAR-STYLE DRAG HANDLE (Only on Selection) */}
                {isSelected && !isDragging && (
                    <div className="absolute -top-10 left-0 flex items-center gap-2 bg-[#111] border border-white/10 px-3 py-1.5 rounded-lg shadow-2xl drag-handle cursor-move animate-in fade-in slide-in-from-bottom-2 select-none">
                        <Move size={14} className="text-cyan-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Move Element</span>
                    </div>
                )}

                <div
                    className="p-8 transition-all duration-300 pointer-events-auto rounded-xl overflow-visible"
                    style={{
                        backgroundColor: `rgba(0, 0, 0, ${bgOpacity / 100})`,
                        backdropFilter: bgOpacity > 0 ? 'blur(10px)' : 'none'
                    }}
                    onDoubleClick={() => onEditModeChange(true)}
                >
                    <div
                        ref={editorRef}
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onFocus={() => { isFocused.current = true; }}
                        onBlur={(e) => {
                            isFocused.current = false;
                            const newText = e.currentTarget.innerHTML;
                            if (newText !== content) {
                                onContentChange(newText);
                            }
                        }}
                        className={`
                            prose prose-invert max-w-none focus:outline-none rounded-lg p-2 transition-all
                            ${layout === 'hero_center' ? 'text-center items-center flex flex-col justify-center' : ''}
                            ${layout === 'hero_center' ? 'prose-h1:text-6xl md:prose-h1:text-7xl' : 'prose-h1:text-4xl md:prose-h1:text-5xl'}
                            prose-h1:font-black prose-h1:tracking-tight prose-h1:mb-4 prose-h1:text-[#ffffff] prose-h1:leading-[1.1]
                            prose-h2:text-xl md:prose-h2:text-2xl prose-h2:font-light prose-h2:mb-6 prose-h2:text-[#93c5fd] prose-h2:leading-snug
                            prose-p:text-lg prose-p:text-[#d1d5db] prose-p:leading-relaxed
                            
                            prose-ul:list-disc prose-ul:pl-10 prose-ul:space-y-1 prose-ul:my-4 prose-ul:block
                            prose-ol:list-decimal prose-ol:pl-10 prose-ol:space-y-1 prose-ol:my-4 prose-ol:block
                            prose-li:text-lg prose-li:text-[#e5e7eb] prose-li:font-medium prose-li:marker:text-cyan-500
                            
                            prose-strong:text-[#ffffff] prose-strong:font-bold
                            selection:bg-cyan-500/30 selection:text-white
                            outline-none focus:ring-1 focus:ring-cyan-500/20
                            select-text font-inherit
                        `}
                        style={{
                            textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                            userSelect: 'text',
                            WebkitUserSelect: 'text',
                            whiteSpace: 'pre-wrap'
                        }}
                    />
                </div>
            </div>
        </Draggable>
    );
}

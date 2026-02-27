"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRoadmapStore } from '@/lib/store/useRoadmapStore';
import { RoadmapBlockRenderer } from './RoadmapBlockRenderer';
import { SlashMenu } from './SlashMenu';
import { HomeView } from '@/components/dashboard/layout/HomeView';
import { SearchModal } from '@/components/dashboard/layout/SearchModal';
import { EmojiPicker } from '@/components/dashboard/roadmap/EmojiPicker';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { RoadmapCopilot } from './RoadmapCopilot';

import { useSearchParams } from 'next/navigation';

export default function RoadmapEngine() {
    const searchParams = useSearchParams();
    const urlPageId = searchParams.get('pageId');

    const {
        pages,
        activePageId,
        setActivePageId,
        currentView,
        blocks,
        addBlock,
        reorderBlocks,
        addPage,
        updatePage,
        isSearchOpen,
        slashQuery,
        slashMenuState,
        setSlashMenuState,
        undo,
        copy,
        paste,
        setFocusedId,
        setFocusedRowId,
        sidebarOpen,
        toggleSidebar
    } = useRoadmapStore();

    const containerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    useEffect(() => {
        if (urlPageId && urlPageId !== activePageId) {
            setActivePageId(urlPageId);
        }
    }, [urlPageId, activePageId, setActivePageId]);

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // Check if user is typing in a textarea or input
            const isTyping = e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement;

            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'z':
                        if (!isTyping) {
                            e.preventDefault();
                            undo();
                        }
                        break;
                    case 'c':
                        // Only trigger block/row copy if no text is selected
                        if (!window.getSelection()?.toString()) {
                            copy();
                        }
                        break;
                    case 'v':
                        if (!isTyping) {
                            e.preventDefault();
                            paste();
                        }
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [undo, copy, paste]);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Only auto-create a page if there are literally zero pages and we aren't in Home view
    useEffect(() => {
        if (mounted && pages.length === 0 && currentView === 'editor') {
            addPage();
        }
    }, [pages.length, addPage, mounted, currentView]);

    const activePage = useMemo(() =>
        pages.find(p => p.id === activePageId),
        [pages, activePageId]);

    const activeBlocks = useMemo(() =>
        blocks
            .filter(b => b.pageId === activePageId && !b.parentId)
            .sort((a, b) => a.order - b.order),
        [blocks, activePageId]);

    const onDragEnd = (result: any) => {
        if (!result.destination) return;
        reorderBlocks(result.source.index, result.destination.index);
    };

    if (!mounted) {
        return (
            <div className="h-screen bg-[#191919] flex items-center justify-center">
                <RotateCcw className="animate-spin text-zinc-800" size={32} />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col relative bg-transparent">

            {/* INFINITE CANVAS / DASHBOARD CONTAINER */}
            <div
                ref={containerRef}
                className="flex-1 overflow-visible"
            >
                {currentView === 'home' ? (
                    <HomeView />
                ) : (
                    /* THE "BOTTOMLESS" WRAPPER */
                    <div className="flex-1 flex flex-col items-center pt-24 px-6 sm:px-10 w-full">
                        <div
                            className="w-full max-w-4xl flex-1 flex flex-col pt-4"
                            onClick={(e) => {
                                if (e.target === e.currentTarget && activePageId) {
                                    addBlock('text');
                                    setFocusedId(null);
                                    setFocusedRowId(null, null);
                                }
                            }}
                        >


                            {/* PAGE HEADER (Title & Icon) */}
                            {activePage && (
                                <div className="flex items-center gap-6 mb-12 group/header">
                                    <div className="text-6xl shrink-0 relative">
                                        <span
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            className="cursor-pointer hover:bg-white/5 rounded-xl p-2 transition-colors block"
                                        >
                                            {activePage.icon}
                                        </span>

                                        <AnimatePresence>
                                            {showEmojiPicker && (
                                                <div className="absolute top-full left-0 mt-4 z-[200]">
                                                    <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)} />
                                                    <EmojiPicker
                                                        onSelect={(emoji) => {
                                                            updatePage(activePage.id, { icon: emoji });
                                                            setShowEmojiPicker(false);
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <input
                                        value={activePage.title}
                                        onChange={(e) => updatePage(activePage.id, { title: e.target.value })}
                                        placeholder="Untitled"
                                        className="w-full bg-transparent border-none text-6xl font-black text-zinc-100 placeholder:text-zinc-800 focus:ring-0 outline-none p-0"
                                    />
                                </div>
                            )}

                            {/* BLOCKS AREA */}
                            <DragDropContext onDragEnd={onDragEnd}>
                                <Droppable droppableId="blocks-canvas">
                                    {(provided) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="space-y-0.5 min-h-[10px]"
                                        >
                                            <AnimatePresence initial={false}>
                                                {activeBlocks.map((block, idx) => (
                                                    <Draggable key={block.id} draggableId={block.id} index={idx}>
                                                        {(provided, snapshot) => (
                                                            <motion.div
                                                                layout
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                id={block.id}
                                                                className={cn(
                                                                    "relative group/block transition-all duration-300",
                                                                    snapshot.isDragging && "z-[100] shadow-2xl scale-[1.01] bg-zinc-900/80 rounded-xl ring-1 ring-white/10 backdrop-blur-sm"
                                                                )}
                                                            >
                                                                <RoadmapBlockRenderer
                                                                    block={block}
                                                                    dragHandleProps={provided.dragHandleProps}
                                                                />
                                                            </motion.div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                            </AnimatePresence>
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>

                            {/* INVISIBLE CLICK CATCHER (For bottom tapping) */}
                            <div
                                className="flex-1 min-h-[20vh] cursor-text"
                                onClick={() => activePageId && addBlock('text')}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* SLASH COMMAND MENU */}
            <AnimatePresence>
                {slashMenuState && (
                    <div key="slash-menu-portal" className="relative z-[100]">
                        <div className="fixed inset-0 bg-transparent" onClick={() => setSlashMenuState(null)} />
                        <SlashMenu
                            position={slashMenuState}
                            onClose={() => setSlashMenuState(null)}
                            targetIndex={blocks.findIndex(b => b.id === slashMenuState.blockId) + 1}
                            triggerBlockId={slashMenuState.blockId}
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* AI COPILOT */}
            <RoadmapCopilot />

            {/* SEARCH MODAL */}
            <SearchModal />
        </div>
    );
}

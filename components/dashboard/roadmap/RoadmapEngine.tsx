"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, RotateCcw, PanelLeft, Home, Sparkles } from 'lucide-react';
import { PageContextMenu } from '@/components/dashboard/roadmap/PageContextMenu';
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
        deletePage,
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
    const mobileEmojiInputRef = useRef<HTMLInputElement>(null);
    const [mounted, setMounted] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
        <div className="flex-1 flex flex-col relative bg-transparent pb-20 lg:pb-0">

            {/* MOBILE PAGES DRAWER */}
            <AnimatePresence>
                {mobileSidebarOpen && (
                    <>
                        <motion.div
                            key="mobile-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/70 z-[150] lg:hidden"
                            onClick={() => setMobileSidebarOpen(false)}
                        />
                        <motion.div
                            key="mobile-drawer"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="fixed top-0 left-0 h-full w-72 bg-[#191919] border-r border-white/10 z-[160] flex flex-col pt-16 lg:hidden"
                        >
                            <nav className="px-3 space-y-1 mb-4 mt-2">
                                <button
                                    onClick={() => { setActivePageId(null); setMobileSidebarOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-all text-left text-zinc-400 hover:text-white"
                                >
                                    <Home size={18} />
                                    <span className="text-sm font-semibold">Home</span>
                                </button>
                            </nav>
                            <div className="flex items-center justify-between px-5 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">My Pages</span>
                                <button onClick={() => { addPage(); setMobileSidebarOpen(false); }} className="p-1 hover:bg-white/5 rounded text-zinc-500">
                                    <Plus size={14} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
                                {pages.map((page) => (
                                    <div
                                        key={page.id}
                                        onClick={() => { setActivePageId(page.id); setMobileSidebarOpen(false); }}
                                        className={cn(
                                            "flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors",
                                            activePageId === page.id ? "bg-white/10 text-zinc-100" : "text-zinc-400 hover:bg-white/5"
                                        )}
                                    >
                                        <span className="text-base shrink-0">{page.icon}</span>
                                        {page.isFavorite && (
                                            <Sparkles size={10} className="fill-blue-400 text-blue-400 shrink-0" />
                                        )}
                                        <span className="text-sm font-medium truncate flex-1">{page.title || 'Untitled'}</span>
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <PageContextMenu page={page} />
                                        </div>
                                    </div>
                                ))}
                                {pages.length === 0 && (
                                    <p className="px-2 py-2 text-[10px] italic text-zinc-600">No pages yet.</p>
                                )}
                                <button
                                    onClick={() => { addPage(); setMobileSidebarOpen(false); }}
                                    className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors text-zinc-500 hover:text-zinc-400"
                                >
                                    <Plus size={14} />
                                    <span className="text-sm font-medium">New Page</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* MOBILE TOP BAR (pages toggle) */}
            <div className="flex lg:hidden items-center gap-3 px-2 py-2 border-b border-white/5 bg-[#191919]/90 sticky top-0 z-[100] backdrop-blur-md">
                <button
                    onClick={() => setMobileSidebarOpen(true)}
                    className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors shrink-0"
                >
                    <PanelLeft size={18} />
                </button>
                {activePage && (
                    <>
                        {/* Emoji — transparent input overlaid so native keyboard opens on tap */}
                        <div className="relative shrink-0 w-10 h-10 flex items-center justify-center">
                            <span className="text-3xl pointer-events-none select-none transition-all duration-150"
                                style={{ filter: 'drop-shadow(0 0 0px transparent)' }}
                                id="mobile-emoji-span"
                            >{activePage.icon}</span>
                            <input
                                ref={mobileEmojiInputRef}
                                type="text"
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck={false}
                                className="absolute inset-0 opacity-0 w-full h-full bg-transparent border-none outline-none cursor-pointer"
                                onFocus={() => {
                                    const wrap = mobileEmojiInputRef.current?.parentElement;
                                    if (wrap) wrap.classList.add('ring-2', 'ring-blue-500/60', 'rounded-xl', 'scale-110');
                                }}
                                onBlur={() => {
                                    const wrap = mobileEmojiInputRef.current?.parentElement;
                                    if (wrap) wrap.classList.remove('ring-2', 'ring-blue-500/60', 'rounded-xl', 'scale-110');
                                }}
                                onChange={(e) => {
                                    const chars = [...e.target.value];
                                    if (chars.length > 0) {
                                        updatePage(activePage.id, { icon: chars[0] });
                                        e.target.value = '';
                                    }
                                }}
                            />
                        </div>
                        <input
                            value={activePage.title}
                            onChange={(e) => updatePage(activePage.id, { title: e.target.value })}
                            placeholder="Untitled"
                            className="flex-1 bg-transparent border-none text-3xl font-black text-zinc-100 placeholder:text-zinc-800 focus:ring-0 outline-none p-0 min-w-0"
                        />
                    </>
                )}
                {!activePage && (
                    <span className="text-3xl font-black text-zinc-400 px-1">Home</span>
                )}
            </div>

            {/* INFINITE CANVAS / DASHBOARD CONTAINER */}
            <div
                ref={containerRef}
                className="flex-1 overflow-visible"
            >
                {currentView === 'home' ? (
                    <HomeView />
                ) : (
                    /* THE "BOTTOMLESS" WRAPPER */
                    <div className="flex-1 flex flex-col items-center pt-6 lg:pt-24 px-4 lg:px-10 w-full">
                        <div
                            className="w-full max-w-4xl flex-1 flex flex-col pt-2 lg:pt-4"
                            onClick={(e) => {
                                if (e.target === e.currentTarget && activePageId) {
                                    addBlock('text');
                                    setFocusedId(null);
                                    setFocusedRowId(null, null);
                                }
                            }}
                        >

                            {/* PAGE HEADER (Title & Icon) — desktop only, mobile uses top bar */}
                            {activePage && (
                                <div className="hidden lg:flex items-center gap-3 lg:gap-6 mb-5 lg:mb-12 group/header">
                                    <div className="text-4xl lg:text-6xl shrink-0 relative">
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
                                        className="w-full bg-transparent border-none text-3xl lg:text-6xl font-black text-zinc-100 placeholder:text-zinc-800 focus:ring-0 outline-none p-0"
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

                            {/* COMMAND HINT — shows after blocks (shifts down as content grows) */}
                            <div
                                className="flex lg:hidden cursor-text py-1"
                                onClick={() => {
                                    if (!activePageId) return;
                                    addBlock('text');
                                    setTimeout(() => {
                                        const store = useRoadmapStore.getState();
                                        const pageBlocks = store.blocks.filter(b => b.pageId === activePageId && !b.parentId);
                                        const last = pageBlocks[pageBlocks.length - 1];
                                        if (last) {
                                            const el = document.getElementById(last.id)?.querySelector('textarea');
                                            el?.focus();
                                        }
                                    }, 80);
                                }}
                            >
                                <span className="text-sm text-zinc-700 font-light select-none">
                                    Press '<span className="text-zinc-500">.</span>' for commands
                                </span>
                            </div>

                            {/* INVISIBLE CLICK CATCHER (For bottom tapping) */}
                            <div
                                className="flex-1 min-h-[8vh] lg:min-h-[20vh] cursor-text"
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

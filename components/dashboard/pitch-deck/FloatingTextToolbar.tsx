"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Type,
    AlignLeft, AlignCenter, AlignRight,
    List, ListOrdered,
    Sparkles, Loader2, ChevronDown, X, Send,
    Paintbrush, RemoveFormatting
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { rewriteSlideText } from '@/app/actions/gemini';
import { AnimatePresence, motion } from 'framer-motion';

// ─── Theme + System Color Palettes ──────────────────────────────

const THEME_COLORS = [
    '#3B82F6', '#1E3A5F', '#64748B', '#CBD5E1', '#0F172A'
];

const SYSTEM_COLORS = [
    '#000000', '#4B5563', '#9CA3AF', '#D1D5DB', '#FFFFFF',
    '#FDE68A', '#FDBA74', '#FCA5A5', '#F9A8D4', '#86EFAC',
    '#C084FC', '#F87171', '#FB923C', '#A78BFA', '#34D399',
    '#818CF8', '#E879F9', '#38BDF8', '#2DD4BF', '#4ADE80',
];

// ─── Text Style Options ──────────────────────────────────────────

const TEXT_STYLES = [
    { label: 'Small text', tag: 'p', shortcut: '/sm', fontSize: '14px' },
    { label: 'Normal text', tag: 'p', shortcut: '/md', fontSize: '16px' },
    { label: 'Large text', tag: 'p', shortcut: '/lg', fontSize: '20px' },
    { label: 'Heading 4', tag: 'h4', shortcut: '####', fontSize: '18px' },
    { label: 'Heading 3', tag: 'h3', shortcut: '###', fontSize: '22px' },
    { label: 'Heading 2', tag: 'h2', shortcut: '##', fontSize: '28px' },
    { label: 'Heading 1', tag: 'h1', shortcut: '#', fontSize: '36px' },
];

// ─── AI Writing Actions ──────────────────────────────────────────

const AI_QUICK_ACTIONS = [
    { label: 'More engaging', icon: '🎯', tone: 'creative' as const },
    { label: 'Expand text', icon: '📝', tone: 'professional' as const },
    { label: 'Condense text', icon: '✂️', tone: 'professional' as const },
];

// ─── Main Component ──────────────────────────────────────────────

interface FloatingTextToolbarProps {
    containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function FloatingTextToolbar({ containerRef }: FloatingTextToolbarProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const toolbarRef = useRef<HTMLDivElement>(null);

    // Sub-menu states
    const [showStyleMenu, setShowStyleMenu] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showAlignMenu, setShowAlignMenu] = useState(false);
    const [showAIMenu, setShowAIMenu] = useState(false);
    const [aiPrompt, setAIPrompt] = useState('');
    const [isAILoading, setIsAILoading] = useState(false);
    const [currentStyle, setCurrentStyle] = useState('Normal text');
    const [activeColor, setActiveColor] = useState('#FFFFFF');

    // Store selection for restoration after toolbar clicks
    const savedSelectionRef = useRef<Range | null>(null);
    const selectedTextRef = useRef<string>('');

    const closeAllMenus = useCallback(() => {
        setShowStyleMenu(false);
        setShowColorPicker(false);
        setShowAlignMenu(false);
        setShowAIMenu(false);
    }, []);

    // ─── Hide Toolbar (called after formatting actions) ──────────

    const hideToolbar = useCallback(() => {
        // CRITICAL: Before clearing selection, blur the contentEditable element
        // to trigger its onBlur handler which saves the edited content to React state.
        // Without this, DOM changes from execCommand are lost on re-render.
        if (savedSelectionRef.current) {
            let node: Node | null = savedSelectionRef.current.startContainer;
            while (node) {
                if (node instanceof HTMLElement && node.contentEditable === 'true') {
                    node.blur();
                    break;
                }
                node = node.parentNode;
            }
        }

        // Clear the saved selection so it doesn't re-trigger
        savedSelectionRef.current = null;
        selectedTextRef.current = '';
        // Collapse the native selection so selectionchange doesn't re-show
        const sel = window.getSelection();
        if (sel) sel.removeAllRanges();
        setIsVisible(false);
        closeAllMenus();
    }, [closeAllMenus]);

    // Track whether a toolbar action is in-progress to block selectionchange re-show
    const isApplyingRef = useRef(false);

    // ─── Save / Restore Selection Helpers ────────────────────────

    const saveSelection = useCallback(() => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
            selectedTextRef.current = sel.toString();
        }
    }, []);

    const restoreSelection = useCallback(() => {
        const sel = window.getSelection();
        if (sel && savedSelectionRef.current) {
            // Focus the contentEditable element that contains the selection
            // This is critical for block commands like insertUnorderedList to work
            let node: Node | null = savedSelectionRef.current.startContainer;
            while (node) {
                if (node instanceof HTMLElement && node.contentEditable === 'true') {
                    node.focus();
                    break;
                }
                node = node.parentNode;
            }
            sel.removeAllRanges();
            sel.addRange(savedSelectionRef.current);
        }
    }, []);

    // ─── Selection Change Listener (ONLY for showing toolbar) ─────

    useEffect(() => {
        const handleSelectionChange = () => {
            // If we're in the middle of applying a command, ignore selection changes
            if (isApplyingRef.current) return;

            const sel = window.getSelection();
            if (!sel || sel.isCollapsed || !sel.toString().trim()) {
                // Don't hide here — hiding is handled by click-outside,
                // keyboard, and auto-hide after formatting actions.
                return;
            }

            // Check if selection is inside our container
            const container = containerRef.current;
            if (!container) return;

            const anchorNode = sel.anchorNode;
            if (!anchorNode || !container.contains(anchorNode)) return;

            // Check the node is inside a contentEditable element
            let node: Node | null = anchorNode;
            let isInEditable = false;
            while (node && node !== container) {
                if (node instanceof HTMLElement && node.contentEditable === 'true') {
                    isInEditable = true;
                    break;
                }
                node = node.parentNode;
            }
            if (!isInEditable) return;

            // Get position
            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            // Position toolbar above the selection
            const toolbarWidth = 620;
            let left = rect.left + rect.width / 2 - containerRect.left - toolbarWidth / 2;
            left = Math.max(10, Math.min(left, containerRect.width - toolbarWidth - 10));

            setPosition({
                top: rect.top - containerRect.top - 55,
                left
            });

            saveSelection();
            setIsVisible(true);

            // Detect current formatting state
            detectCurrentStyle();
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, [containerRef, closeAllMenus, saveSelection]);

    // ─── Click Outside to Dismiss ────────────────────────────────

    useEffect(() => {
        if (!isVisible) return;

        const handleMouseDown = (e: MouseEvent) => {
            const toolbar = toolbarRef.current;
            if (!toolbar) return;
            // If click is inside the toolbar, ignore
            if (toolbar.contains(e.target as Node)) return;
            // Click is outside toolbar → hide it
            hideToolbar();
        };

        // Use capture phase so we fire before contentEditable handlers
        document.addEventListener('mousedown', handleMouseDown, true);
        return () => document.removeEventListener('mousedown', handleMouseDown, true);
    }, [isVisible, hideToolbar]);

    // ─── Keyboard Dismiss (Escape, Enter, Arrow keys) ────────────

    useEffect(() => {
        if (!isVisible) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                hideToolbar();
            }
            // Any key that moves the cursor or creates new content should dismiss
            if (['Enter', 'Backspace', 'Delete', 'Tab'].includes(e.key)) {
                hideToolbar();
            }
            // Arrow keys dismiss too (cursor is moving away from selection)
            if (e.key.startsWith('Arrow')) {
                hideToolbar();
            }
        };

        document.addEventListener('keydown', handleKeyDown, true);
        return () => document.removeEventListener('keydown', handleKeyDown, true);
    }, [isVisible, hideToolbar]);

    // ─── Detect Current Text Style ───────────────────────────────

    const detectCurrentStyle = () => {
        const sel = window.getSelection();
        if (!sel || !sel.anchorNode) return;

        let node: Node | null = sel.anchorNode;
        while (node) {
            if (node instanceof HTMLElement) {
                const tag = node.tagName.toLowerCase();
                const match = TEXT_STYLES.find(s => s.tag === tag);
                if (match) {
                    setCurrentStyle(match.label);
                    return;
                }
            }
            node = node.parentNode;
        }
        setCurrentStyle('Normal text');
    };

    // ─── Command Execution ───────────────────────────────────────

    // Helper: find the nearest contentEditable element from a starting node
    const findContentEditable = useCallback((): HTMLElement | null => {
        // Try 1: Walk up from saved selection
        if (savedSelectionRef.current) {
            let node: Node | null = savedSelectionRef.current.startContainer;
            while (node) {
                if (node instanceof HTMLElement && node.contentEditable === 'true') {
                    return node;
                }
                node = node.parentNode;
            }
        }
        // Try 2: Walk up from active element
        let el: Element | null = document.activeElement;
        while (el) {
            if (el instanceof HTMLElement && el.contentEditable === 'true') {
                return el;
            }
            el = el.parentElement;
        }
        return null;
    }, []);

    // Helper: dispatch input event on the contentEditable so EditableText saves immediately
    const dispatchInputEvent = useCallback(() => {
        const ce = findContentEditable();
        if (ce) {
            console.log(`[Toolbar] dispatching input event on contentEditable: <${ce.tagName}>`);
            ce.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            console.warn('[Toolbar] Could NOT find contentEditable to dispatch input event!');
        }
    }, [findContentEditable]);

    const execCommand = useCallback((command: string, value?: string) => {
        isApplyingRef.current = true;
        restoreSelection();
        document.execCommand('styleWithCSS', false, 'false');
        document.execCommand(command, false, value || undefined);
        dispatchInputEvent();
        saveSelection();
        setTimeout(() => { isApplyingRef.current = false; }, 50);
    }, [restoreSelection, saveSelection, dispatchInputEvent]);

    // ─── Manual List Insertion (execCommand list commands don't work in per-element contentEditable) ──

    const applyList = useCallback((type: 'ul' | 'ol') => {
        isApplyingRef.current = true;
        restoreSelection();
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) {
            isApplyingRef.current = false;
            return;
        }

        const range = sel.getRangeAt(0);
        const selectedText = sel.toString();

        // Split text into lines for multi-line selections
        const lines = selectedText.split('\n').filter(l => l.trim());
        if (lines.length === 0) {
            isApplyingRef.current = false;
            return;
        }

        // Check if the selection is already inside a list of the same type
        let parentNode: Node | null = range.startContainer;
        let existingList: HTMLElement | null = null;
        while (parentNode) {
            if (parentNode instanceof HTMLElement && parentNode.tagName.toLowerCase() === type) {
                existingList = parentNode;
                break;
            }
            parentNode = parentNode.parentNode;
        }

        if (existingList) {
            // Already in a list of this type — unwrap (convert back to plain text)
            const textContent = existingList.textContent || '';
            const textNode = document.createTextNode(textContent);
            existingList.parentNode?.replaceChild(textNode, existingList);
        } else {
            // Create the list element
            const list = document.createElement(type);
            list.style.margin = '0';
            list.style.padding = '0'; // Remove default padding
            list.style.listStylePosition = 'inside'; // Keep marker with text
            list.style.listStyleType = type === 'ul' ? 'disc' : 'decimal';
            list.style.color = 'inherit';
            list.style.textAlign = 'inherit'; // Inherit alignment from parent

            lines.forEach(line => {
                const li = document.createElement('li');
                li.textContent = line.trim();
                li.style.marginBottom = '2px';
                list.appendChild(li);
            });

            range.deleteContents();
            range.insertNode(list);
        }

        // Collapse selection after the inserted content
        sel.collapseToEnd();
        dispatchInputEvent();
        saveSelection();
        setTimeout(() => { isApplyingRef.current = false; }, 50);
    }, [restoreSelection, saveSelection]);

    const applyTextStyle = useCallback((style: typeof TEXT_STYLES[0]) => {
        isApplyingRef.current = true;
        restoreSelection();
        if (style.tag === 'p') {
            document.execCommand('formatBlock', false, 'p');
            document.execCommand('styleWithCSS', false, 'true');
            document.execCommand('fontSize', false, '3');
        } else {
            document.execCommand('formatBlock', false, style.tag);
        }
        setCurrentStyle(style.label);
        setShowStyleMenu(false);
        dispatchInputEvent();
        saveSelection();
        setTimeout(() => { isApplyingRef.current = false; }, 50);
    }, [restoreSelection, saveSelection]);

    const applyColor = useCallback((color: string) => {
        isApplyingRef.current = true;
        restoreSelection();
        document.execCommand('styleWithCSS', false, 'true');
        document.execCommand('foreColor', false, color);
        document.execCommand('styleWithCSS', false, 'false');
        setActiveColor(color);
        dispatchInputEvent();
        saveSelection();
        setTimeout(() => { isApplyingRef.current = false; }, 50);
    }, [restoreSelection, saveSelection]);

    const applyAlign = useCallback((alignment: string) => {
        isApplyingRef.current = true;
        restoreSelection();
        document.execCommand(alignment, false, undefined);
        setShowAlignMenu(false);
        dispatchInputEvent();
        saveSelection();
        setTimeout(() => { isApplyingRef.current = false; }, 50);
    }, [restoreSelection, saveSelection]);

    // ─── AI Rewrite ──────────────────────────────────────────────

    const handleAIRewrite = useCallback(async (tone: 'professional' | 'creative', customPrompt?: string) => {
        const text = selectedTextRef.current;
        if (!text.trim()) return;

        setIsAILoading(true);
        try {
            const rewritten = await rewriteSlideText(
                customPrompt ? `${customPrompt}: "${text}"` : text,
                tone
            );
            if (rewritten) {
                isApplyingRef.current = true;
                restoreSelection();
                document.execCommand('insertText', false, rewritten.trim());
                dispatchInputEvent();
                isApplyingRef.current = false;
            }
        } catch (err) {
            console.error('AI rewrite failed:', err);
        } finally {
            setIsAILoading(false);
            setAIPrompt('');
            setShowAIMenu(false);
            isApplyingRef.current = false;
        }
    }, [restoreSelection]);

    // ─── Toolbar Button Sub-Component ────────────────────────────

    const TBtn = ({ children, title, active, onMouseDown: onMD, className: cx }: {
        children: React.ReactNode;
        title?: string;
        active?: boolean;
        onMouseDown?: (e: React.MouseEvent) => void;
        className?: string;
    }) => (
        <button
            type="button"
            title={title}
            onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMD?.(e);
            }}
            className={cn(
                "p-1.5 rounded-md transition-all duration-150 flex items-center justify-center min-w-[30px] min-h-[30px] relative",
                active
                    ? "bg-blue-500/20 text-blue-500"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100",
                cx
            )}
        >
            {children}
        </button>
    );

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    ref={toolbarRef}
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute z-[200] select-none"
                    style={{ top: position.top, left: position.left }}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        // Set guard immediately so selectionchange doesn't hide toolbar
                        isApplyingRef.current = true;
                        // Reset after a short delay (if no action handler sets its own timeout)
                        setTimeout(() => { isApplyingRef.current = false; }, 300);
                    }}
                >
                    {/* ─── Main Toolbar Bar ──────────────────────────── */}
                    <div className="flex items-center gap-0.5 bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.18)] border border-zinc-200 px-1.5 py-1">

                        {/* 1. TEXT STYLE DROPDOWN */}
                        <div className="relative">
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    closeAllMenus();
                                    setShowStyleMenu(!showStyleMenu);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors min-w-[110px]"
                            >
                                <span className="truncate">{currentStyle}</span>
                                <ChevronDown size={12} className="text-zinc-400 shrink-0" />
                            </button>

                            {/* Style Dropdown */}
                            {showStyleMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.16)] border border-zinc-200 py-1.5 min-w-[200px] z-[210]"
                                >
                                    {TEXT_STYLES.map((style) => (
                                        <button
                                            key={style.label}
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                applyTextStyle(style);
                                            }}
                                            className={cn(
                                                "w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center justify-between transition-colors",
                                                currentStyle === style.label && "bg-zinc-50"
                                            )}
                                        >
                                            <span
                                                style={{
                                                    fontSize: style.fontSize,
                                                    fontWeight: style.tag.startsWith('h') ? 'bold' : 'normal'
                                                }}
                                                className="text-zinc-800"
                                            >
                                                {style.label}
                                            </span>
                                            <span className="text-xs text-zinc-400 font-mono ml-4">{style.shortcut}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </div>

                        {/* DIVIDER */}
                        <div className="w-[1px] h-5 bg-zinc-200 mx-0.5" />

                        {/* 2. FONT COLOR */}
                        <div className="relative">
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    closeAllMenus();
                                    setShowColorPicker(!showColorPicker);
                                }}
                                className="flex items-center gap-0.5 px-1.5 py-1.5 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors"
                            >
                                <span className="text-sm font-bold" style={{ borderBottom: `3px solid ${activeColor}` }}>A</span>
                                <ChevronDown size={10} className="text-zinc-400" />
                            </button>

                            {/* Color Picker Popover */}
                            {showColorPicker && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.16)] border border-zinc-200 p-3 z-[210] min-w-[220px]"
                                >
                                    {/* Two Tabs: A (Text Color) and Paintbrush (Highlight) */}
                                    <div className="flex items-center gap-4 mb-3 pb-2 border-b border-zinc-100">
                                        <span className="text-sm font-bold text-blue-600 border-b-2 border-blue-600 pb-1">A</span>
                                        <Paintbrush size={14} className="text-zinc-400" />
                                    </div>

                                    {/* Theme Colors */}
                                    <div className="mb-2">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Theme colors</span>
                                        </div>
                                        <div className="flex gap-1.5">
                                            {THEME_COLORS.map((c) => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        applyColor(c);
                                                    }}
                                                    className={cn(
                                                        "w-7 h-7 rounded-md border-2 transition-all hover:scale-110",
                                                        activeColor === c ? "border-blue-500 ring-2 ring-blue-200" : "border-zinc-200"
                                                    )}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* System Colors */}
                                    <div>
                                        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">System colors</span>
                                        <div className="grid grid-cols-5 gap-1.5">
                                            {SYSTEM_COLORS.map((c) => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        applyColor(c);
                                                    }}
                                                    className={cn(
                                                        "w-7 h-7 rounded-md border-2 transition-all hover:scale-110",
                                                        activeColor === c ? "border-blue-500 ring-2 ring-blue-200" : "border-zinc-200",
                                                        c === '#FFFFFF' && "border-zinc-300"
                                                    )}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Reset */}
                                    <button
                                        type="button"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            applyColor('#FFFFFF');
                                        }}
                                        className="w-full mt-2 pt-2 border-t border-zinc-100 text-xs text-zinc-500 hover:text-zinc-700 flex items-center justify-center gap-1 py-1.5 transition-colors"
                                    >
                                        ↺ Reset to default
                                    </button>
                                </motion.div>
                            )}
                        </div>

                        {/* DIVIDER */}
                        <div className="w-[1px] h-5 bg-zinc-200 mx-0.5" />

                        {/* 3. FORMATTING: B I U S Code ClearFormat */}
                        <TBtn title="Bold (Ctrl+B)" onMouseDown={() => execCommand('bold')}>
                            <Bold size={15} strokeWidth={2.5} />
                        </TBtn>
                        <TBtn title="Italic (Ctrl+I)" onMouseDown={() => execCommand('italic')}>
                            <Italic size={15} />
                        </TBtn>
                        <TBtn title="Underline (Ctrl+U)" onMouseDown={() => execCommand('underline')}>
                            <UnderlineIcon size={15} />
                        </TBtn>
                        <TBtn title="Strikethrough" onMouseDown={() => execCommand('strikeThrough')}>
                            <Strikethrough size={15} />
                        </TBtn>
                        <TBtn title="Inline Code" onMouseDown={() => {
                            isApplyingRef.current = true;
                            restoreSelection();
                            const sel = window.getSelection();
                            if (sel && sel.rangeCount > 0) {
                                const range = sel.getRangeAt(0);
                                const text = range.toString();
                                const code = document.createElement('code');
                                code.style.backgroundColor = 'rgba(135,131,120,0.15)';
                                code.style.borderRadius = '3px';
                                code.style.padding = '2px 5px';
                                code.style.fontFamily = '"SFMono-Regular", Menlo, Consolas, monospace';
                                code.style.fontSize = '85%';
                                code.style.color = '#EB5757';
                                code.textContent = text;
                                range.deleteContents();
                                range.insertNode(code);
                                sel.collapseToEnd();
                            }
                            saveSelection();
                            setTimeout(() => { isApplyingRef.current = false; }, 50);
                        }}>
                            <Code size={15} />
                        </TBtn>
                        <TBtn title="Clear Formatting" onMouseDown={() => execCommand('removeFormat')}>
                            <RemoveFormatting size={15} />
                        </TBtn>

                        {/* DIVIDER */}
                        <div className="w-[1px] h-5 bg-zinc-200 mx-0.5" />

                        {/* 4. LISTS */}
                        <TBtn title="Bullet List" onMouseDown={() => applyList('ul')}>
                            <List size={15} />
                        </TBtn>
                        <TBtn title="Numbered List" onMouseDown={() => applyList('ol')}>
                            <ListOrdered size={15} />
                        </TBtn>

                        {/* DIVIDER */}
                        <div className="w-[1px] h-5 bg-zinc-200 mx-0.5" />

                        {/* 5. ALIGNMENT */}
                        <div className="relative">
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    closeAllMenus();
                                    setShowAlignMenu(!showAlignMenu);
                                }}
                                className="flex items-center gap-0.5 p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                            >
                                <AlignLeft size={15} />
                                <ChevronDown size={10} className="text-zinc-400" />
                            </button>

                            {showAlignMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.16)] border border-zinc-200 p-1 z-[210] flex gap-0.5"
                                >
                                    <TBtn title="Align Left" onMouseDown={() => applyAlign('justifyLeft')}>
                                        <AlignLeft size={15} />
                                    </TBtn>
                                    <TBtn title="Align Center" onMouseDown={() => applyAlign('justifyCenter')}>
                                        <AlignCenter size={15} />
                                    </TBtn>
                                    <TBtn title="Align Right" onMouseDown={() => applyAlign('justifyRight')}>
                                        <AlignRight size={15} />
                                    </TBtn>
                                </motion.div>
                            )}
                        </div>

                        {/* DIVIDER */}
                        <div className="w-[1px] h-5 bg-zinc-200 mx-0.5" />

                        {/* 6. AI TOOLS */}
                        <div className="relative">
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    saveSelection();
                                    closeAllMenus();
                                    setShowAIMenu(!showAIMenu);
                                }}
                                className={cn(
                                    "flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors text-sm font-medium",
                                    showAIMenu
                                        ? "bg-violet-50 text-violet-600"
                                        : "text-zinc-600 hover:text-violet-600 hover:bg-violet-50"
                                )}
                            >
                                <Sparkles size={14} />
                                <ChevronDown size={10} />
                            </button>

                            {showAIMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.16)] border border-zinc-200 p-3 z-[210] min-w-[280px]"
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    {/* AI Prompt Input */}
                                    <div className="mb-3">
                                        <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">Edit this text</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={aiPrompt}
                                                onChange={(e) => setAIPrompt(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && aiPrompt.trim()) {
                                                        e.preventDefault();
                                                        handleAIRewrite('professional', aiPrompt);
                                                    }
                                                }}
                                                placeholder="How would you like to edit this text?"
                                                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all pr-9"
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                disabled={isAILoading || !aiPrompt.trim()}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    if (aiPrompt.trim()) handleAIRewrite('professional', aiPrompt);
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-blue-500 hover:bg-blue-50 disabled:opacity-30 transition-all"
                                            >
                                                {isAILoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Quick AI Actions */}
                                    <div>
                                        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">Writing</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {AI_QUICK_ACTIONS.map((action) => (
                                                <button
                                                    key={action.label}
                                                    type="button"
                                                    disabled={isAILoading}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        handleAIRewrite(action.tone, `${action.label} this text`);
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300 transition-all disabled:opacity-50"
                                                >
                                                    <span>{action.icon}</span>
                                                    {action.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Loading Indicator */}
                                    {isAILoading && (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-violet-500 animate-pulse">
                                            <Loader2 size={12} className="animate-spin" />
                                            Rewriting with AI...
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

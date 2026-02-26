"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extension-placeholder';
import { FontFamily } from '@tiptap/extension-font-family';
import { Extension } from '@tiptap/core';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Highlighter, Type,
    Undo, Redo, Eraser, Maximize, Check, ChevronDown
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

// Custom Extension for Font Size
const FontSize = Extension.create({
    name: 'fontSize',
    addOptions() {
        return {
            types: ['textStyle'],
        };
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: (element: HTMLElement) => element.style.fontSize?.replace(/px/g, '') || null,
                        renderHTML: (attributes: Record<string, any>) => {
                            if (!attributes.fontSize) return {};
                            return { style: `font-size: ${attributes.fontSize}px` };
                        },
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            setFontSize: (fontSize: string) => ({ chain }: any) => {
                return chain().setMark('textStyle', { fontSize }).run();
            },
            unsetFontSize: () => ({ chain }: any) => {
                return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
            },
        } as any;
    },
});

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    opacity?: number;
    onOpacityChange?: (opacity: number) => void;
    showOpacityControl?: boolean;
    layout?: 'left' | 'right' | 'bg' | 'hero_center' | 'split_editorial' | 'feature_grid';
    onLayoutChange?: (layout: 'left' | 'right' | 'bg' | 'hero_center' | 'split_editorial' | 'feature_grid') => void;
    onDone?: () => void;
}

export default function RichTextEditor({
    content,
    onChange,
    placeholder,
    opacity = 1,
    onOpacityChange,
    showOpacityControl = false,
    layout = 'bg',
    onLayoutChange,
    onDone
}: RichTextEditorProps) {
    const [isMounted, setIsMounted] = useState(false);

    // Use Refs for callbacks to avoid stale closures in TipTap hooks
    const onChangeRef = useRef(onChange);
    const onOpacityChangeRef = useRef(onOpacityChange);
    const onLayoutChangeRef = useRef(onLayoutChange);
    const onDoneRef = useRef(onDone);

    useEffect(() => {
        onChangeRef.current = onChange;
        onOpacityChangeRef.current = onOpacityChange;
        onLayoutChangeRef.current = onLayoutChange;
        onDoneRef.current = onDone;
    }, [onChange, onOpacityChange, onLayoutChange, onDone]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Placeholder.configure({ placeholder: placeholder || 'Start writing your pitch...' }),
            FontFamily,
            FontSize,
        ],
        content: content,
        editorProps: {
            attributes: {
                class: 'prose prose-invert prose-2xl max-w-none focus:outline-none min-h-[500px] p-12 transition-all duration-300',
            },
        },
        // Primary sync on Blur to avoid React re-render cursor jumps during typing
        onBlur: ({ editor }: any) => {
            onChangeRef.current(editor.getHTML());
        },
        // Optional: onUpdate can still inform local state or small updates
        onUpdate: ({ editor }: any) => {
            // We can keep a soft sync here if needed, but the user requested onBlur for persistence
        },
        immediatelyRender: false,
    });

    // Content Sync Logic (optimized to avoid cursor jumps)
    const contentRef = useRef(content);
    useEffect(() => {
        if (editor && content !== contentRef.current) {
            contentRef.current = content;
            // Only sync if the change comes from OUTSIDE and editor isn't being used by user
            if (!editor.isFocused && content !== editor.getHTML()) {
                editor.commands.setContent(content);
            }
        }
    }, [content, editor]);

    if (!isMounted || !editor) {
        return (
            <div className="w-full h-[600px] bg-[#0a0a0a] rounded-xl flex items-center justify-center border border-gray-800 animate-pulse">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Initializing Editor...</span>
                </div>
            </div>
        );
    }

    const ToolbarButton = ({ onClick, isActive, children, title, className = "" }: any) => (
        <button
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            title={title}
            className={`
                p-3.5 rounded-xl transition-all flex items-center justify-center gap-2
                ${isActive
                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-105'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95'
                }
                ${className}
            `}
        >
            {children}
        </button>
    );

    return (
        <div className="flex flex-col rounded-3xl overflow-hidden bg-[#0a0a0a] shadow-[0_0_100px_rgba(0,0,0,0.5)] h-full relative border border-white/5">
            {/* TOOLBAR */}
            <div className="bg-[#111] border-b border-white/5 p-5 flex flex-wrap items-center gap-4 sticky top-0 z-[100] backdrop-blur-xl">

                {/* Font & Size Group */}
                <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                    <div className="relative group">
                        <select
                            onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
                            className="bg-[#1a1a1a] text-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold border border-white/5 outline-none w-36 cursor-pointer hover:bg-zinc-800 transition appearance-none pr-10"
                            value={editor.getAttributes('textStyle').fontFamily || ''}
                        >
                            <option value="">Default Font</option>
                            <option value="Inter, sans-serif">Inter (Modern)</option>
                            <option value="Oswald, sans-serif">Oswald (Bold)</option>
                            <option value="Roboto, sans-serif">Roboto (Clean)</option>
                            <option value="monospace">Mono (Code)</option>
                            <option value="serif">Serif (Classic)</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    <div className="relative group">
                        <select
                            onChange={(e) => (editor.chain().focus() as any).setFontSize(e.target.value).run()}
                            className="bg-[#1a1a1a] text-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold border border-white/5 outline-none w-24 cursor-pointer hover:bg-zinc-800 transition appearance-none pr-8"
                            value={editor.getAttributes('textStyle').fontSize || ''}
                        >
                            <option value="">Size</option>
                            {[12, 14, 16, 20, 24, 32, 48, 64, 80, 96].map(s => (
                                <option key={s} value={s}>{s}px</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    <select
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val.startsWith('h')) {
                                editor.chain().focus().toggleHeading({ level: parseInt(val.replace('h', '')) as any }).run();
                            } else {
                                editor.chain().focus().setParagraph().run();
                            }
                        }}
                        className="bg-[#1a1a1a] text-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold border border-white/5 outline-none w-36 cursor-pointer hover:bg-zinc-800 transition"
                        value={editor.isActive('heading', { level: 1 }) ? 'h1' : editor.isActive('heading', { level: 2 }) ? 'h2' : editor.isActive('heading', { level: 3 }) ? 'h3' : 'p'}
                    >
                        <option value="p">Body Text</option>
                        <option value="h1">Header (H1)</option>
                        <option value="h2">Subheader (H2)</option>
                        <option value="h3">Small Cap (H3)</option>
                    </select>
                </div>

                {/* Formatting Group */}
                <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                    <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold">
                        <Bold size={24} strokeWidth={3} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic">
                        <Italic size={24} strokeWidth={3} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline">
                        <UnderlineIcon size={24} strokeWidth={3} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
                        <Strikethrough size={24} strokeWidth={3} />
                    </ToolbarButton>
                </div>

                {/* Alignment */}
                <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left">
                        <AlignLeft size={24} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center">
                        <AlignCenter size={24} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right">
                        <AlignRight size={24} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Justify">
                        <AlignJustify size={24} />
                    </ToolbarButton>
                </div>

                {/* Lists & Colors */}
                <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                    <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List">
                        <List size={24} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Ordered List">
                        <ListOrdered size={24} />
                    </ToolbarButton>
                    <div className="w-[1px] h-8 bg-white/10 mx-1" />
                    <input
                        type="color"
                        onInput={(e: any) => editor.chain().focus().setColor(e.target.value).run()}
                        value={editor.getAttributes('textStyle').color || '#ffffff'}
                        className="w-10 h-10 bg-[#1a1a1a] border border-white/10 cursor-pointer p-1.5 rounded-xl hover:bg-zinc-800 transition-all ml-1"
                        title="Text Color"
                    />
                    <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} title="Highlight">
                        <Highlighter size={24} />
                    </ToolbarButton>
                </div>

                {/* Opacity & Layout */}
                <div className="flex flex-wrap items-center gap-4 ml-2">
                    {showOpacityControl && onOpacityChangeRef.current && (
                        <div className="flex items-center gap-4 bg-white/5 p-2 px-5 rounded-2xl border border-white/5">
                            <span className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em]">Opacity</span>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={opacity}
                                onChange={(e) => onOpacityChangeRef.current?.(parseFloat(e.target.value))}
                                className="w-28 accent-blue-500 h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer"
                            />
                            <span className="text-xs font-mono text-zinc-500 w-8">{Math.round(opacity * 100)}%</span>
                        </div>
                    )}

                    {onLayoutChangeRef.current && (
                        <div className="flex bg-white/5 rounded-2xl p-1.5 border border-white/5 gap-1">
                            <ToolbarButton onClick={() => onLayoutChangeRef.current?.('left')} isActive={layout === 'left'} title="Split Left">
                                <AlignLeft size={24} className="rotate-90" />
                            </ToolbarButton>
                            <ToolbarButton onClick={() => onLayoutChangeRef.current?.('bg')} isActive={layout === 'bg'} title="Full Background">
                                <Maximize size={24} />
                            </ToolbarButton>
                            <ToolbarButton onClick={() => onLayoutChangeRef.current?.('right')} isActive={layout === 'right'} title="Split Right">
                                <AlignRight size={24} className="-rotate-90" />
                            </ToolbarButton>
                        </div>
                    )}
                </div>

                {/* Main Actions */}
                <div className="flex items-center gap-2 ml-auto">
                    <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 gap-0.5">
                        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
                            <Undo size={22} strokeWidth={2.5} />
                        </ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
                            <Redo size={22} strokeWidth={2.5} />
                        </ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().run()} title="Clear Styles">
                            <Eraser size={22} strokeWidth={2.5} />
                        </ToolbarButton>
                    </div>

                    {onDone && (
                        <button
                            onClick={() => {
                                // Final sync to ensure latest edits are saved
                                if (editor) onChangeRef.current(editor.getHTML());
                                onDoneRef.current?.();
                            }}
                            className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-2xl text-base font-black flex items-center gap-3 ml-4 shadow-[0_10px_30px_rgba(22,163,74,0.3)] hover:shadow-[0_15px_40px_rgba(22,163,74,0.4)] active:scale-95 transition-all group"
                        >
                            <Check size={24} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                            <span>Done Editing</span>
                        </button>
                    )}
                </div>
            </div>

            {/* EDITOR CONTENT AREA */}
            <div
                className="flex-1 overflow-y-auto custom-scrollbar transition-all duration-500 ease-in-out relative group/editor"
                style={{ backgroundColor: `rgba(0, 0, 0, ${opacity})` }}
            >
                {/* Floating Hint */}
                <div className="absolute top-8 right-12 opacity-0 group-hover/editor:opacity-30 transition-opacity pointer-events-none z-10">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white">MonoDesk Editor</span>
                </div>

                <div className="max-w-6xl mx-auto min-h-full">
                    <EditorContent editor={editor} className="h-full" />
                </div>
            </div>

            {/* STATUS BAR */}
            <div className="bg-[#0f0f0f] border-t border-white/5 p-2 px-6 text-[10px] text-gray-500 flex justify-between items-center font-bold tracking-widest uppercase">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                        {editor.getText().length} Characters
                    </span>
                    <span className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-green-500"></div>
                        {editor.storage.characterCount?.words?.() || Math.ceil(editor.getText().length / 5)} Words
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="animate-pulse">Live Sync Active</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                </div>
            </div>

            <style jsx global>{`
                .ProseMirror {
                    outline: none !important;
                }
                .ProseMirror p.is-editor-empty:first-child::before {
                    color: #3f3f46;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                    font-style: italic;
                    font-weight: 300;
                }
                .ProseMirror ul {
                    list-style-type: disc !important;
                    padding-left: 2rem !important;
                    margin: 1.5rem 0 !important;
                }
                .ProseMirror ol {
                    list-style-type: decimal !important;
                    padding-left: 2rem !important;
                    margin: 1.5rem 0 !important;
                }
                .ProseMirror li {
                    display: list-item !important;
                    margin-bottom: 0.5rem !important;
                    line-height: 1.6;
                }
                .ProseMirror h1 { font-family: 'Oswald', sans-serif; font-weight: 900; }
                .ProseMirror h2 { font-family: 'Inter', sans-serif; font-weight: 700; color: #93c5fd; }
                
                /* Custom Scrollbar */
                .custom-scrollbar::-webkit-scrollbar { width: 10px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #050505; }
                .custom-scrollbar::-webkit-scrollbar-thumb { 
                    background: #1a1a1a; 
                    border-radius: 10px; 
                    border: 2px solid #050505;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #252525; }
            `}</style>
        </div>
    );
}

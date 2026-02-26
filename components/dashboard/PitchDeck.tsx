"use client";

import React, { useState } from 'react';
import {
    Layout,
    Image as ImageIcon,
    Plus,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Loader2,
    RefreshCw,
    Maximize2,
    Save,
    Share2,
    Download
} from 'lucide-react';
import { cn } from "@/lib/utils";

// Types
interface Slide {
    id: number;
    title: string;
    content: string;
    image_url: string | null;
    isGeneratingImage: boolean;
    layout?: 'split' | 'hero' | 'centered';
}

const INITIAL_SLIDES: Slide[] = [
    {
        id: 1,
        title: "Slide 1: The Problem",
        content: "<ul><li>Legacy systems are <strong>too slow</strong> and expensive to maintain.</li><li>Data silos prevent real-time decision making.</li><li>High employee turnover due to frustrating internal tools.</li></ul>",
        image_url: null,
        isGeneratingImage: false
    },
    {
        id: 2,
        title: "Slide 2: The Solution",
        content: "<ul><li><strong>Monodesk</strong>: The all-in-one AI workspace for high-growth startups.</li><li>Unified data architecture for 360-degree visibility.</li><li>Intuitive, <em>Notion-style</em> interface that teams actually love.</li></ul>",
        image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426&ixlib=rb-4.0.3",
        isGeneratingImage: false
    }
];

export default function PitchDeck() {
    const [slides, setSlides] = useState<Slide[]>(INITIAL_SLIDES);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    const activeSlide = slides[currentSlideIndex];

    const updateSlide = (index: number, updates: Partial<Slide>) => {
        setSlides(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
    };

    const handleTextChange = (field: 'title' | 'content', value: string) => {
        updateSlide(currentSlideIndex, { [field]: value });
    };

    return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] w-full bg-[#0a0a0a] text-white overflow-hidden selection:bg-cyan-500/30">
            {/* LEFT SIDEBAR: Thumbnails */}
            <aside className="w-72 border-r border-white/5 bg-[#0f0f0f] flex flex-col">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Slides</span>
                    <button className="p-1 hover:bg-white/5 rounded text-zinc-400 hover:text-white transition-colors">
                        <Plus size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {slides.map((slide, idx) => (
                        <div
                            key={slide.id}
                            onClick={() => setCurrentSlideIndex(idx)}
                            className={cn(
                                "group cursor-pointer transition-all",
                                currentSlideIndex === idx ? "scale-[1.02]" : "hover:scale-[1.01]"
                            )}
                        >
                            <div className="flex items-center gap-3 mb-1.5 px-1">
                                <span className="text-[10px] font-mono text-zinc-600">{idx + 1}</span>
                                <span className="text-[10px] font-bold text-zinc-500 truncate uppercase tracking-tight">
                                    {slide.title.replace(/^Slide \d+:\s*/, "") || "Untitled Slide"}
                                </span>
                            </div>

                            <div className={cn(
                                "aspect-video rounded-lg border-2 overflow-hidden bg-zinc-900 transition-all shadow-lg",
                                currentSlideIndex === idx
                                    ? "border-cyan-500 shadow-cyan-500/10"
                                    : "border-white/5 group-hover:border-white/20"
                            )}>
                                {/* Small preview content preview */}
                                <div className="p-2 h-full flex flex-col gap-1 origin-top-left scale-[0.4] w-[250%] h-[250%] pointer-events-none opacity-50 relative">
                                    {slide.image_url && <div className="absolute top-0 right-0 w-1/2 h-full bg-zinc-800 border-l border-zinc-700/50"></div>}
                                    <div className="h-6 w-3/4 bg-white/10 rounded mb-2"></div>
                                    <div className="h-3 w-full bg-white/5 rounded"></div>
                                    <div className="h-3 w-5/6 bg-white/5 rounded"></div>
                                    <div className="h-3 w-4/5 bg-white/5 rounded"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* MAIN STAGE: Editor */}
            <main className="flex-1 flex flex-col bg-[#141414] relative overflow-hidden">
                {/* Stage Toolbar */}
                <div className="h-14 border-b border-white/5 px-8 flex items-center justify-between bg-[#111]">
                    <div className="flex items-center gap-4 text-xs font-medium text-zinc-400">
                        <button className="flex items-center gap-2 hover:text-white px-3 py-1.5 hover:bg-white/5 rounded-md transition-all">
                            <Layout size={14} /> Layout
                        </button>
                        <button className="flex items-center gap-2 hover:text-white px-3 py-1.5 hover:bg-white/5 rounded-md transition-all">
                            <Plus size={14} /> Add Slide
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-all whitespace-nowrap"><Share2 size={16} /></button>
                        <button className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-all whitespace-nowrap"><Download size={16} /></button>
                        <div className="w-px h-4 bg-white/10 mx-2"></div>
                        <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-1.5 rounded-md text-xs font-bold transition-all shadow-lg shadow-cyan-900/20 flex items-center gap-2">
                            <Save size={14} /> Save
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-12 flex items-center justify-center bg-[#0a0a0a] dot-grid">
                    {/* The 16:9 Slide Container */}
                    <div className="w-full max-w-5xl aspect-video bg-white rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex overflow-hidden text-zinc-900 border border-zinc-200">

                        {/* Text Section (Left) */}
                        <div className="flex-1 p-16 flex flex-col justify-center">
                            {/* Editable Title */}
                            <h1
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => handleTextChange('title', e.currentTarget.innerText)}
                                className="text-4xl font-extrabold tracking-tight mb-8 outline-none border-b border-transparent focus:border-cyan-500/20 hover:bg-zinc-50 transition-all p-2 -m-2 rounded"
                            >
                                {activeSlide.title}
                            </h1>

                            {/* Editable Content */}
                            <div
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => handleTextChange('content', e.currentTarget.innerHTML)}
                                className="text-lg leading-relaxed text-zinc-600 outline-none hover:bg-zinc-50 transition-all p-2 -m-2 rounded prose prose-zinc"
                                dangerouslySetInnerHTML={{ __html: activeSlide.content }}
                            />
                        </div>

                        {/* Image Section (Right) */}
                        <div className="w-[45%] bg-zinc-50 border-l border-zinc-100 relative group flex items-center justify-center p-8 overflow-hidden">
                            {activeSlide.isGeneratingImage ? (
                                <div className="flex flex-col items-center gap-3 animate-pulse">
                                    <Loader2 className="animate-spin text-cyan-500" size={32} />
                                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Generating Visual...</span>
                                </div>
                            ) : activeSlide.image_url ? (
                                <div className="relative w-full h-full">
                                    <img
                                        src={activeSlide.image_url}
                                        alt="Slide Visual"
                                        className="w-full h-full object-cover rounded-md shadow-lg"
                                    />
                                    <button
                                        onClick={() => updateSlide(currentSlideIndex, { isGeneratingImage: true })}
                                        className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur shadow-xl rounded-full text-zinc-600 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-cyan-600"
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3 text-zinc-300">
                                    <div className="w-16 h-16 rounded-2xl bg-zinc-100 border-2 border-dashed border-zinc-200 flex items-center justify-center group-hover:border-cyan-500/30 group-hover:bg-white transition-all">
                                        <ImageIcon size={24} />
                                    </div>
                                    <button
                                        onClick={() => updateSlide(currentSlideIndex, { isGeneratingImage: true })}
                                        className="text-[10px] font-bold uppercase tracking-tighter px-4 py-2 bg-zinc-100 border border-zinc-200 rounded-full hover:bg-zinc-900 hover:text-white transition-all"
                                    >
                                        Generate Visual
                                    </button>
                                </div>
                            )}

                            {/* Failure State Mock (Hidden by default) */}
                            {false && (
                                <div className="flex flex-col items-center gap-3">
                                    <span className="text-xs text-red-500 font-medium tracking-tight">Generation Failed</span>
                                    <button className="text-[10px] font-bold uppercase tracking-tighter px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-full hover:bg-red-600 hover:text-white transition-all">
                                        Retry Image
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Navigation Overlays */}
                    <button
                        onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                        disabled={currentSlideIndex === 0}
                        className="absolute left-8 p-3 rounded-full bg-white/5 border border-white/5 text-zinc-500 hover:text-white hover:bg-white/10 disabled:opacity-0 transition-all shadow-xl"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
                        disabled={currentSlideIndex === slides.length - 1}
                        className="absolute right-8 p-3 rounded-full bg-white/5 border border-white/5 text-zinc-500 hover:text-white hover:bg-white/10 disabled:opacity-0 transition-all shadow-xl"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            </main>

            <style jsx>{`
                .dot-grid {
                    background-image: radial-gradient(circle, #ffffff05 1px, transparent 1px);
                    background-size: 24px 24px;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #ffffff1a;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #ffffff33;
                }
            `}</style>
        </div>
    );
}

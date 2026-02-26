"use client";

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Image as ImageIcon } from 'lucide-react';
import DraggableTextElement from './DraggableTextElement';

export interface Slide {
    id: number;
    title: string;
    subtitle: string;
    content: string;
    moodImage?: string;
    layout?: 'left' | 'right' | 'bg' | 'hero_center' | 'split_editorial' | 'feature_grid';
    contentPosition?: { x: number; y: number };
    fontSize?: number;
    styleHint?: string;
    isFavorite?: boolean;
    bgOpacity?: number; // 0 to 100
}

interface SlideEditorProps {
    slide: Slide;
    isActive?: boolean;
    isEditing?: boolean;
    onUpdate?: (updatedSlide: Slide) => void;
    exportMode?: boolean;
}

export default function SlideEditor({
    slide,
    isActive = false,
    isEditing = false,
    onUpdate,
    exportMode = false,
}: SlideEditorProps) {
    // Use Ref for slide to avoid stale closures in callbacks
    const slideRef = useRef(slide);
    useEffect(() => {
        slideRef.current = slide;
    }, [slide]);

    const canEdit = !exportMode && isEditing;

    return (
        <div
            className={cn(
                "w-full h-full relative overflow-hidden bg-black text-white font-sans transition-all duration-700",
                exportMode ? 'pdf-slide-container' : 'shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/5 rounded-xl'
            )}
            style={{ width: '1920px', height: '1080px' }}
        >
            {/* LAYER 1: Background Image (Full Bleed) */}
            {slide.moodImage ? (
                <div className="absolute inset-0 z-0">
                    <img
                        src={slide.moodImage}
                        alt="Background"
                        className={cn(
                            "w-full h-full object-cover transition-all duration-1000",
                            slide.layout === 'hero_center' ? "opacity-40 blur-sm scale-110" : "opacity-100"
                        )}
                        style={{ opacity: exportMode ? 1 : undefined }}
                        crossOrigin="anonymous"
                    />
                </div>
            ) : (
                <div className="absolute inset-0 z-0 bg-[#0a0a0a] flex items-center justify-center">
                    <div className="text-center opacity-20">
                        <ImageIcon size={64} className="text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-500 font-mono uppercase tracking-[0.3em] text-xs">Awaiting Visual...</p>
                    </div>
                </div>
            )}

            {/* LAYER 2: Gradient Overlays (Context Aware) */}
            <div className={cn(
                "absolute inset-0 z-1 pointer-events-none transition-all duration-1000",
                slide.layout === 'left' ? "bg-gradient-to-l from-black via-black/80 to-transparent w-[60%] right-0" :
                    slide.layout === 'right' ? "bg-gradient-to-r from-black via-black/80 to-transparent w-[60%] left-0" :
                        slide.layout === 'hero_center' ? "bg-black/70" :
                            "bg-gradient-to-t from-black via-black/50 to-transparent"
            )} />

            {/* LAYER 3: Content Area (Typography) */}
            <div className={cn(
                "absolute z-10 p-24 h-full flex flex-col justify-center transition-all duration-1000",
                slide.layout === 'left' ? "right-0 w-[55%] items-start text-left pl-32" :
                    slide.layout === 'right' ? "left-0 w-[55%] items-start text-left pr-32" :
                        slide.layout === 'hero_center' ? "inset-0 items-center text-center justify-center" :
                            "inset-0 items-center justify-center"
            )}>
                <DraggableTextElement
                    x={slide.contentPosition?.x || 0}
                    y={slide.contentPosition?.y || 0}
                    content={slide.content}
                    isEditing={canEdit}
                    onContentChange={(val) => {
                        if (onUpdate) {
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = val;
                            const firstH1 = tempDiv.querySelector('h1');
                            const firstH2 = tempDiv.querySelector('h2');

                            onUpdate({
                                ...slideRef.current,
                                content: val,
                                title: firstH1 ? firstH1.innerText : slideRef.current.title,
                                subtitle: firstH2 ? firstH2.innerText : slideRef.current.subtitle
                            });
                        }
                    }}
                    onPositionChange={(nx, ny) => {
                        if (onUpdate) {
                            onUpdate({
                                ...slideRef.current,
                                contentPosition: { x: nx, y: ny }
                            });
                        }
                    }}
                    onEditModeChange={() => { }} // No-op, managed by parent toolbar
                    layout={slide.layout}
                    bgOpacity={slide.bgOpacity}
                />
            </div>

            {/* Layout Badge (Context Indicator) */}
            {!exportMode && isActive && (
                <div className="absolute bottom-12 right-12 z-50 animate-in fade-in slide-in-from-bottom-4">
                    <div className="px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                            {slide.layout?.replace('_', ' ') || 'standard'} Mode
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

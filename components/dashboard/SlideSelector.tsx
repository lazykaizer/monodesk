import React, { useState } from 'react';
import { PITCH_DECK_SLIDES } from './pitch-deck-constants';
import { Check, Plus, X } from 'lucide-react';

interface SlideSelectorProps {
    selectedSlides: string[];
    setSelectedSlides: (slides: string[]) => void;
}

export default function SlideSelector({ selectedSlides, setSelectedSlides }: SlideSelectorProps) {
    const [customSlide, setCustomSlide] = useState('');

    const toggleSlide = (label: string) => {
        if (selectedSlides.includes(label)) {
            setSelectedSlides(selectedSlides.filter((s) => s !== label));
        } else {
            if (selectedSlides.length >= 15) return;
            setSelectedSlides([...selectedSlides, label]);
        }
    };

    const addCustomSlide = () => {
        if (customSlide.trim() && !selectedSlides.includes(customSlide)) {
            if (selectedSlides.length >= 15) return;
            setSelectedSlides([...selectedSlides, customSlide]);
            setCustomSlide('');
        }
    };

    return (
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 w-full max-w-5xl mx-auto mt-6 mb-12 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">Select Slides to Generate</h3>
                    <p className="text-sm text-zinc-500">Curate exactly which chapters your AI architect should build.</p>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">
                        {selectedSlides.length} / 15 Slides
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                {PITCH_DECK_SLIDES.map((slide) => {
                    const isSelected = selectedSlides.includes(slide.label);
                    return (
                        <button
                            key={slide.id}
                            onClick={() => toggleSlide(slide.label)}
                            className={`flex items-center justify-between px-5 py-3.5 rounded-xl border text-sm transition-all duration-300 group ${isSelected
                                ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                                : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-white/10 hover:bg-zinc-900'
                                }`}
                        >
                            <span className="font-medium">{slide.label}</span>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'
                                }`}>
                                {isSelected ? <Check size={12} strokeWidth={3} /> : <Plus size={12} className="opacity-40 group-hover:opacity-100" />}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="flex gap-3 border-t border-white/5 pt-6 items-center">
                <div className="relative flex-1 group">
                    <input
                        type="text"
                        value={customSlide}
                        onChange={(e) => setCustomSlide(e.target.value)}
                        placeholder="Add a custom slide topic (e.g., 'Exit Strategy')..."
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-5 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-zinc-600"
                        onKeyDown={(e) => e.key === 'Enter' && addCustomSlide()}
                    />
                </div>
                <button
                    onClick={addCustomSlide}
                    disabled={!customSlide.trim() || selectedSlides.length >= 15}
                    className="bg-zinc-800 hover:bg-white hover:text-black text-white px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed h-full"
                >
                    <Plus size={18} /> Add
                </button>
            </div>

            {selectedSlides.filter((s) => !PITCH_DECK_SLIDES.map((p) => p.label).includes(s)).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6 animate-in fade-in slide-in-from-top-2 duration-500">
                    {selectedSlides
                        .filter((s) => !PITCH_DECK_SLIDES.map((p) => p.label).includes(s))
                        .map((custom, idx) => (
                            <span key={idx} className="flex items-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-1.5 rounded-full text-xs font-medium">
                                {custom}
                                <button onClick={() => toggleSlide(custom)} className="hover:text-white transition-colors p-0.5 rounded-full hover:bg-white/10"><X size={14} /></button>
                            </span>
                        ))}
                </div>
            )}
        </div>
    );
}

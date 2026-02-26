"use client";

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { RefreshCw, Image as ImageIcon, Loader2, Sparkles, ChevronRight, TrendingUp, Shield, Zap, Globe, Cloud, Users, Target, DollarSign, Rocket, Brain, Search, Activity, Layers, Cpu, Database, Mail, Phone, Lock, Unlock, Key, Settings, Trash2, Edit3, Plus, Minus, Check, X, Info, HelpCircle, AlertTriangle, Star, Heart, Smile, AlignLeft, AlignCenter, AlignRight, MousePointer2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
    Cell, CartesianGrid, AreaChart, Area, LineChart, Line
} from 'recharts';
import { generatePitchDeckImage } from '@/app/actions/gemini';
import { cn, sanitizeAIText } from '@/lib/utils';

import { Slide as SlideData, SlideFeature, DesignDNA } from '@/lib/types/pitch-deck';

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// STABLE EDITABLE TEXT COMPONENT â€” defined OUTSIDE PitchDeckSlide
// so React treats it as the SAME component type across re-renders.
// Uses a ref to manage the contentEditable DOM element directly,
// preventing dangerouslySetInnerHTML from clobbering user edits.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface EditableTextProps {
    tag?: any;
    content?: string;
    onSave: (val: string) => void;
    className?: string;
    style?: React.CSSProperties;
    fieldId: string;
    isEditing: boolean;
    initialPosition?: { x: number; y: number };
    onPositionChange?: (pos: { x: number; y: number }) => void;
}

const EditableText = memo(function EditableText({
    tag: Tag = 'p',
    content,
    onSave,
    className,
    style,
    fieldId,
    isEditing,
    initialPosition = { x: 0, y: 0 },
    onPositionChange,
}: EditableTextProps) {
    const elRef = useRef<HTMLElement | null>(null);
    const mountedRef = useRef(false);
    const lastPropContentRef = useRef<string>(content || '');
    const lastSavedRef = useRef<string>(content || '');
    const onSaveRef = useRef(onSave);
    onSaveRef.current = onSave;
    // Keep a ref of content for the callback ref (avoids stale closure)
    const contentRef = useRef(content);
    contentRef.current = content;

    // Callback ref: set innerHTML ONCE on first mount (no flicker)
    const attachRef = useCallback((node: HTMLElement | null) => {
        if (node && !mountedRef.current) {
            mountedRef.current = true;
            const initialContent = contentRef.current || '';
            node.innerHTML = initialContent;
            lastPropContentRef.current = initialContent;
            lastSavedRef.current = initialContent;
            elRef.current = node;
        } else if (node) {
            // Re-attach (shouldn't happen with memo, but safety)
            elRef.current = node;
        }
        // Don't clear elRef on null — we still need it for saves in flight
    }, []); // stable — uses refs only

    // Sync from props when content genuinely changed externally
    // (e.g., switching slides, or after AI rewrite via parent)
    useEffect(() => {
        if (!elRef.current || !mountedRef.current) return;
        const propContent = content || '';
        if (propContent !== lastPropContentRef.current) {
            lastPropContentRef.current = propContent;
            lastSavedRef.current = propContent;
            if (elRef.current.innerHTML !== propContent) {
                elRef.current.innerHTML = propContent;
            }
        }
    }, [content]);

    // Stable save function — never changes reference, uses refs internally
    const doSave = useCallback(() => {
        if (!elRef.current) return;
        const currentHTML = elRef.current.innerHTML;
        if (currentHTML !== lastSavedRef.current) {
            console.log(`[EditableText] SAVING change for field, length: ${currentHTML.length}, snippet: "${currentHTML.substring(0, 60)}..."`);
            lastSavedRef.current = currentHTML;
            lastPropContentRef.current = currentHTML;
            onSaveRef.current(currentHTML);
        }
    }, []); // stable — deps are all refs

    return (
        <motion.div
            drag={isEditing}
            dragMomentum={false}
            initial={initialPosition}
            onDragEnd={(_, info) => {
                const newPos = {
                    x: initialPosition.x + info.offset.x,
                    y: initialPosition.y + info.offset.y
                };
                onPositionChange?.(newPos);
            }}
            className={cn(
                "relative group/text w-full",
                isEditing && "pointer-events-auto cursor-move active:scale-105 transition-transform"
            )}
        >
            <Tag
                ref={attachRef}
                className={cn(className, "outline-none")}
                style={style}
                contentEditable={isEditing}
                onBlur={doSave}
                onInput={doSave}
                suppressContentEditableWarning
            />
            {isEditing && (
                <div className="absolute -top-6 left-0 opacity-0 group-hover/text:opacity-100 transition-opacity whitespace-nowrap">
                    <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20">
                        <MousePointer2 size={10} className="text-blue-400" />
                        <span className="text-[8px] font-bold text-white uppercase tracking-tighter">Drag to move</span>
                    </div>
                </div>
            )}
        </motion.div>
    );
}, (prevProps, nextProps) => {
    // Custom memo: skip re-render if only onSave changed (tracked via ref)
    return (
        prevProps.content === nextProps.content &&
        prevProps.className === nextProps.className &&
        prevProps.isEditing === nextProps.isEditing &&
        prevProps.fieldId === nextProps.fieldId &&
        prevProps.tag === nextProps.tag &&
        prevProps.initialPosition?.x === nextProps.initialPosition?.x &&
        prevProps.initialPosition?.y === nextProps.initialPosition?.y
    );
});

export interface Slide extends SlideData {}

export interface PitchDeckSlideProps {
    slide: SlideData;
    isActive?: boolean;
    isEditing?: boolean;
    onUpdate?: (updatedSlide: SlideData) => void;
    onRegenerateImage?: () => void;
    isRefreshingImage?: boolean;
    exportMode?: boolean;
}

export default function PitchDeckSlide({
    slide,
    isActive = false,
    isEditing = false,
    onUpdate,
    onRegenerateImage,
    isRefreshingImage = false,
    exportMode = false,
}: PitchDeckSlideProps) {
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    // Use a ref to track the most recent slide data to avoid stale closures during rapid drags
    const latestSlideRef = useRef(slide);
    useEffect(() => {
        latestSlideRef.current = slide;
    }, [slide]);

    const updateFeature = (index: number, field: keyof SlideFeature, value: string) => {
        if (!slide.features) return;
        const newFeatures = [...slide.features];
        newFeatures[index] = { ...newFeatures[index], [field]: value };
        onUpdate?.({ ...slide, features: newFeatures });
    };

    const updateContentPart = (index: number, newValue: string) => {
        const parts = (slide.content || "").split('</li>');
        parts[index] = newValue;
        onUpdate?.({ ...slide, content: parts.join('</li>') });
    };

    const handlePositionSave = (fieldId: string, pos: { x: number; y: number }) => {
        const currentSlide = latestSlideRef.current;
        onUpdate?.({
            ...currentSlide,
            textPositions: {
                ...(currentSlide.textPositions || {}),
                [fieldId]: pos
            }
        });
    };

    // Dynamic Icon Mapping
    const DynamicIcon = ({ name, className, style, size = 24 }: { name?: string, className?: string, style?: any, size?: number }) => {
        const icons: Record<string, any> = {
            growth: TrendingUp, security: Shield, speed: Zap, global: Globe, cloud: Cloud,
            users: Users, target: Target, dollar: DollarSign, rocket: Rocket, brain: Brain,
            zap: Zap, search: Search, activity: Activity, layers: Layers, cpu: Cpu,
            database: Database, mail: Mail, phone: Phone, lock: Lock, unlock: Unlock,
            key: Key, settings: Settings, trash: Trash2, edit: Edit3, plus: Plus,
            minus: Minus, check: Check, x: X, info: Info, help: HelpCircle,
            alert: AlertTriangle, star: Star, heart: Heart, smile: Smile
        };
        const IconComponent = name ? icons[name.toLowerCase()] || Sparkles : Sparkles;
        return <IconComponent className={className} style={style} size={size} />;
    };

    const handleGenerateImage = async () => {
        if (exportMode || !onUpdate) return;
        setIsGeneratingImage(true);
        try {
            const prompt = `Vibrant corporate 3D illustration, ${slide.title}, cinematic studio lighting, clean editorial photography, abstract technological geometry, high saturation, professional colors.`;
            const base64 = await generatePitchDeckImage(prompt);
            if (base64) {
                onUpdate({ ...slide, moodImage: base64, styleHint: prompt });
            }
        } catch (e) {
            console.error("Failed to generate image", e);
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const renderImageLayer = (className?: string) => (
        <div className={cn("relative overflow-hidden bg-zinc-900 group", className)}>
            {(slide.image_url || slide.moodImage) ? (
                <img src={slide.image_url || slide.moodImage} alt="" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-zinc-500">
                    <Sparkles size={32} className={cn(isGeneratingImage && "animate-spin text-blue-500")} />
                    <button onClick={handleGenerateImage} className="text-xs font-medium hover:text-white transition-colors">
                        {isGeneratingImage ? "Designing..." : "Generate Magic Visual"}
                    </button>
                </div>
            )}

            {/* Image buttons are now at the top level */}
        </div>
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
        visible: {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            transition: {
                duration: 0.8,
                ease: [0.21, 0.47, 0.32, 0.98] as any // Custom smooth ease
            }
        }
    };

    // THEME HELPER
    const activeTheme = slide.theme || {
        primary: '#3b82f6', // Default Blue
        secondary: '#6366f1', // Default Indigo
        background: '#050505',
        accent: '#10b981' // Default Emerald
    };

    // DESIGN DNA ENGINE
    const getStyleDNA = (dna?: DesignDNA) => {
        const styles: Record<DesignDNA, any> = {
            Minimalist: {
                fontHeader: 'font-sans',
                fontBody: 'font-sans',
                headerWeight: 'font-light',
                headerTransform: 'normal-case',
                headerTracking: 'tracking-tight',
                cardStyle: 'bg-white/5 border-zinc-800 rounded-none',
                accentOpacity: '0.1'
            },
            Vibrant: {
                fontHeader: 'font-sans',
                fontBody: 'font-sans',
                headerWeight: 'font-black',
                headerTransform: 'uppercase italic',
                headerTracking: 'tracking-tighter',
                cardStyle: 'bg-zinc-900/50 border-white/5 rounded-[2.5rem]',
                accentOpacity: '0.2'
            },
            Cyberpunk: {
                fontHeader: 'font-mono',
                fontBody: 'font-mono',
                headerWeight: 'font-bold',
                headerTransform: 'uppercase',
                headerTracking: 'tracking-widest',
                cardStyle: 'bg-black/80 border-cyan-500/30 rounded-none border-l-4',
                accentOpacity: '0.3'
            },
            Fortune500: {
                fontHeader: 'font-serif',
                fontBody: 'font-sans',
                headerWeight: 'font-semibold',
                headerTransform: 'normal-case',
                headerTracking: 'tracking-normal',
                cardStyle: 'bg-zinc-900 border-zinc-700 rounded-lg shadow-xl',
                accentOpacity: '0.15'
            },
            CreativeAgency: {
                fontHeader: 'font-sans',
                fontBody: 'font-sans',
                headerWeight: 'font-black',
                headerTransform: 'uppercase',
                headerTracking: 'tracking-tight',
                cardStyle: 'bg-white text-black rounded-none skew-x-1',
                accentOpacity: '0.5'
            },
            MonoDark: {
                fontHeader: 'font-sans',
                fontBody: 'font-sans',
                headerWeight: 'font-bold',
                headerTransform: 'normal-case',
                headerTracking: 'tracking-tighter',
                cardStyle: 'bg-zinc-900/80 border-zinc-800 rounded-2xl',
                accentOpacity: '0.2'
            },
            Glassmorphism: {
                fontHeader: 'font-sans',
                fontBody: 'font-sans',
                headerWeight: 'font-medium',
                headerTransform: 'normal-case',
                headerTracking: 'tracking-tight',
                cardStyle: 'bg-white/10 backdrop-blur-xl border-white/20 rounded-3xl',
                accentOpacity: '0.2'
            },
            Editorial: {
                fontHeader: 'font-serif',
                fontBody: 'font-serif',
                headerWeight: 'font-black',
                headerTransform: 'italic',
                headerTracking: 'tracking-tighter',
                cardStyle: 'bg-transparent border-b border-zinc-800 rounded-none',
                accentOpacity: '0.1'
            },
            TechSaas: {
                fontHeader: 'font-sans',
                fontBody: 'font-sans',
                headerWeight: 'font-bold',
                headerTransform: 'normal-case',
                headerTracking: 'tracking-tight',
                cardStyle: 'bg-zinc-900 border-white/5 rounded-2xl shadow-2xl',
                accentOpacity: '0.2'
            }
        };
        return styles[dna || 'TechSaas'] || styles.TechSaas;
    };

    const dnaStyle = getStyleDNA(slide.design_dna);

    // Template Selector
    // Template Selector
    const renderContent = (): React.ReactNode => {
        const slideContent = slide.content && slide.content.trim() !== ""
            ? slide.content
            : (slide.features && slide.features.length > 0)
                ? `<ul>${slide.features.map(f => `<li><strong>${f.title}</strong>: ${f.description}</li>`).join('')}</ul>`
                : "";

        const slideFeatures = slide.features && slide.features.length > 0
            ? slide.features
            : (slide.content || "").split('</li>')
                .map(item => sanitizeAIText(item.replace(/<[^>]*>?/gm, '')).trim())
                .filter(text => text.length > 0)
                .map(text => {
                    const [title, ...desc] = text.split(':');
                    return {
                        title: title?.trim() || "Core Insight",
                        description: desc.join(':')?.trim() || text,
                        icon: 'sparkles',
                        image_url: ''
                    } as any;
                });

        const commonKey = `${slide.id}-${slide.layout_type}`;

        switch (slide.layout_type) {
            case 'hero_center':
                return (
                    <motion.div
                        key={commonKey}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className={cn(
                            "w-full h-full flex flex-col justify-center px-20 relative",
                            slide.imageAlignment === 'left' ? "items-start text-left" :
                                slide.imageAlignment === 'right' ? "items-end text-right" :
                                    "items-center justify-center text-center"
                        )}
                        style={{ backgroundColor: activeTheme.background }}
                    >
                        {(slide.image_url || slide.moodImage) && (
                            <motion.div
                                initial={{ opacity: 0, scale: 1.1 }}
                                animate={{ opacity: 0.5, scale: 1 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="absolute inset-0"
                            >
                                {renderImageLayer("w-full h-full")}
                            </motion.div>
                        )}
                        <div className="relative z-10 max-w-4xl pointer-events-none">
                            <EditableText
                                isEditing={isEditing}
                                tag="h1"
                                content={slide.title}
                                className={cn("text-8xl text-white mb-8 leading-[0.9]", dnaStyle.fontHeader, dnaStyle.headerWeight, dnaStyle.headerTransform, dnaStyle.headerTracking)}
                                onSave={(newVal) => onUpdate?.({ ...slide, title: newVal })}
                                fieldId="title"
                                initialPosition={slide.textPositions?.['title']}
                                onPositionChange={(pos) => handlePositionSave('title', pos)}
                            />

                            <EditableText
                                isEditing={isEditing}
                                content={slide.subtitle}
                                className={cn("text-2xl text-zinc-400 font-medium leading-relaxed max-w-2xl mx-auto", dnaStyle.fontBody)}
                                onSave={(newVal) => onUpdate?.({ ...slide, subtitle: newVal })}
                                fieldId="subtitle"
                                initialPosition={slide.textPositions?.['subtitle']}
                                onPositionChange={(pos) => handlePositionSave('subtitle', pos)}
                            />
                        </div>
                    </motion.div>
                );

            case 'split_image_left':
                return (
                    <motion.div
                        key={commonKey}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className={cn(
                            "w-full h-full flex",
                            slide.imageAlignment === 'right' && "flex-row-reverse",
                            slide.imageAlignment === 'center' && "flex-col items-center justify-center p-20 text-center"
                        )}
                        style={{ backgroundColor: activeTheme.background }}
                    >
                        {slide.imageAlignment === 'center' ? (
                            <>
                                <motion.div
                                    variants={itemVariants}
                                    className="w-2/3 h-[50%] mb-12 rounded-3xl overflow-hidden shadow-2xl"
                                >
                                    {renderImageLayer("h-full w-full")}
                                </motion.div>
                                <motion.div variants={itemVariants} className="max-w-4xl pointer-events-none">
                                    <EditableText
                                        isEditing={isEditing}
                                        tag="h1"
                                        content={slide.title}
                                        className={cn("text-7xl mb-6 text-white leading-tight", dnaStyle.fontHeader, dnaStyle.headerWeight)}
                                        onSave={(newVal) => onUpdate?.({ ...slide, title: newVal })}
                                        fieldId="title"
                                        initialPosition={slide.textPositions?.['title']}
                                        onPositionChange={(pos) => handlePositionSave('title', pos)}
                                    />
                                    <EditableText
                                        isEditing={isEditing}
                                        content={slide.subtitle}
                                        className={cn("text-2xl text-zinc-400 font-medium leading-relaxed", dnaStyle.fontBody)}
                                        onSave={(newVal) => onUpdate?.({ ...slide, subtitle: newVal })}
                                        fieldId="subtitle"
                                        initialPosition={slide.textPositions?.['subtitle']}
                                        onPositionChange={(pos) => handlePositionSave('subtitle', pos)}
                                    />
                                </motion.div>
                            </>
                        ) : (
                            <>
                                <motion.div
                                    initial={{ x: slide.imageAlignment === 'right' ? 100 : -100, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="w-1/2 h-full"
                                >
                                    {renderImageLayer("h-full w-full")}
                                </motion.div>
                                <motion.div
                                    variants={itemVariants}
                                    className="w-1/2 h-full flex flex-col justify-center p-24 pointer-events-none"
                                >
                                    <EditableText
                                        isEditing={isEditing}
                                        tag="h1"
                                        content={slide.title}
                                        className={cn("text-6xl text-white mb-6 leading-tight outline-none", dnaStyle.fontHeader, dnaStyle.headerWeight, dnaStyle.headerTransform, dnaStyle.headerTracking)}
                                        onSave={(newVal) => onUpdate?.({ ...slide, title: newVal })}
                                        fieldId="split-title"
                                        initialPosition={slide.textPositions?.['split-title']}
                                        onPositionChange={(pos) => handlePositionSave('split-title', pos)}
                                    />

                                    <EditableText
                                        isEditing={isEditing}
                                        content={slide.subtitle}
                                        className={cn("text-xl text-zinc-400 font-medium mb-12 leading-relaxed outline-none", dnaStyle.fontBody)}
                                        onSave={(newVal) => onUpdate?.({ ...slide, subtitle: newVal })}
                                        fieldId="split-subtitle"
                                        initialPosition={slide.textPositions?.['split-subtitle']}
                                        onPositionChange={(pos) => handlePositionSave('split-subtitle', pos)}
                                    />
                                    <motion.div variants={itemVariants} className="space-y-4 relative z-10">
                                        {(slideContent || "").split('</li>').map((item, i) => {
                                            const text = sanitizeAIText(item.replace(/<[^>]*>?/gm, '')).trim();
                                            if (!text) return null;
                                            return (
                                                <div key={i} className="flex items-start gap-4">
                                                    <div
                                                        className="mt-1.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0"
                                                        style={{ borderColor: `${activeTheme.primary}4d` }}
                                                    >
                                                        <div
                                                            className="w-1.5 h-1.5 rounded-full"
                                                            style={{ backgroundColor: activeTheme.primary }}
                                                        />
                                                    </div>
                                                    <EditableText
                                                        isEditing={isEditing}
                                                        content={text}
                                                        className="text-zinc-300 text-lg leading-snug outline-none"
                                                        onSave={(newVal) => updateContentPart(i, newVal)}
                                                        fieldId={`split-content-${i}`}
                                                        initialPosition={slide.textPositions?.[`split-content-${i}`]}
                                                        onPositionChange={(pos) => handlePositionSave(`split-content-${i}`, pos)}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </motion.div>
                                </motion.div>
                            </>
                        )}
                    </motion.div>
                );

            case 'three_column_grid':
                return (
                    <motion.div
                        key={commonKey}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className={cn(
                            "w-full h-full flex flex-col p-20 relative overflow-hidden",
                            slide.imageAlignment === 'center' ? "items-center text-center" :
                                slide.imageAlignment === 'right' ? "items-end text-right" : ""
                        )}
                        style={{ backgroundColor: activeTheme.background }}
                    >
                        {(slide.image_url || slide.moodImage) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.3 }}
                                transition={{ duration: 2 }}
                                className="absolute inset-0 pointer-events-none"
                            >
                                {renderImageLayer("w-full h-full")}
                                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-[#050505] pointer-events-none" />
                            </motion.div>
                        )}
                        <div className="mb-16">
                            <EditableText
                                isEditing={isEditing}
                                tag="h1"
                                content={slide.title}
                                className={cn("text-7xl text-white leading-none mb-4 outline-none", dnaStyle.fontHeader, dnaStyle.headerWeight, dnaStyle.headerTransform, dnaStyle.headerTracking)}
                                onSave={(newVal) => onUpdate?.({ ...slide, title: newVal })}
                                fieldId="grid-title"
                                initialPosition={slide.textPositions?.['grid-title']}
                                onPositionChange={(pos) => handlePositionSave('grid-title', pos)}
                            />

                            <EditableText
                                isEditing={isEditing}
                                content={slide.subtitle}
                                className={cn("text-xl text-zinc-400 font-medium leading-relaxed max-w-2xl", dnaStyle.fontBody)}
                                onSave={(newVal) => onUpdate?.({ ...slide, subtitle: newVal })}
                                fieldId="subtitle"
                                initialPosition={slide.textPositions?.['subtitle']}
                                onPositionChange={(pos) => handlePositionSave('subtitle', pos)}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-8 mt-auto relative z-10 pointer-events-none">
                            {slideFeatures.map((feature, i) => (
                                <motion.div
                                    key={i}
                                    variants={itemVariants}
                                    className={cn("p-8 transition-all group pointer-events-auto", dnaStyle.cardStyle)}
                                    style={{ '--hover-border': activeTheme.primary } as any}
                                >
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                                        style={{ backgroundColor: `${activeTheme.primary}1a` }}
                                    >
                                        <DynamicIcon name={feature.icon} style={{ color: activeTheme.primary }} />
                                    </div>
                                    <EditableText
                                        isEditing={isEditing}
                                        tag="h3"
                                        content={feature.title}
                                        className="text-2xl font-bold text-white mb-3 tracking-tight"
                                        onSave={(newVal) => updateFeature(i, 'title', newVal)}
                                        fieldId={`grid-${i}-title`}
                                        initialPosition={slide.textPositions?.[`grid-${i}-title`]}
                                        onPositionChange={(pos) => handlePositionSave(`grid-${i}-title`, pos)}
                                    />
                                    <EditableText
                                        isEditing={isEditing}
                                        content={feature.description}
                                        className="text-zinc-400 leading-relaxed text-sm"
                                        onSave={(newVal) => updateFeature(i, 'description', newVal)}
                                        fieldId={`grid-${i}-desc`}
                                        initialPosition={slide.textPositions?.[`grid-${i}-desc`]}
                                        onPositionChange={(pos) => handlePositionSave(`grid-${i}-desc`, pos)}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                );

            case 'timeline_vertical':
                return (
                    <motion.div
                        key={commonKey}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="w-full h-full p-24 text-white flex flex-col justify-center relative"
                        style={{ backgroundColor: activeTheme.background }}
                    >
                        {(slide.image_url || slide.moodImage) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.25 }}
                                transition={{ duration: 2 }}
                                className="absolute inset-0 pointer-events-none"
                            >
                                <img src={slide.image_url || slide.moodImage} alt="" className="w-full h-full object-cover" />
                            </motion.div>
                        )}
                        <EditableText
                            isEditing={isEditing}
                            tag="h1"
                            content={slide.title}
                            className="text-6xl font-black mb-16 tracking-tighter uppercase italic text-transparent bg-clip-text"
                            style={{ backgroundImage: `linear-gradient(to right, ${activeTheme.primary}, ${activeTheme.secondary})` }}
                            onSave={(newVal) => onUpdate?.({ ...slide, title: newVal })}
                            fieldId="title"
                            initialPosition={slide.textPositions?.['title']}
                            onPositionChange={(pos) => handlePositionSave('title', pos)}
                        />

                        <div className="relative flex flex-col gap-12 before:absolute before:inset-y-0 before:left-8 before:w-px before:bg-white/10 z-10">
                            {slideFeatures.map((feat, i) => (
                                <motion.div key={i} variants={itemVariants} className="relative pl-24 group">
                                    <div
                                        className="absolute left-4 top-0 w-8 h-8 rounded-full border-4 flex items-center justify-center text-[10px] font-black z-10 group-hover:scale-110 transition-transform"
                                        style={{
                                            backgroundColor: activeTheme.primary,
                                            borderColor: activeTheme.background,
                                            boxShadow: `0 0 15px ${activeTheme.primary}80`
                                        }}
                                    >
                                        {i + 1}
                                    </div>
                                    <EditableText
                                        isEditing={isEditing}
                                        tag="h3"
                                        content={feat.title}
                                        className="text-2xl font-bold text-zinc-100 mb-2 tracking-tight transition-colors outline-none"
                                        style={{ '--hover-color': activeTheme.primary } as any}
                                        onSave={(newVal) => updateFeature(i, 'title', newVal)}
                                        fieldId={`timeline-v-${i}-title`}
                                        initialPosition={slide.textPositions?.[`timeline-v-${i}-title`]}
                                        onPositionChange={(pos) => handlePositionSave(`timeline-v-${i}-title`, pos)}
                                    />
                                    <EditableText
                                        isEditing={isEditing}
                                        content={feat.description}
                                        className="text-zinc-400 text-lg leading-relaxed max-w-3xl outline-none"
                                        onSave={(newVal) => updateFeature(i, 'description', newVal)}
                                        fieldId={`timeline-v-${i}-desc`}
                                        initialPosition={slide.textPositions?.[`timeline-v-${i}-desc`]}
                                        onPositionChange={(pos) => handlePositionSave(`timeline-v-${i}-desc`, pos)}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                );

            case 'circular_process':
                return (
                    <motion.div
                        key={commonKey}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className={cn(
                            "w-full h-full p-16 flex flex-col items-center justify-center text-white relative",
                            slide.imageAlignment === 'left' ? "items-start text-left" :
                                slide.imageAlignment === 'right' ? "items-end text-right" : "items-center text-center"
                        )}
                        style={{ backgroundColor: activeTheme.background }}
                    >
                        {(slide.image_url || slide.moodImage) && (
                            <motion.div
                                initial={{ opacity: 0, scale: 1.2 }}
                                animate={{ opacity: 0.3, scale: 1 }}
                                transition={{ duration: 2 }}
                                className="absolute inset-0"
                            >
                                {renderImageLayer("w-full h-full")}
                            </motion.div>
                        )}
                        <EditableText
                            isEditing={isEditing}
                            tag="h1"
                            content={slide.title}
                            className="text-6xl font-black mb-24 text-center tracking-tighter uppercase italic outline-none"
                            style={{ color: activeTheme.primary }}
                            onSave={(newVal) => onUpdate?.({ ...slide, title: newVal })}
                            fieldId="circular-title"
                            initialPosition={slide.textPositions?.['circular-title']}
                            onPositionChange={(pos) => handlePositionSave('circular-title', pos)}
                        />

                        <div className="relative flex items-center justify-between gap-12 max-w-7xl w-full z-10 pointer-events-none">
                            {/* Left Side: Features */}
                            <div className="grid grid-cols-1 gap-6 w-1/2">
                                {slideFeatures.slice(0, 4).map((feat, i) => (
                                    <motion.div key={i} variants={itemVariants} className="flex gap-6 group bg-zinc-900/40 border border-white/5 p-6 rounded-2xl hover:bg-zinc-800/60 transition-all pointer-events-auto">
                                        <div
                                            className="w-12 h-12 shrink-0 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center transition-all"
                                            style={{ '--hover-bg': `${activeTheme.primary}1a`, '--hover-border': `${activeTheme.primary}4d` } as any}
                                        >
                                            <DynamicIcon name={feat.icon} style={{ color: activeTheme.primary }} />
                                        </div>
                                        <div className="flex-1">
                                            <EditableText
                                                isEditing={isEditing}
                                                tag="h3"
                                                content={feat.title}
                                                className="text-xl font-bold text-zinc-100 mb-2 tracking-tight uppercase italic outline-none"
                                                onSave={(newVal) => updateFeature(i, 'title', newVal)}
                                                fieldId={`circular-${i}-title`}
                                                initialPosition={slide.textPositions?.[`circular-${i}-title`]}
                                                onPositionChange={(pos) => handlePositionSave(`circular-${i}-title`, pos)}
                                            />
                                            <EditableText
                                                isEditing={isEditing}
                                                content={feat.description}
                                                className="text-zinc-400 leading-relaxed text-sm outline-none"
                                                onSave={(newVal) => updateFeature(i, 'description', newVal)}
                                                fieldId={`circular-${i}-desc`}
                                                initialPosition={slide.textPositions?.[`circular-${i}-desc`]}
                                                onPositionChange={(pos) => handlePositionSave(`circular-${i}-desc`, pos)}
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Right Side: Visual */}
                            <motion.div
                                variants={itemVariants}
                                className="w-[500px] h-[500px] relative shrink-0"
                            >
                                <div
                                    className="absolute inset-0 rounded-full border border-white/10 animate-[spin_20s_linear_infinite]"
                                    style={{ borderColor: `${activeTheme.primary}33` }}
                                />
                                <div
                                    className="absolute inset-8 rounded-full border border-white/5 animate-[spin_15s_linear_infinite_reverse]"
                                    style={{ borderColor: `${activeTheme.primary}1a` }}
                                />
                                <div className="absolute inset-16 rounded-full overflow-hidden border-4 border-zinc-900 shadow-2xl pointer-events-auto">
                                    {renderImageLayer("w-full h-full")}
                                </div>
                                <div
                                    className="absolute -inset-4 rounded-full blur-3xl opacity-20"
                                    style={{ backgroundImage: `radial-gradient(circle, ${activeTheme.primary}, transparent)` }}
                                />
                            </motion.div>
                        </div>
                    </motion.div>
                );

            case 'image_card_grid':
                return (
                    <motion.div
                        key={commonKey}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="w-full h-full p-20 flex flex-col justify-center text-white"
                        style={{ backgroundColor: activeTheme.background }}
                    >
                        <EditableText
                            isEditing={isEditing}
                            tag="h1"
                            content={slide.title}
                            className="text-6xl font-black mb-16 tracking-tighter uppercase italic"
                            style={{ color: activeTheme.primary }}
                            onSave={(newVal) => onUpdate?.({ ...slide, title: newVal })}
                            fieldId="title"
                            initialPosition={slide.textPositions?.['title']}
                            onPositionChange={(pos) => handlePositionSave('title', pos)}
                        />
                        <div className="grid grid-cols-4 gap-8 relative z-10">
                            {slideFeatures.map((feat, i) => (
                                <motion.div
                                    key={i}
                                    variants={itemVariants}
                                    className="flex flex-col bg-zinc-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden group transition-all"
                                    style={{ '--hover-border': activeTheme.primary } as any}
                                >
                                    <div className="h-48 bg-zinc-800 w-full relative overflow-hidden">
                                        {feat.image_url ? (
                                            <img src={feat.image_url} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                                                <ImageIcon className="text-white/10" size={48} />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                    </div>
                                    <div className="p-8">
                                        <EditableText
                                            isEditing={isEditing}
                                            tag="h3"
                                            content={feat.title}
                                            className="text-xl font-bold text-white mb-3 tracking-tight transition-colors uppercase italic"
                                            onSave={(newVal) => updateFeature(i, 'title', newVal)}
                                            fieldId={`imagegrid-${i}-title`}
                                            initialPosition={slide.textPositions?.[`imagegrid-${i}-title`]}
                                            onPositionChange={(pos) => handlePositionSave(`imagegrid-${i}-title`, pos)}
                                        />
                                        <EditableText
                                            isEditing={isEditing}
                                            content={feat.description}
                                            className="text-sm text-zinc-400 leading-relaxed"
                                            onSave={(newVal) => updateFeature(i, 'description', newVal)}
                                            fieldId={`imagegrid-${i}-desc`}
                                            initialPosition={slide.textPositions?.[`imagegrid-${i}-desc`]}
                                            onPositionChange={(pos) => handlePositionSave(`imagegrid-${i}-desc`, pos)}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                );

            case 'financial_chart':
                return (
                    <motion.div
                        key={commonKey}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className={cn(
                            "w-full h-full p-24 text-white flex gap-12 items-center relative overflow-hidden",
                            slide.imageAlignment === 'left' && "flex-row-reverse",
                            slide.imageAlignment === 'center' && "flex-col p-32 text-center"
                        )}
                        style={{ backgroundColor: activeTheme.background }}
                    >
                        {(slide.image_url || slide.moodImage) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.15 }}
                                transition={{ duration: 2 }}
                                className="absolute inset-0"
                            >
                                {renderImageLayer("w-full h-full")}
                                <div className={cn(
                                    "absolute inset-0 pointer-events-none",
                                    slide.imageAlignment === 'left' ? "bg-gradient-to-l from-transparent via-transparent to-black" : "bg-gradient-to-r from-black via-black/40 to-transparent"
                                )} />
                            </motion.div>
                        )}
                        <div className="w-1/2 relative z-10 pointer-events-none">
                            <EditableText
                                isEditing={isEditing}
                                tag="h1"
                                content={slide.title}
                                className="text-7xl font-black mb-8 tracking-tighter uppercase italic text-transparent bg-clip-text"
                                style={{ backgroundImage: `linear-gradient(to right, ${activeTheme.primary}, ${activeTheme.secondary})` }}
                                onSave={(newVal) => onUpdate?.({ ...slide, title: newVal })}
                                fieldId="title"
                                initialPosition={slide.textPositions?.['title']}
                                onPositionChange={(pos) => handlePositionSave('title', pos)}
                            />

                            <EditableText
                                isEditing={isEditing}
                                content={slide.subtitle}
                                className="text-2xl text-zinc-400 font-medium leading-relaxed mb-8"
                                onSave={(newVal) => onUpdate?.({ ...slide, subtitle: newVal })}
                                fieldId="subtitle"
                                initialPosition={slide.textPositions?.['subtitle']}
                                onPositionChange={(pos) => handlePositionSave('subtitle', pos)}
                            />
                            <motion.div
                                variants={itemVariants}
                                className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl relative z-10"
                            >
                                <div className="space-y-4">
                                    {(slideContent || "").split('</li>').map((item, i) => {
                                        const text = item.replace(/<[^>]*>?/gm, '').trim();
                                        if (!text) return null;
                                        return (
                                            <div key={i} className="flex items-center gap-3">
                                                <ChevronRight size={16} style={{ color: activeTheme.primary }} />
                                                <EditableText
                                                    isEditing={isEditing}
                                                    content={text}
                                                    className="text-zinc-300 text-lg outline-none"
                                                    onSave={(newVal) => updateContentPart(i, newVal)}
                                                    fieldId={`finance-content-${i}`}
                                                    initialPosition={slide.textPositions?.[`finance-content-${i}`]}
                                                    onPositionChange={(pos) => handlePositionSave(`finance-content-${i}`, pos)}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </div>

                        <motion.div
                            variants={itemVariants}
                            className={cn(
                                slide.imageAlignment === 'center' ? "w-full max-w-5xl" : "w-1/2"
                            )}
                            style={{ pointerEvents: 'auto' }}
                        >
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ backgroundImage: `linear-gradient(to bottom right, ${activeTheme.primary}1a, transparent)` }}
                            />
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={slide.chartData || []} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={activeTheme.primary} stopOpacity={1} />
                                            <stop offset="100%" stopColor={activeTheme.secondary} stopOpacity={0.8} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#71717a', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        cursor={{ fill: '#ffffff05' }}
                                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px' }}
                                    />
                                    <Bar dataKey="value" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </motion.div>
                    </motion.div>
                );

            case 'horizontal_timeline':
                return (
                    <motion.div
                        key={commonKey}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="w-full h-full p-24 flex flex-col justify-center items-center relative overflow-hidden"
                        style={{ backgroundColor: activeTheme.background }}
                    >
                        {(slide.image_url || slide.moodImage) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.25 }}
                                transition={{ duration: 2 }}
                                className="absolute inset-0 pointer-events-none"
                            >
                                {renderImageLayer("w-full h-full")}
                                <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/20 to-black/80 pointer-events-none" />
                            </motion.div>
                        )}
                        <div className="absolute inset-0 opacity-10 dot-grid" />

                        <div className="relative z-10 w-full text-center mb-32">
                            <EditableText
                                isEditing={isEditing}
                                tag="h1"
                                content={slide.title}
                                className={cn("text-7xl mb-4 text-white uppercase italic tracking-tighter outline-none", dnaStyle.fontHeader, dnaStyle.headerWeight)}
                                onSave={(newVal) => onUpdate?.({ ...slide, title: newVal })}
                                fieldId="timeline-h-title"
                                initialPosition={slide.textPositions?.['timeline-h-title']}
                                onPositionChange={(pos) => handlePositionSave('timeline-h-title', pos)}
                            />
                            <EditableText
                                isEditing={isEditing}
                                content={slide.subtitle}
                                className={cn("text-xl text-zinc-400 max-w-2xl mx-auto outline-none", dnaStyle.fontBody)}
                                onSave={(newVal) => onUpdate?.({ ...slide, subtitle: newVal })}
                                fieldId="timeline-h-subtitle"
                                initialPosition={slide.textPositions?.['timeline-h-subtitle']}
                                onPositionChange={(pos) => handlePositionSave('timeline-h-subtitle', pos)}
                            />
                        </div>

                        <div className="relative w-full max-w-7xl">
                            <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 1.5, ease: "circOut" }}
                                className="absolute top-1/2 left-0 w-full h-px origin-left"
                                style={{ backgroundColor: `${activeTheme.primary}40` }}
                            />

                            <div className="flex justify-between items-start relative px-12 z-10">
                                {slideFeatures.slice(0, 4).map((feat, i) => (
                                    <motion.div
                                        key={i}
                                        variants={itemVariants}
                                        className="relative flex flex-col items-center w-64 group"
                                    >
                                        <div
                                            className="w-12 h-12 rounded-xl mb-8 flex items-center justify-center relative z-20 transition-all group-hover:scale-125 shadow-2xl"
                                            style={{
                                                backgroundColor: i % 2 === 0 ? activeTheme.primary : activeTheme.secondary,
                                                boxShadow: `0 0 30px ${i % 2 === 0 ? activeTheme.primary : activeTheme.secondary}40`
                                            }}
                                        >
                                            <span className="text-white font-black text-lg">{i + 1}</span>
                                        </div>

                                        <div className={cn("text-center absolute w-full", i % 2 === 0 ? "-top-40" : "top-20")}>
                                            <EditableText
                                                isEditing={isEditing}
                                                tag="h3"
                                                content={feat.title}
                                                className={cn("text-2xl font-black text-white uppercase italic outline-none", dnaStyle.fontHeader)}
                                                onSave={(newVal) => updateFeature(i, 'title', newVal)}
                                                fieldId={`timeline-h-${i}-title`}
                                                initialPosition={slide.textPositions?.[`timeline-h-${i}-title`]}
                                                onPositionChange={(pos) => handlePositionSave(`timeline-h-${i}-title`, pos)}
                                            />
                                            <EditableText
                                                isEditing={isEditing}
                                                content={feat.description}
                                                className={cn("text-sm text-zinc-400 leading-relaxed outline-none", dnaStyle.fontBody)}
                                                onSave={(newVal) => updateFeature(i, 'description', newVal)}
                                                fieldId={`timeline-h-${i}-desc`}
                                                initialPosition={slide.textPositions?.[`timeline-h-${i}-desc`]}
                                                onPositionChange={(pos) => handlePositionSave(`timeline-h-${i}-desc`, pos)}
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                );

            case 'bento_editorial':
                return (
                    <motion.div
                        key={commonKey}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className={cn(
                            "w-full h-full p-24 flex gap-16 relative",
                            slide.imageAlignment === 'left' && "flex-row-reverse",
                            slide.imageAlignment === 'center' && "flex-col p-32 text-center"
                        )}
                        style={{ backgroundColor: activeTheme.background }}
                    >
                        {slide.imageAlignment === 'center' ? (
                            <>
                                <motion.div
                                    variants={itemVariants}
                                    className="w-full h-[55%] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl relative mb-12"
                                >
                                    {renderImageLayer("w-full h-full")}
                                </motion.div>
                                <div className="max-w-4xl mx-auto items-center pointer-events-none">
                                    <div className="pointer-events-auto">
                                        <EditableText
                                            isEditing={isEditing}
                                            tag="h1"
                                            content={slide.title}
                                            className={cn("text-8xl mb-6 text-white tracking-tighter outline-none", dnaStyle.fontHeader, dnaStyle.headerWeight, dnaStyle.headerTransform)}
                                            onSave={(newVal) => onUpdate?.({ ...slide, title: newVal })}
                                            fieldId="bento-title"
                                            initialPosition={slide.textPositions?.['bento-title']}
                                            onPositionChange={(pos) => handlePositionSave('bento-title', pos)}
                                        />
                                        <EditableText
                                            isEditing={isEditing}
                                            content={slide.subtitle}
                                            className={cn("text-2xl text-zinc-400 font-medium leading-relaxed outline-none", dnaStyle.fontBody)}
                                            onSave={(newVal) => onUpdate?.({ ...slide, subtitle: newVal })}
                                            fieldId="bento-subtitle"
                                            initialPosition={slide.textPositions?.['bento-subtitle']}
                                            onPositionChange={(pos) => handlePositionSave('bento-subtitle', pos)}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-1/2 flex flex-col justify-center pointer-events-none">
                                    <div className="pointer-events-auto">
                                        <EditableText
                                            isEditing={isEditing}
                                            tag="h1"
                                            content={slide.title}
                                            className={cn("text-8xl mb-6 text-white tracking-tighter outline-none", dnaStyle.fontHeader, dnaStyle.headerWeight, dnaStyle.headerTransform)}
                                            onSave={(newVal) => onUpdate?.({ ...slide, title: newVal })}
                                            fieldId="bento-title"
                                            initialPosition={slide.textPositions?.['bento-title']}
                                            onPositionChange={(pos) => handlePositionSave('bento-title', pos)}
                                        />
                                        <EditableText
                                            isEditing={isEditing}
                                            content={slide.subtitle}
                                            className={cn("text-2xl text-zinc-400 mb-12 font-medium leading-relaxed outline-none", dnaStyle.fontBody)}
                                            onSave={(newVal) => onUpdate?.({ ...slide, subtitle: newVal })}
                                            fieldId="bento-subtitle"
                                            initialPosition={slide.textPositions?.['bento-subtitle']}
                                            onPositionChange={(pos) => handlePositionSave('bento-subtitle', pos)}
                                        />
                                    </div>

                                    <div className="space-y-6 relative z-10">
                                        {slideFeatures.slice(0, 3).map((feat, i) => (
                                            <motion.div
                                                key={i}
                                                variants={itemVariants}
                                                className="flex items-center gap-6 group"
                                            >
                                                <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                                                    <ChevronRight size={24} />
                                                </div>
                                                <EditableText
                                                    isEditing={isEditing}
                                                    tag="h3"
                                                    content={feat.title}
                                                    className={cn("text-2xl font-bold text-white outline-none", dnaStyle.fontHeader)}
                                                    onSave={(newVal) => updateFeature(i, 'title', newVal)}
                                                    fieldId={`bento-${i}-title`}
                                                    initialPosition={slide.textPositions?.[`bento-${i}-title`]}
                                                    onPositionChange={(pos) => handlePositionSave(`bento-${i}-title`, pos)}
                                                />
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                <div className="w-1/2 relative h-full">
                                    <motion.div
                                        variants={itemVariants}
                                        className="w-full h-full rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl relative"
                                    >
                                        {renderImageLayer("w-full h-full")}
                                        <div className={cn(
                                            "absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/40 pointer-events-none",
                                            slide.imageAlignment === 'left' && "bg-gradient-to-r"
                                        )} />
                                    </motion.div>
                                </div>
                            </>
                        )}
                    </motion.div>
                );

            case 'split_hero':
                return (
                    <motion.div
                        key={commonKey}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className={cn(
                            "w-full h-full flex relative overflow-hidden",
                            slide.imageAlignment === 'left' ? "flex-row-reverse" : ""
                        )}
                        style={{ backgroundColor: activeTheme.background }}
                    >
                        {slide.imageAlignment === 'center' ? (
                            <>
                                <div className="absolute inset-0 z-0">
                                    {renderImageLayer("w-full h-full")}
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-none" />
                                </div>
                                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center p-32 pointer-events-none">
                                    <div className="pointer-events-auto flex flex-col items-center justify-center">
                                        <motion.div
                                            variants={itemVariants}
                                            className="w-20 h-1 bg-white mb-12"
                                            style={{ backgroundColor: activeTheme.primary }}
                                        />
                                        <EditableText
                                            isEditing={isEditing}
                                            tag="h1"
                                            content={slide.title}
                                            className={cn("text-9xl mb-8 text-white tracking-tighter leading-[0.9]", dnaStyle.fontHeader, dnaStyle.headerWeight, dnaStyle.headerTransform)}
                                            onSave={(newVal) => onUpdate?.({ ...slide, title: newVal })}
                                            fieldId="title"
                                            initialPosition={slide.textPositions?.['title']}
                                            onPositionChange={(pos) => handlePositionSave('title', pos)}
                                        />
                                        <EditableText
                                            isEditing={isEditing}
                                            content={slide.subtitle}
                                            className={cn("text-3xl text-zinc-400 font-medium leading-relaxed max-w-4xl", dnaStyle.fontBody)}
                                            onSave={(newVal) => onUpdate?.({ ...slide, subtitle: newVal })}
                                            fieldId="subtitle"
                                            initialPosition={slide.textPositions?.['subtitle']}
                                            onPositionChange={(pos) => handlePositionSave('subtitle', pos)}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-[45%] h-full flex flex-col justify-center p-32 relative z-10 pointer-events-none">
                                    <div className="pointer-events-auto">
                                        <motion.div
                                            variants={itemVariants}
                                            className="w-20 h-1 bg-white mb-12"
                                            style={{ backgroundColor: activeTheme.primary }}
                                        />
                                        <EditableText
                                            isEditing={isEditing}
                                            tag="h1"
                                            content={slide.title}
                                            className={cn("text-9xl mb-8 text-white tracking-tighter leading-[0.9]", dnaStyle.fontHeader, dnaStyle.headerWeight, dnaStyle.headerTransform)}
                                            onSave={(newVal) => onUpdate?.({ ...slide, title: newVal })}
                                            fieldId="title"
                                            initialPosition={slide.textPositions?.['title']}
                                            onPositionChange={(pos) => handlePositionSave('title', pos)}
                                        />
                                        <EditableText
                                            isEditing={isEditing}
                                            content={slide.subtitle}
                                            className={cn("text-3xl text-zinc-400 font-medium leading-relaxed", dnaStyle.fontBody)}
                                            onSave={(newVal) => onUpdate?.({ ...slide, subtitle: newVal })}
                                            fieldId="subtitle"
                                            initialPosition={slide.textPositions?.['subtitle']}
                                            onPositionChange={(pos) => handlePositionSave('subtitle', pos)}
                                        />
                                    </div>
                                </div>

                                <div className="w-[55%] h-full relative">
                                    {renderImageLayer("w-full h-full")}
                                    <div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{ backgroundImage: `linear-gradient(to ${slide.imageAlignment === 'left' ? 'left' : 'right'}, ${activeTheme.background}, transparent)` }}
                                    />
                                </div>
                            </>
                        )}
                    </motion.div>
                );

            case 'dashboard_editorial':
                return (
                    <motion.div
                        key={commonKey}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className={cn(
                            "w-full h-full p-16 flex gap-12 relative items-center",
                            slide.imageAlignment === 'right' ? "flex-row-reverse" :
                                slide.imageAlignment === 'center' ? "flex-col p-20 text-center" : ""
                        )}
                        style={{ backgroundColor: activeTheme.background }}
                    >
                        {slide.imageAlignment === 'center' ? (
                            <>
                                <motion.div
                                    variants={itemVariants}
                                    className="w-full h-[60%] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl relative"
                                >
                                    {renderImageLayer("w-full h-full")}
                                </motion.div>
                                <div className="max-w-4xl mt-12 pointer-events-none">
                                    <div className="pointer-events-auto">
                                        <EditableText
                                            isEditing={isEditing}
                                            tag="h2"
                                            content={slide.title}
                                            className={cn("text-6xl font-black text-white mb-4 italic uppercase", dnaStyle.fontHeader)}
                                            onSave={(newVal) => onUpdate?.({ ...slide, title: newVal })}
                                            fieldId="dashboard-ed-title"
                                            initialPosition={slide.textPositions?.['dashboard-ed-title']}
                                            onPositionChange={(pos) => handlePositionSave('dashboard-ed-title', pos)}
                                        />
                                        <EditableText
                                            isEditing={isEditing}
                                            content={slide.subtitle}
                                            className={cn("text-zinc-400 text-xl max-w-2xl mx-auto", dnaStyle.fontBody)}
                                            onSave={(newVal) => onUpdate?.({ ...slide, subtitle: newVal })}
                                            fieldId="dashboard-ed-subtitle"
                                            initialPosition={slide.textPositions?.['dashboard-ed-subtitle']}
                                            onPositionChange={(pos) => handlePositionSave('dashboard-ed-subtitle', pos)}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-3/5 h-full relative group">
                                    <motion.div
                                        variants={itemVariants}
                                        className="w-full h-full rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl"
                                    >
                                        {renderImageLayer("w-full h-full")}
                                    </motion.div>
                                    <div className={cn(
                                        "absolute top-12 p-8 bg-black/40 backdrop-blur-3xl rounded-3xl border border-white/10 max-w-sm pointer-events-none",
                                        slide.imageAlignment === 'right' ? "right-12" : "left-12"
                                    )}>
                                        <div className="pointer-events-auto">
                                            <EditableText
                                                isEditing={isEditing}
                                                tag="h2"
                                                content={slide.title}
                                                className={cn("text-3xl font-black text-white mb-2 italic uppercase", dnaStyle.fontHeader)}
                                                onSave={(newVal) => onUpdate?.({ ...slide, title: newVal })}
                                                fieldId="dashboard-ed-title"
                                                initialPosition={slide.textPositions?.['dashboard-ed-title']}
                                                onPositionChange={(pos) => handlePositionSave('dashboard-ed-title', pos)}
                                            />
                                            <EditableText
                                                isEditing={isEditing}
                                                content={slide.subtitle}
                                                className={cn("text-zinc-400 text-sm", dnaStyle.fontBody)}
                                                onSave={(newVal) => onUpdate?.({ ...slide, subtitle: newVal })}
                                                fieldId="dashboard-ed-subtitle"
                                                initialPosition={slide.textPositions?.['dashboard-ed-subtitle']}
                                                onPositionChange={(pos) => handlePositionSave('dashboard-ed-subtitle', pos)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="w-2/5 flex flex-col justify-center gap-8 relative z-10 pointer-events-none">
                                    <div className="pointer-events-auto flex flex-col gap-8">
                                        {slideFeatures.slice(0, 3).map((feat, i) => (
                                            <motion.div
                                                key={i}
                                                variants={itemVariants}
                                                className={cn("p-10 transition-all border border-white/5", dnaStyle.cardStyle)}
                                                style={{ '--hover-border': activeTheme.primary } as any}
                                            >
                                                <EditableText
                                                    isEditing={isEditing}
                                                    tag="h3"
                                                    content={feat.title}
                                                    className={cn("text-3xl font-black text-white mb-4 uppercase italic tracking-tighter", dnaStyle.fontHeader)}
                                                    onSave={(newVal) => updateFeature(i, 'title', newVal)}
                                                    fieldId={`dashboard-${i}-title`}
                                                    initialPosition={slide.textPositions?.[`dashboard-${i}-title`]}
                                                    onPositionChange={(pos) => handlePositionSave(`dashboard-${i}-title`, pos)}
                                                />
                                                <EditableText
                                                    isEditing={isEditing}
                                                    content={feat.description}
                                                    className={cn("text-zinc-400 text-lg leading-relaxed", dnaStyle.fontBody)}
                                                    onSave={(newVal) => updateFeature(i, 'description', newVal)}
                                                    fieldId={`dashboard-${i}-desc`}
                                                    initialPosition={slide.textPositions?.[`dashboard-${i}-desc`]}
                                                    onPositionChange={(pos) => handlePositionSave(`dashboard-${i}-desc`, pos)}
                                                />
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                );

            case 'stats_grid':
                return (
                    <motion.div
                        key={commonKey}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="w-full h-full p-24 flex flex-col justify-center relative overflow-hidden"
                        style={{ backgroundColor: activeTheme.background }}
                    >
                        {(slide.image_url || slide.moodImage) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.3 }}
                                transition={{ duration: 2 }}
                                className="absolute inset-0"
                            >
                                {renderImageLayer("w-full h-full")}
                                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-[#050505] pointer-events-none" />
                            </motion.div>
                        )}
                        <div className="absolute inset-0 opacity-20 pointer-events-none">
                            <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px]" style={{ backgroundColor: `${activeTheme.primary}20` }} />
                            <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px]" style={{ backgroundColor: `${activeTheme.secondary}20` }} />
                        </div>

                        <EditableText
                            isEditing={isEditing}
                            tag="h1"
                            content={slide.title}
                            className={cn("text-7xl mb-4 text-white uppercase italic tracking-tighter", dnaStyle.fontHeader, dnaStyle.headerWeight)}
                            onSave={(newVal) => onUpdate?.({ ...slide, title: newVal })}
                            fieldId="title"
                            initialPosition={slide.textPositions?.['title']}
                            onPositionChange={(pos) => handlePositionSave('title', pos)}
                        />
                        <EditableText
                            isEditing={isEditing}
                            content={slide.subtitle}
                            className={cn("text-2xl text-zinc-400 max-w-3xl", dnaStyle.fontBody)}
                            onSave={(newVal) => onUpdate?.({ ...slide, subtitle: newVal })}
                            fieldId="subtitle"
                            initialPosition={slide.textPositions?.['subtitle']}
                            onPositionChange={(pos) => handlePositionSave('subtitle', pos)}
                        />

                        <div className="grid grid-cols-2 gap-8 max-w-6xl relative z-10">
                            {slideFeatures.slice(0, 4).map((feat, i) => {
                                if (!feat) return null;
                                return (
                                    <motion.div
                                        key={i}
                                        variants={itemVariants}
                                        className={cn(
                                            "relative group border border-white/5 overflow-hidden transition-all duration-300",
                                            dnaStyle.cardStyle,
                                            i % 2 === 0 ? "mt-0" : "mt-8"
                                        )}
                                        style={{ '--hover-border': activeTheme.primary } as any}
                                    >
                                        <div
                                            className="absolute left-0 top-0 w-1 h-full"
                                            style={{ background: `linear-gradient(to bottom, ${activeTheme.primary}, ${activeTheme.secondary})` }}
                                        />
                                        <div
                                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                            style={{ background: `radial-gradient(ellipse at top left, ${activeTheme.primary}12, transparent 70%)` }}
                                        />

                                        <div className="p-10 pl-12 relative z-10">
                                            <div className="absolute top-8 right-8 transition-transform group-hover:scale-110 opacity-60">
                                                <DynamicIcon name={feat.icon} style={{ color: activeTheme.primary }} size={28} />
                                            </div>

                                            <EditableText
                                                isEditing={isEditing}
                                                tag="h3"
                                                content={feat.title}
                                                className={cn("font-black text-white uppercase tracking-tight leading-none break-words", dnaStyle.fontHeader)}
                                                style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: i % 2 === 0 ? 'white' : activeTheme.primary }}
                                                onSave={(newVal) => updateFeature(i, 'title', newVal)}
                                                fieldId={`stats-${i}-title`}
                                                initialPosition={slide.textPositions?.[`stats-${i}-title`]}
                                                onPositionChange={(pos) => handlePositionSave(`stats-${i}-title`, pos)}
                                            />

                                            <EditableText
                                                isEditing={isEditing}
                                                content={feat.description}
                                                className={cn("text-base text-zinc-400 font-medium leading-snug outline-none max-w-[90%]", dnaStyle.fontBody)}
                                                onSave={(newVal) => updateFeature(i, 'description', newVal)}
                                                fieldId={`stats-${i}-desc`}
                                                initialPosition={slide.textPositions?.[`stats-${i}-desc`]}
                                                onPositionChange={(pos) => handlePositionSave(`stats-${i}-desc`, pos)}
                                            />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                );

            case 'circular_step':
                return (
                    <motion.div
                        key={commonKey}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className={cn(
                            "w-full h-full p-20 flex gap-12 items-center justify-center relative",
                            slide.imageAlignment === 'right' && "flex-row-reverse",
                            slide.imageAlignment === 'center' && "flex-col p-24 text-center"
                        )}
                        style={{ backgroundColor: activeTheme.background }}
                    >
                        <div className={cn(
                            "w-1/2 relative flex items-center justify-center",
                            slide.imageAlignment === 'center' && "w-full mb-12"
                        )}>
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 1 }}
                                className={cn(
                                    "rounded-full overflow-hidden border-8 border-zinc-900 shadow-2xl relative z-10",
                                    slide.imageAlignment === 'center' ? "w-[400px] h-[400px]" : "w-[500px] h-[500px]"
                                )}
                            >
                                {renderImageLayer("w-full h-full")}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            </motion.div>

                            <div className="absolute inset-0 animate-[spin_60s_linear_infinite] opacity-30">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full" style={{ backgroundColor: activeTheme.primary }} />
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full" style={{ backgroundColor: activeTheme.secondary }} />
                            </div>
                        </div>

                        <div className={cn(
                            "w-1/2 grid grid-cols-2 gap-8 relative z-10 pointer-events-none",
                            slide.imageAlignment === 'center' ? "w-full max-w-6xl px-12" : "pr-12",
                            slide.imageAlignment === 'right' && "pl-12 pr-0"
                        )}>
                            {slideFeatures.slice(0, 4).map((feat, i) => (
                                <motion.div
                                    key={i}
                                    variants={itemVariants}
                                    className={cn("p-8 transition-all group border border-white/5 pointer-events-auto", dnaStyle.cardStyle)}
                                    style={{ '--hover-border': activeTheme.primary } as any}
                                >
                                    <div
                                        className="w-14 h-14 rounded-2xl mb-6 flex items-center justify-center transition-transform group-hover:rotate-12"
                                        style={{ backgroundColor: `${activeTheme.primary}15`, border: `1px solid ${activeTheme.primary}30` }}
                                    >
                                        <DynamicIcon name={feat.icon} style={{ color: activeTheme.primary }} />
                                    </div>
                                    <EditableText
                                        isEditing={isEditing}
                                        tag="h3"
                                        content={feat.title}
                                        className={cn("text-2xl font-black text-white mb-3 tracking-tighter uppercase italic", dnaStyle.fontHeader)}
                                        onSave={(newVal) => updateFeature(i, 'title', newVal)}
                                        fieldId={`circular-step-${i}-title`}
                                        initialPosition={slide.textPositions?.[`circular-step-${i}-title`]}
                                        onPositionChange={(pos) => handlePositionSave(`circular-step-${i}-title`, pos)}
                                    />
                                    <EditableText
                                        isEditing={isEditing}
                                        content={feat.description}
                                        className={cn("text-zinc-400 text-sm leading-relaxed", dnaStyle.fontBody)}
                                        onSave={(newVal) => updateFeature(i, 'description', newVal)}
                                        fieldId={`circular-step-${i}-desc`}
                                        initialPosition={slide.textPositions?.[`circular-step-${i}-desc`]}
                                        onPositionChange={(pos) => handlePositionSave(`circular-step-${i}-desc`, pos)}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                );

            default:
                return (
                    <div className={cn(
                        "w-full h-full flex bg-zinc-950",
                        slide.imageAlignment === 'right' && "flex-row-reverse",
                        slide.imageAlignment === 'center' && "flex-col p-24 text-center items-center justify-center"
                    )}>
                        <div className={cn(
                            "h-full flex flex-col justify-center p-24 pointer-events-none",
                            slide.imageAlignment === 'center' ? "w-full max-w-4xl h-auto" : "w-1/2"
                        )}>
                            <EditableText
                                isEditing={isEditing}
                                tag="h1"
                                content={slide.title}
                                className="text-6xl font-black text-white tracking-tighter mb-6 leading-tight uppercase italic"
                                onSave={(newVal) => onUpdate?.({ ...slide, title: newVal })}
                                fieldId="title"
                                initialPosition={slide.textPositions?.['title']}
                                onPositionChange={(pos) => handlePositionSave('title', pos)}
                            />
                            <EditableText
                                isEditing={isEditing}
                                content={slide.subtitle}
                                className="text-xl text-zinc-400 font-medium mb-12 leading-relaxed"
                                onSave={(newVal) => onUpdate?.({ ...slide, subtitle: newVal })}
                                fieldId="subtitle"
                                initialPosition={slide.textPositions?.['subtitle']}
                                onPositionChange={(pos) => handlePositionSave('subtitle', pos)}
                            />
                            <EditableText
                                isEditing={isEditing}
                                content={(slide.content || "").replace(/<[^>]*>?/gm, '')}
                                className="text-zinc-300 text-lg leading-relaxed outline-none"
                                onSave={(newVal) => onUpdate?.({ ...slide, content: newVal })}
                                fieldId="default-content"
                                initialPosition={slide.textPositions?.['default-content']}
                                onPositionChange={(pos) => handlePositionSave('default-content', pos)}
                            />
                        </div>
                        <div className={cn(
                            "h-full overflow-hidden",
                            slide.imageAlignment === 'center' ? "w-[60%] h-[40%] rounded-3xl mt-8" : "w-1/2"
                        )}>
                            {renderImageLayer("h-full w-full")}
                        </div>
                    </div>
                );
        }
    };

    return (
        <div
            className={cn(
                "w-full h-full relative font-sans overflow-hidden",
                exportMode && "pdf-slide-container"
            )}
            style={{ width: '1920px', height: '1080px' }}
        >
            {renderContent()}
            {/* MAIN INTERACTIVE LAYER (Always on top) */}
            {isEditing && (slide.image_url || slide.moodImage) && (
                <div className="absolute bottom-12 right-12 flex items-center gap-4 z-[9999]">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2 p-1.5 bg-black/80 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl items-center"
                    >
                        <button
                            onClick={() => onUpdate?.({ ...slide, imageAlignment: 'left' })}
                            className={cn(
                                "flex flex-col items-center gap-1 p-3 rounded-xl transition-all min-w-[64px]",
                                (!slide.imageAlignment || slide.imageAlignment === 'left') ? "bg-blue-500 text-white shadow-lg" : "hover:bg-white/10 text-zinc-400 hover:text-white"
                            )}
                        >
                            <AlignLeft size={20} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Left</span>
                        </button>
                        <button
                            onClick={() => onUpdate?.({ ...slide, imageAlignment: 'center' })}
                            className={cn(
                                "flex flex-col items-center gap-1 p-3 rounded-xl transition-all min-w-[64px]",
                                slide.imageAlignment === 'center' ? "bg-blue-500 text-white shadow-lg" : "hover:bg-white/10 text-zinc-400 hover:text-white"
                            )}
                        >
                            <AlignCenter size={20} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Center</span>
                        </button>
                        <button
                            onClick={() => onUpdate?.({ ...slide, imageAlignment: 'right' })}
                            className={cn(
                                "flex flex-col items-center gap-1 p-3 rounded-xl transition-all min-w-[64px]",
                                slide.imageAlignment === 'right' ? "bg-blue-500 text-white shadow-lg" : "hover:bg-white/10 text-zinc-400 hover:text-white"
                            )}
                        >
                            <AlignRight size={20} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Right</span>
                        </button>

                        <div className="w-[1px] h-10 bg-white/10 mx-2" />

                        <button
                            onClick={onRegenerateImage || handleGenerateImage}
                            className="group flex flex-col items-center gap-1 p-3 rounded-xl transition-all min-w-[100px] hover:bg-white/10 text-zinc-200"
                        >
                            {(isGeneratingImage || isRefreshingImage) ? <Loader2 className="animate-spin text-blue-400" size={20} /> : <Sparkles className="text-blue-400 group-hover:scale-110 transition-transform" size={20} />}
                            <span className="text-[10px] font-bold uppercase tracking-wider">Magic Visual</span>
                        </button>
                    </motion.div>
                </div>
            )}

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
                .pdf-slide-container {
                    background-color: white !important;
                }
                .group:hover {
                    border-color: var(--hover-border, #ffffff10) !important;
                }
                .group:hover h3 {
                    color: var(--hover-color, white) !important;
                }
                .group:hover div {
                    background-color: var(--hover-bg, transparent) !important;
                    border-color: var(--hover-border, transparent) !important;
                }
                ul, ol {
                    display: inline-block;
                    text-align: left;
                    width: 100%;
                }
                li {
                    margin-bottom: 0.25rem;
                }
                li::marker {
                    color: inherit;
                    font-weight: bold;
                }
            `}</style>
        </div>
    );
}

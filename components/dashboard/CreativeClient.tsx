"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Send, Download, RefreshCw, Wand2, Image as ImageIcon, Sparkles, Video, Palette, Camera, ChevronRight, ChevronLeft, X, Upload, ImagePlus, Trash2, Plus, ChevronDown, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { generateCreativeConcept } from "@/app/actions/gemini";
import { generateCreativeImage, generateCreativeVideo } from "@/app/dashboard/creative/actions";
import { fetchCreativeHistory, saveCreativeAsset, deleteCreativeAsset, type CreativeHistoryItem as HistoryItem } from "@/app/actions/creative";
import ProjectSyncButton from "./ProjectSyncButton";
import { toast } from "sonner";
import CubeLoader from "@/components/ui/cube-loader";

type Mode = "image" | "video" | "logo" | "agency";

// HistoryItem type imported from actions

import { useTaskStore } from "@/lib/store/useTaskStore";
import { useProjectStore } from "@/lib/store/useProjectStore";

export default function CreativeClient() {
    const { currentProject } = useProjectStore();
    const { tasks, startTask, completeTask, failTask, setTask } = useTaskStore();
    const task = tasks['creative'];

    const [prompt, setPrompt] = useState(task?.input || "");

    // SYNC: Ensure local state picks up store values on navigation/refresh
    useEffect(() => {
        if (task?.input && !prompt) {
            setPrompt(task.input);
        }
    }, [task?.input]);

    const [mode, setMode] = useState<Mode>("image");

    const isGenerating = task?.status === 'loading';

    const [modeContent, setModeContent] = useState<any>(task?.data || {
        image: { image: null, concept: null },
        video: { video: null },
        logo: { image: null, concept: null },
        agency: { image: null, concept: null }
    });

    // Update local state when task completes
    useEffect(() => {
        if (task?.status === 'success' && task.data) {
            setModeContent(task.data);
        }
    }, [task?.status, task?.data]);

    const generatedImage = mode === "video" ? null : (modeContent[mode]?.image || null);
    const generatedVideo = mode === "video" ? modeContent.video?.video : null;
    const conceptData = mode === "video" ? null : (modeContent[mode] as any)?.concept;

    const [history, setHistory] = useState<HistoryItem[]>([]
    );
    const [isHistoryOpen, setIsHistoryOpen] = useState(true);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);

    const [productImage, setProductImage] = useState<File | string | null>(null);
    const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
    const [referenceImage, setReferenceImage] = useState<File | string | null>(null);
    const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);

    const [attachedMedia, setAttachedMedia] = useState<string | null>(null);

    const [isDraggingOverProduct, setIsDraggingOverProduct] = useState(false);
    const [isDraggingOverReference, setIsDraggingOverReference] = useState(false);
    const [isDraggingOverPrompt, setIsDraggingOverPrompt] = useState(false);

    useEffect(() => {
        const fetchHistoryItems = async () => {
            try {
                const response = await fetch('/api/creative/history');
                if (response.ok) {
                    const data = await response.json();
                    setHistory(data);
                }
            } catch (error) {
                console.error("Failed to fetch history:", error);
            }
        };
        fetchHistoryItems();
    }, []);

    // Keyboard listeners
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!selectedHistoryItem) return;
            if (event.key === 'Escape') setSelectedHistoryItem(null);
            else if (event.key === 'ArrowRight') navigateHistory('next');
            else if (event.key === 'ArrowLeft') navigateHistory('prev');
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedHistoryItem, history]);

    // Scroll lock
    useEffect(() => {
        if (selectedHistoryItem) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [selectedHistoryItem]);

    const handleReset = () => {
        setTask('creative', { status: 'idle', data: null, input: "", progress: 0 });
        setPrompt("");
        setModeContent({
            image: { image: null, concept: null },
            video: { video: null },
            logo: { image: null, concept: null },
            agency: { image: null, concept: null }
        });
        setAttachedMedia(null);
        setProductImage(null);
        setProductImagePreview(null);
        setReferenceImage(null);
        setReferenceImagePreview(null);
    };

    const uploadAndSync = async (payload: { assetBase64?: string, assetUrl?: string, assetType: Mode, prompt: string }) => {
        try {
            const response = await fetch('/api/creative/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.details || errData.error || "Persistence failed");
            }

            const { publicUrl, dbItem } = await response.json();

            if (publicUrl) {
                // Now that we have a URL/Base64, update local content state and save to history
                const isVideo = payload.assetType === 'video';
                const updateKey = payload.assetType;

                const newContent = isVideo
                    ? { ...modeContent, video: { video: publicUrl } }
                    : { ...modeContent, [updateKey]: { ...modeContent[updateKey], image: publicUrl } };

                setModeContent(newContent);
                completeTask('creative', newContent);

                if (dbItem) {
                    setHistory(prev => [dbItem, ...prev]);
                }

                setPrompt("");
                setPrompt("");
                setAttachedMedia(null);
                toast.success("Successfully saved to database");
            }
        } catch (err: any) {
            console.error("uploadAndSync failed:", err);
            toast.error("Cloud persistence error. Try again.");
        }
    };

    const compressImage = (file: File, maxWidth: number = 1024): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) { reject(new Error('Could not get canvas context')); return; }
                    ctx.drawImage(img, 0, 0, width, height);
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                    resolve(compressedBase64);
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target?.result as string;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    };

    const handleDrop = async (e: React.DragEvent, type: 'product' | 'reference' | 'input') => {
        e.preventDefault();
        setIsDraggingOverProduct(false); setIsDraggingOverReference(false); setIsDraggingOverPrompt(false);
        const url = e.dataTransfer.getData("text/plain");
        if (url && url.startsWith('http')) {
            if (type === 'product') { setProductImage(url); setProductImagePreview(url); }
            else if (type === 'reference') { setReferenceImage(url); setReferenceImagePreview(url); }
            else setAttachedMedia(url);
            return;
        }
        const file = e.dataTransfer.files?.[0];
        if (file) {
            try {
                const compressedBase64 = await compressImage(file, 1024);
                if (type === 'product') { setProductImage(file); setProductImagePreview(compressedBase64); }
                else if (type === 'reference') { setReferenceImage(file); setReferenceImagePreview(compressedBase64); }
                else setAttachedMedia(compressedBase64);
            } catch (error) { console.error('Image compression failed:', error); }
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'reference' | 'input') => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressedBase64 = await compressImage(file, 1024);
                if (type === 'product') { setProductImage(file); setProductImagePreview(compressedBase64); }
                else if (type === 'reference') { setReferenceImage(file); setReferenceImagePreview(compressedBase64); }
                else setAttachedMedia(compressedBase64);
            } catch (error) { console.error('Image compression failed:', error); }
        }
    };

    const handleGenerate = async () => {
        if (isGenerating) {
            setTask('creative', { status: 'idle' });
            return;
        }
        if (!prompt.trim()) return;
        if (mode === "agency" && !productImage) { alert("Please upload a product image"); return; }

        startTask('creative', ["INJECTING CREATIVE DNA...", "ORCHESTRATING VISUALS...", "SYNTHESIZING CONCEPT..."]);
        setTask('creative', { input: prompt });

        setModeContent((prev: any) => ({
            ...prev,
            [mode]: mode === "video" ? { video: null } : { image: null, concept: null }
        }));

        try {

            let finalPrompt = prompt;
            let aspectRatio: string | undefined = undefined;

            if (mode === "logo") {
                finalPrompt = `A minimalist, modern vector logo design, flat style, solid background, professional branding, clean and simple, square format for: ${prompt}`;
                aspectRatio = "1:1";
            }

            if (mode === "agency") {
                if (productImagePreview && referenceImagePreview) {
                    finalPrompt = `A photorealistic composite image created by precisely placing the EXACT product shown in the first uploaded image into the scene defined by the second reference image. 
CRITICAL PRESERVATION RULES:
- The shape, geometry, screen details, colors, textures, and ALL visual characteristics of the product from the first image MUST remain 100% identical and unchanged
- Do NOT alter, modify, regenerate, or reinterpret the product model in any way
- Do NOT change the product's design, form factor, or any physical attributes
- The product is the SAME object from the uploaded image, just placed in a new environment
COMPOSITING INSTRUCTIONS:
- Apply realistic lighting, shadows, reflections, and atmospheric effects from the reference environment onto the product's surface to integrate it seamlessly
- Match the lighting direction, color temperature, and intensity from the reference scene
- Add appropriate shadows and reflections that would naturally occur in the reference environment
- Maintain photorealistic quality and professional product photography standards
PLACEMENT INSTRUCTION: ${prompt}
The final result must look like professional product photography where the original uploaded product has been expertly placed and lit within the reference scene. High fidelity composite, 8K quality, professional studio work.`;
                } else if (productImagePreview && !referenceImagePreview) {
                    finalPrompt = `Professional product photography of the EXACT product shown in the uploaded image. 
CRITICAL: The product's shape, design, colors, textures, and ALL visual details MUST remain 100% identical to the uploaded image. Do NOT regenerate or alter the product in any way.
SCENE INSTRUCTION: ${prompt}
Apply professional studio lighting and create a clean, high-end commercial photography setup. The product should look like it's been photographed by a professional product photographer. Maintain the exact product from the upload, only enhance the lighting and background. 8K quality, commercial photography standards.`;
                }
            }

            let conceptResult: any = null;
            if (mode === "image" || mode === "logo") {
                try {
                    const concept = await generateCreativeConcept(finalPrompt);
                    if (useTaskStore.getState().tasks['creative']?.status !== 'loading') return;
                    if (concept) {
                        conceptResult = concept;
                        finalPrompt = `${concept.visualDescription} ${concept.technicalSpecs?.styleModel} ${concept.technicalSpecs?.lighting}`;
                    }
                } catch (e) { console.warn("Concept generation failed", e); }
            }

            if (attachedMedia && mode !== 'agency') {
                if (mode === 'video') {
                    finalPrompt = `Video animation based on the reference image: ${finalPrompt}. High fidelity, smooth motion, cinematic rendering.`;
                } else {
                    finalPrompt = `Image variation of the reference: ${finalPrompt}. Maintain structural fidelity, original perspective, and lighting. Professional studio quality.`;
                }
            }

            if (mode === "video") {
                const result = await generateCreativeVideo(finalPrompt, attachedMedia || undefined);
                if (useTaskStore.getState().tasks['creative']?.status !== 'loading') return;

                if (result.error) {
                    const errorMsg = typeof result.error === 'string' ? result.error : JSON.stringify(result.error);
                    throw new Error(errorMsg);
                }

                if (result.video) {
                    await uploadAndSync({
                        assetUrl: result.video,
                        assetType: "video",
                        prompt: prompt
                    });
                }
            } else if (mode === "agency") {
                const response = await fetch('/api/generate-agency-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: finalPrompt,
                        productImageBase64: productImagePreview || undefined,
                        referenceImageBase64: referenceImagePreview || undefined,
                        aspectRatio: aspectRatio
                    })
                });
                if (!response.ok) {
                    let errorMsg = 'Agency generation failed';
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.error || errorMsg;
                    } catch (e) { }
                    throw new Error(errorMsg);
                }
                const result = await response.json();
                if (useTaskStore.getState().tasks['creative']?.status !== 'loading') return;
                if (result.error) throw new Error(result.error);
                if (result.image) {
                    // result.image is Base64 - PERSIST IT IMMEDIATELY
                    await uploadAndSync({
                        assetBase64: result.image,
                        assetType: mode,
                        prompt: prompt
                    });
                }
            } else {
                const result = await generateCreativeImage(finalPrompt, aspectRatio, undefined, attachedMedia || undefined);
                if (useTaskStore.getState().tasks['creative']?.status !== 'loading') return;
                if (result.error) throw new Error(result.error);
                if (result.image) {
                    // result.image is Base64 - PERSIST IT IMMEDIATELY
                    await uploadAndSync({
                        assetBase64: result.image,
                        assetType: mode,
                        prompt: prompt
                    });
                }
            }
        } catch (error: any) {
            console.error("Generation failed:", error);
            failTask('creative', error.message || "Generation failed.");
            toast.error(`Generation failed: ${error.message || "Unknown error"}`);
        }
    };

    const handleDownloadUrl = async (url: string, assetType: string) => {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const extension = assetType === "video" ? "mp4" : "png";
            const filename = `${assetType}_${timestamp}.${extension}`;

            if (url.startsWith('data:')) {
                const base64Data = url.split(',')[1];
                const mimeType = url.match(/data:(.*?);base64/)?.[1] || (assetType === "video" ? 'video/mp4' : 'image/png');
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: mimeType });
                const downloadUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl; link.download = filename; document.body.appendChild(link);
                link.click(); document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
            } else {
                const response = await fetch(url);
                const blob = await response.blob();
                const downloadUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl; link.download = filename; document.body.appendChild(link);
                link.click(); document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
            }
        } catch (error) { console.error('Download failed:', error); }
    };

    const handleDownload = async () => {
        const source = mode === "video" ? generatedVideo : generatedImage;
        if (!source) return;
        await handleDownloadUrl(source, mode);
    };

    const navigateHistory = (direction: 'next' | 'prev') => {
        if (!selectedHistoryItem || history.length <= 1) return;
        const currentIndex = history.findIndex(item => item.id === selectedHistoryItem.id);
        if (currentIndex === -1) return;
        let nextIndex = direction === 'next' ? (currentIndex + 1) % history.length : (currentIndex - 1 + history.length) % history.length;
        setSelectedHistoryItem(history[nextIndex]);
    };

    const deleteHistoryItem = async () => {
        if (!selectedHistoryItem) return;
        try {
            await deleteCreativeAsset(selectedHistoryItem.id, selectedHistoryItem.storage_path);
            setHistory(prev => prev.filter(item => item.id !== selectedHistoryItem.id));
            setSelectedHistoryItem(null);
            toast.success("Creation deleted locally and on cloud.");
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Delete failed.");
        }
    };

    const reusePrompt = () => {
        if (selectedHistoryItem) {
            setPrompt(selectedHistoryItem.prompt_used);
            setMode(selectedHistoryItem.asset_type as Mode);
            setSelectedHistoryItem(null);
        }
    };

    const modeConfig = {
        image: { icon: ImageIcon, label: "Text to Image", color: "cyan", placeholder: "Describe your image..." },
        video: { icon: Video, label: "Text to Video", color: "blue", placeholder: "Describe your video..." },
        logo: { icon: Palette, label: "Logo Maker", color: "cyan", placeholder: "Describe your brand..." },
        agency: { icon: Camera, label: "Agency Replacer", color: "cyan", placeholder: "Describe placement..." }
    };

    const currentConfig = modeConfig[mode];
    const ModeIcon = currentConfig.icon;

    return (
        <div className="w-full h-[calc(100vh-64px)] bg-[#020202] text-white flex flex-col font-sans border-t border-white/5 overflow-hidden">
            <header className="h-16 border-b border-white/5 bg-[#050505] flex items-center justify-between px-6 z-20">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                            <ModeIcon className="text-cyan-400" size={18} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-zinc-100">Creative Studio</h1>
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-zinc-500 font-mono">REAL-TIME GENERATION</p>
                                <span className="text-zinc-700">•</span>
                                <span className="text-xs font-bold uppercase text-cyan-400">{currentConfig.label}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <ProjectSyncButton
                        module="creative"
                        data={modeContent}
                        className="scale-90"
                        disabled={!generatedImage && !generatedVideo}
                        context={{
                            name: (prompt || task?.input || "Creative Asset").slice(0, 50),
                            description: prompt || task?.input || ""
                        }}
                    />
                    <div className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", isGenerating ? "bg-yellow-500 animate-pulse" : "bg-green-500")} />
                        <span className="text-xs text-zinc-500 uppercase tracking-widest">{isGenerating ? "PROCESSING" : "READY"}</span>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-60 bg-[#050505] border-r border-white/5 p-4 space-y-2">
                    <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 px-2">Generation Modes</h2>
                    {(Object.keys(modeConfig) as Mode[]).map((modeKey) => {
                        const config = modeConfig[modeKey];
                        const Icon = config.icon;
                        const isActive = mode === modeKey;
                        return (
                            <button
                                key={modeKey}
                                onClick={() => setMode(modeKey)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                                    isActive ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400" : "bg-[#0a0a0a] border border-white/5 text-zinc-400 hover:bg-white/5 hover:text-zinc-300"
                                )}
                            >
                                <Icon size={20} />
                                <span className="text-sm font-medium">{config.label}</span>
                                {isActive && <ChevronRight size={16} className="ml-auto" />}
                            </button>
                        );
                    })}
                </div>

                <div className="flex-1 bg-[#030303] flex flex-col h-full w-full relative">
                    {mode === "agency" && (
                        <div className="border-b border-white/5 bg-[#050505] p-4 shrink-0">
                            <div className="grid grid-cols-2 gap-4">
                                <label className="flex flex-col gap-2">
                                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Product Image <span className="text-red-500">*</span></span>
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setIsDraggingOverProduct(true); }}
                                        onDragEnter={() => setIsDraggingOverProduct(true)}
                                        onDragLeave={() => setIsDraggingOverProduct(false)}
                                        onDrop={(e) => handleDrop(e, 'product')}
                                        className={cn("flex items-center gap-3 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all bg-cyan-500/5 min-h-[100px]", isDraggingOverProduct ? "border-cyan-400 bg-cyan-500/20 scale-[1.02]" : "border-cyan-500/30 hover:border-cyan-500/50")}
                                    >
                                        <Upload className="text-cyan-400" size={24} />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-zinc-300">{productImage ? (typeof productImage === 'string' ? "From History" : productImage.name) : "Upload Product"}</p>
                                            <p className="text-xs text-zinc-500">Required</p>
                                        </div>
                                        {productImagePreview && (
                                            <div className="relative group">
                                                <img src={productImagePreview} alt="Product" className="w-16 h-16 object-cover rounded border border-white/10" />
                                                <button
                                                    type="button"
                                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-opacity z-10 shadow-lg"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setProductImage(null);
                                                        setProductImagePreview(null);
                                                    }}
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'product')} className="hidden" />
                                    </div>
                                </label>
                                <label className="flex flex-col gap-2">
                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Reference Image <span className="text-zinc-600">(Optional)</span></span>
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setIsDraggingOverReference(true); }}
                                        onDragEnter={() => setIsDraggingOverReference(true)}
                                        onDragLeave={() => setIsDraggingOverReference(false)}
                                        onDrop={(e) => handleDrop(e, 'reference')}
                                        className={cn("flex items-center gap-3 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all bg-white/5 min-h-[100px]", isDraggingOverReference ? "border-cyan-400 bg-cyan-500/10 scale-[1.02]" : "border-white/10 hover:border-white/20")}
                                    >
                                        <ImagePlus className="text-zinc-500" size={24} />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-zinc-400">{referenceImage ? (typeof referenceImage === 'string' ? "From History" : referenceImage.name) : "Background/Scene"}</p>
                                            <p className="text-xs text-zinc-600">Optional</p>
                                        </div>
                                        {referenceImagePreview && (
                                            <div className="relative group">
                                                <img src={referenceImagePreview} alt="Reference" className="w-16 h-16 object-cover rounded border border-white/10" />
                                                <button
                                                    type="button"
                                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-opacity z-10 shadow-lg"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setReferenceImage(null);
                                                        setReferenceImagePreview(null);
                                                    }}
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'reference')} className="hidden" />
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* 1. MAIN PREVIEW AREA (Takes remaining space) */}
                    <div className="flex-1 w-full min-h-0 overflow-y-auto flex items-center justify-center p-6 relative creative-canvas-area custom-scrollbar">
                        {!generatedImage && !generatedVideo && !isGenerating && (
                            <div className="text-center space-y-4 opacity-30">
                                <ModeIcon size={64} className="mx-auto text-zinc-600" />
                                <h3 className="text-xl font-medium text-zinc-400">Ready to Create</h3>
                            </div>
                        )}

                        {isGenerating && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl z-10">
                                <CubeLoader
                                    title="PREPARING"
                                    description={`Generating your ${mode === "agency" ? "product placement" : mode === "video" ? "video experience" : mode}, please wait...`}
                                />
                            </div>
                        )}

                        {generatedImage && (
                            <div className="relative w-full h-full max-w-4xl max-h-[80vh] group">
                                <img src={generatedImage} alt="Generated" className="w-full h-full object-contain rounded-lg shadow-2xl border border-white/5" />
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <Button size="icon" variant="secondary" onClick={handleDownload}><Download size={18} /></Button>
                                    <Button size="icon" variant="secondary" className="bg-red-500/80 hover:bg-red-600" onClick={() => setModeContent((prev: any) => ({ ...prev, [mode]: { image: null, concept: null } }))}><X size={18} /></Button>
                                </div>
                            </div>
                        )}

                        {generatedVideo && !generatedImage && (
                            <div className="relative w-full h-full max-w-4xl max-h-[80vh] group bg-black rounded-lg overflow-hidden border border-white/10 shadow-2xl">
                                <video src={generatedVideo} controls autoPlay loop className="w-full h-full object-contain" />
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <Button size="icon" variant="secondary" onClick={handleDownload}><Download size={18} /></Button>
                                    <Button size="icon" variant="secondary" className="bg-red-500/80 hover:bg-red-600" onClick={() => setModeContent((prev: any) => ({ ...prev, video: { video: null } }))}><X size={18} /></Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. INPUT BAR CONTAINER (Anchored at Bottom) */}
                    <div className="w-full max-w-4xl mx-auto px-6 pb-6 mt-auto z-10">
                        <div className={cn("relative group transition-transform duration-300", isDraggingOverPrompt && "scale-[1.02]")} onDragOver={(e) => { e.preventDefault(); setIsDraggingOverPrompt(true); }} onDrop={(e) => handleDrop(e, 'input')}>
                            {attachedMedia && (
                                <div className="absolute -top-12 left-0 flex items-center gap-2 bg-[#1a1a1a] border border-cyan-500/30 rounded-full px-3 py-1.5 shadow-xl animate-in fade-in slide-in-from-bottom-2">
                                    <img src={attachedMedia} alt="Ref" className="w-6 h-6 rounded-md object-cover" />
                                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Variation Mode</span>
                                    <button onClick={() => setAttachedMedia(null)} className="text-zinc-500 hover:text-red-400"><X size={14} /></button>
                                </div>
                            )}
                            {currentProject && !prompt && (
                                <button
                                    onClick={() => setPrompt(currentProject.description || currentProject.name)}
                                    className="absolute -top-10 left-0 z-10 text-[10px] text-blue-400 hover:text-blue-300 font-bold tracking-widest uppercase flex items-center gap-2 transition-colors bg-black/40 backdrop-blur-sm px-2 py-1 rounded border border-blue-500/20"
                                >
                                    <Rocket size={12} />
                                    Synchronize with {currentProject.name} concept
                                </button>
                            )}
                            <div className={cn("bg-[#111] border border-white/10 rounded-2xl p-2 flex items-center gap-4 shadow-2xl transition-all", isDraggingOverPrompt ? "border-cyan-500 ring-4 ring-cyan-500/10" : "focus-within:border-white/20")}>
                                <div className="flex-1 relative">
                                    <Input
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                                        placeholder={attachedMedia ? "Describe changes..." : currentConfig.placeholder}
                                        className="w-full h-12 bg-transparent border-none text-white pl-4 pr-20 text-base focus-visible:ring-0"
                                        disabled={isGenerating}
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                        {prompt && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-zinc-500 hover:text-red-400"
                                                onClick={handleReset}
                                                disabled={isGenerating}
                                            >
                                                <X size={16} />
                                            </Button>
                                        )}
                                        {mode !== 'agency' && (
                                            <>
                                                <input type="file" id="manual-upload-input" accept="image/*" onChange={(e) => handleFileUpload(e, 'input')} className="hidden" />
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-500 hover:text-cyan-400" onClick={() => document.getElementById('manual-upload-input')?.click()} disabled={isGenerating}><Plus size={20} /></Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <Button onClick={handleGenerate} disabled={!isGenerating && !prompt.trim()} className={cn("h-12 w-12 rounded-xl transition-all duration-300", isGenerating ? "bg-red-500/20 hover:bg-red-500 text-red-500 border border-red-500/50" : "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20 shadow-lg")}>
                                    {isGenerating ? <X size={20} /> : <Send size={20} />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={cn("bg-[#050505] border-l border-white/5 transition-all duration-300 overflow-hidden", isHistoryOpen ? "w-80" : "w-0")}>
                    <div className="w-80 h-full flex flex-col">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-zinc-300">Recent Creations</h2>
                            <Button size="icon" variant="ghost" onClick={() => setIsHistoryOpen(false)}><ChevronRight size={18} /></Button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar max-h-[calc(100vh-160px)]">
                            {history.length === 0 ? <p className="text-center py-8 text-zinc-600 text-sm">No creations yet</p> : history.map((item) => {
                                const ItemIcon = modeConfig[item.asset_type].icon;
                                return (
                                    <button key={item.id} onClick={() => setSelectedHistoryItem(item)} className="w-full group rounded-lg border border-white/10 hover:border-cyan-500/50 overflow-hidden bg-[#0a0a0a] transition-all">
                                        <div className="aspect-video w-full relative">
                                            {item.asset_type === "video" ? <video src={item.storage_path} className="w-full h-full object-cover" /> : <img src={item.storage_path} alt="History" className="w-full h-full object-cover" />}
                                            <Badge className="absolute top-2 right-2 bg-cyan-500/20 text-cyan-400 border-cyan-500/30"><ItemIcon size={12} className="mr-1" />{item.asset_type}</Badge>
                                        </div>
                                        <div className="p-3 text-left"><p className="text-[10px] text-zinc-500 line-clamp-2">{item.prompt_used}</p></div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {
                selectedHistoryItem && (
                    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4" onClick={() => setSelectedHistoryItem(null)}>
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
                            <Button size="icon" variant="ghost" onClick={() => setSelectedHistoryItem(null)} className="absolute top-4 right-4 text-white hover:bg-white/10 z-20"><X size={24} /></Button>
                            <div className="p-8 flex flex-col items-center gap-8">
                                {selectedHistoryItem.asset_type === "video" ? (
                                    <video src={selectedHistoryItem.storage_path} controls autoPlay loop className="max-w-full max-h-[60vh] rounded-lg shadow-2xl" />
                                ) : (
                                    <img src={selectedHistoryItem.storage_path} alt="History Large" className="max-w-full max-h-[60vh] rounded-lg shadow-2xl" />
                                )}
                                <div className="w-full bg-white/5 border border-white/10 rounded-xl p-6">
                                    <h4 className="text-xs font-bold text-cyan-400 uppercase mb-2">Prompt</h4>
                                    <p className="text-lg text-zinc-300 italic">"{selectedHistoryItem.prompt_used}"</p>
                                </div>
                                <div className="flex gap-2 w-full">
                                    <Button onClick={reusePrompt} className="flex-1 bg-cyan-600 hover:bg-cyan-500 h-11 rounded-xl font-bold gap-2">
                                        <Wand2 size={16} /> Reuse
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleDownloadUrl(selectedHistoryItem.storage_path, selectedHistoryItem.asset_type)}
                                        className="border-white/10 text-zinc-300 hover:text-white h-11 px-4 rounded-xl font-bold gap-2"
                                    >
                                        <Download size={16} /> Download
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={deleteHistoryItem}
                                        className="border-white/10 text-zinc-500 hover:text-red-500 h-11 px-4 rounded-xl font-bold gap-2"
                                    >
                                        <Trash2 size={16} /> Delete
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

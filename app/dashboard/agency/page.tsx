"use client";

import { generateAgencyDescription } from "@/app/actions/gemini";
import { useState } from "react";
import {
    Box,
    Camera,
    Lightbulb,
    Palette,
    Layers,
    Share2,
    Cloud,
    MonitorPlay,
    Settings,
    ChevronDown,
    Plus,
    BoxSelect,
    Move3d,
    ScanFace,
    Wand2,
    Sparkles,
    Check
} from "lucide-react";
import { Button } from "@/components/ui/core/button";
import { ScrollArea } from "@/components/ui/core/scroll-area";
import { Slider } from "@/components/ui/core/slider";
import { Badge } from "@/components/ui/core/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/core/tabs";
import { Switch } from "@/components/ui/core/switch";
import { cn } from "@/lib/utils";

// --- Mock Data ---

const INITIAL_ASSETS = [
    { id: 1, name: "Product_Box_v10", type: "mesh", size: "12MB", date: "2m ago" },
    { id: 2, name: "Hero_Lighting_Rig", type: "light", size: "2KB", date: "1h ago" },
    { id: 3, name: "Studio_Environment_04", type: "scene", size: "45MB", date: "1d ago" },
    { id: 4, name: "Glass_Material_Pack", type: "material", size: "15MB", date: "2d ago" },
];

const INITIAL_SCENE_CONFIG = {
    camera: { fov: 45, type: "perspective" },
    lighting: { intensity: 1.2, color: "#ffffff" },
    environment: "studio_soft",
    description: "A photorealistic studio setup with soft lighting, emphasizing the product's silhouette against a minimal background."
};

export default function AgencyPage() {
    const [assets, setAssets] = useState(INITIAL_ASSETS);
    const [sceneConfig, setSceneConfig] = useState(INITIAL_SCENE_CONFIG);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleRemixScene = async () => {
        setIsGenerating(true);
        try {
            const result = await generateAgencyDescription(sceneConfig);
            if (result) {
                setSceneConfig(prev => ({
                    ...prev,
                    description: result.description,
                    lighting: { ...prev.lighting, intensity: result.suggestedSettings.lightingIntensity || 1.2 }
                }));
            }
        } catch (error) {
            console.error("Failed to generate agency description", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="w-full h-screen bg-[#080808] text-white flex flex-col font-sans overflow-hidden">

            {/* Top Bar */}
            <header className="h-14 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center shadow-lg shadow-orange-900/20">
                        <Box size={16} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold tracking-wide uppercase text-zinc-200">Technical Studio</h1>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-500 font-mono">SCENE-092</span>
                            <Badge variant="outline" className="text-[9px] h-4 px-1 border-orange-900 text-orange-500 bg-orange-900/10">WEBGL2</Badge>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 bg-[#111] border border-white/5 rounded-full flex items-center gap-2">
                        <Cloud size={12} className="text-green-500" />
                        <span className="text-[10px] text-zinc-400">GPU Cluster: <span className="text-white">Active</span></span>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 border-white/10 bg-[#0a0a0a] text-zinc-400 hover:text-white text-xs">
                        <Share2 size={14} className="mr-2" /> Share
                    </Button>
                    <Button
                        size="sm"
                        className="h-8 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-900/20"
                        onClick={handleRemixScene}
                        disabled={isGenerating}
                    >
                        {isGenerating ? <Cloud className="animate-spin mr-2" size={14} /> : <Wand2 size={14} className="mr-2" />}
                        {isGenerating ? "Processing..." : "REMIX SCENE"}
                    </Button>
                </div>
            </header>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden">

                {/* Left Sidebar: Assets */}
                <aside className="w-64 border-r border-white/5 bg-[#0a0a0a] flex flex-col">
                    <div className="h-10 border-b border-white/5 flex items-center px-4 justify-between">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Scene Assets</span>
                        <Plus size={14} className="text-zinc-500 cursor-pointer hover:text-white" />
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            {assets.map(asset => (
                                <div key={asset.id} className="group p-2 rounded-md hover:bg-white/5 cursor-pointer flex items-center gap-3 transition-colors">
                                    <div className="w-8 h-8 rounded bg-[#151515] border border-white/5 flex items-center justify-center text-zinc-600 group-hover:text-zinc-400">
                                        {asset.type === 'mesh' ? <Box size={14} /> :
                                            asset.type === 'light' ? <Lightbulb size={14} /> :
                                                asset.type === 'scene' ? <MonitorPlay size={14} /> : <Palette size={14} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-zinc-300 font-medium truncate group-hover:text-white">{asset.name}</p>
                                        <div className="flex justify-between items-center text-[9px] text-zinc-600 mt-0.5">
                                            <span>{asset.type}</span>
                                            <span>{asset.size}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </aside>

                {/* Center: Viewport */}
                <main className="flex-1 flex flex-col relative bg-[#050505]">
                    {/* Toolbar */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#111]/80 backdrop-blur border border-white/10 rounded-full h-10 px-4 flex items-center gap-4 z-20 shadow-xl">
                        <div className="flex gap-2 text-zinc-400">
                            <Move3d size={16} className="hover:text-white cursor-pointer" />
                            <ScanFace size={16} className="hover:text-white cursor-pointer" />
                            <BoxSelect size={16} className="hover:text-white cursor-pointer" />
                        </div>
                        <div className="w-px h-4 bg-white/10"></div>
                        <span className="text-[10px] font-mono text-zinc-500">PERSPECTIVE</span>
                    </div>

                    {/* 3D Canvas Placeholder */}
                    <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                        {/* Grid Floor */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 [transform:perspective(1000px)_rotateX(60deg)] origin-bottom"></div>

                        {/* Central Object */}
                        <div className="relative w-64 h-64 border-2 border-orange-500/30 bg-orange-500/5 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-[0_0_100px_rgba(249,115,22,0.1)]">
                            {/* Wireframe Box */}
                            <div className="w-32 h-32 border border-orange-500/50 rotate-45 animate-[spin_10s_linear_infinite]"></div>
                            <div className="absolute inset-0 flex items-center justify-center text-orange-500 font-mono text-xs animate-pulse">
                                UNREAL_ENGINE_PROXY
                            </div>
                        </div>

                        {/* Processing Overlay */}
                        {isGenerating && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center animate-in fade-in">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-orange-500 blur-xl opacity-20 animate-pulse"></div>
                                    <Cloud size={48} className="text-orange-500 animate-bounce relative z-10" />
                                </div>
                                <h3 className="text-white font-bold mt-6 tracking-widest uppercase">Offloading Compute</h3>
                                <p className="text-zinc-500 text-xs mt-2">Sending scene graph to Gemini 1.5 Pro...</p>
                            </div>
                        )}
                    </div>
                </main>

                {/* Right Sidebar: Inspector */}
                <aside className="w-80 border-l border-white/5 bg-[#0a0a0a] flex flex-col">
                    <Tabs defaultValue="inspector" className="flex-1 flex flex-col">
                        <div className="px-4 pt-4 pb-2">
                            <TabsList className="w-full bg-[#111] border border-white/5 h-8">
                                <TabsTrigger value="inspector" className="flex-1 text-[10px] h-6 data-[state=active]:bg-[#222] data-[state=active]:text-white text-zinc-500">INSPECTOR</TabsTrigger>
                                <TabsTrigger value="render" className="flex-1 text-[10px] h-6 data-[state=active]:bg-[#222] data-[state=active]:text-white text-zinc-500">RENDER</TabsTrigger>
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-6">

                                {/* AI Description Panel */}
                                <div className="bg-[#111] border border-orange-900/30 rounded-lg p-3 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none"></div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-[10px] font-bold text-orange-500 uppercase tracking-widest flex items-center gap-1">
                                            <Sparkles size={10} /> Scene AI Context
                                        </label>
                                    </div>
                                    <p className="text-xs text-zinc-300 leading-relaxed italic">
                                        "{sceneConfig.description}"
                                    </p>
                                </div>

                                {/* Transform */}
                                <div className="space-y-3">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                        <Box size={12} /> Transform
                                    </span>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-zinc-600 block text-center">POS X</label>
                                            <div className="h-8 bg-[#111] border border-white/5 rounded text-xs flex items-center justify-center text-zinc-300 font-mono">0.00</div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-zinc-600 block text-center">POS Y</label>
                                            <div className="h-8 bg-[#111] border border-white/5 rounded text-xs flex items-center justify-center text-zinc-300 font-mono">1.20</div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-zinc-600 block text-center">POS Z</label>
                                            <div className="h-8 bg-[#111] border border-white/5 rounded text-xs flex items-center justify-center text-zinc-300 font-mono">5.00</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Camera */}
                                <div className="space-y-3">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                        <Camera size={12} /> Camera
                                    </span>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-zinc-400">
                                                <span>Field of View</span>
                                                <span className="font-mono text-zinc-500">{sceneConfig.camera.fov}°</span>
                                            </div>
                                            <Slider defaultValue={[sceneConfig.camera.fov]} max={120} min={10} step={1} className="[&>.relative>.absolute]:bg-orange-500" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-zinc-400">Depth of Field</span>
                                            <Switch className="data-[state=checked]:bg-orange-600" />
                                        </div>
                                    </div>
                                </div>

                                {/* Lighting */}
                                <div className="space-y-3">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                        <Lightbulb size={12} /> Lighting
                                    </span>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-zinc-400">
                                                <span>Intensity</span>
                                                <span className="font-mono text-zinc-500">{sceneConfig.lighting.intensity.toFixed(1)}</span>
                                            </div>
                                            <Slider
                                                value={[sceneConfig.lighting.intensity]}
                                                onValueChange={(val) => setSceneConfig({ ...sceneConfig, lighting: { ...sceneConfig.lighting, intensity: val[0] } })}
                                                max={5} min={0} step={0.1}
                                                className="[&>.relative>.absolute]:bg-orange-500"
                                            />
                                        </div>
                                        <div className="flex justify-between items-center bg-[#111] p-2 rounded border border-white/5">
                                            <span className="text-xs text-zinc-400">Light Color</span>
                                            <div className="w-6 h-6 rounded bg-white border border-white/10 cursor-pointer"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Environment */}
                                <div className="space-y-3">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                        <Layers size={12} /> Environment
                                    </span>
                                    <div className="bg-[#111] border border-white/5 rounded p-2">
                                        <div className="flex justify-between items-center text-xs text-zinc-300">
                                            <span>Studio Soft</span>
                                            <ChevronDown size={14} className="text-zinc-500" />
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </ScrollArea>
                    </Tabs>
                </aside>

            </div>
        </div>
    );
}

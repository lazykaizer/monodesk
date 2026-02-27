"use client";

import { useState, useRef, useEffect } from 'react';
import { generateGeminiContent } from '@/app/actions/gemini';
import { createClient } from "@/lib/supabase/client";
import {
    Trash2,
    Plus,
    Play,
    User,
    MessageSquare,
    BrainCircuit,
    MoreHorizontal,
    Sparkles,
    RefreshCw,
    History,
    Search,
    Clock,
    Pencil,
    Camera,
    Info,
    X,
    Users,
    Save,
    Download,
    FileDown,
    Rocket
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useTaskStore } from "@/lib/store/useTaskStore";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { simulatePersonaFeedback, simulateGroupFeedback } from "@/app/actions/gemini";
import { AnimatedTestimonials } from "@/components/ui/animations/animated-testimonials";
import { Button } from "@/components/ui/core/button";
import { MagnetizeButton } from "@/components/ui/animations/magnetize-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/core/avatar";
import { Badge } from "@/components/ui/core/badge";
import { ScrollArea } from "@/components/ui/core/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/core/dialog";
import { Label } from "@/components/ui/core/label";
import { Input } from "@/components/ui/core/input";
import { Textarea } from "@/components/ui/core/textarea";
import ProjectSyncButton from "@/components/dashboard/layout/ProjectSyncButton";
import { FeedbackCard } from "@/components/dashboard/shared/FeedbackCard";

// 1. Define Persona Type
type Persona = {
    id: string;
    name: string;
    role: string;
    avatar_url?: string;
    bio: string;
    is_system?: boolean;
    color?: string;
};

// 2. Default Personas removed (Now stored in Database)

export default function PersonaClient() {
    const { currentProject } = useProjectStore();
    const { tasks, startTask, completeTask, failTask, setTask } = useTaskStore();
    const personaTask = tasks['persona'];
    const groupTask = tasks['persona-group'];

    const [personas, setPersonas] = useState<Persona[]>([]);
    const [selectedPersona, setSelectedPersona] = useState<Persona | null>(personaTask?.data?.persona || null);
    const [ideaInput, setIdeaInput] = useState(personaTask?.input || "");

    // SYNC: Ensure local state picks up store values on navigation/refresh
    useEffect(() => {
        if (personaTask?.input && !ideaInput) {
            setIdeaInput(personaTask.input);
        }
        if (personaTask?.data?.feedback && !feedback) {
            setFeedback(personaTask.data.feedback);
        }
    }, [personaTask?.input, personaTask?.data]);

    const [feedback, setFeedback] = useState<string>(personaTask?.data?.feedback || "");
    const [history, setHistory] = useState<any[]>([]);

    const [editingPersonaId, setEditingPersonaId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingPersonaId, setUploadingPersonaId] = useState<string | null>(null);
    const [showInfo, setShowInfo] = useState(false);
    const [feedbackPersona, setFeedbackPersona] = useState<Persona | null>(personaTask?.data?.persona || null);
    const [showHistory, setShowHistory] = useState(false);

    const isSimulating = personaTask?.status === 'loading';

    // Group Simulation State
    const [isAllPersonasMode, setIsAllPersonasMode] = useState(false);
    const [allPersonasFeedback, setAllPersonasFeedback] = useState<Array<{ persona: Persona, feedback: string }>>(groupTask?.data || []);
    const isGroupSimulating = groupTask?.status === 'loading';
    const isLoading = isSimulating || isGroupSimulating;

    const supabase = createClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newPersona, setNewPersona] = useState({ name: "", role: "", bio: "", avatar_url: "" });
    const modalFileInputRef = useRef<HTMLInputElement>(null);

    // Export State
    const [isExportChoicesOpen, setIsExportChoicesOpen] = useState(false);
    const [historyExportItem, setHistoryExportItem] = useState<any>(null);

    // PHASE 4: Per-Persona Feedback Storage (prevents clearing when switching personas)
    const [personaFeedbackMap, setPersonaFeedbackMap] = useState<Map<string, string>>(new Map());

    // PHASE 4: Undo Delete State
    const [deletedPersona, setDeletedPersona] = useState<{ persona: Persona, timeoutId: NodeJS.Timeout } | null>(null);

    const handleClear = () => {
        setTask('persona', { status: 'idle', data: null, input: "", progress: 0 });
        setTask('persona-group', { status: 'idle', data: [], input: "", progress: 0 });
        setIdeaInput("");
        setFeedback("");
        setAllPersonasFeedback([]);
        setPersonaFeedbackMap(new Map());
    };

    // Helper function to parse feedback and remove JSON wrapper
    const parseFeedback = (rawFeedback: string): string => {
        const trimmed = rawFeedback.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (parsed && typeof parsed === 'object' && 'feedback' in parsed) {
                    return parsed.feedback;
                }
            } catch {
                const match = trimmed.match(/"feedback"\s*:\s*"([^"]*)"/);
                if (match && match[1]) {
                    return match[1];
                }
            }
        }
        return trimmed;
    };

    const handleModalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewPersona(prev => ({ ...prev, avatar_url: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    const handleSimulate = async () => {
        if (!selectedPersona || !ideaInput.trim()) return;

        startTask('persona', ["INJECTING CONSCIOUSNESS...", "SIMULATING BRAIN WAVES...", "SYNTHESIZING FEEDBACK..."]);
        setTask('persona', {
            input: ideaInput,
            data: null
        });

        try {
            const result = await simulatePersonaFeedback(selectedPersona, ideaInput);
            setFeedback(result);
            setFeedbackPersona(selectedPersona);
            // Clear group feedback when running single persona
            setAllPersonasFeedback([]);

            // PHASE 4: Store feedback per persona
            setPersonaFeedbackMap(prev => {
                const newMap = new Map(prev);
                newMap.set(selectedPersona.id, result);
                return newMap;
            });

            completeTask('persona', { feedback: result, persona: selectedPersona });

            // Save to DB
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('persona_tests').insert({
                    user_id: user.id,
                    persona_name: selectedPersona.name,
                    prompt: ideaInput,
                    response: result,
                    full_result: { feedback: result }
                });
                fetchHistory();
            }
        } catch (error) {
            console.error("Simulation failed:", error);
            failTask('persona', "Simulation failed.");
        }
    };

    const handleGroupSimulate = async () => {
        if (!ideaInput.trim()) return;

        startTask('persona-group', ["ORCHESTRATING PANEL...", "GATHERING COLLECTIVE INSIGHTS...", "FINALIZING CONSENSUS..."]);
        setTask('persona-group', {
            input: ideaInput,
            data: null
        });

        try {
            const results = await simulateGroupFeedback(personas, ideaInput);
            setAllPersonasFeedback(results);
            // Clear single persona feedback when running group
            setFeedback("");
            setFeedbackPersona(null);
            completeTask('persona-group', results);

            // Save to DB
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('persona_tests').insert({
                    user_id: user.id,
                    persona_name: "Group Session",
                    prompt: ideaInput,
                    response: "Group discussion completed",
                    full_result: results
                });
                fetchHistory();
            }
        } catch (error) {
            console.error("Group Simulation failed:", error);
            failTask('persona-group', "Group simulation failed.");
        }
    };

    const handleExportPDF = async (personaName?: string, singleFeedback?: string, groupData?: Array<{ persona: Persona, feedback: string }>, promptOverride?: string) => {
        const docTitle = personaName ? `${personaName} Feedback` : "Group Persona Feedback";
        const filename = `${docTitle.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

        // Use promptOverride if provided, otherwise use ideaInput
        const promptText = promptOverride || ideaInput;

        // Helper function to add blue highlights to **text**
        const highlightText = (text: string) => {
            return text.replace(/\*\*(.*?)\*\*/g, '<span style="background: rgba(59, 130, 246, 0.1); color: #60a5fa; font-weight: 600; padding: 2px 6px; border-radius: 4px; border-bottom: 1px solid rgba(59, 130, 246, 0.5);">$1</span>');
        };

        // Helper function to parse feedback and remove JSON wrapper
        const parseFeedbackForPDF = (rawFeedback: string): string => {
            const trimmed = rawFeedback.trim();
            if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (parsed && typeof parsed === 'object' && 'feedback' in parsed) {
                        return parsed.feedback;
                    }
                } catch {
                    const match = trimmed.match(/"feedback"\s*:\s*"([^"]*)"/);
                    if (match && match[1]) {
                        return match[1];
                    }
                }
            }
            return trimmed;
        };

        try {
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: 'a4'
            });

            const content = document.createElement('div');
            content.style.width = '800px';
            content.style.padding = '40px';
            content.style.background = '#000';
            content.style.color = '#fff';
            content.style.fontFamily = 'sans-serif';

            let htmlContent = `
                <div style="border-bottom: 1px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="font-size: 24px; color: #fff; margin: 0;">MONODESK PERSONA LAB</h1>
                    <p style="font-size: 12px; color: #888; margin-top: 5px;">AI-Driven Strategy & Feedback Report</p>
                </div>
                <div style="margin-bottom: 40px;">
                    <h3 style="font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px;">Original Concept</h3>
                    <p style="font-size: 16px; color: #ccc; line-height: 1.6; background: #111; padding: 15px; border-radius: 8px; margin: 0;">${promptText}</p>
                </div>
            `;

            if (personaName && singleFeedback) {
                const p = personas.find(pers => pers.name === personaName);
                // Parse feedback to remove JSON wrapper
                const parsedFeedback = parseFeedbackForPDF(singleFeedback);
                const highlightedFeedback = highlightText(parsedFeedback);
                htmlContent += `
                    <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 25px; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px; border-bottom: 1px solid #222; padding-bottom: 15px;">
                            <div style="width: 50px; height: 50px; border-radius: 25px; background: #333; overflow: hidden; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; color: #fff;">
                                ${p?.avatar_url ? `<img src="${p.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;" />` : personaName[0]}
                            </div>
                            <div>
                                <h2 style="font-size: 18px; color: #fff; margin: 0;">${personaName}</h2>
                                <p style="font-size: 12px; color: #3b82f6; text-transform: uppercase; font-weight: bold; margin: 2px 0 0 0;">${p?.role || "Advisor"}</p>
                            </div>
                        </div>
                        <div style="font-size: 14px; color: #eee; line-height: 1.7; white-space: pre-wrap;">${highlightedFeedback}</div>
                    </div>
                `;
            } else if ((groupData && groupData.length > 0) || (allPersonasFeedback && Array.isArray(allPersonasFeedback) && allPersonasFeedback.length > 0)) {
                const dataToUse = groupData || allPersonasFeedback;
                dataToUse.forEach((item, index) => {
                    const p = item.persona;
                    const fb = item.feedback;
                    // Parse feedback to remove JSON wrapper
                    const parsedFeedback = parseFeedbackForPDF(fb);
                    const highlightedFeedback = highlightText(parsedFeedback);
                    htmlContent += `
                        <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 25px; margin-bottom: 20px;">
                            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px; border-bottom: 1px solid #222; padding-bottom: 15px;">
                                <div style="width: 50px; height: 50px; border-radius: 25px; background: #333; overflow: hidden; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; color: #fff;">
                                    ${p?.avatar_url ? `<img src="${p.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;" />` : p.name[0]}
                                </div>
                                <div>
                                    <h2 style="font-size: 18px; color: #fff; margin: 0;">${p.name}</h2>
                                    <p style="font-size: 12px; color: #3b82f6; text-transform: uppercase; font-weight: bold; margin: 2px 0 0 0;">${p?.role || "Advisor"}</p>
                                </div>
                            </div>
                            <div style="font-size: 14px; color: #eee; line-height: 1.7; white-space: pre-wrap;">${highlightedFeedback}</div>
                        </div>
                        ${index < dataToUse.length - 1 ? '<div style="page-break-after: always;"></div>' : ''}
                    `;
                });
            }

            content.innerHTML = htmlContent;
            document.body.appendChild(content);

            const canvas = await html2canvas(content, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#000',
                logging: false
            });

            document.body.removeChild(content);

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(filename);
        } catch (error) {
            console.error("PDF Export failed:", error);
        }
    };

    const fetchHistory = async () => {
        const { data: { user } = {} } = await supabase.auth.getUser(); // Destructure with default empty object
        if (user) {
            const { data } = await supabase
                .from('persona_tests')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (data) setHistory(data);
        }
    };

    const fetchPersonas = async () => {
        const { data, error } = await supabase.from('personas').select('*').order('is_system', { ascending: false });
        if (error) console.error("Error fetching personas:", error);
        if (data) {
            setPersonas(data);
            // Auto-select first persona if none selected
            if (!selectedPersona && data.length > 0) {
                setSelectedPersona(data[0]);
            }
        }
    };

    useEffect(() => {
        // Initial fetch attempted on mount
        fetchHistory();
        fetchPersonas();

        // Listen for ANY auth changes (Sign-in, Sign-out, Token Refresh, Session Restored)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("Auth State Changed:", event, session?.user?.id);
            // On any significant event, refresh the data to ensure RLS-protected records show up
            fetchHistory();
            fetchPersonas();
        });

        return () => subscription.unsubscribe();
    }, []);

    // PHASE 4: Restore feedback when switching personas
    useEffect(() => {
        if (selectedPersona && personaFeedbackMap.has(selectedPersona.id)) {
            const storedFeedback = personaFeedbackMap.get(selectedPersona.id);
            if (storedFeedback) {
                setFeedback(storedFeedback);
                setFeedbackPersona(selectedPersona);
            }
        }
    }, [selectedPersona]);

    const handleAddPersona = async () => {
        if (!newPersona.name || !newPersona.role) return;

        const { data: { user } = {} } = await supabase.auth.getUser(); // Destructure with default empty object
        if (!user) return;

        const { error } = await supabase.from('personas').insert([{
            name: newPersona.name,
            role: newPersona.role,
            bio: newPersona.bio,
            avatar_url: newPersona.avatar_url,
            user_id: user.id
        }]);

        if (error) {
            console.error("Error adding persona:", error.message);
        } else {
            await fetchPersonas();
            setIsAddModalOpen(false);
            setNewPersona({ name: "", role: "", bio: "", avatar_url: "" });
        }
    };

    const handleDeletePersona = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();

        const personaToDelete = personas.find(p => p.id === id);
        if (!personaToDelete) return;

        // Remove from UI immediately
        setPersonas(prev => prev.filter(p => p.id !== id));

        // Set up undo timeout (10 seconds)
        const timeoutId = setTimeout(async () => {
            // Permanently delete from database after 10s
            await supabase.from('personas').delete().eq('id', id);
            setDeletedPersona(null);
        }, 10000);

        setDeletedPersona({ persona: personaToDelete, timeoutId });

        // Show toast with undo button
        toast.error(`${personaToDelete.name} deleted`, {
            description: 'Persona removed from your list',
            action: {
                label: 'Undo',
                onClick: () => {
                    // Cancel the deletion
                    if (deletedPersona?.timeoutId) {
                        clearTimeout(deletedPersona.timeoutId);
                    }
                    // Restore persona to UI
                    setPersonas(prev => [...prev, personaToDelete]);
                    setDeletedPersona(null);
                    toast.success(`${personaToDelete.name} restored`);
                }
            },
            duration: 10000
        });
    };

    const handleNameChange = (id: string, newName: string) => {
        setPersonas(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
    };

    const handleAvatarClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setUploadingPersonaId(id);
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && uploadingPersonaId) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPersonas(prev => prev.map(p => p.id === uploadingPersonaId ? { ...p, avatar_url: reader.result as string } : p));
                setUploadingPersonaId(null);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-black text-white font-sans border-t border-white/5">

            {/* COLUMN 1: PERSONA MANAGER (Left Sidebar) */}
            <div className="w-80 border-r border-white/5 flex flex-col bg-[#050505]">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-zinc-900/50 to-[#080808]">
                    <h2 className="font-bold flex items-center gap-3 text-xs uppercase tracking-[0.15em] text-zinc-400">
                        <div className="bg-white/5 p-1.5 rounded-md border border-white/10">
                            <User size={14} className="text-white" />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                            PERSONAS
                        </span>
                    </h2>
                </div>


                <ScrollArea className="flex-1 p-3">
                    <div className="space-y-2">
                        {/* Redesigned Add Persona Card */}
                        <div
                            onClick={() => setIsAddModalOpen(true)}
                            className="p-4 rounded-xl cursor-pointer border border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group/add mb-4"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center border border-white/5 group-hover/add:scale-105 transition-transform duration-300">
                                    <Plus size={24} className="text-zinc-500 group-hover/add:text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-zinc-400 group-hover/add:text-white uppercase tracking-wider">
                                        Create Persona
                                    </h3>
                                    <p className="text-[10px] text-zinc-600 uppercase font-bold">New Mindset</p>
                                </div>
                            </div>
                        </div>
                        {personas.map((p) => (
                            <div
                                key={p.id}
                                onClick={() => {
                                    setSelectedPersona(p);
                                    setIsAllPersonasMode(false);
                                }}
                                className={cn(
                                    "p-4 rounded-xl cursor-pointer border transition-all duration-300 relative group",
                                    selectedPersona?.id === p.id
                                        ? 'bg-white/10 backdrop-blur-md border-white/20 shadow-[0_0_30px_-5px_rgba(6,182,212,0.4)]'
                                        : 'bg-transparent border-transparent hover:bg-white/5 opacity-60 hover:opacity-100'
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="relative group/avatar">
                                        <Avatar className={cn(
                                            "w-12 h-12 border transition-all duration-300",
                                            selectedPersona?.id === p.id
                                                ? "border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.6)] ring-2 ring-cyan-500/30"
                                                : "border-white/5"
                                        )}>
                                            <AvatarImage
                                                src={p.avatar_url}
                                                alt={p.name}
                                                className="object-cover"
                                            />
                                            <AvatarFallback className={cn(
                                                "font-bold text-xs uppercase flex items-center justify-center w-full h-full",
                                                p.is_system ? "bg-white text-black" : "bg-zinc-800 text-white/50"
                                            )}>
                                                {p.name[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div
                                            onClick={(e) => handleAvatarClick(e, p.id)}
                                            className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                                        >
                                            <Camera size={14} className="text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        {editingPersonaId === p.id ? (
                                            <input
                                                autoFocus
                                                className="bg-transparent border-b border-white/20 text-sm font-bold text-white focus:outline-none w-full px-0 py-0.5"
                                                value={p.name}
                                                onChange={(e) => handleNameChange(p.id, e.target.value)}
                                                onBlur={() => setEditingPersonaId(null)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') setEditingPersonaId(null);
                                                    if (e.key === 'Escape') setEditingPersonaId(null);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            <div className="flex items-center justify-between group/name">
                                                <div className="flex items-center gap-2">
                                                    <h3 className={cn("font-bold text-base", selectedPersona?.id === p.id ? "text-white" : "text-zinc-400 group-hover:text-zinc-200")}>
                                                        {p.name}
                                                    </h3>
                                                    {!p.is_system && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingPersonaId(p.id);
                                                            }}
                                                            className="opacity-0 group-hover/name:opacity-100 transition-opacity text-zinc-500 hover:text-white"
                                                        >
                                                            <Pencil size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                                {!p.is_system && (
                                                    <button
                                                        onClick={(e) => handleDeletePersona(e, p.id)}
                                                        className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500 transition-all ml-2"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        <span className={cn(
                                            "text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold inline-block mt-1",
                                            p.is_system ? "bg-white/10 text-white/70" : "bg-blue-500/20 text-blue-400"
                                        )}>
                                            {p.role}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* All Personas Button - At Bottom */}
                        <div
                            onClick={() => {
                                setIsAllPersonasMode(true);
                                setSelectedPersona(null);
                            }}
                            className={cn(
                                "p-4 rounded-xl cursor-pointer border transition-all duration-200 relative group",
                                isAllPersonasMode
                                    ? 'bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border-blue-500 shadow-[0_0_20px_-5px_rgba(59,130,246,0.4)]'
                                    : 'bg-transparent border-transparent hover:bg-white/5 opacity-60 hover:opacity-100'
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center border border-white/10">
                                    <Users size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className={cn("font-bold text-base", isAllPersonasMode ? "text-white" : "text-zinc-400 group-hover:text-zinc-200")}>
                                        All Personas
                                    </h3>
                                    <span className="text-xs px-2.5 py-0.5 rounded-full uppercase font-bold inline-block mt-1 bg-blue-500/20 text-blue-400">
                                        Group Mode
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 px-1">
                        <Button
                            variant="ghost"
                            onClick={() => setShowInfo(!showInfo)}
                            className={cn(
                                "w-full justify-between group relative overflow-hidden border border-white/10 transition-all duration-300",
                                showInfo
                                    ? "bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white border-pink-500/30"
                                    : "bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-white/20"
                            )}
                        >
                            <span className="flex items-center gap-2 relative z-10">
                                <Info size={16} className={cn("transition-colors", showInfo ? "text-pink-400" : "text-zinc-500 group-hover:text-zinc-300")} />
                                <span className={cn("text-xs font-medium tracking-wide uppercase", showInfo ? "text-pink-100" : "text-zinc-400 group-hover:text-zinc-200")}>
                                    {showInfo ? "Close Info" : "View Details"}
                                </span>
                            </span>
                            {showInfo ? (
                                <X size={14} className="text-pink-400 relative z-10" />
                            ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-pink-500 transition-colors relative z-10" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                        </Button>
                    </div>
                </ScrollArea>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />
            </div>

            {/* COLUMN 2: INPUT AREA (Center) */}
            <div className="flex-1 flex flex-col p-6 bg-[#020202] relative">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-lg font-bold text-gray-100">Simulation Lab</h1>
                            <p className="text-xs text-zinc-500 font-mono">AI-POWERED USER FEEDBACK</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {(ideaInput || feedback || allPersonasFeedback.length > 0) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClear}
                                className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10 gap-2 font-mono text-[10px] uppercase tracking-widest"
                            >
                                <X size={14} /> Clear Session
                            </Button>
                        )}
                        <MagnetizeButton
                            onClick={isAllPersonasMode ? handleGroupSimulate : handleSimulate}
                            disabled={isLoading || !ideaInput.trim()}
                            particleCount={16}
                            className={cn(
                                "bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)] transition-all",
                                isLoading && "opacity-80"
                            )}
                        >
                            {isLoading ? (
                                <> <Sparkles size={18} className="animate-spin" /> Simulating... </>
                            ) : (
                                <> <Play size={18} fill="currentColor" /> Run Simulation </>
                            )}
                        </MagnetizeButton>
                    </div>
                </div>

                <div className="flex-1 bg-zinc-900/60 border border-white/10 rounded-xl p-1 relative overflow-hidden focus-within:ring-2 focus-within:ring-cyan-500/50 focus-within:border-cyan-500/30 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                    {currentProject && !ideaInput && (
                        <button
                            onClick={() => setIdeaInput(currentProject.description || currentProject.name)}
                            className="absolute top-4 left-6 z-10 text-[10px] text-blue-400 hover:text-blue-300 font-bold tracking-widest uppercase flex items-center gap-2 transition-colors bg-black/40 backdrop-blur-sm px-2 py-1 rounded border border-blue-500/20"
                        >
                            <Rocket size={12} />
                            Synchronize with {currentProject.name} concept
                        </button>
                    )}
                    <textarea
                        className={cn(
                            "w-full h-full bg-transparent border-none p-6 text-gray-300 resize-none focus:outline-none font-mono text-sm leading-relaxed placeholder:text-zinc-700 transition-opacity duration-300",
                            currentProject && !ideaInput && "pt-14",
                            showInfo ? "opacity-0 pointer-events-none" : "opacity-100"
                        )}
                        placeholder="> Enter your concept here..."
                        value={ideaInput}
                        onChange={(e) => setIdeaInput(e.target.value)}
                        spellCheck={false}
                    />

                    {showInfo && (
                        <div className="absolute inset-0 bg-[#020202] z-10 flex items-center justify-center p-6 animate-in fade-in duration-300">
                            <button
                                onClick={() => setShowInfo(false)}
                                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-20"
                            >
                                <X size={24} />
                            </button>
                            <div className="w-full h-full flex items-center justify-center">
                                {personas.length > 0 ? (
                                    <AnimatedTestimonials
                                        testimonials={personas.map(p => ({
                                            quote: p.bio,
                                            name: p.name,
                                            designation: p.role,
                                            src: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`
                                        }))}
                                        autoplay={false}
                                    />
                                ) : (
                                    <div className="text-zinc-500 font-mono text-sm">
                                        No personas available. Please add some to view details.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur text-zinc-500 text-xs px-2 py-1 rounded border border-white/5 font-mono">
                        {ideaInput.length} chars
                    </div>
                </div>
            </div>

            {/* COLUMN 3: LIVE FEEDBACK (Right Sidebar) */}
            <div className="w-[450px] border-l border-white/5 bg-[#050505] flex flex-col">
                <div className="p-4 border-b border-white/5 bg-[#080808] flex items-center justify-between">
                    <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                        <button
                            onClick={() => setShowHistory(false)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] uppercase tracking-wider font-bold transition-all",
                                !showHistory ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <MessageSquare size={12} /> Live Feedback
                        </button>
                        <button
                            onClick={() => setShowHistory(true)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] uppercase tracking-wider font-bold transition-all",
                                showHistory ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <History size={12} /> History
                        </button>
                    </div>
                    {isLoading && (
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-[10px] text-green-500 font-mono">LIVE</span>
                        </div>
                    )}
                    <ProjectSyncButton module="persona" data={isAllPersonasMode ? allPersonasFeedback : feedback} disabled={isAllPersonasMode ? (!allPersonasFeedback || allPersonasFeedback.length === 0) : !feedback} className="ml-auto scale-90" context={{ name: ideaInput.slice(0, 50), description: ideaInput }} />
                </div>

                <ScrollArea className="flex-1 p-6 relative">
                    {/* Clear Button - Top Right Corner */}
                    {!showHistory && (feedback || allPersonasFeedback.length > 0) && !isLoading && (
                        <button
                            onClick={() => {
                                setFeedback("");
                                setFeedbackPersona(null);
                                setAllPersonasFeedback([]);
                                setPersonaFeedbackMap(new Map());
                                toast.success("Output cleared");
                            }}
                            className="absolute top-2 right-2 z-[100] text-zinc-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all border border-white/5 hover:border-red-500/30 backdrop-blur-sm bg-black/50 shadow-lg"
                            title="Clear Output"
                        >
                            <X size={18} />
                        </button>
                    )}

                    {showHistory && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            {history.length > 0 ? (
                                history.map((item) => (
                                    <div key={item.id} className="p-4 bg-zinc-900/40 border border-white/5 rounded-xl hover:bg-zinc-900/60 transition-all group/item">
                                        <div className="flex items-center justify-between mb-3 text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={10} /> {new Date(item.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="text-zinc-600 bg-black/30 px-2 py-0.5 rounded border border-white/5">
                                                {item.persona_name}
                                            </div>
                                        </div>

                                        <div className="text-xs text-white/50 mb-3 line-clamp-2 italic font-serif italic border-l border-white/10 pl-3">
                                            "{item.prompt}"
                                        </div>

                                        <div className="text-xs text-zinc-300 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
                                            {parseFeedback(item.response || "No feedback recorded.")}
                                        </div>

                                        <div className="mt-3 flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setIdeaInput(item.prompt);
                                                    setFeedback(item.response);
                                                    const p = personas.find(pers => pers.name === item.persona_name);
                                                    if (p) {
                                                        setSelectedPersona(p);
                                                        setFeedbackPersona(p);
                                                        setIsAllPersonasMode(false);
                                                    }
                                                    setShowHistory(false);
                                                }}
                                                className="flex-1 py-1.5 text-[10px] uppercase font-bold text-zinc-500 hover:text-white border border-white/5 rounded-md hover:bg-white/5 transition-all opacity-0 group-hover/item:opacity-100"
                                            >
                                                Recall
                                            </button>
                                            <button
                                                onClick={() => {
                                                    // Check if this is a group session
                                                    if (item.persona_name === "Group Session" && item.full_result) {
                                                        // For group sessions, open the modal
                                                        setHistoryExportItem(item);
                                                        setIsExportChoicesOpen(true);
                                                    } else {
                                                        // For single persona, use the normal flow
                                                        handleExportPDF(item.persona_name, item.response);
                                                    }
                                                }}
                                                className="px-3 py-1.5 text-zinc-500 hover:text-blue-400 border border-white/5 rounded-md hover:bg-blue-500/10 transition-all opacity-0 group-hover/item:opacity-100"
                                                title="Download PDF"
                                            >
                                                <Download size={12} />
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    const { error } = await supabase.from('persona_tests').delete().eq('id', item.id);
                                                    if (!error) {
                                                        fetchHistory();
                                                        toast.success("History item deleted");
                                                    } else {
                                                        toast.error("Failed to delete");
                                                    }
                                                }}
                                                className="px-3 py-1.5 text-zinc-500 hover:text-red-400 border border-white/5 rounded-md hover:bg-red-500/10 transition-all opacity-0 group-hover/item:opacity-100"
                                                title="Delete"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full py-20 flex flex-col items-center justify-center text-zinc-700 opacity-50 space-y-4">
                                    <History size={32} />
                                    <p className="text-xs font-mono text-center max-w-[150px]">No historical simulations found.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {!showHistory && (
                        <>
                            {!feedback && !isLoading && allPersonasFeedback.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-700 opacity-50 space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
                                        <User size={32} />
                                    </div>
                                    <p className="text-sm font-mono text-center max-w-[200px]">Select a persona and run simulation to see feedback here</p>
                                </div>
                            )}

                            {isLoading && (
                                <div className="space-y-4 animate-in fade-in duration-500 mb-8 border-b border-white/5 pb-8">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 animate-pulse"></div>
                                        <div className="space-y-2">
                                            <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse"></div>
                                            <div className="h-2 w-16 bg-zinc-800 rounded animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div className="h-32 bg-zinc-900/50 rounded-xl border border-white/5 p-4 space-y-2">
                                        <div className="h-2 w-full bg-zinc-800 rounded animate-pulse"></div>
                                        <div className="h-2 w-[90%] bg-zinc-800 rounded animate-pulse"></div>
                                        <div className="h-2 w-[80%] bg-zinc-800 rounded animate-pulse"></div>
                                    </div>
                                    <p className="text-[10px] text-blue-500 font-mono text-center animate-pulse">
                                        {personaTask?.loadingStep || groupTask?.loadingStep || "SIMULATING..."}
                                    </p>
                                </div>
                            )}


                            {feedback && feedbackPersona && !isLoading && !isAllPersonasMode && (
                                <div className="space-y-2 animate-in fade-in duration-500">
                                    <FeedbackCard
                                        persona={feedbackPersona}
                                        feedback={feedback}
                                        onDownload={() => handleExportPDF(feedbackPersona.name, feedback)}
                                    />
                                    <div className="flex justify-end pr-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleExportPDF(feedbackPersona.name, feedback)}
                                            className="text-[10px] uppercase font-bold text-blue-400 border border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/10 h-8 px-4 rounded-lg transition-all"
                                        >
                                            <Download size={12} className="mr-2" /> Export PDF
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {allPersonasFeedback.length > 0 && !isLoading && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                                    {allPersonasFeedback.map(({ persona, feedback }, index) => (
                                        <div
                                            key={persona.id}
                                            className="animate-in slide-in-from-bottom-4 duration-500 fade-in"
                                            style={{ animationDelay: `${index * 100}ms` }}
                                        >
                                            <FeedbackCard
                                                persona={persona}
                                                feedback={feedback}
                                                onDownload={() => { }}
                                            />
                                        </div>
                                    ))}
                                    <div className="mt-2 flex justify-between items-center pr-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsExportChoicesOpen(true)}
                                            className="text-[10px] uppercase font-bold text-blue-400 border border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/10 h-8 px-4 rounded-lg transition-all"
                                        >
                                            <Download size={12} className="mr-2" /> Export Options
                                        </Button>
                                        <Badge variant="outline" className="text-[10px] text-zinc-600 border-zinc-800">
                                            ALL PERSONAS • {new Date().toLocaleTimeString()}
                                        </Badge>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </ScrollArea>
            </div>

            {/* Add Persona Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center flex items-center justify-center gap-2">
                            <Plus size={20} className="text-blue-500" />
                            Create New Persona
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex justify-center mb-4">
                            <div
                                onClick={() => modalFileInputRef.current?.click()}
                                className="relative w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer group hover:bg-white/10 transition-all overflow-hidden"
                            >
                                {newPersona.avatar_url ? (
                                    <img src={newPersona.avatar_url} alt="preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-1">
                                        <Camera size={24} className="text-zinc-600 group-hover:text-zinc-400" />
                                        <span className="text-[10px] text-zinc-600 group-hover:text-zinc-400 uppercase font-bold">Upload</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera size={20} className="text-white" />
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={modalFileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleModalFileChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="base_name" className="text-xs uppercase tracking-widest text-zinc-500">Full Name</Label>
                            <Input
                                id="base_name"
                                value={newPersona.name}
                                onChange={(e) => setNewPersona({ ...newPersona, name: e.target.value })}
                                className="bg-white/5 border-white/10 focus:border-blue-500/50 h-10"
                                placeholder="e.g. John Wick"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="base_role" className="text-xs uppercase tracking-widest text-zinc-500">Professional Role</Label>
                            <Input
                                id="base_role"
                                value={newPersona.role}
                                onChange={(e) => setNewPersona({ ...newPersona, role: e.target.value })}
                                className="bg-white/5 border-white/10 focus:border-blue-500/50 h-10"
                                placeholder="e.g. Disgruntled Customer"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="base_bio" className="text-xs uppercase tracking-widest text-zinc-500">Personality & Background</Label>
                            <Textarea
                                id="base_bio"
                                value={newPersona.bio}
                                onChange={(e) => setNewPersona({ ...newPersona, bio: e.target.value })}
                                className="bg-white/5 border-white/10 focus:border-blue-500/50 h-32 resize-none"
                                placeholder="Describe their motivations, frustrations, and communication style..."
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setIsAddModalOpen(false)}
                            className="text-zinc-500 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddPersona}
                            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold shadow-lg hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                            <Save size={16} className="mr-2" />
                            Save Persona
                        </Button>
                    </DialogFooter >
                </DialogContent >
            </Dialog>

            {/* Export Choice Modal for Group Sessions */}
            <Dialog open={isExportChoicesOpen} onOpenChange={setIsExportChoicesOpen}>
                <DialogContent className="bg-[#0c0c0e] border-white/10 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold uppercase tracking-tight">Export Session Results</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <button
                            onClick={() => {
                                if (historyExportItem) {
                                    // Export from history
                                    const groupData = Array.isArray(historyExportItem.full_result) ? historyExportItem.full_result : [];
                                    handleExportPDF(undefined, undefined, groupData, historyExportItem.prompt);
                                } else {
                                    // Export from live feedback
                                    handleExportPDF();
                                }
                                setIsExportChoicesOpen(false);
                                setHistoryExportItem(null);
                            }}
                            className="w-full p-4 rounded-xl border border-white/5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-bold flex items-center justify-between group transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <Users size={20} />
                                <div className="text-left">
                                    <h4 className="text-sm">Whole Group Analysis</h4>
                                    <p className="text-[10px] font-normal text-blue-400/50">Complete report with all advisors</p>
                                </div>
                            </div>
                            <Download size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/5" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
                                <span className="bg-[#0c0c0e] px-2">OR SELECT INDIVIDUAL</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2">
                            {(historyExportItem ? (historyExportItem.full_result || []) : allPersonasFeedback).map(({ persona, feedback }: { persona: any, feedback: string }) => (
                                <button
                                    key={persona.id}
                                    onClick={() => {
                                        if (historyExportItem) {
                                            // Export single persona from history
                                            handleExportPDF(persona.name, feedback, undefined, historyExportItem.prompt);
                                        } else {
                                            // Export single persona from live feedback
                                            handleExportPDF(persona.name, feedback);
                                        }
                                        setIsExportChoicesOpen(false);
                                        setHistoryExportItem(null);
                                    }}
                                    className="w-full p-3 rounded-lg border border-white/5 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center gap-3 transition-all group"
                                >
                                    <Avatar className="w-8 h-8 border border-white/10">
                                        <AvatarImage src={persona.avatar_url} alt={persona.name} className="object-cover" />
                                        <AvatarFallback>{persona.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-left">
                                        <div className="text-xs font-bold">{persona.name}</div>
                                        <div className="text-[10px] text-zinc-500">{persona.role}</div>
                                    </div>
                                    <Download size={14} className="opacity-0 group-hover:opacity-100 text-zinc-500" />
                                </button>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setIsExportChoicesOpen(false)}
                            className="text-zinc-500 hover:text-white"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}

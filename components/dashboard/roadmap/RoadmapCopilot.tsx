"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import {
    Sparkles, X, Send, Brain, Target,
    AlertCircle, FileText, ChevronRight,
    Layout, Kanban, Calendar, PieChart, Table as TableIcon,
    RefreshCcw, Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRoadmapStore, ViewType } from '@/lib/store/useRoadmapStore';
import { generateCopilotResponse } from '@/app/actions/gemini';
import { toast } from 'sonner';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    action?: any;
    timestamp: number;
}

export const RoadmapCopilot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hi! I'm your Roadmap Copilot. I can help you plan your project, break down tasks, or analyze your current progress. What's on your mind?",
            timestamp: Date.now()
        }
    ]);

    const {
        blocks, activePageId, addDatabaseRow, updateDatabaseRow,
        setActiveView, updateBlock, addBlock, addDatabaseProperty,
        updatePage, deleteBlock, addDatabaseView
    } = useRoadmapStore();
    const chatEndRef = useRef<HTMLDivElement>(null);
    const dragControls = useDragControls();
    const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });

    useEffect(() => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Get context of current page databases
    const pageContext = useMemo(() => {
        const pageBlocks = blocks.filter(b => b.pageId === activePageId && !b.parentId);
        const databases = pageBlocks.filter(b => b.type === 'database');

        return databases.map(db => ({
            id: db.id,
            name: db.content || "Untitled Database",
            properties: db.data?.properties.map(p => ({ label: p.label, key: p.key, type: p.type })),
            rows: db.data?.rows.map(r => ({
                id: r.id,
                title: r.values.title,
                status: r.values.status,
                priority: r.values.priority,
                all_values: r.values
            }))
        }));
    }, [blocks, activePageId]);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleAction = async (action: any) => {
        if (!action || !activePageId) return;

        console.log("Copilot Executing High-Performance Action:", action);

        switch (action.type) {
            case 'create_tasks':
                // Find or create a database
                let targetDb = pageContext[0]?.id;

                if (!targetDb) {
                    addBlock('database');
                    await new Promise(resolve => setTimeout(resolve, 300));
                    const newBlocks = useRoadmapStore.getState().blocks;
                    const newDb = newBlocks.find(b => b.type === 'database' && b.pageId === activePageId);
                    if (newDb) targetDb = newDb.id;
                }

                if (targetDb && action.tasks) {
                    action.tasks.forEach((task: any) => {
                        addDatabaseRow(targetDb!, {
                            title: task.title || task.name,
                            status: task.status || 'To Do',
                            priority: task.priority || 'None',
                            ...(task.properties || {})
                        });
                    });
                    toast.success(`Synchronized ${action.tasks.length} strategic milestones.`);
                }
                break;

            case 'update_task':
                if (action.taskId && action.updates) {
                    const blockWithRow = blocks.find(b => b.data?.rows.some(r => r.id === action.taskId));
                    if (blockWithRow) {
                        updateDatabaseRow(blockWithRow.id, action.taskId, {
                            values: { ...action.updates }
                        });
                        toast.success(`Protocol updated for task ${action.taskId}.`);
                    }
                }
                break;

            case 'navigate':
                if (action.view) {
                    const dbBlock = blocks.find(b => b.type === 'database');
                    if (dbBlock && dbBlock.data) {
                        const view = dbBlock.data.views.find(v => v.type.toLowerCase() === action.view.toLowerCase());
                        if (view) {
                            setActiveView(dbBlock.id, view.id);
                        } else if (action.view.toLowerCase() === 'chart') {
                            // Automatically add a chart view if requested
                            addDatabaseView(dbBlock.id, 'Distribution Chart', 'Chart');
                            toast.success("Initialized Charting Engine.");
                        }
                    }
                }
                break;

            case 'style_page':
                if (action.updates) {
                    updatePage(activePageId, action.updates);
                    toast.success("Aesthetic synchronized.");
                }
                break;

            case 'add_block':
                if (action.blockType) {
                    addBlock(action.blockType as any);
                    if (action.content) {
                        // Small delay to let block generate
                        setTimeout(() => {
                            const lastBlock = useRoadmapStore.getState().blocks.slice(-1)[0];
                            if (lastBlock) updateBlock(lastBlock.id, { content: action.content });
                        }, 100);
                    }
                    toast.success(`Module deployed: ${action.blockType}`);
                }
                break;

            case 'delete_item':
                if (action.blockId) {
                    deleteBlock(action.blockId);
                    toast.info("Module decommissioned.");
                }
                break;

            case 'refine_page':
                if (action.suggestions) {
                    const { title, icon, blocks: suggestionBlocks } = action.suggestions;
                    if (title || icon) updatePage(activePageId, { title, icon });

                    if (suggestionBlocks && suggestionBlocks.length > 0) {
                        suggestionBlocks.forEach((sb: any, idx: number) => {
                            setTimeout(() => {
                                addBlock(sb.type, idx);
                                setTimeout(() => {
                                    const allBlocks = useRoadmapStore.getState().blocks;
                                    const target = allBlocks.find(b => b.order === idx);
                                    if (target) updateBlock(target.id, { content: sb.content });
                                }, 50);
                            }, idx * 100);
                        });
                    }
                    toast.success("Architectural refinement complete.");
                }
                break;

            default:
                break;
        }
    };

    const handleSend = async (text: string = input) => {
        if (!text.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await generateCopilotResponse(text, pageContext);

            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.content || "I'm not sure how to help with that yet.",
                action: response.action,
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, assistantMsg]);

            if (response.action) {
                await handleAction(response.action);
            }
        } catch (error) {
            console.error("Copilot Error:", error);
            toast.error("Copilot is resting right now. Try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    const QuickAction = ({ label, icon: Icon, query }: { label: string, icon: any, query: string }) => (
        <button
            onClick={() => handleSend(query)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/10 rounded-full transition-all group shrink-0"
        >
            <Icon size={12} className="text-cyan-500 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white uppercase tracking-wider">{label}</span>
        </button>
    );

    return (
        <div className="fixed bottom-6 right-6 z-[1000] flex flex-col items-end gap-4">
            {/* CHAT WINDOW */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        drag
                        dragControls={dragControls}
                        dragListener={false}
                        dragMomentum={false}
                        dragElastic={0}
                        dragConstraints={{
                            left: -(windowSize.width - 300 - 384 - 24),
                            right: 24,
                            top: -(windowSize.height - 550 - 24),
                            bottom: 24
                        }}
                        className="w-96 h-[550px] bg-[#0f0f0f] border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden backdrop-blur-xl"
                    >
                        {/* HEADER - Drag Trigger */}
                        <div
                            onPointerDown={(e) => dragControls.start(e)}
                            className="p-4 border-b border-white/[0.05] flex items-center justify-between bg-gradient-to-r from-cyan-500/20 to-transparent cursor-grab active:cursor-grabbing select-none"
                        >
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-cyan-600/30 rounded-xl">
                                    <Brain size={18} className="text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">Strategy Kernel</h3>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* MESSAGES */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex flex-col max-w-[85%]",
                                        msg.role === 'user' ? "ml-auto items-end" : "items-start"
                                    )}
                                >
                                    <div className={cn(
                                        "p-3 rounded-2xl text-xs leading-relaxed",
                                        msg.role === 'user'
                                            ? "bg-cyan-600 text-white rounded-tr-none shadow-[0_4px_15px_rgba(6,182,212,0.3)]"
                                            : "bg-white/[0.03] text-zinc-300 rounded-tl-none border border-white/[0.05]"
                                    )}>
                                        {msg.content}
                                    </div>
                                    <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                                        {msg.role === 'user' ? 'You' : 'Copilot'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-center gap-2 text-zinc-600 animate-pulse">
                                    <RefreshCcw size={12} className="animate-spin" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">AI is thinking...</span>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* FOOTER */}
                        <div className="p-4 border-t border-white/[0.05] space-y-4 bg-white/[0.01]">
                            {/* QUICK ACTIONS */}
                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                <QuickAction label="Generate Plan" icon={Play} query="Create a roadmap for a new SaaS product launch" />
                                <QuickAction label="Analyze Risks" icon={AlertCircle} query="What are the risks in my current roadmap?" />
                                <QuickAction label="Summarize" icon={FileText} query="Summarize my high priority tasks" />
                                <QuickAction label="Next Steps" icon={Target} query="What should I focus on next?" />
                            </div>

                            {/* INPUT */}
                            <div className="relative">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask AI to manage your roadmap..."
                                    className="w-full bg-white/[0.05] border border-white/10 rounded-2xl py-3 pl-4 pr-12 text-xs text-white placeholder:text-zinc-600 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all"
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl transition-all shadow-lg"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FLOATING BUTTON */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "p-4 rounded-2xl shadow-2xl transition-all flex items-center justify-center group",
                    isOpen
                        ? "bg-zinc-800 text-white"
                        : "bg-gradient-to-br from-cyan-500 to-blue-600 text-white"
                )}
            >
                {isOpen ? <X size={24} /> : <Brain size={24} className="group-hover:scale-110 transition-transform" />}
                {!isOpen && (
                    <div className="absolute inset-0 rounded-2xl bg-cyan-400 opacity-20 blur-xl group-hover:opacity-40 transition-opacity" />
                )}
            </motion.button>
        </div>
    );
};

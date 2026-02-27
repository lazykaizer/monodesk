"use client";

import { useEffect, useState } from 'react';
import { useProjectStore } from '@/lib/store/useProjectStore';
import {
    ChevronDown,
    Rocket,
    Plus,
    Box,
    Check,
    Loader2,
    Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/core/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/core/dropdown-menu";
import { toast } from 'sonner';
import { useTaskStore } from '@/lib/store/useTaskStore';

export default function ProjectSwitcher({ className }: { className?: string }) {
    const {
        projects,
        activeProjectId,
        currentProject,
        fetchProjects,
        setActiveProject,
        createProject,
        deleteProject,
        isLoading
    } = useProjectStore();

    const { ownerId } = useTaskStore();
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (ownerId) {
            fetchProjects();
        }
    }, [ownerId, fetchProjects]);

    if (!mounted) return null;

    const handleSelect = async (id: string | null) => {
        await setActiveProject(id);
        const project = projects.find(p => p.id === id);
        if (id) {
            toast.success(`Context switched to ${project?.name || 'Project'}`);
        } else {
            toast.info("Switched to Sandbox Mode (Incognito)");
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;

        const id = await createProject(newProjectName);
        if (id) {
            toast.success(`Project "${newProjectName}" created!`);
            setNewProjectName("");
            setIsCreating(false);
        }
    };

    return (
        <div className={cn("flex items-center", className)}>
            <DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
                <DropdownMenuTrigger asChild>
                    <button className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all group focus:outline-none",
                        activeProjectId
                            ? "bg-blue-600/10 border-blue-500/20 hover:bg-blue-600/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                            : "bg-white/5 border-white/10 hover:bg-white/10 text-zinc-400"
                    )}>
                        <div className={cn(
                            "w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                            activeProjectId ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-500"
                        )}>
                            {activeProjectId ? <Rocket size={12} /> : <Box size={12} />}
                        </div>

                        <div className="text-xs font-bold truncate max-w-[120px]">
                            {currentProject?.name || "Select Project"}
                        </div>

                        <ChevronDown size={12} className={cn("text-current transition-transform opacity-50", isOpen && "rotate-180")} />
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-64 bg-[#09090b] border-white/10 text-white p-2 z-[9999]" align="end" sideOffset={8}>
                    <DropdownMenuLabel className="text-zinc-500 text-[10px] uppercase tracking-widest px-2 py-3">
                        Workspace Projects
                    </DropdownMenuLabel>

                    <div className="max-h-64 overflow-y-auto p-1 scrollbar-hide">
                        <DropdownMenuItem
                            onClick={() => handleSelect(null)}
                            className={cn(
                                "rounded-lg gap-3 py-2 cursor-pointer transition-colors focus:bg-white/5",
                                !activeProjectId && "bg-white/5 text-blue-400"
                            )}
                        >
                            <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center shrink-0">
                                <Box size={12} />
                            </div>
                            <span className="flex-1 text-sm font-medium">Sandbox Mode</span>
                            {!activeProjectId && <Check size={14} />}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-white/5 my-2" />

                        {isLoading && projects.length === 0 ? (
                            <div className="py-4 flex justify-center">
                                <Loader2 className="animate-spin text-zinc-500" size={16} />
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="py-4 text-center text-zinc-600 text-xs italic">
                                No projects yet.
                            </div>
                        ) : (
                            projects.map((project) => (
                                <DropdownMenuItem
                                    key={project.id}
                                    onClick={() => handleSelect(project.id)}
                                    className={cn(
                                        "rounded-lg gap-3 py-2 cursor-pointer transition-colors focus:bg-white/5 relative group",
                                        activeProjectId === project.id && "bg-blue-500/10 text-blue-400"
                                    )}
                                >
                                    <div className={cn(
                                        "w-6 h-6 rounded flex items-center justify-center shrink-0",
                                        activeProjectId === project.id ? "bg-blue-600/20" : "bg-zinc-800"
                                    )}>
                                        <Rocket size={12} />
                                    </div>
                                    <span className="flex-1 truncate text-sm font-medium pr-6">{project.name}</span>

                                    {/* Active Checkmark (only if not hovering group) */}
                                    {activeProjectId === project.id && <Check size={14} className="group-hover:hidden" />}

                                    {/* Delete Button (visible on hover) */}
                                    <div
                                        role="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
                                                deleteProject(project.id);
                                                toast.success("Project deleted");
                                            }
                                        }}
                                        className="hidden group-hover:flex absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 items-center justify-center rounded-md hover:bg-red-500/20 text-red-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={12} />
                                    </div>
                                </DropdownMenuItem>
                            ))
                        )}
                    </div>

                    <DropdownMenuSeparator className="bg-white/5 my-2" />

                    {isCreating ? (
                        <div className="p-2 space-y-2">
                            <input
                                autoFocus
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject(e as any)}
                                placeholder="Project Name..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500/50"
                            />
                            <div className="flex gap-2">
                                <Button
                                    onClick={(e) => handleCreateProject(e as any)}
                                    size="sm"
                                    className="flex-1 h-8 bg-blue-600 hover:bg-blue-500 text-xs text-white"
                                >
                                    Create
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setIsCreating(false)}
                                    className="h-8 text-xs text-zinc-500"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <DropdownMenuItem
                            onSelect={(e) => { e.preventDefault(); setIsCreating(true); }}
                            className="rounded-lg gap-2 py-2 cursor-pointer text-blue-400 focus:text-blue-300 focus:bg-blue-500/5"
                        >
                            <Plus size={14} />
                            <span className="font-bold text-xs uppercase tracking-tight">Create New Project</span>
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

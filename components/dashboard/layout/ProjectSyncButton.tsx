"use client";

import { useProjectStore } from '@/lib/store/useProjectStore';
import {
    RefreshCw,
    Check,
    Rocket,
    Box,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/core/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';

interface ProjectSyncButtonProps {
    module: string;
    data: any;
    className?: string;
    context?: {
        name: string;
        description: string;
    };
    disabled?: boolean;
    compact?: boolean;
}

export default function ProjectSyncButton({ module, data, className, context, disabled, compact }: ProjectSyncButtonProps) {
    const { activeProjectId, currentProject, projects, fetchProjects, setActiveProject, syncModuleData, createProject } = useProjectStore();
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const isAlreadySynced = currentProject?.knowledge_base?.[module];
    const hasProjects = projects.length > 0;

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            if (!activeProjectId) {
                // Sandbox Mode: Create new project First
                if (!context || !context.name.trim()) {
                    toast.error("Enter an idea first!");
                    setIsSyncing(false);
                    return;
                }

                const newProjectId = await createProject(context.name, context.description);
                if (newProjectId) {
                    await syncModuleData(module, data);
                    setIsSuccess(true);
                    toast.success(`Project "${context.name}" created & synced!`);
                    setTimeout(() => setIsSuccess(false), 3000);
                } else {
                    toast.error("Failed to create project.");
                }
            } else {
                // Normal Mode: Sync to existing
                await syncModuleData(module, data);
                setIsSuccess(true);
                toast.success(`Synced to ${currentProject?.name}!`);
                setTimeout(() => setIsSuccess(false), 3000);
            }
        } catch (error) {
            toast.error("Sync failed. Please try again.");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <Button
            onClick={handleSync}
            disabled={disabled || isSyncing || !data}
            variant="ghost"
            size="sm"
            className={cn(
                "transition-all duration-300 gap-2 relative",
                isSuccess ? "text-green-400 bg-green-500/10" : "text-blue-400 bg-blue-500/5 hover:bg-blue-500/10",
                isAlreadySynced && !isSuccess && "shadow-[0_0_15px_rgba(59,130,246,0.5)] border-blue-500/50 bg-blue-500/10",
                className
            )}
        >
            {isSyncing ? (
                <>
                    <Loader2 size={16} className="animate-spin" />
                    {activeProjectId ? "Syncing..." : "Saving..."}
                </>
            ) : isSuccess ? (
                <>
                    <Check size={16} />
                    {activeProjectId ? "Synced" : "Saved"}
                </>
            ) : (
                <>
                    {activeProjectId ? <RefreshCw size={16} /> : <Rocket size={16} />}
                    {activeProjectId ? "Sync" : compact ? "Save" : "Save as Project"}
                </>
            )}
            {isAlreadySynced && !isSuccess && !isSyncing && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
            )}
        </Button>
    );
}

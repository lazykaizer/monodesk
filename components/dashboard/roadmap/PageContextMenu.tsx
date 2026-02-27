"use client";

import React, { useState } from 'react';
import {
    MoreHorizontal,
    Sparkles,
    Copy,
    Edit2,
    ExternalLink,
    Trash2
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/core/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/core/dialog";
import { Input } from "@/components/ui/core/input";
import { Button } from "@/components/ui/core/button";
import { useRoadmapStore, RoadmapPage } from '@/lib/store/useRoadmapStore';
import { cn } from '@/lib/utils';

interface PageContextMenuProps {
    page: RoadmapPage;
    trigger?: React.ReactNode;
    className?: string;
}

export const PageContextMenu: React.FC<PageContextMenuProps> = ({
    page,
    trigger,
    className
}) => {
    const { toggleFavorite, duplicatePage, renamePage, deletePage } = useRoadmapStore();
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [newTitle, setNewTitle] = useState(page.title);

    const handleRename = () => {
        if (newTitle.trim()) {
            renamePage(page.id, newTitle.trim());
            setIsRenameOpen(false);
        }
    };

    const openInNewWindow = () => {
        const url = `/dashboard/roadmap?minimal=true`;
        // Since the store is persistent, we can't easily set the active page in the new window store state
        // unless we use a URL param for the page ID too.
        // Let's update the minimal route to support pageId.
        window.open(`${url}&pageId=${page.id}`, '_blank', 'width=1000,height=800');
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    {trigger || (
                        <button className={cn("p-1 hover:bg-white/10 rounded transition-colors text-zinc-500 hover:text-zinc-200", className)}>
                            <MoreHorizontal size={14} />
                        </button>
                    )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#1a1a1a] border-white/10 text-zinc-300">
                    <DropdownMenuItem
                        onClick={() => toggleFavorite(page.id)}
                        className="flex items-center gap-2 hover:bg-white/5 cursor-pointer"
                    >
                        <Sparkles size={14} className={cn(page.isFavorite && "fill-blue-400 text-blue-400")} />
                        <span>{page.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-white/5" />

                    <DropdownMenuItem
                        onClick={() => duplicatePage(page.id)}
                        className="flex items-center gap-2 hover:bg-white/5 cursor-pointer"
                    >
                        <Copy size={14} />
                        <span>Duplicate</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => {
                            setNewTitle(page.title);
                            setIsRenameOpen(true);
                        }}
                        className="flex items-center gap-2 hover:bg-white/5 cursor-pointer"
                    >
                        <Edit2 size={14} />
                        <span>Rename</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-white/5" />

                    <DropdownMenuItem
                        onClick={openInNewWindow}
                        className="flex items-center gap-2 hover:bg-white/5 cursor-pointer"
                    >
                        <ExternalLink size={14} />
                        <span>Open in new window</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-white/5" />

                    <DropdownMenuItem
                        onClick={() => deletePage(page.id)}
                        className="flex items-center gap-2 hover:bg-red-500/10 text-red-500 cursor-pointer"
                    >
                        <Trash2 size={14} />
                        <span>Delete</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                <DialogContent className="bg-[#1a1a1a] border-white/10 text-white max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Rename Page</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                            placeholder="Enter page title..."
                            className="bg-[#2a2a2a] border-white/10 text-white focus:border-blue-500/50"
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsRenameOpen(false)} className="hover:bg-white/5 text-zinc-400">
                            Cancel
                        </Button>
                        <Button onClick={handleRename} className="bg-blue-600 hover:bg-blue-700 text-white">
                            Rename
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

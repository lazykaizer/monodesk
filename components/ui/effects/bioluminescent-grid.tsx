"use client";

import React, { useEffect, useRef, forwardRef } from 'react';
import { cn } from "@/lib/utils";

// --- Reusable Grid Item Component ---
const BioluminescentGridItem = forwardRef<HTMLDivElement, { className?: string; children: React.ReactNode }>(({ className, children }, ref) => {
    const itemRef = useRef<HTMLDivElement>(null);

    // Effect to track mouse position and update CSS custom properties
    useEffect(() => {
        const item = itemRef.current;
        if (!item) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = item.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            item.style.setProperty('--mouse-x', `${x}px`);
            item.style.setProperty('--mouse-y', `${y}px`);
        };

        item.addEventListener('mousemove', handleMouseMove);

        return () => {
            item.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <div
            ref={itemRef}
            className={cn("bio-item group/bio", className)}
        >
            {/* Background Soft Glow Layer */}
            <div className="bio-spotlight opacity-0 group-hover/bio:opacity-100" />

            {/* Grid Pattern Layer (Animated by mouse position via mask) */}
            <div className="bio-grid-layer opacity-0 group-hover/bio:opacity-100" />

            <div className="bio-item-content relative z-10">
                {children}
            </div>
        </div>
    );
});
BioluminescentGridItem.displayName = "BioluminescentGridItem";


// --- Main Grid Container Component ---
export const BioluminescentGrid = forwardRef<HTMLDivElement, { className?: string; children: React.ReactNode }>(({ className, children }, ref) => {
    return (
        <div ref={ref} className={cn("bio-grid", className)}>
            {children}
        </div>
    );
});
BioluminescentGrid.displayName = "BioluminescentGrid";

export { BioluminescentGridItem };

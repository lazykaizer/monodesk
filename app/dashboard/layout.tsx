"use client";

import TopBar from "@/components/dashboard/layout/TopBar";
import GradientMenu from "@/components/ui/animations/gradient-menu";
import RoadmapSidebar from "@/components/dashboard/roadmap/RoadmapSidebar";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

function LayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isMinimal = searchParams.get('minimal') === 'true';

    const isValidator = pathname === '/dashboard/validator';
    const isRoadmap = pathname === '/dashboard/roadmap';
    const isCreative = pathname === '/dashboard/creative';
    const isTrends = pathname === '/dashboard/trends';
    const isPitch = pathname === '/dashboard/pitch';
    const isFinance = pathname === '/dashboard/finance';
    const isStrategy = pathname === '/dashboard/strategy';
    const isPersona = pathname === '/dashboard/persona';

    if (isMinimal) {
        return (
            <div className="min-h-screen bg-[#191919] text-white overflow-y-auto">
                <main className="w-full">
                    <div className="p-8 pt-4">
                        {children}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className={cn(
            "h-screen flex flex-col bg-[#050505] text-white transition-colors duration-300 relative overflow-hidden",
            isRoadmap && "bg-[#191919]",
            isValidator && "bg-transparent"
        )}>
            {/* Navbar (Sticky/Fixed Top) - Moved to root for full width line */}
            <TopBar />

            <div className="flex flex-1 overflow-hidden">
                {/* 1. SIDEBAR (Fixed Height, Left) */}
                {isRoadmap && <RoadmapSidebar />}

                {/* 2. MAIN CONTENT AREA (Scrollable, Right of Sidebar) */}
                <main className={cn(
                    "flex-1 flex flex-col relative z-0 overflow-y-auto",
                    isRoadmap && "ml-64"
                )}>
                    {/* Dynamic Page Content (Grows to fill space) */}
                    <div className={cn(
                        "flex-1 flex flex-col p-8",
                        (isValidator || isRoadmap || isCreative || isTrends || isPitch) && "pt-0",
                        (isCreative || isValidator || isTrends || isPitch) && "pb-0 px-0"
                    )}>
                        {children}
                    </div>

                    <footer className={cn(
                        "w-full border-t border-white/5 pt-2 pb-4",
                        isRoadmap ? "bg-[#191919]" : "bg-black/20",
                        (isFinance || isStrategy || isPersona || isCreative || isValidator || isTrends || isPitch) ? "mt-0" : "mt-20"
                    )}>
                        <div className="max-w-6xl mx-auto flex flex-col items-center px-6">
                            <GradientMenu />
                        </div>
                    </footer>
                </main>
            </div>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<div className="h-screen bg-[#050505]" />}>
            <LayoutContent>{children}</LayoutContent>
        </Suspense>
    );
}

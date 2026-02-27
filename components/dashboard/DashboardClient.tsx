"use client";

import { GooeyText } from "@/components/ui/gooey-text-morphing";
import { RevealImageList } from "@/components/ui/reveal-images";
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";
import {
    Lightbulb,
    TrendingUp,
    BarChart3,
    Users,
    PenTool,
    Map,
    DollarSign,
    Briefcase
} from "lucide-react";

const dashboardModulesData = [
    { id: 1, title: "Idea Validator", date: "Phase 1", content: "Validate your startup ideas with AI-driven market analysis and feasibility checks.", category: "Validation", icon: Lightbulb, relatedIds: [2, 3], status: "pending" as const, energy: 0, href: "/dashboard/validator" },
    { id: 2, title: "Trend Hunter", date: "Phase 1", content: "Discover emerging market trends and viral topics before they peak.", category: "Validation", icon: TrendingUp, relatedIds: [1, 3], status: "pending" as const, energy: 0, href: "/dashboard/trends" },
    { id: 3, title: "Persona Tester", date: "Phase 1", content: "Simulate user interviews with AI personas to gather feedback.", category: "Validation", icon: Users, relatedIds: [1, 2], status: "pending" as const, energy: 0, href: "/dashboard/persona" },
    { id: 4, title: "Strategy Deck", date: "Phase 2", content: "Auto-generate SWOT analysis and tactical plans to outmaneuver competitors.", category: "Strategy", icon: BarChart3, relatedIds: [5], status: "pending" as const, energy: 0, href: "/dashboard/strategy" },
    { id: 5, title: "Roadmap Engine", date: "Phase 2", content: "Plan your product development with AI-suggested milestones and tasks.", category: "Strategy", icon: Map, relatedIds: [4], status: "pending" as const, energy: 0, href: "/dashboard/roadmap" },
    { id: 6, title: "Finance View", date: "Phase 3", content: "Monitor burn rate, runway, and financial health.", category: "Execution", icon: DollarSign, relatedIds: [7], status: "pending" as const, energy: 0, href: "/dashboard/finance" },
    { id: 7, title: "Creative Studio", date: "Phase 3", content: "Generate marketing assets, logos, and visuals.", category: "Execution", icon: PenTool, relatedIds: [6], status: "pending" as const, energy: 0, href: "/dashboard/creative" },
    { id: 8, title: "Pitch Deck", date: "Phase 4", content: "Create compelling pitch decks for investors.", category: "Fundraising", icon: Briefcase, relatedIds: [4, 6], status: "pending" as const, energy: 0, href: "/dashboard/pitch" }
];

export default function DashboardClient() {
    const handleServiceClick = (item: any) => {
        console.log(`[Realtime Action] Initializing ${item.title} module...`);
    };

    return (
        <div className="flex flex-col items-center justify-start w-full min-h-screen px-8 pt-4 pb-32 overflow-x-hidden relative">
            <div className="h-[100px] w-full flex items-center justify-center relative z-0">
                <GooeyText
                    texts={["Welcome", "to", "Monodesk"]}
                    morphTime={0.8}
                    cooldownTime={0.6}
                    className="font-bold text-white w-full max-w-lg select-none pointer-events-none"
                />
            </div>

            <div className="mt-2 text-center relative z-10 px-4 mb-4">
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 drop-shadow-sm font-sans uppercase">
                    All systems operational.
                </h2>
                <p className="text-xl md:text-3xl font-bold text-accent-purple mt-2 tracking-wide font-mono animate-pulse">
                    Ready to build.
                </p>
            </div>

            <div className="w-full max-w-4xl mx-auto mb-0 mt-16">
                <RevealImageList />
            </div>

            <div className="w-full max-w-5xl mx-auto mt-10">
                <RadialOrbitalTimeline
                    timelineData={dashboardModulesData}
                    onItemClick={handleServiceClick}
                />
            </div>
        </div>
    );
}

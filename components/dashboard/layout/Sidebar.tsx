"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Home,
    Lightbulb,
    TrendingUp,
    BarChart3,
    Map,
    Users,
    PenTool,
    Briefcase,
    DollarSign,
    ChevronLeft,
    ChevronRight,
    Menu
} from "lucide-react";

const MODULES = [
    { name: "Idea Validator", icon: Lightbulb, href: "/dashboard/validator" },
    { name: "Trend Hunter", icon: TrendingUp, href: "/dashboard/trends" },
    { name: "Persona Tester", icon: Users, href: "/dashboard/persona" },
    { name: "Strategy Deck", icon: BarChart3, href: "/dashboard/strategy" },
    { name: "Roadmap Engine", icon: Map, href: "/dashboard/roadmap" },
    { name: "Finance View", icon: DollarSign, href: "/dashboard/finance" },
    { name: "Creative Studio", icon: PenTool, href: "/dashboard/creative" },
    { name: "Pitch Deck", icon: Briefcase, href: "/dashboard/pitch" },
];

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (v: boolean) => void }) {
    const pathname = usePathname();

    return (
        <motion.aside
            animate={{ width: isOpen ? 280 : 80 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-screen bg-background border-r border-white/5 flex flex-col fixed left-0 top-0 z-40 overflow-hidden"
        >
            {/* Header / Logo */}
            <div className="p-6 flex items-center justify-between h-20">
                <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
                    {/* Placeholder for Custom Logo - User should replace public/logo.png */}
                    <div className="relative flex items-center justify-center bg-transparent p-0 m-0 border-none shadow-none shrink-0 w-10 h-10">
                        <img
                            src="/logo.png"
                            alt="Monodesk"
                            className="w-full h-full object-contain bg-transparent"
                        />
                    </div>

                    <motion.span
                        animate={{ opacity: isOpen ? 1 : 0 }}
                        className="font-bold text-lg tracking-wider whitespace-nowrap"
                    >
                        MONODESK
                    </motion.span>
                </Link>

                {/* Toggle Button */}
                {isOpen && (
                    <button onClick={() => setIsOpen(false)} className="text-white/30 hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">

                {/* Home */}
                <div>
                    <Link
                        href="/dashboard"
                        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${pathname === '/dashboard' ? 'bg-white/10 text-white font-medium' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                    >
                        <Home size={22} strokeWidth={pathname === '/dashboard' ? 2.5 : 2} />
                        <motion.span animate={{ opacity: isOpen ? 1 : 0, display: isOpen ? "block" : "none" }}>
                            Home
                        </motion.span>
                    </Link>
                </div>

                {/* Modules */}
                <div>
                    <motion.div
                        animate={{ opacity: isOpen ? 1 : 0 }}
                        className="text-white/20 text-xs font-bold uppercase tracking-widest px-4 mb-4 truncate"
                    >
                        Modules
                    </motion.div>

                    <div className="space-y-2">
                        {MODULES.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${pathname === item.href ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                            >
                                <item.icon size={22} className="group-hover:text-accent-cyan transition-colors" />
                                <motion.span
                                    animate={{ opacity: isOpen ? 1 : 0, display: isOpen ? "block" : "none" }}
                                    className="whitespace-nowrap"
                                >
                                    {item.name}
                                </motion.span>
                            </Link>
                        ))}
                    </div>
                </div>

            </nav>

            {!isOpen && (
                <div className="p-4 flex justify-center border-t border-white/5">
                    <button onClick={() => setIsOpen(true)} className="text-white/30 hover:text-white">
                        <Menu size={24} />
                    </button>
                </div>
            )}
        </motion.aside>
    );
}

"use client";

import { useState, useEffect } from "react";
import { Bell, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NotificationPopover } from "@/components/ui/specialized/notification-popover";
import ProjectSwitcher from "@/components/dashboard/layout/ProjectSwitcher";

export default function TopBar() {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    const pathname = usePathname();
    const isValidator = pathname === '/dashboard/validator';
    const isRoadmap = pathname === '/dashboard/roadmap';
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data.user);
        };
        getUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (!session) {
                // No session
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase.auth]);

    const handleSignOut = async () => {
        try {
            // 1. Dynamic imports to avoid SSR issues or circular dependencies
            const { useTaskStore } = await import("@/lib/store/useTaskStore");
            const { useProjectStore } = await import("@/lib/store/useProjectStore");
            const { useRoadmapStore } = await import("@/lib/store/useRoadmapStore");

            // 2. Reset all global stores
            useTaskStore.getState().reset();
            useProjectStore.getState().reset();
            useRoadmapStore.getState().reset();

            // 3. Clear all local/session storage
            localStorage.clear();
            sessionStorage.clear();

            // 4. Sign out from Supabase
            await supabase.auth.signOut();

            // 5. Force a hard redirect to login to completely dump memory
            window.location.href = "/login";
        } catch (error) {
            console.error("Sign out error:", error);
            // Fallback redirect
            window.location.href = "/login";
        }
    };

    return (
        <>
            {/* ===== DESKTOP TOPBAR — LOCKED, DO NOT TOUCH ===== */}
            <header className={cn(
                "hidden lg:flex h-16 items-center justify-between px-8 sticky top-0 z-100 border-b border-white/5 transition-all w-full",
                isRoadmap ? "bg-[#191919]/80 backdrop-blur-md" : isValidator ? "bg-transparent" : "bg-[#050505]/80 backdrop-blur-md"
            )}>
                <Link href="/dashboard" className="flex items-center gap-3 group cursor-pointer no-underline">
                    <img src="/logo.png" alt="MONODESK" className="w-12 h-12 object-contain transition-transform duration-500 group-hover:scale-110" />
                    <span className="text-base font-black tracking-[0.2em] text-white/90 group-hover:text-white transition-colors">MONODESK</span>
                </Link>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <ProjectSwitcher className="mr-2" />
                    <Link
                        href="/dashboard"
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-white/70 hover:text-white"
                        title="Dashboard Home"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    </Link>
                    <NotificationPopover />
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:scale-105 transition-transform overflow-hidden"
                        >
                            {user?.user_metadata?.avatar_url ? (
                                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={20} className="text-white" />
                            )}
                        </button>
                        <AnimatePresence>
                            {isProfileOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 top-14 w-64 bg-[#0A0A0C] border border-white/10 rounded-xl shadow-2xl p-2 z-50 text-white"
                                >
                                    <div className="px-4 py-3 border-b border-white/5 mb-2">
                                        <p className="text-sm font-bold truncate">{user?.user_metadata?.full_name || 'Founder'}</p>
                                        <p className="text-xs text-white/50 truncate" title={user?.email}>{user?.email || 'Guest'}</p>
                                    </div>
                                    <Link
                                        href="/profile"
                                        className="w-full text-left px-4 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white rounded-lg transition-colors flex items-center gap-2"
                                        onClick={() => setIsProfileOpen(false)}
                                    >
                                        <User size={16} /> Profile
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2 mt-1"
                                    >
                                        <LogOut size={16} /> Sign Out
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {/* ===== MOBILE TOPBAR — NEW, TOUCH-FRIENDLY ===== */}
            <header className={cn(
                "flex lg:hidden h-14 items-center justify-between px-4 sticky top-0 z-100 border-b border-white/5 w-full",
                isRoadmap ? "bg-[#191919]/90 backdrop-blur-md" : "bg-[#050505]/90 backdrop-blur-md"
            )}>
                {/* Left: Logo only (no text) */}
                <Link href="/dashboard" className="flex items-center shrink-0">
                    <img src="/logo.png" alt="MONODESK" className="w-9 h-9 object-contain" />
                </Link>

                {/* Right: Select Project + Profile */}
                <div className="flex items-center gap-2">
                    <ProjectSwitcher className="scale-90 origin-right" />

                    {/* Profile with dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden"
                        >
                            {user?.user_metadata?.avatar_url ? (
                                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={18} className="text-white" />
                            )}
                        </button>

                        <AnimatePresence>
                            {isProfileOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                    className="absolute right-0 top-12 w-56 bg-[#0A0A0C] border border-white/10 rounded-xl shadow-2xl p-2 z-200 text-white"
                                >
                                    <div className="px-4 py-3 border-b border-white/5 mb-2">
                                        <p className="text-sm font-bold truncate">{user?.user_metadata?.full_name || 'Founder'}</p>
                                        <p className="text-xs text-white/50 truncate">{user?.email || 'Guest'}</p>
                                    </div>
                                    {/* 1. Profile */}
                                    <Link
                                        href="/profile"
                                        className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white rounded-lg transition-colors flex items-center gap-3"
                                        onClick={() => setIsProfileOpen(false)}
                                    >
                                        <User size={15} className="text-white/50" />
                                        Profile
                                    </Link>
                                    {/* 2. Notifications */}
                                    <Link
                                        href="/dashboard/notifications"
                                        className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white rounded-lg transition-colors flex items-center gap-3"
                                        onClick={() => setIsProfileOpen(false)}
                                    >
                                        <Bell size={15} className="text-white/50" />
                                        Notifications
                                    </Link>
                                    {/* 3. Log Out */}
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-3 mt-1"
                                    >
                                        <LogOut size={15} />
                                        Log Out
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>
        </>
    );
}

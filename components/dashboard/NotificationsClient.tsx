"use client";

import { useState, useEffect } from "react";
import { Bell, ArrowLeft, CheckCircle2, Info, AlertTriangle, XCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    created_at: string;
    is_global: boolean;
    is_read?: boolean;
}

export default function NotificationsClient() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchAllNotifications = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) {
                setNotifications(data);
            }
            setIsLoading(false);
        };

        fetchAllNotifications();
    }, []);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="text-emerald-400" size={20} />;
            case 'warning': return <AlertTriangle className="text-amber-400" size={20} />;
            case 'error': return <XCircle className="text-red-400" size={20} />;
            default: return <Info className="text-blue-400" size={20} />;
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-white/70" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Notifications</h1>
                        <p className="text-sm text-white/40">Manage your system updates and activity history</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                        <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin mb-4" />
                        <p className="text-sm uppercase tracking-widest font-mono">Loading Archive...</p>
                    </div>
                ) : notifications.length > 0 ? (
                    notifications.map((notif) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={notif.id}
                            className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all group"
                        >
                            <div className="flex items-start gap-4">
                                <div className="mt-1 flex-shrink-0">
                                    {getTypeIcon(notif.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between gap-4 mb-2">
                                        <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">
                                            {notif.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-white/30 text-xs font-mono">
                                            <Clock size={12} />
                                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                        </div>
                                    </div>
                                    <p className="text-sm text-white/60 leading-relaxed mb-4">
                                        {notif.message}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        {notif.is_global && (
                                            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                                                Global Sync
                                            </span>
                                        )}
                                        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[10px] text-white/30 font-bold uppercase tracking-wider">
                                            ID: {notif.id.slice(0, 8)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="text-center py-20 rounded-3xl border-2 border-dashed border-white/5">
                        <Bell size={48} className="mx-auto mb-4 text-white/5" />
                        <h2 className="text-white font-bold opacity-40">Your archive is empty</h2>
                        <p className="text-sm text-white/20">System updates and greetings will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

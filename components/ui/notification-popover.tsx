"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, Clock, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export type Notification = {
    id: string;
    title: string;
    description: string;
    timestamp: Date;
    read: boolean;
    type: 'info' | 'success' | 'warning' | 'error';
};

interface NotificationItemProps {
    notification: Notification;
    index: number;
    onMarkAsRead: (id: string) => void;
    textColor?: string;
    hoverBgColor?: string;
    dotColor?: string;
}

const NotificationItem = ({
    notification,
    index,
    onMarkAsRead,
    textColor = "text-white",
    dotColor = "bg-blue-500",
    hoverBgColor = "hover:bg-white/[0.03]",
}: NotificationItemProps) => (
    <motion.div
        initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        key={notification.id}
        className={cn(`p-4 ${hoverBgColor} cursor-pointer transition-colors border-b border-white/5 last:border-0`)}
        onClick={() => onMarkAsRead(notification.id)}
    >
        <div className="flex justify-between items-start gap-4">
            <div className="flex items-center gap-2">
                {!notification.read && (
                    <span className={`h-1.5 w-1.5 rounded-full ${dotColor} shadow-[0_0_8px_rgba(59,130,246,0.5)]`} />
                )}
                <h4 className={cn(
                    "text-sm font-medium",
                    notification.type === 'info' && "text-blue-400",
                    notification.type === 'success' && "text-emerald-400",
                    notification.type === 'warning' && "text-amber-400",
                    notification.type === 'error' && "text-red-400"
                )}>
                    {notification.title}
                </h4>
            </div>

            <span className={`text-[10px] opacity-40 font-mono whitespace-nowrap flex items-center gap-1 ${textColor}`}>
                <Clock size={10} />
                {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
            </span>
        </div>
        <p className={`text-xs opacity-60 mt-1 leading-relaxed ${textColor}`}>
            {notification.description}
        </p>
    </motion.div>
);

interface NotificationListProps {
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    textColor?: string;
    hoverBgColor?: string;
    dividerColor?: string;
}

const NotificationList = ({
    notifications,
    onMarkAsRead,
    textColor,
    hoverBgColor,
    dividerColor = "divide-white/5",
}: NotificationListProps) => (
    <div className={cn("overflow-y-auto no-scrollbar max-h-[320px]")}>
        {notifications.length > 0 ? (
            notifications.map((notification, index) => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    index={index}
                    onMarkAsRead={onMarkAsRead}
                    textColor={textColor}
                    hoverBgColor={hoverBgColor}
                />
            ))
        ) : (
            <div className="py-12 text-center">
                <Bell size={24} className="mx-auto mb-2 text-white/10" />
                <p className="text-xs text-white/30 uppercase tracking-widest font-mono">No new alerts</p>
            </div>
        )}
    </div>
);

interface NotificationPopoverProps {
    buttonClassName?: string;
    popoverClassName?: string;
    textColor?: string;
    hoverBgColor?: string;
    dividerColor?: string;
    headerBorderColor?: string;
}

export const NotificationPopover = ({
    buttonClassName = "w-10 h-10 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-all",
    popoverClassName = "bg-[#0A0A0C] border border-white/10",
    textColor = "text-white",
    hoverBgColor = "hover:bg-white/[0.03]",
    dividerColor = "divide-white/5",
    headerBorderColor = "border-white/10",
}: NotificationPopoverProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (!error && data) {
                setNotifications(data.map(n => ({
                    id: n.id,
                    title: n.title,
                    description: n.message,
                    timestamp: new Date(n.created_at),
                    read: false, // In a real app, check against notification_reads
                    type: n.type
                })));
            }
        };

        fetchNotifications();

        const channel = supabase
            .channel('global-notifications')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                (payload) => {
                    const newNotif = payload.new;
                    const mappedNotif: Notification = {
                        id: newNotif.id,
                        title: newNotif.title,
                        description: newNotif.message,
                        timestamp: new Date(newNotif.created_at),
                        read: false,
                        type: newNotif.type
                    };
                    setNotifications((prev) => [mappedNotif, ...prev].slice(0, 10));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const toggleOpen = () => setIsOpen(!isOpen);

    const markAllAsRead = () => {
        const updatedNotifications = notifications.map((n) => ({
            ...n,
            read: true,
        }));
        setNotifications(updatedNotifications);
    };

    const markAsRead = (id: string) => {
        const updatedNotifications = notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
        );
        setNotifications(updatedNotifications);
    };

    return (
        <div className={`relative ${textColor}`} ref={dropdownRef}>
            <Button
                onClick={toggleOpen}
                variant="ghost"
                size="icon"
                className={cn("relative", buttonClassName)}
            >
                <Bell size={18} className={cn("transition-colors", unreadCount > 0 ? "text-blue-400" : "text-white/70")} />
                {unreadCount > 0 && (
                    <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#0A0A0C] animate-pulse" />
                )}
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                            "absolute right-0 mt-3 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden",
                            popoverClassName
                        )}
                    >
                        <div
                            className={`p-4 border-b ${headerBorderColor} bg-white/[0.02] flex justify-between items-center`}
                        >
                            <h3 className="text-sm font-bold">Notifications</h3>
                            <Button
                                onClick={markAllAsRead}
                                variant="ghost"
                                size="sm"
                                className={`text-[10px] uppercase tracking-widest font-mono h-7 px-2 ${hoverBgColor} text-white/40 hover:text-blue-400 transition-colors`}
                            >
                                Mark read
                            </Button>
                        </div>

                        <NotificationList
                            notifications={notifications}
                            onMarkAsRead={markAsRead}
                            textColor={textColor}
                            hoverBgColor={hoverBgColor}
                            dividerColor={dividerColor}
                        />

                        <div className="p-3 border-t border-white/5 bg-white/[0.01] grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setNotifications([])}
                                className="text-[10px] py-1 text-white/20 hover:text-white/40 transition-colors uppercase tracking-widest font-mono text-left"
                            >
                                Clear all
                            </button>
                            <Link
                                href="/dashboard/notifications"
                                onClick={() => setIsOpen(false)}
                                className="text-[10px] py-1 text-blue-400/40 hover:text-blue-400 transition-colors uppercase tracking-widest font-mono text-right flex items-center justify-end gap-1"
                            >
                                <History size={10} />
                                History
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

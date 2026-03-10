import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lightbulb, TrendingUp, BarChart3, Map, Users, PenTool, Briefcase, DollarSign } from 'lucide-react';
import { cn } from "@/lib/utils";

const menuItems = [
    { title: 'Idea Validator', icon: <Lightbulb />, href: '/dashboard/validator', gradientFrom: '#FF9966', gradientTo: '#FF5E62' },
    { title: 'Trend Hunter', icon: <TrendingUp />, href: '/dashboard/trends', gradientFrom: '#56CCF2', gradientTo: '#2F80ED' },
    { title: 'Persona Tester', icon: <Users />, href: '/dashboard/persona', gradientFrom: '#ffa9c6', gradientTo: '#f434e2' },
    { title: 'Strategy Deck', icon: <BarChart3 />, href: '/dashboard/strategy', gradientFrom: '#a955ff', gradientTo: '#ea51ff' },
    { title: 'Roadmap Engine', icon: <Map />, href: '/dashboard/roadmap', gradientFrom: '#80FF72', gradientTo: '#7EE8FA' },
    { title: 'Finance View', icon: <DollarSign />, href: '/dashboard/finance', gradientFrom: '#CAC531', gradientTo: '#F3F9A7' },
    { title: 'Creative Studio', icon: <PenTool />, href: '/dashboard/creative', gradientFrom: '#F2C94C', gradientTo: '#F2994A' },
    { title: 'Pitch Deck', icon: <Briefcase />, href: '/dashboard/pitch', gradientFrom: '#00b09b', gradientTo: '#96c93d' }
];

export default function GradientMenu({ nowrap }: { nowrap?: boolean } = {}) {
    const pathname = usePathname();

    // Filter out the active page from the menu
    const visibleItems = menuItems.filter(item => item.href !== pathname);

    return (
        <div className="relative w-full max-w-6xl transition-all duration-500">
            <ul className={cn("flex gap-4", nowrap ? "flex-nowrap justify-start" : "flex-wrap justify-center")}>
                {visibleItems.map(({ title, icon, href, gradientFrom, gradientTo }, idx) => (
                    <li
                        key={idx}
                        // @ts-ignore
                        style={{ '--gradient-from': gradientFrom, '--gradient-to': gradientTo }}
                        className="relative w-[60px] h-[60px] shrink-0 bg-white shadow-lg rounded-full flex items-center justify-center transition-all duration-500 hover:w-[200px] hover:shadow-none group cursor-pointer"
                    >
                        <Link href={href} className="flex items-center justify-center w-full h-full absolute inset-0 rounded-full z-20">
                            {/* Gradient background on hover moved to li but controlled via group-hover */}
                        </Link>

                        {/* Gradient background on hover */}
                        <span className="absolute inset-0 rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] opacity-0 transition-all duration-500 group-hover:opacity-100 pointer-events-none"></span>
                        {/* Blur glow */}
                        <span className="absolute top-[10px] inset-x-0 h-full rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] blur-[15px] opacity-0 -z-10 transition-all duration-500 group-hover:opacity-50 pointer-events-none"></span>

                        {/* Icon */}
                        <span className="relative z-10 transition-all duration-500 group-hover:scale-0 delay-0 pointer-events-none">
                            <span className="text-2xl text-gray-500">{icon}</span>
                        </span>

                        {/* Title */}
                        <span className="absolute text-white font-bold tracking-wide text-sm transition-all duration-500 scale-0 group-hover:scale-100 delay-150 whitespace-nowrap pointer-events-none z-30">
                            {title}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

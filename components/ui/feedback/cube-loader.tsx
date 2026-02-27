'use client'

import { cn } from "@/lib/utils";
import React from 'react'

interface CubeLoaderProps {
    title?: string;
    description?: string;
}

export default function CubeLoader({ title = "Loading", description = "Preparing your experience, please wait…" }: CubeLoaderProps) {
    return (
        <div className='flex flex-col items-center justify-center gap-12 p-12 min-h-[400px] bg-slate-950/0 perspective-container'>

            {/* 3D Scene Wrapper */}
            <div className='relative w-24 h-24 flex items-center justify-center preserve-3d'>

                {/* THE SPINNING CUBE CONTAINER */}
                <div className='relative w-full h-full preserve-3d animate-cube-spin'>

                    {/* Internal Core (The energy source) */}
                    <div className='absolute inset-0 m-auto w-8 h-8 bg-white rounded-full blur-md shadow-[0_0_40px_rgba(255,255,255,0.8)] animate-pulse-fast' />

                    {/* Front */}
                    <div className='side-wrapper front'>
                        <div className='face bg-cyan-500/10 border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' />
                    </div>

                    {/* Back */}
                    <div className='side-wrapper back'>
                        <div className='face bg-cyan-500/10 border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' />
                    </div>

                    {/* Right */}
                    <div className='side-wrapper right'>
                        <div className='face bg-purple-500/10 border-2 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]' />
                    </div>

                    {/* Left */}
                    <div className='side-wrapper left'>
                        <div className='face bg-purple-500/10 border-2 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]' />
                    </div>

                    {/* Top */}
                    <div className='side-wrapper top'>
                        <div className='face bg-indigo-500/10 border-2 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]' />
                    </div>

                    {/* Bottom */}
                    <div className='side-wrapper bottom'>
                        <div className='face bg-indigo-500/10 border-2 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]' />
                    </div>
                </div>

                {/* Floor Shadow (Scales with the breathing) */}
                <div className='absolute -bottom-20 w-24 h-8 bg-black/40 blur-xl rounded-[100%] animate-shadow-breathe' />
            </div>

            {/* Loading Text */}
            <div className='flex flex-col items-center gap-1 mt-2'>
                <h3 className='text-sm font-semibold tracking-[0.3em] text-cyan-300 uppercase'>
                    {title}
                </h3>
                <p className='text-xs text-slate-400'>
                    {description}
                </p>
            </div>

        </div>
    )
}

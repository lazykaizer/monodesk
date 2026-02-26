"use client";

import { Scroller } from "@/components/ui/scroller-1";

export default function HorizontalDemo() {
    return (
        <div className="w-full max-w-4xl mx-auto p-10 bg-black/20 rounded-3xl border border-white/5">
            <h2 className="text-xl font-bold text-white mb-6 font-mono tracking-widest uppercase">Scroller Performance Demo</h2>
            <Scroller height="300px" overflow="x" width="100%" withButtons>
                <div className="flex gap-6 min-w-[150%] px-4 py-10">
                    <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 h-64 w-64 rounded-2xl flex items-center justify-center">
                        <span className="text-cyan-400 font-mono text-4xl font-black">01</span>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 h-64 w-64 rounded-2xl flex items-center justify-center">
                        <span className="text-purple-400 font-mono text-4xl font-black">02</span>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 h-64 w-64 rounded-2xl flex items-center justify-center">
                        <span className="text-emerald-400 font-mono text-4xl font-black">03</span>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 h-64 w-64 rounded-2xl flex items-center justify-center">
                        <span className="text-amber-400 font-mono text-4xl font-black">04</span>
                    </div>
                    <div className="bg-gradient-to-br from-rose-500/20 to-red-500/20 border border-rose-500/20 h-64 w-64 rounded-2xl flex items-center justify-center">
                        <span className="text-rose-400 font-mono text-4xl font-black">05</span>
                    </div>
                </div>
            </Scroller>
        </div>
    );
}

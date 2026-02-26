export default function TrendsSkeleton() {
    return (
        <div className="w-full h-screen bg-[#020202] text-white flex flex-col overflow-hidden font-mono animate-pulse">
            {/* Top Bar Skeleton */}
            <header className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-[#050505]">
                <div className="flex items-center gap-4">
                    <div className="w-6 h-6 bg-white/5 rounded-sm" />
                    <div className="h-4 w-32 bg-white/5 rounded" />
                </div>
                <div className="flex items-center bg-[#080808] p-1 rounded-lg border border-white/5 h-8 w-40" />
                <div className="h-4 w-24 bg-white/5 rounded" />
            </header>

            {/* Main Content Skeleton */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col border-r border-white/5 bg-[#030303]">
                    <div className="p-4">
                        <div className="h-12 w-full bg-white/5 rounded-xl border border-white/10" />
                    </div>
                    <div className="flex-1 p-4 flex flex-col space-y-4">
                        <div className="h-64 bg-white/5 rounded-2xl border border-white/5" />
                        <div className="grid grid-cols-4 gap-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-16 bg-white/5 rounded-lg border border-white/5" />
                            ))}
                        </div>
                    </div>
                    <div className="h-24 border-t border-white/10 bg-[#060606] p-4 flex items-center gap-6">
                        <div className="w-16 h-16 rounded-full bg-white/5" />
                        <div className="flex-1 h-12 bg-white/5 rounded" />
                    </div>
                </div>

                {/* Right Sidebar Skeleton */}
                <div className="w-[380px] bg-[#050505] p-3 space-y-4">
                    <div className="h-48 bg-white/5 rounded-2xl border border-white/5" />
                    <div className="h-48 bg-white/5 rounded-2xl border border-white/5" />
                </div>
            </div>
        </div>
    );
}

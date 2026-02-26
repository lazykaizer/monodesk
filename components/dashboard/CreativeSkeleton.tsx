export default function CreativeSkeleton() {
    return (
        <div className="w-full h-screen bg-[#020202] text-white flex flex-col animate-pulse">
            {/* Header Skeleton */}
            <div className="h-16 border-b border-white/5 bg-[#050505] flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5" />
                    <div className="space-y-2">
                        <div className="h-4 w-32 bg-white/5 rounded" />
                        <div className="h-3 w-24 bg-white/5 rounded" />
                    </div>
                </div>
                <div className="h-4 w-24 bg-white/5 rounded" />
            </div>

            {/* Main Layout Skeleton */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar Skeleton */}
                <div className="w-60 bg-[#050505] border-r border-white/5 p-4 space-y-4">
                    <div className="h-4 w-24 bg-white/5 rounded mb-4" />
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-12 w-full bg-white/5 rounded-lg" />
                    ))}
                </div>

                {/* Center Display Skeleton */}
                <div className="flex-1 bg-[#030303] flex flex-col p-8 items-center justify-center">
                    <div className="w-full max-w-4xl aspect-video bg-white/5 rounded-2xl border border-white/5" />
                </div>

                {/* Right Sidebar (History) Skeleton */}
                <div className="w-80 bg-[#050505] border-l border-white/5 p-4 space-y-4">
                    <div className="h-4 w-32 bg-white/5 rounded mb-6" />
                    <div className="grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="aspect-square bg-white/5 rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Input Area Skeleton */}
            <div className="h-32 border-t border-white/5 bg-[#050505] p-6">
                <div className="max-w-4xl mx-auto h-16 bg-white/5 rounded-2xl" />
            </div>
        </div>
    );
}

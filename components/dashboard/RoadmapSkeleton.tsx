export default function RoadmapSkeleton() {
    return (
        <div className="min-h-screen bg-black text-white p-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-10">
                <div className="h-10 w-64 bg-white/5 rounded-xl" />
                <div className="flex items-center gap-4 flex-1 justify-end">
                    <div className="h-8 w-24 bg-white/5 rounded" />
                    <div className="h-10 w-48 bg-white/5 rounded-lg" />
                    <div className="h-10 w-32 bg-white/5 rounded-lg" />
                </div>
            </div>

            {/* Kanban Board Skeleton */}
            <div className="flex gap-6 overflow-x-hidden">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="min-w-[300px] flex-1">
                        {/* Column Header Skeleton */}
                        <div className="mb-4 h-12 bg-white/5 rounded-t-xl border-b border-white/10" />

                        {/* Task Cards Skeleton */}
                        <div className="bg-[#050505] p-2 rounded-b-xl min-h-[500px] space-y-3">
                            {[1, 2, 3].map((j) => (
                                <div key={j} className="h-32 bg-white/5 rounded-xl border border-white/5" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Progress Bar Skeleton */}
            <div className="mt-12 p-6 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center gap-6">
                <div className="h-4 w-48 bg-white/10 rounded" />
                <div className="w-full max-w-2xl h-2 bg-white/5 rounded-full" />
            </div>
        </div>
    );
}

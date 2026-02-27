export default function ValidatorSkeleton() {
    return (
        <div className="px-8 pb-20 pt-4 max-w-5xl mx-auto space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="text-center space-y-4">
                <div className="h-12 w-64 bg-white/5 rounded-xl mx-auto" />
                <div className="h-4 w-96 bg-white/5 rounded mx-auto" />
            </div>

            {/* Input Section Skeleton */}
            <div className="rounded-xl border border-white/5 bg-white/5 h-44 p-6 space-y-4">
                <div className="h-4 w-32 bg-white/10 rounded" />
                <div className="h-20 w-full bg-white/5 rounded-lg" />
                <div className="flex justify-end">
                    <div className="h-9 w-32 bg-white/10 rounded-md" />
                </div>
            </div>

            {/* Results Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-[400px] rounded-2xl bg-white/5 border border-white/5 p-6 space-y-6">
                        <div className="flex justify-between">
                            <div className="h-4 w-24 bg-white/10 rounded" />
                            <div className="h-6 w-6 bg-white/10 rounded" />
                        </div>
                        <div className="w-32 h-32 rounded-full bg-white/5 mx-auto" />
                        <div className="space-y-3">
                            <div className="h-4 w-full bg-white/5 rounded" />
                            <div className="h-4 w-3/4 bg-white/5 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

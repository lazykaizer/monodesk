export default function FinanceSkeleton() {
    return (
        <div className="p-8 space-y-8 animate-pulse bg-transparent">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-white/5 rounded-lg" />
                    <div className="h-4 w-64 bg-white/5 rounded-lg" />
                </div>
                <div className="h-10 w-32 bg-white/5 rounded-lg" />
            </div>

            {/* Metrics Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/5" />
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="h-[400px] bg-white/5 rounded-2xl border border-white/5" />
                    <div className="h-64 bg-white/5 rounded-2xl border border-white/5" />
                </div>
                <div className="space-y-8">
                    <div className="h-96 bg-white/5 rounded-2xl border border-white/5" />
                    <div className="h-64 bg-white/5 rounded-2xl border border-white/5" />
                </div>
            </div>
        </div>
    );
}

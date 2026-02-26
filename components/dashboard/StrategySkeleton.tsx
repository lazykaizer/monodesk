export default function StrategySkeleton() {
    return (
        <div className="min-h-screen bg-black text-white p-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-8">
                <div className="space-y-2">
                    <div className="h-10 w-64 bg-white/5 rounded-xl" />
                    <div className="h-4 w-48 bg-white/5 rounded" />
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-8 w-24 bg-white/5 rounded" />
                    <div className="h-10 w-48 bg-white/5 rounded-lg" />
                </div>
            </div>

            {/* Input Area Skeleton */}
            <div className="h-16 w-full max-w-4xl mx-auto bg-white/5 rounded-2xl mb-8 border border-white/10" />

            {/* SWOT Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-80 bg-white/5 rounded-2xl border border-white/5" />
                ))}
            </div>
        </div>
    );
}

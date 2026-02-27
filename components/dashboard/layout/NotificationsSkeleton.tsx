export default function NotificationsSkeleton() {
    return (
        <div className="p-8 max-w-4xl mx-auto animate-pulse">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5" />
                    <div className="space-y-2">
                        <div className="h-8 w-40 bg-white/5 rounded" />
                        <div className="h-4 w-64 bg-white/5 rounded" />
                    </div>
                </div>
            </div>

            {/* List Skeleton */}
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 h-32" />
                ))}
            </div>
        </div>
    );
}

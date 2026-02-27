export default function DashboardSkeleton() {
    return (
        <div className="flex flex-col items-center justify-start w-full min-h-screen px-8 pt-4 pb-32 animate-pulse">
            {/* Gooey Text Placeholder */}
            <div className="h-[100px] w-full flex items-center justify-center">
                <div className="h-10 w-64 bg-white/5 rounded-lg" />
            </div>

            {/* Title Placeholder */}
            <div className="mt-2 text-center space-y-4">
                <div className="h-12 w-80 bg-white/5 mx-auto rounded-lg" />
                <div className="h-8 w-48 bg-white/5 mx-auto rounded-lg" />
            </div>

            {/* List Placeholder */}
            <div className="w-full max-w-4xl mx-auto mt-16 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-20 w-full bg-white/5 rounded-xl border border-white/5" />
                ))}
            </div>

            {/* Timeline Placeholder */}
            <div className="w-full max-w-5xl mx-auto mt-10 h-64 bg-white/5 rounded-3xl" />
        </div>
    );
}

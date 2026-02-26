export default function PersonaSkeleton() {
    return (
        <div className="flex h-screen w-full bg-black text-white overflow-hidden animate-pulse">
            {/* Persona Manager Skeleton (Left Sidebar) */}
            <div className="w-80 border-r border-white/5 flex flex-col bg-[#050505]">
                <div className="p-4 border-b border-white/5 h-16 bg-white/5" />
                <div className="flex-1 p-3 space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-20 bg-white/5 rounded-xl border border-white/5" />
                    ))}
                </div>
            </div>

            {/* Input Area Skeleton (Center) */}
            <div className="flex-1 flex flex-col p-6 bg-[#020202]">
                <div className="flex justify-between items-center mb-6">
                    <div className="space-y-2">
                        <div className="h-6 w-32 bg-white/5 rounded" />
                        <div className="h-4 w-48 bg-white/5 rounded" />
                    </div>
                    <div className="h-10 w-32 bg-white/5 rounded-lg" />
                </div>
                <div className="flex-1 bg-[#080808] border border-white/5 rounded-xl" />
            </div>

            {/* Live Feedback Skeleton (Right Sidebar) */}
            <div className="w-[450px] border-l border-white/5 bg-[#050505] flex flex-col">
                <div className="p-4 border-b border-white/5 h-16 bg-[#080808]" />
                <div className="flex-1 p-6 space-y-6">
                    <div className="h-40 bg-white/5 rounded-2xl" />
                    <div className="h-40 bg-white/5 rounded-2xl" />
                </div>
            </div>
        </div>
    );
}

import Link from "next/link";
import { ChevronLeft, Shield, Scale, Zap, Globe, Lock } from "lucide-react";

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-black text-zinc-400 font-sans selection:bg-blue-500/30">
            {/* Background Grain/Glow */}
            <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#27272a_1px,transparent_1px)] bg-[size:20px_20px]" />
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-600/[0.05] blur-[120px] pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
                {/* Header */}
                <div className="mb-16 space-y-6">
                    <Link
                        href="/"
                        className="group inline-flex items-center gap-2 text-[10px] font-mono tracking-widest text-zinc-600 hover:text-white transition-colors uppercase font-black"
                    >
                        <ChevronLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
                        Return to Alpha 0.1
                    </Link>

                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-blue-500">
                            <Shield size={20} />
                            <span className="text-[10px] font-mono font-black tracking-[0.5em] uppercase italic">Protocol: Legal</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter">Terms of Synthesis.</h1>
                        <p className="text-lg text-zinc-500 font-medium">Last Synchronized: March 10, 2026. Version 1.2.0-STABLE</p>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="space-y-16">
                    {/* 01. Acceptance */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-white font-mono text-xs font-black">01</div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Access Protocol</h2>
                        </div>
                        <div className="pl-12 space-y-4 leading-relaxed">
                            <p>
                                By initializing a session on the Monodesk platform, you acknowledge and agree to be bound by the <span className="text-zinc-200">Neural Infrastructure Access Protocol</span>. Our services represent a high-latency cognitive workspace designed for elite founders. Use of this platform constitutes unconditional acceptance of these terms.
                            </p>
                        </div>
                    </section>

                    {/* 02. Neural Credits */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-white font-mono text-xs font-black">02</div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Compute Resources & Fair Use</h2>
                        </div>
                        <div className="pl-12 space-y-4 leading-relaxed">
                            <p>
                                Monodesk grants users access to distributed GPU clusters for visual synthesis (Creative Studio) and cognitive mapping (Strategic Engine).
                            </p>
                            <ul className="space-y-3 list-none">
                                {[
                                    "Neural credits are non-transferable and reset every 30-day cycle.",
                                    "Automated scraping or bot-driven resource exhaustion is strictly prohibited.",
                                    "Synthetic assets generated via Monodesk are subject to the Alpha License (Section 04)."
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-3 items-start group">
                                        <Zap size={14} className="text-blue-500 shrink-0 mt-1 opacity-50 group-hover:opacity-100 transition-opacity" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    {/* 03. User Identity */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-white font-mono text-xs font-black">03</div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Identity & Security</h2>
                        </div>
                        <div className="pl-12 space-y-4 leading-relaxed">
                            <p>
                                You are solely responsible for maintaining the integrity of your <span className="text-blue-400">Auth-Signature</span>. Any operations executed under your signature are deemed to be your unique intent. If you suspect a breach in your cognitive perimeter, notify Monodesk Labs immediately.
                            </p>
                        </div>
                    </section>

                    {/* 04. Ownership */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-white font-mono text-xs font-black">04</div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Intellectual Synthesis</h2>
                        </div>
                        <div className="pl-12 space-y-4 leading-relaxed">
                            <p>
                                While you retain full commercial rights to the <span className="text-zinc-200">outputs</span> (Strategy Reports, Design Assets), Monodesk retains all proprietary rights to the <span className="text-zinc-200">Neural Architecture</span>, latent space weights, and underlying workflow logic used to generate said outputs.
                            </p>
                        </div>
                    </section>

                    {/* 05. Liability */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-white font-mono text-xs font-black">05</div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Limit of Cognitive Liability</h2>
                        </div>
                        <div className="pl-12 space-y-4 leading-relaxed p-6 rounded-2xl border border-white/[0.03] bg-white/[0.01]">
                            <p className="italic">
                                NOTE: Monodesk provides strategic insights via proprietary AI models. We do not guarantee market success, funding, or product-market fit. We are the tool, you are the pilot.
                            </p>
                        </div>
                    </section>
                </div>

                {/* Footer Legal */}
                <div className="mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-mono uppercase tracking-[0.3em] font-black text-zinc-700">
                    <div className="flex items-center gap-3">
                        <Lock size={12} className="text-zinc-800" />
                        Encrypted Connection: SHA-256 Verified
                    </div>
                    <div className="flex gap-8">
                        <Link href="/legal/privacy" className="hover:text-blue-500 transition-colors">Privacy Shield</Link>
                        <span className="text-zinc-900">|</span>
                        <Link href="/contact" className="hover:text-blue-500 transition-colors">Labs Terminal</Link>
                    </div>
                </div>
            </div>
        </main>
    );
}

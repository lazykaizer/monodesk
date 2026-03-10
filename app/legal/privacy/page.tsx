import Link from "next/link";
import { ChevronLeft, Lock, Eye, Database, ShieldCheck, HardDrive, Trash2, Globe } from "lucide-react";

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-black text-zinc-400 font-sans selection:bg-emerald-500/30">
            {/* Background Grain/Glow */}
            <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#27272a_1px,transparent_1px)] bg-[size:20px_20px]" />
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-emerald-600/[0.05] blur-[120px] pointer-events-none" />

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
                        <div className="flex items-center gap-3 text-emerald-500">
                            <Lock size={20} />
                            <span className="text-[10px] font-mono font-black tracking-[0.5em] uppercase italic">Protocol: Security</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter">Data Privacy.</h1>
                        <p className="text-lg text-zinc-500 font-medium">Encryption Standard: AES-256-GCM. Version 1.0.1-SECURE</p>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="space-y-16">
                    {/* 01. Collection */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-white font-mono text-xs font-black">01</div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Data Ingress</h2>
                        </div>
                        <div className="pl-12 space-y-4 leading-relaxed">
                            <p>
                                We collect minimal identity objects required for system authentication. When you connect via <span className="text-zinc-200">OAuth 2.0</span> (Google/GitHub), we only store your unique ID, email, and localized display metadata.
                            </p>
                            <p className="text-[10px] font-mono text-emerald-500/50 uppercase tracking-widest italic">
                                Summary: Hum wahi data lete hain jo app chalane ke liye zaroori hai.
                            </p>
                        </div>
                    </section>

                    {/* 02. ISOLATION */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-white font-mono text-xs font-black">02</div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Financial Isolation</h2>
                        </div>
                        <div className="pl-12 space-y-4 leading-relaxed">
                            <p>
                                Payment infrastructure is offloaded via <span className="text-blue-500">Stripe encrypted tunnels</span>. Monodesk never receives, processes, or stores raw financial telemetry.
                            </p>
                            <div className="flex gap-4 pt-2">
                                <div className="p-3 rounded-xl border border-white/5 bg-white/[0.01] flex items-center gap-2">
                                    <ShieldCheck size={14} className="text-emerald-500" />
                                    <span className="text-[9px] font-mono uppercase tracking-widest">PCI-DSS Compliant</span>
                                </div>
                                <div className="p-3 rounded-xl border border-white/5 bg-white/[0.01] flex items-center gap-2">
                                    <Database size={14} className="text-zinc-500" />
                                    <span className="text-[9px] font-mono uppercase tracking-widest">Stripe Vault Only</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 03. AI EPHEMERALITY */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-white font-mono text-xs font-black">03</div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">AI Ephemerality</h2>
                        </div>
                        <div className="pl-12 space-y-4 leading-relaxed">
                            <p>
                                Your strategic inputs and startup intelligence are proprietary to your tenant. We enforce <span className="text-zinc-200">Zero-Training policies</span>: your inputs are never used to train public LLM weights.
                            </p>
                        </div>
                    </section>

                    {/* 04. ENCRYPTION */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-white font-mono text-xs font-black">04</div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">System Hardening</h2>
                        </div>
                        <div className="pl-12 space-y-4 leading-relaxed">
                            {[
                                { icon: <HardDrive size={12} />, text: "Data-at-rest: AES-256 military-grade encryption." },
                                { icon: <Globe size={12} />, text: "Data-in-transit: TLS 1.3 encrypted handshakes." },
                                { icon: <Lock size={12} />, text: "RLS: Row Level Security enforced at the core engine." }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="text-emerald-500/50">{item.icon}</div>
                                    <span className="text-xs">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 05. TERMINATION */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-white font-mono text-xs font-black">05</div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Wipe Protocol</h2>
                        </div>
                        <div className="pl-12 space-y-4 leading-relaxed">
                            <p>
                                Account termination triggers a <span className="text-rose-500">Cascade Clear</span> command. All records, synthetic assets, and telemetry linked to your signature are purged within 24 hours.
                            </p>
                            <p className="text-[10px] font-mono text-rose-500/50 uppercase tracking-widest italic flex items-center gap-2">
                                <Trash2 size={10} /> Summary: Jab aap account delete karte hain, hum sab kuch wipe kar dete hain.
                            </p>
                        </div>
                    </section>
                </div>

                {/* Footer Legal */}
                <div className="mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-mono uppercase tracking-[0.3em] font-black text-zinc-700">
                    <div className="flex items-center gap-3">
                        <Eye size={12} className="text-zinc-800" />
                        Transparency: Total
                    </div>
                    <div className="flex gap-8">
                        <Link href="/legal/terms" className="hover:text-emerald-500 transition-colors">Usage Terms</Link>
                        <span className="text-zinc-900">|</span>
                        <Link href="/contact" className="hover:text-emerald-500 transition-colors">Support Trace</Link>
                    </div>
                </div>
            </div>
        </main>
    );
}

"use client";

import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowLeft, BarChart3 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen w-full flex items-center justify-center bg-[#050505]">
                <Loader2 className="text-orange-500 animate-spin" size={40} />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}

function LoginContent() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();
    const searchParams = useSearchParams();
    const verified = searchParams.get("verified");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) throw signInError;

            router.refresh();
            router.push("/dashboard");

        } catch (err: any) {
            if (err.message === "Invalid login credentials") {
                setError("Invalid email or password. Please try again.");
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOAuth = async (provider: 'google' | 'github') => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${location.origin}/auth/callback`,
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-[#050505] text-white font-sans selection:bg-orange-500/30 overflow-hidden relative">

            {/* MOBILE BACKGROUND GLOW */}
            <div className="lg:hidden absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-[#FF5C00]/[0.07] rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[250px] h-[250px] bg-[#FF5C00]/[0.04] rounded-full blur-[90px]" />
            </div>

            {/* BRANDING HEADER */}
            <div className="absolute top-8 left-8 z-50">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative flex items-center justify-center bg-transparent p-0 m-0 border-none shadow-none w-10 h-10">
                        <img
                            src="/images/logo.png"
                            alt="Monodesk Logo"
                            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 bg-transparent"
                        />
                    </div>
                    <span className="text-xl font-black tracking-tighter text-white">MONODESK</span>
                </Link>
            </div>

            {/* LEFT PANEL: AUTH FORM (Synced with Signup Style) */}
            <div className="flex flex-col items-center justify-start pt-24 lg:pt-32 p-8 lg:px-20 relative z-10">
                <div className="w-full max-w-md p-8 lg:p-10 rounded-[32px] bg-white/[0.01] max-lg:bg-white/[0.03] border border-white/[0.05] max-lg:border-orange-500/[0.15] backdrop-blur-3xl shadow-2xl max-lg:shadow-[0_0_80px_rgba(255,92,0,0.08)] relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/[0.02] via-transparent to-blue-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="lg:hidden absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />

                    <div className="relative z-10 w-full">
                        <div className="mb-10 text-center lg:text-left">
                            <h1 className="text-4xl font-black mb-4 tracking-tight">Welcome back</h1>
                            <p className="text-white/40 max-lg:text-white/60 text-sm font-medium leading-relaxed">
                                Enter your credentials to access your Monodesk workspace.
                            </p>
                        </div>

                        {(verified || searchParams.get("reset")) && (
                            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-500">
                                <CheckCircle2 size={18} />
                                <p className="text-xs font-bold uppercase tracking-wider">Access granted.</p>
                            </div>
                        )}
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500">
                                <AlertCircle size={18} />
                                <p className="text-xs font-bold uppercase tracking-wider">{error}</p>
                            </div>
                        )}

                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <button type="button" onClick={() => handleOAuth('google')} className="flex items-center justify-center gap-3 bg-white/[0.03] max-lg:bg-white/[0.06] border border-white/5 max-lg:border-white/[0.12] hover:border-orange-500/30 hover:bg-orange-500/[0.02] h-12 rounded-xl transition-all duration-500 group px-4">
                                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-500" viewBox="0 0 48 48">
                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                                    </svg>
                                    <span className="text-sm font-black tracking-widest uppercase text-white/50 max-lg:text-white/70 group-hover:text-white transition-colors duration-500">Google</span>
                                </button>
                                <button type="button" onClick={() => handleOAuth('github')} className="flex items-center justify-center gap-3 bg-white/[0.03] max-lg:bg-white/[0.06] border border-white/5 max-lg:border-white/[0.12] hover:border-orange-500/30 hover:bg-orange-500/[0.02] h-12 rounded-xl transition-all duration-500 group px-4">
                                    <svg className="w-5 h-5 fill-white group-hover:scale-110 transition-transform duration-500" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.372.79 1.103.79 2.222v3.293c0 .317.22.694.825.576C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    <span className="text-sm font-black tracking-widest uppercase text-white/50 max-lg:text-white/70 group-hover:text-white transition-colors duration-500">GitHub</span>
                                </button>
                            </div>

                            <div className="flex items-center gap-4 py-0">
                                <div className="h-[1px] flex-1 bg-white/[0.05]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/10 max-lg:text-white/30 shrink-0">or continue with</span>
                                <div className="h-[1px] flex-1 bg-white/[0.05]" />
                            </div>

                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black tracking-[0.2em] text-white/20 max-lg:text-white/50 uppercase ml-1">Email</label>
                                    <div className="relative group/input">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-orange-500 transition-all duration-500 group-focus-within/input:scale-110" size={18} />
                                        <input type="email" placeholder="founder@startup.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-white/[0.01] max-lg:bg-white/[0.04] border border-white/[0.05] max-lg:border-white/[0.15] group-hover/input:border-white/10 max-lg:group-hover/input:border-orange-500/30 rounded-2xl py-4 pl-14 pr-4 text-white placeholder:text-white/10 max-lg:placeholder:text-white/25 focus:outline-none focus:border-orange-500/50 focus:bg-orange-500/[0.02] transition-all duration-500 ring-0 focus:ring-4 focus:ring-orange-500/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-[10px] font-black tracking-[0.2em] text-white/20 max-lg:text-white/50 uppercase ml-1">Password</label>
                                            <Link href="/forgot-password" className="text-[10px] font-black uppercase tracking-widest text-orange-500/50 hover:text-orange-500 transition-colors">Forgot?</Link>
                                        </div>
                                        <div className="relative group/input">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-orange-500 transition-all duration-500 group-focus-within/input:scale-110" size={18} />
                                            <input type={showPassword ? "text" : "password"} placeholder="••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-white/[0.01] max-lg:bg-white/[0.04] border border-white/[0.05] max-lg:border-white/[0.15] group-hover/input:border-white/10 max-lg:group-hover/input:border-orange-500/30 rounded-2xl py-4 pl-14 pr-14 text-white placeholder:text-white/10 max-lg:placeholder:text-white/25 focus:outline-none focus:border-orange-500/50 focus:bg-orange-500/[0.02] transition-all duration-500 ring-0 focus:ring-4 focus:ring-orange-500/10" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 hover:text-white/40 transition-all duration-500">
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-2">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input type="checkbox" className="w-4 h-4 rounded-sm border-white/10 bg-white/5 checked:bg-[#FF5C00] transition-colors accent-[#FF5C00]" />
                                            <span className="text-[11px] text-white/20 max-lg:text-white/40 group-hover:text-white/40 transition-colors font-bold uppercase tracking-widest">Remember me</span>
                                        </label>
                                    </div>

                                    <button type="submit" disabled={loading} className="w-full h-14 bg-[#FF5C00] hover:bg-[#FF6D1A] text-white font-black text-lg rounded-2xl shadow-[0_0_30px_rgba(255,92,0,0.1)] hover:shadow-[0_0_50px_rgba(255,92,0,0.4)] transition-all duration-500 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center relative overflow-hidden group/btn">
                                        <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[45deg] pointer-events-none" />
                                        {loading ? <Loader2 className="animate-spin" size={24} /> : (
                                            <div className="flex items-center gap-3">
                                                <span>Sign In</span>
                                                <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                                    <ArrowLeft className="rotate-180" size={20} />
                                                </motion.div>
                                            </div>
                                        )}
                                    </button>

                                    <div className="text-center">
                                        <p className="text-xs font-bold text-white/20 max-lg:text-white/40">
                                            Don't have an account? <Link href="/signup" className="text-orange-500 hover:text-orange-400 transition-colors ml-1">Sign up</Link>
                                        </p>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: STRATEGY DECK SHOWCASE */}
            <div className="hidden lg:flex flex-col justify-center items-center relative overflow-hidden bg-[#080808]">
                {/* Dynamic Liquid Atmos */}
                <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                        animate={{
                            scale: [1, 1.4, 1],
                            rotate: [0, 90, 0],
                            x: [0, -100, 0],
                            y: [0, 60, 0]
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-[10%] -left-[10%] w-[900px] h-[900px] bg-[#FF5C00]/[0.06] rounded-full blur-[140px]"
                    />
                    <motion.div
                        animate={{
                            scale: [1.4, 1, 1.4],
                            rotate: [0, -90, 0],
                            x: [0, 100, 0],
                            y: [0, -60, 0]
                        }}
                        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                        className="absolute -bottom-[20%] -right-[10%] w-[700px] h-[700px] bg-blue-500/[0.06] rounded-full blur-[120px]"
                    />
                </div>

                <div className="relative z-10 w-full flex flex-col items-center">
                    {/* STRATEGY CARD */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-[440px] bg-[#121212] border border-white/5 rounded-[24px] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)]"
                    >
                        {/* Prismatic Scanning Line */}
                        <motion.div
                            animate={{
                                top: ["-5%", "105%"],
                                opacity: [0, 0.4, 0]
                            }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent z-10"
                        />

                        {/* Card Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#FF5C00]/10 rounded flex items-center justify-center">
                                    <BarChart3 className="text-[#FF5C00]" size={18} />
                                </div>
                                <span className="text-sm font-black uppercase tracking-widest">Strategy Deck</span>
                            </div>
                            <div className="px-2.5 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-full flex items-center gap-2 group/status">
                                <motion.div
                                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                />
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                            </div>
                        </div>

                        {/* Card SWOT Content */}
                        <div className="p-6 grid grid-cols-2 gap-4 relative z-10">
                            {[
                                { label: "Strengths", color: "emerald", width: "85%" },
                                { label: "Weaknesses", color: "red", width: "65%" },
                                { label: "Opportunities", color: "blue", width: "95%" },
                                { label: "Threats", color: "yellow", width: "75%" }
                            ].map((item, idx) => (
                                <motion.div
                                    key={item.label}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 * idx }}
                                    className="bg-[#1a1a1a]/60 border border-white/5 rounded-xl p-4 space-y-3 relative overflow-hidden group/swot"
                                >
                                    {/* PERSISTENT pulsing background glow */}
                                    <motion.div
                                        animate={{
                                            opacity: [0.03, 0.08, 0.03],
                                            scale: [1, 1.2, 1]
                                        }}
                                        transition={{ duration: 4, repeat: Infinity, delay: idx * 0.5 }}
                                        className={`absolute -top-10 -right-10 w-24 h-24 blur-[40px] pointer-events-none ${item.color === 'emerald' ? 'bg-emerald-500' :
                                            item.color === 'red' ? 'bg-red-500' :
                                                item.color === 'blue' ? 'bg-blue-500' : 'bg-yellow-500'
                                            }`}
                                    />

                                    <div className="flex items-center gap-2 relative z-10">
                                        <motion.div
                                            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                                            className={`w-1.5 h-1.5 rounded-full ${item.color === 'emerald' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                                item.color === 'red' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                                    item.color === 'blue' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]'
                                                }`}
                                        />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${item.color === 'emerald' ? 'text-emerald-500' :
                                            item.color === 'red' ? 'text-red-500' :
                                                item.color === 'blue' ? 'text-blue-500' : 'text-yellow-500'
                                            }`}>{item.label}</span>
                                    </div>
                                    <div className="space-y-2 relative z-10">
                                        {/* Bar 1: Primary Metric */}
                                        <div className="w-full h-1.5 bg-white/[0.03] rounded-full overflow-hidden relative">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{
                                                    width: "100%",
                                                    opacity: [0.3, 0.45, 0.3]
                                                }}
                                                transition={{
                                                    width: { duration: 1.5, delay: idx * 0.2 },
                                                    opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                                                }}
                                                className={`h-full relative ${item.color === 'emerald' ? 'bg-emerald-500' :
                                                    item.color === 'red' ? 'bg-red-500' :
                                                        item.color === 'blue' ? 'bg-blue-500' : 'bg-yellow-500'
                                                    }`}
                                            >
                                                <motion.div
                                                    animate={{ x: ["-100%", "200%"] }}
                                                    transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: idx * 0.1 }}
                                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                                />
                                            </motion.div>
                                        </div>
                                        {/* Bar 2: Secondary Metric (The specific ones shown in user image) */}
                                        <div className="h-1.5 bg-white/[0.03] rounded-full overflow-hidden relative" style={{ width: item.width }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{
                                                    width: "100%",
                                                    opacity: [0.4, 0.6, 0.4],
                                                    filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"]
                                                }}
                                                transition={{
                                                    width: { duration: 1.8, delay: idx * 0.3 },
                                                    opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                                                    filter: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                                                }}
                                                className={`h-full relative ${item.color === 'emerald' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' :
                                                    item.color === 'red' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' :
                                                        item.color === 'blue' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                                                    }`}
                                            >
                                                <motion.div
                                                    animate={{ x: ["-100%", "200%"] }}
                                                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: idx * 0.2 }}
                                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                                                />
                                            </motion.div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Footer Section */}
                    <div className="mt-12 text-center relative z-10">
                        <h2 className="text-3xl font-black text-white tracking-tight mb-4 leading-none">
                            Instant Market Intelligence
                        </h2>

                        <p className="text-sm text-white/30 font-medium leading-relaxed max-w-sm mx-auto">
                            Monodesk transforms your raw notes into comprehensive SWOT analysis grids in seconds using advanced AI models.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

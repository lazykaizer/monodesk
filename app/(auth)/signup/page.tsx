"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Check, TrendingUp, Target, Loader2, AlertCircle, ArrowLeft, Zap, Cpu, Search, CheckCircle2, MoreHorizontal, Flame, LineChart, BarChart3 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignupPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [otp, setOtp] = useState("");
    const router = useRouter();
    const supabase = createClient();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                    emailRedirectTo: `${location.origin}/auth/callback`,
                },
            });

            if (signUpError) throw signUpError;
            setVerifying(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'signup'
            });
            if (error) throw error;
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message);
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

            {/* LEFT PANEL: AUTH FORM */}
            <div className="flex flex-col items-center justify-start pt-24 lg:pt-32 p-8 lg:px-20 relative z-10">

                <div className="w-full max-w-md p-8 lg:p-10 rounded-[32px] bg-white/[0.01] border border-white/[0.05] backdrop-blur-3xl shadow-2xl relative group overflow-hidden">
                    {/* Background glow */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/[0.02] via-transparent to-blue-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <div className="relative z-10 w-full">
                        {/* Header */}
                        <div className="mb-10 text-center lg:text-left">
                            <h1 className="text-4xl font-black mb-4 tracking-tight">Get started</h1>
                            <p className="text-white/40 text-sm font-medium leading-relaxed">
                                The all-in-one workspace for turning ideas into products.
                            </p>
                        </div>

                        {/* Status Messages */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-500">
                                <AlertCircle size={18} />
                                <p className="text-xs font-bold uppercase tracking-wider">{error}</p>
                            </div>
                        )}

                        {verifying ? (
                            <div className="space-y-6">
                                <div className="text-center p-4">
                                    <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                        <Lock className="text-orange-500 animate-pulse" size={32} />
                                    </div>
                                    <h2 className="text-xl font-bold mb-2">Verify your email</h2>
                                    <p className="text-white/40 text-sm mb-6">Enter the 6-digit code sent to <span className="text-white">{email}</span></p>

                                    <form onSubmit={handleVerify} className="space-y-4">
                                        <div className="relative group/input">
                                            <input
                                                type="text"
                                                maxLength={6}
                                                placeholder="000000"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                required
                                                className="w-full bg-white/[0.01] border border-white/[0.05] group-hover/input:border-white/10 rounded-2xl py-4 text-center text-2xl font-black tracking-[0.5em] text-white placeholder:text-white/10 focus:outline-none focus:border-orange-500/50 focus:bg-orange-500/[0.02] transition-all duration-500 ring-0 focus:ring-4 focus:ring-orange-500/10"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full h-14 bg-[#FF5C00] hover:bg-[#FF6D1A] text-white font-black text-lg rounded-2xl transition-all duration-500 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
                                        >
                                            {loading ? <Loader2 className="animate-spin" size={24} /> : "Verify Code"}
                                        </button>
                                    </form>

                                    <div className="mt-8">
                                        <button onClick={() => setVerifying(false)} className="text-orange-500 text-[10px] font-black uppercase tracking-widest hover:text-orange-400">Try another email</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-5">

                                {/* Social Auth at TOP */}
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => handleOAuth('google')}
                                        className="flex items-center justify-center gap-3 bg-white/[0.03] border border-white/5 hover:border-orange-500/30 hover:bg-orange-500/[0.02] h-12 rounded-xl transition-all duration-500 group px-4"
                                    >
                                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-500" viewBox="0 0 48 48">
                                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                                        </svg>
                                        <span className="text-sm font-black tracking-widest uppercase text-white/50 group-hover:text-white transition-colors duration-500">Google</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleOAuth('github')}
                                        className="flex items-center justify-center gap-3 bg-white/[0.03] border border-white/5 hover:border-orange-500/30 hover:bg-orange-500/[0.02] h-12 rounded-xl transition-all duration-500 group px-4"
                                    >
                                        <svg className="w-5 h-5 fill-white group-hover:scale-110 transition-transform duration-500" viewBox="0 0 24 24">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.372.79 1.103.79 2.222v3.293c0 .317.22.694.825.576C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12z" />
                                        </svg>
                                        <span className="text-sm font-black tracking-widest uppercase text-white/50 group-hover:text-white transition-colors duration-500">GitHub</span>
                                    </button>
                                </div>

                                <div className="flex items-center gap-4 py-0">
                                    <div className="h-[1px] flex-1 bg-white/[0.05]" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/10 shrink-0">or continue with</span>
                                    <div className="h-[1px] flex-1 bg-white/[0.05]" />
                                </div>

                                <form onSubmit={handleSignUp} className="space-y-4">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black tracking-[0.2em] text-white/20 uppercase ml-1">Full Name</label>
                                            <div className="relative group/input">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-orange-500 transition-all duration-500 group-focus-within/input:scale-110" size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="Kaizer D'souza"
                                                    value={fullName}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const sanitized = val.replace(/[^a-zA-Z\s']/g, "");
                                                        setFullName(sanitized);
                                                    }}
                                                    required
                                                    className="w-full bg-white/[0.01] border border-white/[0.05] group-hover/input:border-white/10 rounded-2xl py-4 pl-14 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:border-orange-500/50 focus:bg-orange-500/[0.02] transition-all duration-500 ring-0 focus:ring-4 focus:ring-orange-500/10"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black tracking-[0.2em] text-white/20 uppercase ml-1">Email</label>
                                            <div className="relative group/input">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-orange-500 transition-all duration-500 group-focus-within/input:scale-110" size={18} />
                                                <input
                                                    type="email"
                                                    placeholder="founder@startup.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    className="w-full bg-white/[0.01] border border-white/[0.05] group-hover/input:border-white/10 rounded-2xl py-4 pl-14 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:border-orange-500/50 focus:bg-orange-500/[0.02] transition-all duration-500 ring-0 focus:ring-4 focus:ring-orange-500/10"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black tracking-[0.2em] text-white/20 uppercase ml-1">Password</label>
                                            <div className="relative group/input">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-orange-500 transition-all duration-500 group-focus-within/input:scale-110" size={18} />
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••••••"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                    minLength={10}
                                                    className="w-full bg-white/[0.01] border border-white/[0.05] group-hover/input:border-white/10 rounded-2xl py-4 pl-14 pr-14 text-white placeholder:text-white/10 focus:outline-none focus:border-orange-500/50 focus:bg-orange-500/[0.02] transition-all duration-500 ring-0 focus:ring-4 focus:ring-orange-500/10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 hover:text-white/40 transition-all duration-500"
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                            <AnimatePresence>
                                                {password.length > 0 && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        className="grid grid-cols-2 gap-2 mt-3 px-1"
                                                    >
                                                        {[
                                                            { label: "Lowercase", met: /[a-z]/.test(password) },
                                                            { label: "Uppercase", met: /[A-Z]/.test(password) },
                                                            { label: "Number", met: /[0-9]/.test(password) },
                                                            { label: "Special", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
                                                        ].map((req) => (
                                                            <div key={req.label} className="flex items-center gap-2">
                                                                <motion.div
                                                                    animate={{
                                                                        scale: req.met ? [1, 1.2, 1] : 1,
                                                                        backgroundColor: req.met ? "#10B981" : "rgba(255,255,255,0.05)"
                                                                    }}
                                                                    className="w-1.5 h-1.5 rounded-full"
                                                                />
                                                                <span className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-500 ${req.met ? "text-emerald-500" : "text-white/10"}`}>
                                                                    {req.label}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <div className="space-y-6 pt-2">
                                        <div className="flex items-start gap-3 px-1">
                                            <input type="checkbox" required className="mt-1 w-4 h-4 rounded-sm border-white/10 bg-white/5 checked:bg-[#FF5C00] transition-colors accent-[#FF5C00]" />
                                            <p className="text-[11px] text-white/20 leading-relaxed font-bold">
                                                I agree to the <Link href="/legal/terms" className="underline text-orange-500/50 hover:text-orange-500 transition-colors">Terms of Service</Link> and <Link href="/legal/privacy" className="underline text-orange-500/50 hover:text-orange-500 transition-colors">Privacy Policy</Link>
                                            </p>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full h-14 bg-[#FF5C00] hover:bg-[#FF6D1A] text-white font-black text-lg rounded-2xl shadow-[0_0_30px_rgba(255,92,0,0.1)] hover:shadow-[0_0_50px_rgba(255,92,0,0.4)] transition-all duration-500 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center relative overflow-hidden group/btn"
                                        >
                                            <motion.div
                                                animate={{ x: ["-100%", "100%"] }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                                className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[45deg] pointer-events-none"
                                            />
                                            {loading ? <Loader2 className="animate-spin" size={24} /> : (
                                                <div className="flex items-center gap-3">
                                                    <span>Create Account</span>
                                                    <motion.div
                                                        animate={{ x: [0, 4, 0] }}
                                                        transition={{ duration: 1.5, repeat: Infinity }}
                                                    >
                                                        <ArrowLeft className="rotate-180" size={20} />
                                                    </motion.div>
                                                </div>
                                            )}
                                        </button>

                                        <div className="text-center">
                                            <p className="text-xs font-bold text-white/20">
                                                Already have an account? <Link href="/login" className="text-orange-500 hover:text-orange-400 transition-colors ml-1">Sign in</Link>
                                            </p>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* RIGHT PANEL: STRATEGY DECK SHOWCASE */}
            <div className="hidden lg:flex flex-col justify-center items-center relative overflow-hidden bg-[#080808]">
                {/* Dynamic Liquid Atmos: Orbiting Blobs */}
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
                                <div className="w-8 h-8 bg-orange-500/10 rounded flex items-center justify-center">
                                    <Flame className="text-orange-500" size={18} />
                                </div>
                                <span className="text-sm font-black uppercase tracking-widest">Trend Hunter</span>
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


                        {/* Market Signals List */}
                        <div className="p-8 space-y-6 relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Search size={14} className="text-orange-500" />
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Emerging Signals</span>
                                </div>
                                <div className="flex gap-1">
                                    <div className="w-1 h-1 rounded-full bg-white/20" />
                                    <div className="w-1 h-1 rounded-full bg-white/20" />
                                    <div className="w-1 h-1 rounded-full bg-orange-500" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { title: "Generative Workflows", desc: "Enterprise scale adoption up 240%", icon: Cpu, color: "orange" },
                                    { title: "Edge computing", desc: "Distributed infrastructure trends", icon: Zap, color: "blue" }
                                ].map((item, idx) => (
                                    <motion.div
                                        key={item.title}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 + (idx * 0.2) }}
                                        className="group/item relative p-5 bg-white/[0.03] border border-white/[0.05] rounded-2xl flex items-center gap-6 overflow-hidden transition-all duration-700 hover:bg-white/[0.05] hover:border-white/10"
                                    >
                                        {/* Internal Prismatic Scanning Light */}
                                        <motion.div
                                            animate={{
                                                left: ["-100%", "200%"],
                                                opacity: [0, 0.2, 0]
                                            }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: idx * 1.5 }}
                                            className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent skew-x-[45deg] z-0"
                                        />

                                        {/* PERSISTENT pulsing background glow */}
                                        <motion.div
                                            animate={{
                                                opacity: [0.03, 0.08, 0.03],
                                                scale: [1, 1.3, 1]
                                            }}
                                            transition={{ duration: 5, repeat: Infinity, delay: idx * 2 }}
                                            className={`absolute inset-0 blur-[30px] pointer-events-none ${item.color === 'orange' ? 'bg-orange-600/10' : 'bg-blue-600/10'
                                                }`}
                                        />

                                        {/* Icon Container with Radar Pulse */}
                                        <div className="relative z-10">
                                            <motion.div
                                                animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.3, 0.1] }}
                                                transition={{ duration: 2, repeat: Infinity, delay: idx * 0.5 }}
                                                className={`absolute -inset-2 rounded-xl blur-md ${item.color === 'orange' ? 'bg-orange-500/20' : 'bg-blue-500/20'
                                                    }`}
                                            />
                                            <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center border border-white/5 relative group-hover/item:border-orange-500/30 transition-all duration-500">
                                                <item.icon className="text-white/40 group-hover/item:text-orange-500 transition-colors duration-500" size={20} />
                                            </div>
                                        </div>

                                        <div className="flex-1 relative z-10">
                                            <span className="text-sm font-black text-white block mb-1 tracking-tight group-hover/item:translate-x-1 transition-transform duration-500 uppercase">{item.title}</span>
                                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em] transition-colors duration-500 group-hover/item:text-white/50">{item.desc}</span>
                                        </div>

                                        <div className="flex flex-col items-end gap-1.5 relative z-10">
                                            <div className="flex items-center gap-2">
                                                <motion.div
                                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                    className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                                                />
                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic group-hover/item:not-italic transition-all">Hot</span>
                                            </div>
                                            <div className="h-1.5 bg-white/[0.05] rounded-full w-12 overflow-hidden relative">
                                                <motion.div
                                                    animate={{
                                                        width: ["20%", "100%", "20%"]
                                                    }}
                                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: idx * 0.5 }}
                                                    className="absolute top-0 bottom-0 left-0 bg-orange-500 shadow-[0_0_10px_rgba(255,92,0,0.5)]"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Footer Section */}
                    <div className="mt-12 text-center relative z-10 group/footer">
                        {/* Animated Decorative Element */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute left-1/2 -top-8 -translate-x-1/2 w-32 h-32 bg-orange-500/5 blur-[50px] rounded-full pointer-events-none"
                        />

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl font-black tracking-tighter mb-4 leading-none bg-gradient-to-b from-white via-white to-white/30 bg-clip-text text-transparent flex items-center justify-center gap-3"
                        >
                            {["Trend", "Detection", "Engine"].map((word, i) => (
                                <motion.span
                                    key={word}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 1 + (i * 0.1), duration: 0.8 }}
                                    className="hover:text-orange-500 transition-colors duration-500 cursor-default"
                                >
                                    {word}
                                </motion.span>
                            ))}
                        </motion.h2>

                        <p className="text-sm text-white/30 font-medium leading-relaxed max-w-sm mx-auto">
                            Monodesk hunts for trends, validates ideas, and helps you execute with precision.
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
}

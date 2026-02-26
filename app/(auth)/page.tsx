"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Check, TrendingUp, Target, MoreHorizontal } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2">

            {/* LEFT PANEL: FORM */}
            <div className="flex flex-col justify-center items-center p-8 lg:p-16 relative z-10 bg-background">
                <div className="w-full max-w-md">

                    {/* Header */}
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                                <span className="text-white font-bold">/</span>
                            </div>
                            <span className="text-xl font-bold tracking-widest uppercase">Monodesk</span>
                        </div>
                        <h1 className="text-4xl font-bold mb-3">Create your account</h1>
                        <p className="text-white/50">Start building smarter with the AI OS for founders.</p>
                    </div>

                    {/* Form */}
                    <form className="space-y-6">

                        <div className="grid grid-cols-2 gap-4">
                            <button type="button" className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 p-4 rounded-xl transition-colors font-medium">
                                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.98h5.24c-.27 1.67-1.64 3.07-3.4 3.42v2.63h5.5c3.2-2.95 3.52-8.38 1.83-9.03z" /><path fill="currentColor" d="M12.18 21c2.7 0 4.98-.88 6.62-2.39l-2.1-1.63c-.93.63-2.12 1-3.42 1-2.93 0-5.42-2.01-6.17-2.92l-2.1 1.63C7.03 19.33 9.49 21 12.18 21z" /><path fill="currentColor" d="M6.01 14.1c-.26-.78-.4-1.62-.4-2.5 0-1.31.33-2.58.91-3.69l2.1 1.63c-.43.91-.71 1.9 -.71 3 0 1.11.23 2.15.54 3.11l-2.44 1.95z" /><path fill="currentColor" d="M12.18 5c1.67 0 3.16.6 4.34 1.76l2.5-2.5C17.2 2.68 14.89 2 12.18 2 9.49 2 7.03 3.67 5.62 6.54l2.1 1.63c.75-1.91 3.24-3.17 6.17-3.17z" /></svg>
                                Google
                            </button>
                            <button type="button" className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 p-4 rounded-xl transition-colors font-medium">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                                GitHub
                            </button>
                        </div>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-4 text-white/30">Or continue with</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-accent-purple transition-colors" size={18} />
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/50 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Work Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-accent-purple transition-colors" size={18} />
                                    <input
                                        type="email"
                                        placeholder="john@company.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/50 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-accent-purple transition-colors" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white placeholder:text-white/20 focus:outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/50 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <p className="text-xs text-white/30">Must be at least 8 characters</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <input type="checkbox" className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 checked:bg-orange-500 checked:border-orange-500 transition-colors" />
                            <p className="text-sm text-white/50 leading-tight">
                                I agree to the <a href="#" className="text-orange-500 hover:underline">Terms of Service</a> and <a href="#" className="text-orange-500 hover:underline">Privacy Policy</a>
                            </p>
                        </div>

                        <Link href="/dashboard" className="block w-full text-center bg-orange-500 hover:bg-orange-400 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transition-all transform hover:-translate-y-1">
                            Create Account
                        </Link>

                        <div className="text-center text-sm text-white/50">
                            Already have an account? <Link href="/login" className="text-orange-500 hover:text-orange-400 font-medium">Sign in</Link>
                        </div>
                    </form>
                </div>
            </div>

            {/* RIGHT PANEL: VISUAL */}
            <div className="hidden lg:flex flex-col justify-center items-center relative bg-[#050507] border-l border-white/5 p-12 overflow-hidden">

                {/* Background Gradients */}
                <div className="absolute inset-0">
                    <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-accent-cyan/10 rounded-full blur-[100px] animate-pulse" />
                </div>

                {/* Floating Idea Validator Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center">
                                <div className="w-3 h-3 bg-orange-500 rounded-full animate-ping absolute" />
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                >
                                    <Target size={20} />
                                </motion.div>
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Idea Validator</h3>
                                <p className="text-xs text-green-400">Analysis in progress...</p>
                            </div>
                        </div>
                        <div className="bg-green-500/20 text-green-500 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Active
                        </div>
                    </div>

                    <div className="space-y-6">

                        {/* Score Bar */}
                        <div>
                            <div className="flex justify-between text-sm font-bold mb-2">
                                <span className="text-white/60">Market Viability</span>
                                <span className="text-orange-500">85%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "85%" }}
                                    transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                                    className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                                />
                            </div>
                        </div>

                        {/* Checklist */}
                        <div className="space-y-4">
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1.0 }}
                                className="flex gap-4"
                            >
                                <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center shrink-0">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-white">Problem Space identified</h4>
                                    <p className="text-xs text-white/40">Clear pain point in B2B sector detected.</p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1.5 }}
                                className="flex gap-4"
                            >
                                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                                    <TrendingUp size={14} strokeWidth={3} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-white">Growing Trend</h4>
                                    <p className="text-xs text-white/40">Interest has grown by 40% YoY.</p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 2.0 }}
                                className="flex gap-4 opacity-50"
                            >
                                <div className="w-6 h-6 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0 border border-white/10">
                                    <MoreHorizontal size={14} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-white">Competitor Analysis</h4>
                                    <p className="text-xs text-white/40">Scanning 12 potential competitors...</p>
                                </div>
                            </motion.div>
                        </div>

                        {/* Validation Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 2.5 }}
                            className="absolute bottom-8 right-[-20px] bg-white text-black font-bold text-xs px-4 py-3 rounded-xl shadow-lg flex items-center gap-2"
                        >
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            Validation Complete
                        </motion.div>

                    </div>

                    <div className="mt-8 flex items-center gap-[-10px]">
                        <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-[#1a1a1a] " />
                        <div className="w-8 h-8 rounded-full bg-gray-600 border-2 border-[#1a1a1a] -ml-3" />
                        <div className="w-8 h-8 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center border-2 border-[#1a1a1a] -ml-3">
                            +3
                        </div>
                        <div className="ml-3 text-xs text-white/30">Updated just now</div>
                    </div>

                </motion.div>

                <div className="mt-16 text-center max-w-sm relative z-10">
                    <h2 className="text-2xl font-bold mb-2">Turn ideas into products</h2>
                    <p className="text-white/50 text-sm leading-relaxed">
                        Monodesk validates, outlines, and helps you execute your next big idea with AI-powered precision.
                    </p>
                </div>

            </div>
        </div>
    );
}

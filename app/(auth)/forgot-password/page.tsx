"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowLeft, AlertCircle, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<'request' | 'reset'>('request');
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;
            setStep('reset');
            setSuccess("Check your email for the password reset code.");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // 1. Verify OTP (logs user in)
            const { error: verifyError } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'recovery',
            });
            if (verifyError) throw verifyError;

            // 2. Update Password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });
            if (updateError) throw updateError;

            // 3. Success
            router.push("/login?reset=true");

        } catch (err: any) {
            setError(err.message);
        } finally {
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

            {/* LEFT PANEL: FORM */}
            <div className="flex flex-col justify-center items-center p-8 lg:p-16 relative z-10">
                <div className="w-full max-w-md">

                    {/* Header */}
                    <div className="mb-10">
                        <Link href="/login" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-white mb-8 transition-colors">
                            <ArrowLeft size={14} />
                            Back to Login
                        </Link>
                        <h1 className="text-4xl font-bold mb-3">Reset Password</h1>
                        <p className="text-white/50">
                            {step === 'request'
                                ? "Enter your email to receive a password reset code."
                                : "Enter the code sent to your email and your new password."}
                        </p>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-500">
                            <CheckCircle2 size={20} />
                            <p className="text-sm font-medium">{success}</p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500">
                            <AlertCircle size={20} />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {step === 'request' ? (
                        <form onSubmit={handleRequestReset} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-accent-purple transition-colors" size={18} />
                                    <input
                                        type="email"
                                        placeholder="founder@startup.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/50 transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="block w-full text-center bg-orange-500 hover:bg-orange-400 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="animate-spin" size={20} />
                                        Sending Code...
                                    </span>
                                ) : (
                                    "Send Reset Code"
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Verification Code</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-accent-purple transition-colors" size={18} />
                                    <input
                                        type="text"
                                        placeholder="123456"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                        maxLength={6}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/50 transition-all tracking-widest text-lg"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-wider">New Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-accent-purple transition-colors" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={10}
                                        pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{10,}"
                                        title="Must be at least 10 characters and contain lowercase, uppercase, digits, and symbols."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white placeholder:text-white/20 focus:outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/50 transition-all invalid:border-red-500/50 invalid:text-red-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <p className="text-xs text-white/30">
                                    Min 10 chars (Uppercase, Lowercase, Number, Symbol)
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="block w-full text-center bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="animate-spin" size={20} />
                                        Updating Password...
                                    </span>
                                ) : (
                                    "Reset Password"
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* RIGHT PANEL: VISUAL (RECOVERY THEME) */}
            <div className="hidden lg:flex flex-col justify-center items-center relative overflow-hidden bg-[#080808]">
                {/* Dynamic Atmosphere: Orbiting Recovery Blobs */}
                <div className="absolute inset-0">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 90, 0],
                            x: [0, 50, 0],
                            y: [0, -30, 0]
                        }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-emerald-500/[0.03] rounded-full blur-[120px]"
                    />
                    <motion.div
                        animate={{
                            scale: [1.2, 1, 1.2],
                            rotate: [0, -90, 0],
                            x: [0, -40, 0],
                            y: [0, 40, 0]
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute -bottom-1/4 -left-1/4 w-[700px] h-[700px] bg-orange-500/[0.03] rounded-full blur-[100px]"
                    />
                </div>

                <div className="relative z-10 w-full flex flex-col items-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-[440px] bg-[#121212] border border-white/5 rounded-[24px] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)] p-12 text-center"
                    >
                        {/* Prismatic Scanning Line (Recovery Theme) */}
                        <motion.div
                            animate={{ left: ["-100%", "200%"] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent skew-x-[45deg]"
                        />

                        <div className="relative">
                            <motion.div
                                animate={{
                                    scale: [1, 1.1, 1],
                                    opacity: [0.5, 1, 0.5]
                                }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"
                            />
                            <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-10 border border-white/10 relative z-10 group/icon">
                                <Lock className="text-emerald-500 group-hover:scale-110 transition-transform duration-500" size={40} />
                            </div>
                        </div>

                        <h2 className="text-3xl font-black text-white tracking-tight mb-4 leading-none">
                            Identity Verification
                        </h2>
                        <p className="text-sm text-white/30 font-medium leading-relaxed mb-8">
                            We use military-grade encryption and secure OTP protocols to protect your account during recovery.
                        </p>

                        <div className="flex items-center justify-center gap-2 py-3 px-6 bg-white/[0.02] border border-white/[0.05] rounded-full inline-flex">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest text-[10px]">Secure Protocol Active</span>
                        </div>
                    </motion.div>

                    <div className="mt-12 text-center relative z-10">
                        <h2 className="text-2xl font-black text-white tracking-tight mb-4 opacity-40">
                            Zero-Knowledge Recovery
                        </h2>
                    </div>
                </div>
            </div>
        </div>
    );
}

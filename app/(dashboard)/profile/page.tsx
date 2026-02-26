"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, Camera, Save, Loader2, AlertCircle, CheckCircle2, Edit2, X, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // -- EDIT NAME STATE --
    const [isEditingName, setIsEditingName] = useState(false);
    const [fullName, setFullName] = useState("");
    const [nameLoading, setNameLoading] = useState(false);

    // -- EDIT EMAIL STATE --
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [emailOtp, setEmailOtp] = useState("");
    const [emailStep, setEmailStep] = useState<'input' | 'verify'>('input');
    const [emailLoading, setEmailLoading] = useState(false);

    // -- EDIT PASSWORD STATE --
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Auto-hide message after 15 seconds
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage(null);
            }, 15000); // 15 seconds
            return () => clearTimeout(timer);
        }
    }, [message]);

    // -- AVATAR STATE --
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarLoading, setAvatarLoading] = useState(false);

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                // Initialize fields
                setFullName(user.user_metadata?.full_name || "");
                setAvatarUrl(user.user_metadata?.avatar_url || null);
            }
            setLoading(false);
        };
        getUser();
    }, []);

    // --- 1. AVATAR UPLOAD ---
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        setAvatarLoading(true);
        setMessage(null);

        try {
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            if (updateError) throw updateError;

            setAvatarUrl(publicUrl);
            setMessage({ type: 'success', text: "Profile picture updated!" });
            router.refresh();

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setAvatarLoading(false);
        }
    };

    // --- 2. UPDATE NAME ---
    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault();
        setNameLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            });

            if (error) throw error;

            setMessage({ type: 'success', text: "Name updated successfully!" });
            setIsEditingName(false);
            router.refresh();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setNameLoading(false);
        }
    };

    // --- 3. CHANGE EMAIL FLOW ---
    const initiateEmailChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailLoading(true);
        setMessage(null);

        try {
            // This sends a confirmation email to the NEW address (and potentially the old one)
            // Note: Standard Supabase behavior is to send confirmation to both old and new.
            const { error } = await supabase.auth.updateUser({ email: newEmail });
            if (error) throw error;

            setEmailStep('verify');
            setMessage({ type: 'success', text: "Verification code sent to " + newEmail + " (and possibly your old email)." });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setEmailLoading(false);
        }
    };

    const verifyEmailChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailLoading(true);
        setMessage(null);

        try {
            // Verify the token sent to the NEW email
            const { error } = await supabase.auth.verifyOtp({
                email: newEmail,
                token: emailOtp,
                type: 'email_change'
            });

            if (error) throw error;

            setMessage({ type: 'success', text: "Email updated successfully!" });
            setUser({ ...user, email: newEmail }); // Optimistic update
            setIsEditingEmail(false);
            setEmailStep('input');
            setNewEmail("");
            setEmailOtp("");
            router.refresh();

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setEmailLoading(false);
        }
    };


    // --- 4. CHANGE PASSWORD FLOW ---
    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordLoading(true);
        setMessage(null);

        try {
            // 1. Validate Passwords Match
            if (newPassword !== confirmPassword) {
                throw new Error("New passwords do not match.");
            }

            // 2. Validate Password Strength (Client-Side)
            const strongPasswordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{10,}/;
            if (!strongPasswordRegex.test(newPassword)) {
                throw new Error("Password must be at least 10 chars long and include uppercase, lowercase, number, and symbol.");
            }

            // 3. Verify Old Password (Re-authenticate)
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: oldPassword,
            });

            if (signInError) {
                throw new Error("Incorrect old password.");
            }

            // 4. Update to New Password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) throw updateError;

            // 5. Success
            setMessage({ type: 'success', text: "Password updated successfully!" });

            // Clean up
            setIsEditingPassword(false);
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setPasswordLoading(false);
        }
    };


    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="animate-spin text-accent-purple" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex items-start gap-5">
                <button
                    onClick={() => router.back()}
                    className="mt-1 w-11 h-11 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center hover:bg-white/[0.08] hover:border-white/20 transition-all group outline-none shrink-0"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                    <h1 className="text-4xl font-black mb-2 tracking-tight">Profile Settings</h1>
                    <p className="text-white/40 text-sm font-medium font-sans">Manage your account settings and preferences.</p>
                </div>
            </div>

            {/* Floating Message Popup (Toast) */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className="fixed bottom-8 right-8 z-[100] min-w-[320px] max-w-md"
                    >
                        <div className={`
                            relative overflow-hidden p-1 rounded-[22px] border backdrop-blur-xl shadow-2xl
                            ${message.type === 'success'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                : 'bg-red-500/10 border-red-500/20 text-red-500'
                            }
                        `}>
                            {/* Progress bar for 15s timer */}
                            <motion.div
                                initial={{ width: "100%" }}
                                animate={{ width: "0%" }}
                                transition={{ duration: 15, ease: "linear" }}
                                className={`absolute bottom-0 left-0 h-1 ${message.type === 'success' ? 'bg-emerald-500/30' : 'bg-red-500/30'}`}
                            />

                            <div className="flex items-center justify-between p-4 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${message.type === 'success' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                                        {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-0.5">
                                            {message.type === 'success' ? 'Success' : 'Attention'}
                                        </span>
                                        <p className="text-sm font-bold text-white leading-tight">{message.text}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setMessage(null)}
                                    className="p-2 hover:bg-white/5 rounded-lg transition-colors group"
                                >
                                    <X size={16} className="opacity-40 group-hover:opacity-100" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Visual / Avatar Section */}
                <div className="md:col-span-1">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center">
                        <div className="relative group mb-4">
                            <div className="w-32 h-32 rounded-full overflow-hidden bg-white/10 border-2 border-white/20">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <User size={48} className="text-white/30" />
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={avatarLoading}
                                className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer disabled:cursor-not-allowed"
                            >
                                {avatarLoading ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                            />
                        </div>
                        <h2 className="text-xl font-bold">{fullName || 'User'}</h2>
                        <p className="text-sm text-white/50">{user?.email}</p>
                    </div>
                </div>

                {/* Edit Form Section */}
                <div className="md:col-span-2 space-y-6">

                    {/* 1. NAME SECTION */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <User size={18} className="text-accent-purple" />
                                    Full Name
                                </h3>
                                <p className="text-xs text-white/40 mt-1">Your display name on the platform.</p>
                            </div>
                            {!isEditingName && (
                                <button
                                    onClick={() => setIsEditingName(true)}
                                    className="text-xs bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors font-bold uppercase tracking-wider flex items-center gap-1"
                                >
                                    <Edit2 size={12} /> Change Name
                                </button>
                            )}
                        </div>

                        {isEditingName ? (
                            <form onSubmit={handleUpdateName} className="flex gap-2">
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const sanitized = val.replace(/[^a-zA-Z\s']/g, "");
                                        setFullName(sanitized);
                                    }}
                                    className="flex-1 bg-black/20 border border-white/10 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/50"
                                    placeholder="Enter your name"
                                />
                                <button
                                    type="submit"
                                    disabled={nameLoading}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 rounded-xl font-bold text-sm disabled:opacity-50"
                                >
                                    {nameLoading ? <Loader2 className="animate-spin" size={16} /> : "Save"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsEditingName(false)}
                                    className="bg-white/5 hover:bg-white/10 text-white px-3 rounded-xl"
                                >
                                    <X size={16} />
                                </button>
                            </form>
                        ) : (
                            <p className="text-white/80 py-2">{fullName || 'No name set'}</p>
                        )}
                    </div>

                    {/* 2. EMAIL SECTION */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Mail size={18} className="text-accent-purple" />
                                    Email Address
                                </h3>
                                <p className="text-xs text-white/40 mt-1">Manage your sign-in email.</p>
                            </div>
                            {!isEditingEmail && (
                                <button
                                    onClick={() => setIsEditingEmail(true)}
                                    className="text-xs bg-orange-500/10 text-orange-500 border border-orange-500/20 px-3 py-1.5 rounded-lg hover:bg-orange-500/20 transition-colors font-bold uppercase tracking-wider flex items-center gap-1"
                                >
                                    <Edit2 size={12} /> Change Email
                                </button>
                            )}
                        </div>

                        {!isEditingEmail ? (
                            <p className="text-white/80 py-2">{user?.email}</p>
                        ) : (
                            <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-bold text-orange-400 uppercase tracking-wider">
                                        {emailStep === 'input' ? 'Step 1: New Email' : 'Step 2: Verify Code'}
                                    </h4>
                                    <button onClick={() => { setIsEditingEmail(false); setEmailStep('input'); }} className="text-white/30 hover:text-white">
                                        <X size={16} />
                                    </button>
                                </div>

                                {emailStep === 'input' ? (
                                    <form onSubmit={initiateEmailChange} className="space-y-3">
                                        <input
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            placeholder="Enter new email address"
                                            required
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-accent-purple/50"
                                        />
                                        <button
                                            type="submit"
                                            disabled={emailLoading}
                                            className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50"
                                        >
                                            {emailLoading ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Send Verification Code"}
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={verifyEmailChange} className="space-y-3">
                                        <p className="text-xs text-white/50">Enter the verification code sent to <strong>{newEmail}</strong>.</p>
                                        <input
                                            type="text"
                                            value={emailOtp}
                                            onChange={(e) => setEmailOtp(e.target.value)}
                                            placeholder="6-digit code"
                                            required
                                            maxLength={6}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-4 text-white tracking-widest text-center font-mono focus:outline-none focus:border-accent-purple/50"
                                        />
                                        <button
                                            type="submit"
                                            disabled={emailLoading}
                                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50"
                                        >
                                            {emailLoading ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Verify & Update Email"}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 3. PASSWORD SECTION */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Lock size={18} className="text-accent-purple" />
                                    Password
                                </h3>
                                <p className="text-xs text-white/40 mt-1">Update your existing password.</p>
                            </div>
                            {!isEditingPassword && (
                                <button
                                    onClick={() => setIsEditingPassword(true)}
                                    className="text-xs bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors font-bold uppercase tracking-wider flex items-center gap-1"
                                >
                                    <Edit2 size={12} /> Change Password
                                </button>
                            )}
                        </div>

                        {isEditingPassword && (
                            <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5 relative">
                                <button
                                    onClick={() => setIsEditingPassword(false)}
                                    className="absolute top-4 right-4 text-white/30 hover:text-white"
                                >
                                    <X size={16} />
                                </button>

                                <form onSubmit={handlePasswordUpdate} className="space-y-4">

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-white/40 uppercase">Old Password</label>
                                        <input
                                            type="password"
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            placeholder="Enter current password"
                                            required
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-red-500/50"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-white/40 uppercase">New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="New strong password"
                                            required
                                            minLength={10}
                                            pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{10,}"
                                            title="10+ chars, upper, lower, number, symbol"
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-red-500/50"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-white/40 uppercase">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Repeat new password"
                                            required
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-red-500/50"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={passwordLoading}
                                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50 mt-4"
                                    >
                                        {passwordLoading ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Validate & Update Password"}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}

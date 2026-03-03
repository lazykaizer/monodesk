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
        <div className="max-w-4xl mx-auto space-y-8 px-4 max-lg:pt-4">

            {/* Toast */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                        className="fixed bottom-6 right-6 z-[100] min-w-[280px] max-w-sm"
                    >
                        <div className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl shadow-2xl
                            ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                            <motion.div
                                initial={{ width: "100%" }} animate={{ width: "0%" }}
                                transition={{ duration: 15, ease: "linear" }}
                                className={`absolute bottom-0 left-0 h-0.5 ${message.type === 'success' ? 'bg-emerald-500/40' : 'bg-red-500/40'}`}
                            />
                            <div className="flex items-center gap-3 px-4 py-3">
                                {message.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> : <AlertCircle size={16} className="text-red-400 shrink-0" />}
                                <p className="text-sm font-medium text-white flex-1">{message.text}</p>
                                <button onClick={() => setMessage(null)} className="text-white/30 hover:text-white transition-colors">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header â€” desktop big, mobile compact */}
            <div className="flex items-start gap-4">
                <button onClick={() => router.back()}
                    className="mt-1 w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center hover:bg-white/[0.08] transition-all group shrink-0 max-lg:w-9 max-lg:h-9 max-lg:mt-0">
                    <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform max-lg:size-4 text-white/60" />
                </button>
                <div>
                    <h1 className="text-4xl font-black tracking-tight max-lg:text-xl max-lg:font-bold">Profile Settings</h1>
                    <p className="text-white/40 text-sm max-lg:text-xs mt-1">Manage your account settings and preferences.</p>
                </div>
            </div>

            {/* â”€â”€ DESKTOP LAYOUT (lg+) â”€â”€ */}
            <div className="hidden lg:grid grid-cols-3 gap-8">

                {/* Avatar Sidebar */}
                <div className="col-span-1">
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
                            <button onClick={() => fileInputRef.current?.click()} disabled={avatarLoading}
                                className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer disabled:cursor-not-allowed">
                                {avatarLoading ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                        </div>
                        <h2 className="text-xl font-bold">{fullName || 'User'}</h2>
                        <p className="text-sm text-white/50">{user?.email}</p>
                    </div>
                </div>

                {/* Form Cards */}
                <div className="col-span-2 space-y-6">

                    {/* Name */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-2"><User size={18} className="text-accent-purple" /> Full Name</h3>
                                <p className="text-xs text-white/40 mt-1">Your display name on the platform.</p>
                            </div>
                            {!isEditingName && (
                                <button onClick={() => setIsEditingName(true)}
                                    className="text-xs bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Edit2 size={12} /> Change Name
                                </button>
                            )}
                        </div>
                        {isEditingName ? (
                            <form onSubmit={handleUpdateName} className="flex gap-2">
                                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value.replace(/[^a-zA-Z\s']/g, ""))} autoFocus
                                    className="flex-1 bg-black/20 border border-white/10 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-accent-purple/50" placeholder="Enter your name" />
                                <button type="submit" disabled={nameLoading} className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 rounded-xl font-bold text-sm disabled:opacity-50">
                                    {nameLoading ? <Loader2 className="animate-spin" size={16} /> : "Save"}
                                </button>
                                <button type="button" onClick={() => setIsEditingName(false)} className="bg-white/5 hover:bg-white/10 text-white px-3 rounded-xl"><X size={16} /></button>
                            </form>
                        ) : (
                            <p className="text-white/80 py-2">{fullName || 'No name set'}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-2"><Mail size={18} className="text-accent-purple" /> Email Address</h3>
                                <p className="text-xs text-white/40 mt-1">Manage your sign-in email.</p>
                            </div>
                            {!isEditingEmail && (
                                <button onClick={() => setIsEditingEmail(true)}
                                    className="text-xs bg-orange-500/10 text-orange-500 border border-orange-500/20 px-3 py-1.5 rounded-lg hover:bg-orange-500/20 transition-colors font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Edit2 size={12} /> Change Email
                                </button>
                            )}
                        </div>
                        {!isEditingEmail ? (
                            <p className="text-white/80 py-2">{user?.email}</p>
                        ) : (
                            <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-bold text-orange-400 uppercase tracking-wider">{emailStep === 'input' ? 'Step 1: New Email' : 'Step 2: Verify Code'}</h4>
                                    <button onClick={() => { setIsEditingEmail(false); setEmailStep('input'); }} className="text-white/30 hover:text-white"><X size={16} /></button>
                                </div>
                                {emailStep === 'input' ? (
                                    <form onSubmit={initiateEmailChange} className="space-y-3">
                                        <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Enter new email address" required autoFocus
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-accent-purple/50" />
                                        <button type="submit" disabled={emailLoading} className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50">
                                            {emailLoading ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Send Verification Code"}
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={verifyEmailChange} className="space-y-3">
                                        <p className="text-xs text-white/50">Enter the verification code sent to <strong>{newEmail}</strong>.</p>
                                        <input type="text" value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)} placeholder="6-digit code" required maxLength={6} autoFocus
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-4 text-white tracking-widest text-center font-mono focus:outline-none focus:border-accent-purple/50" />
                                        <button type="submit" disabled={emailLoading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50">
                                            {emailLoading ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Verify & Update Email"}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Password */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-2"><Lock size={18} className="text-accent-purple" /> Password</h3>
                                <p className="text-xs text-white/40 mt-1">Update your existing password.</p>
                            </div>
                            {!isEditingPassword && (
                                <button onClick={() => setIsEditingPassword(true)}
                                    className="text-xs bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Edit2 size={12} /> Change Password
                                </button>
                            )}
                        </div>
                        {isEditingPassword && (
                            <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5 relative">
                                <button onClick={() => setIsEditingPassword(false)} className="absolute top-4 right-4 text-white/30 hover:text-white"><X size={16} /></button>
                                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                    {[
                                        { val: oldPassword, setter: setOldPassword, placeholder: "Enter current password", label: "Old Password" },
                                        { val: newPassword, setter: setNewPassword, placeholder: "New strong password", label: "New Password" },
                                        { val: confirmPassword, setter: setConfirmPassword, placeholder: "Repeat new password", label: "Confirm New Password" },
                                    ].map((field, i) => (
                                        <div key={i} className="space-y-1">
                                            <label className="text-xs font-bold text-white/40 uppercase">{field.label}</label>
                                            <input type="password" value={field.val} onChange={(e) => field.setter(e.target.value)} placeholder={field.placeholder} required autoFocus={i === 0}
                                                className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-red-500/50" />
                                        </div>
                                    ))}
                                    <button type="submit" disabled={passwordLoading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50 mt-4">
                                        {passwordLoading ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Validate & Update Password"}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* â”€â”€ MOBILE LAYOUT (below lg) â”€â”€ */}
            <div className="lg:hidden space-y-4 pb-24">

                {/* Avatar row */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                    <div className="relative group shrink-0">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/10 border border-white/10">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center"><User size={24} className="text-white/30" /></div>
                            )}
                        </div>
                        <button onClick={() => fileInputRef.current?.click()} disabled={avatarLoading}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity rounded-2xl cursor-pointer">
                            {avatarLoading ? <Loader2 className="animate-spin" size={14} /> : <Camera size={14} />}
                        </button>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm truncate">{fullName || 'No name set'}</p>
                        <p className="text-xs text-white/40 truncate">{user?.email}</p>
                    </div>
                </div>

                {/* Settings card */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl divide-y divide-white/[0.06] overflow-hidden">

                    {/* Name row */}
                    <div className="p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                                    <User size={13} className="text-violet-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Name</p>
                                    <p className="text-sm font-semibold text-white truncate">{fullName || 'â€”'}</p>
                                </div>
                            </div>
                            {!isEditingName && (
                                <button onClick={() => setIsEditingName(true)}
                                    className="shrink-0 text-[11px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1">
                                    <Edit2 size={11} /> Edit
                                </button>
                            )}
                        </div>
                        <AnimatePresence>
                            {isEditingName && (
                                <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }} onSubmit={handleUpdateName} className="overflow-hidden">
                                    <div className="flex gap-2 mt-3">
                                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value.replace(/[^a-zA-Z\s']/g, ""))} autoFocus
                                            className="flex-1 bg-black/30 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-violet-500/50 placeholder:text-white/20" placeholder="Your name" />
                                        <button type="submit" disabled={nameLoading} className="bg-violet-600 hover:bg-violet-500 text-white px-3 rounded-xl text-sm font-bold disabled:opacity-50">
                                            {nameLoading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                        </button>
                                        <button type="button" onClick={() => setIsEditingName(false)} className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-white/40"><X size={14} /></button>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Email row */}
                    <div className="p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                                    <Mail size={13} className="text-orange-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Email</p>
                                    <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
                                </div>
                            </div>
                            {!isEditingEmail && (
                                <button onClick={() => setIsEditingEmail(true)}
                                    className="shrink-0 text-[11px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1">
                                    <Edit2 size={11} /> Edit
                                </button>
                            )}
                        </div>
                        <AnimatePresence>
                            {isEditingEmail && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }} className="overflow-hidden">
                                    <div className="mt-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-mono text-orange-400/70 uppercase tracking-widest">{emailStep === 'input' ? 'New email' : 'Verify code'}</span>
                                            <button onClick={() => { setIsEditingEmail(false); setEmailStep('input'); }} className="text-white/30 hover:text-white"><X size={14} /></button>
                                        </div>
                                        {emailStep === 'input' ? (
                                            <form onSubmit={initiateEmailChange} className="flex gap-2">
                                                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new@email.com" required autoFocus
                                                    className="flex-1 bg-black/30 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-orange-500/50 placeholder:text-white/20" />
                                                <button type="submit" disabled={emailLoading} className="bg-orange-500 text-white px-3 rounded-xl text-sm font-bold disabled:opacity-50 whitespace-nowrap">
                                                    {emailLoading ? <Loader2 className="animate-spin" size={14} /> : 'Send'}
                                                </button>
                                            </form>
                                        ) : (
                                            <form onSubmit={verifyEmailChange} className="space-y-2">
                                                <p className="text-[11px] text-white/40">Code sent to <span className="text-white/70">{newEmail}</span></p>
                                                <div className="flex gap-2">
                                                    <input type="text" value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)} placeholder="000000" required maxLength={6} autoFocus
                                                        className="flex-1 bg-black/30 border border-white/10 rounded-xl py-2 px-3 text-sm text-white font-mono tracking-widest text-center focus:outline-none focus:border-orange-500/50 placeholder:text-white/20" />
                                                    <button type="submit" disabled={emailLoading} className="bg-emerald-600 text-white px-3 rounded-xl text-sm font-bold disabled:opacity-50 whitespace-nowrap">
                                                        {emailLoading ? <Loader2 className="animate-spin" size={14} /> : 'Verify'}
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Password row */}
                    <div className="p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                                    <Lock size={13} className="text-red-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Password</p>
                                    <p className="text-sm font-semibold text-white/50 tracking-widest">{'\u2022'.repeat(10)}</p>
                                </div>
                            </div>
                            {!isEditingPassword && (
                                <button onClick={() => setIsEditingPassword(true)}
                                    className="shrink-0 text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1">
                                    <Edit2 size={11} /> Change
                                </button>
                            )}
                        </div>
                        <AnimatePresence>
                            {isEditingPassword && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }} className="overflow-hidden">
                                    <form onSubmit={handlePasswordUpdate} className="mt-3 space-y-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-mono text-red-400/70 uppercase tracking-widest">Update password</span>
                                            <button type="button" onClick={() => setIsEditingPassword(false)} className="text-white/30 hover:text-white"><X size={14} /></button>
                                        </div>
                                        {[
                                            { val: oldPassword, setter: setOldPassword, placeholder: "Current password" },
                                            { val: newPassword, setter: setNewPassword, placeholder: "New password (10+ chars)" },
                                            { val: confirmPassword, setter: setConfirmPassword, placeholder: "Confirm new password" },
                                        ].map((field, i) => (
                                            <input key={i} type="password" value={field.val} onChange={(e) => field.setter(e.target.value)}
                                                placeholder={field.placeholder} required autoFocus={i === 0}
                                                className="w-full bg-black/30 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-red-500/40 placeholder:text-white/20" />
                                        ))}
                                        <button type="submit" disabled={passwordLoading}
                                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-1">
                                            {passwordLoading ? <Loader2 className="animate-spin" size={14} /> : <><Save size={14} /> Update Password</>}
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </div>

        </div>
    );
}


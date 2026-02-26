"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#1c1c1c] text-[#ededed] font-sans selection:bg-emerald-500/30">

            {/* Header / Nav */}
            <header className="border-b border-white/10 bg-[#1c1c1c]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center">
                            <span className="text-black font-bold text-xs">/</span>
                        </div>
                        <span className="font-bold text-lg tracking-tight">Monodesk</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-6 text-sm text-[#888]">
                        <Link href="#" className="hover:text-white transition-colors">Product</Link>
                        <Link href="#" className="hover:text-white transition-colors">Developers</Link>
                        <Link href="#" className="hover:text-white transition-colors">Solutions</Link>
                    </nav>
                    <div className="text-xs font-mono text-[#666]">
                        v1.0.1
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-12 md:py-20">

                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-white">DATA PRIVACY PROTOCOL</h1>
                    <div className="text-[#888] text-sm font-mono flex flex-col gap-1 mt-4">
                        <p>VERSION: v1.0.1 (Production)</p>
                        <p>LAST UPDATED: February 8, 2026</p>
                        <p>ENCRYPTION: AES-256 (At Rest) / TLS 1.3 (In Transit)</p>
                    </div>
                </div>

                <div className="prose prose-invert prose-sm md:prose-base max-w-none text-[#cccccc] space-y-12">

                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">01. DATA INGRESS & COLLECTION</h2>
                        <p className="text-emerald-400/80 italic mb-4 text-sm font-mono border-l-2 border-emerald-500/20 pl-4">
                            (Human Summary: Hum wahi data lete hain jo app chalane ke liye zaroori hai. Koi hidden tracking nahi.)
                        </p>
                        <div className="space-y-4">
                            <div>
                                <strong className="text-white block mb-1">1.1 Identity Objects</strong>
                                <p>When you authenticate via Google or GitHub, we receive a limited payload: your email address, name, and avatar URL. We do not have access to your repositories or private emails unless explicitly granted via OAuth scopes.</p>
                            </div>
                            <div>
                                <strong className="text-white block mb-1">1.2 System Telemetry</strong>
                                <p>We use Google Analytics 4 (GA4) to track "Events" (e.g., button_click, page_load). This data is anonymized and helps us debug performance issues. We do not link telemetry logs to your financial secrets.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">02. AUTHENTICATION HANDSHAKE (OAUTH 2.0)</h2>
                        <p className="text-emerald-400/80 italic mb-4 text-sm font-mono border-l-2 border-emerald-500/20 pl-4">
                            (Human Summary: Hum aapka password kabhi nahi dekhte. Google aur GitHub hamein sirf ek "Token" dete hain.)
                        </p>
                        <div className="space-y-4">
                            <div>
                                <strong className="text-white block mb-1">2.1 Delegated Auth</strong>
                                <p>Monodesk does not store passwords. We utilize Supabase Auth to manage sessions via secure HTTP-only cookies.</p>
                            </div>
                            <div>
                                <strong className="text-white block mb-1">2.2 Token Storage</strong>
                                <p>We only store the provider_token to maintain your session. If you revoke access via your Google/GitHub security settings, our access token is immediately invalidated, and you will be logged out of the OS.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">03. FINANCIAL DATA ISOLATION (STRIPE)</h2>
                        <p className="text-emerald-400/80 italic mb-4 text-sm font-mono border-l-2 border-emerald-500/20 pl-4">
                            (Human Summary: Credit Card numbers humare server par kabhi touch bhi nahi hote. Seedha Stripe ke vault mein jaate hain.)
                        </p>
                        <div className="space-y-4">
                            <div>
                                <strong className="text-white block mb-1">3.1 PCI-DSS Compliance</strong>
                                <p>All payment processing is offloaded to Stripe, Inc. Monodesk never receives, processes, or stores your raw credit card information.</p>
                            </div>
                            <div>
                                <strong className="text-white block mb-1">3.2 The "Customer ID"</strong>
                                <p>We only store a stripe_customer_id and subscription_status (e.g., active, past_due) in our database to gatekeep premium features like the "Finance View."</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">04. AI DATA HANDLING & EPHEMERALITY</h2>
                        <p className="text-emerald-400/80 italic mb-4 text-sm font-mono border-l-2 border-emerald-500/20 pl-4">
                            (Human Summary: Aapka startup idea humara training data nahi hai. Hum usse private rakhte hain.)
                        </p>
                        <div className="space-y-4">
                            <div>
                                <strong className="text-white block mb-1">4.1 No Training on User Data</strong>
                                <p>Your proprietary inputs (e.g., "My startup idea is X") and the generated outputs (e.g., "Strategy Deck") are stored in your private database rows protected by Row Level Security (RLS).</p>
                            </div>
                            <div>
                                <strong className="text-white block mb-1">4.2 API Transmission</strong>
                                <p>Data sent to LLM providers (Google Gemini/OpenAI) is for inference only. We have opted out of data retention policies where applicable, ensuring your prompts are not used to improve their public models.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">05. DATA ENCRYPTION & SECURITY</h2>
                        <p className="text-emerald-400/80 italic mb-4 text-sm font-mono border-l-2 border-emerald-500/20 pl-4">
                            (Human Summary: Database hacker-proof hai. Agar koi chura bhi le, toh usse sirf encrypted gibberish milega.)
                        </p>
                        <div className="space-y-4">
                            <div>
                                <strong className="text-white block mb-1">5.1 Encryption Standards</strong>
                                <p>All data in our database (Supabase/Postgres) is encrypted at rest using AES-256. Data in transit is protected via TLS 1.3.</p>
                            </div>
                            <div>
                                <strong className="text-white block mb-1">5.2 Row Level Security (RLS)</strong>
                                <p>We enforce strict RLS policies at the database engine level. A user with ID: 123 can physically only query rows tagged with user_id: 123. Cross-tenant data leakage is mathematically impossible at the query layer.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">06. THE "DROP TABLE" RIGHT (DELETION)</h2>
                        <p className="text-emerald-400/80 italic mb-4 text-sm font-mono border-l-2 border-emerald-500/20 pl-4">
                            (Human Summary: Jab aap account delete karte hain, hum sab kuch wipe kar dete hain. Koi "Soft Delete" nahi.)
                        </p>
                        <div className="space-y-4">
                            <div>
                                <strong className="text-white block mb-1">6.1 Right to Erasure</strong>
                                <p>You may request full account deletion via the Settings panel. Upon execution, we trigger a cascade delete function that wipes your User Record, Financial Logs, and Strategy Decks from our production database immediately.</p>
                            </div>
                            <div>
                                <strong className="text-white block mb-1">6.2 Backup Expiry</strong>
                                <p>Encrypted database backups are retained for 30 days for disaster recovery purposes, after which your data is permanently purged from existence.</p>
                            </div>
                        </div>
                    </section>

                </div>

                <div className="mt-20 pt-10 border-t border-white/5 text-sm text-[#666]">
                    <p>© Monodesk Inc</p>
                    <div className="flex gap-6 mt-4 text-sm font-mono text-gray-500">
                        <Link href="/legal/terms" className="hover:text-white transition-colors">
                            Terms <span className="text-xs bg-white/10 px-1 rounded ml-1">v1.2</span>
                        </Link>
                        <Link href="/legal/privacy" className="hover:text-white transition-colors">
                            Privacy <span className="text-xs bg-green-500/10 text-green-400 px-1 rounded ml-1">Secure</span>
                        </Link>
                    </div>
                </div>

            </main>
        </div>
    );
}

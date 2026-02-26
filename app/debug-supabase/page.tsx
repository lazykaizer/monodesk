"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function DebugSupabasePage() {
    const [status, setStatus] = useState<string>("Testing connection...");
    const [user, setUser] = useState<any>(null);
    const [error, setError] = useState<any>(null);
    const [envCheck, setEnvCheck] = useState<any>({});

    useEffect(() => {
        async function testConnection() {
            try {
                // 1. Check Env Vars availability
                const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
                const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
                setEnvCheck({
                    url: url ? "Present" : "Missing",
                    key: key ? "Present (Length: " + key.length + ")" : "Missing"
                });

                if (!url || !key) {
                    setStatus("Configuration Error: Missing Environment Variables");
                    return;
                }

                const supabase = createClient();

                // 2. Test Auth Session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) throw sessionError;

                if (session) {
                    setUser(session.user);
                    setStatus("Connected & Authenticated");

                    // 3. Test Database Access (Select from creative_assets)
                    // We try to select just 1 row to see if query works
                    const { data, error: dbError } = await supabase
                        .from('creative_assets')
                        .select('count')
                        .limit(1)
                        .maybeSingle(); // Use maybeSingle to avoid error on empty table

                    if (dbError) {
                        setError(dbError);
                        setStatus("Auth OK, Database Error");
                    } else {
                        setStatus("Connection Fully Operational");
                    }

                } else {
                    setStatus("Connected, No Active Session (Please Login)");
                }

            } catch (err: any) {
                console.error("Debug Connection Error:", err);
                setError(err);
                setStatus("Connection Failed");
            }
        }

        testConnection();
    }, []);

    return (
        <div className="p-8 bg-black text-white min-h-screen font-mono">
            <h1 className="text-2xl font-bold mb-4 text-cyan-400">Supabase Connection Trap</h1>

            <div className="space-y-4">
                <div className="p-4 border border-white/10 rounded bg-white/5">
                    <h2 className="font-bold mb-2">Status</h2>
                    <p className={`text-xl ${status.includes("Operational") ? "text-green-400" : "text-red-400"}`}>
                        {status}
                    </p>
                </div>

                <div className="p-4 border border-white/10 rounded bg-white/5">
                    <h2 className="font-bold mb-2">Environment Check</h2>
                    <pre className="text-sm bg-black p-2 rounded border border-white/10">
                        {JSON.stringify(envCheck, null, 2)}
                    </pre>
                </div>

                <div className="p-4 border border-white/10 rounded bg-white/5">
                    <h2 className="font-bold mb-2">User Session</h2>
                    {user ? (
                        <pre className="text-sm bg-black p-2 rounded border border-white/10 text-green-300">
                            ID: {user.id}
                            Email: {user.email}
                        </pre>
                    ) : (
                        <p className="text-yellow-500">No user logged in.</p>
                    )}
                </div>

                {error && (
                    <div className="p-4 border border-red-500/30 rounded bg-red-900/10">
                        <h2 className="font-bold mb-2 text-red-400">Error Details</h2>
                        <pre className="text-xs overflow-auto bg-black p-2 rounded border border-red-500/20 text-red-300">
                            {JSON.stringify(error, null, 2)}
                        </pre>
                        <p className="mt-2 text-sm text-red-300">Message: {error.message}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

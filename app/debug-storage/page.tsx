"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function StorageDebugPage() {
    const [status, setStatus] = useState("Checking...");
    const [buckets, setBuckets] = useState<any[]>([]);
    const [error, setError] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        const checkStorage = async () => {
            setStatus("Listing buckets...");

            // 1. List Buckets
            const { data: bucketsData, error: bucketsError } = await supabase.storage.listBuckets();

            if (bucketsError) {
                setError(bucketsError);
                setStatus("Failed to list buckets.");
                return;
            }

            setBuckets(bucketsData || []);

            // 2. Check specific 'avatars' bucket
            const avatarsBucket = bucketsData?.find(b => b.name === 'avatars');
            if (!avatarsBucket) {
                setStatus("Bucket 'avatars' NOT FOUND in list via API.");
            } else {
                setStatus("Bucket 'avatars' FOUND! Testing upload...");

                // 3. Test Upload (Tiny file)
                const blob = new Blob(["test"], { type: "text/plain" });
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload('test-debug.txt', blob, { upsert: true });

                if (uploadError) {
                    setError(uploadError);
                    setStatus("Bucket exists but upload FAILED.");
                } else {
                    setStatus("SUCCESS! Bucket exists and upload works.");
                }
            }
        };

        checkStorage();
    }, []);

    return (
        <div className="p-10 text-white">
            <h1 className="text-2xl font-bold mb-4">Storage Debugger</h1>

            <div className="mb-4">
                <strong>Status:</strong> {status}
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded text-red-200">
                    <h3 className="font-bold">Error Details:</h3>
                    <pre className="text-xs mt-2 overflow-auto">{JSON.stringify(error, null, 2)}</pre>
                    <p className="mt-2 text-sm">{error.message}</p>
                </div>
            )}

            <div>
                <h3 className="font-bold mb-2">Available Buckets:</h3>
                {buckets.length === 0 ? (
                    <p className="text-white/50">No buckets found (or permission denied).</p>
                ) : (
                    <ul className="list-disc pl-5">
                        {buckets.map((b: any) => (
                            <li key={b.id}>
                                <strong>{b.name}</strong>
                                <span className="text-xs opacity-50 ml-2">({b.public ? 'Public' : 'Private'})</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

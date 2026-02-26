import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { assetBase64, assetUrl, assetType, prompt } = await request.json();
        if (!assetBase64 && !assetUrl) {
            return NextResponse.json({ error: "No asset data or URL provided" }, { status: 400 });
        }

        const timestamp = Date.now();
        const extension = assetType === "video" ? "mp4" : "jpg";
        const fileName = `${user.id}/${timestamp}.${extension}`;
        const bucketName = 'creative_assets';

        let assetBuffer: Buffer;
        let contentType = assetType === "video" ? "video/mp4" : "image/jpeg";

        if (assetUrl) {
            // Handle Temporary URL (fetch and store)
            const response = await fetch(assetUrl);
            if (!response.ok) throw new Error("Failed to fetch asset from URL");
            assetBuffer = Buffer.from(await response.arrayBuffer());
            contentType = response.headers.get('content-type') || contentType;
        } else if (assetBase64.startsWith('data:')) {
            const base64Data = assetBase64.replace(/^data:.*?;base64,/, '');
            assetBuffer = Buffer.from(base64Data, 'base64');
            const detectedMime = assetBase64.match(/data:(.*?);base64/)?.[1];
            if (detectedMime) contentType = detectedMime;
        } else {
            assetBuffer = Buffer.from(assetBase64, 'base64');
        }

        // 1. Best-effort upload to Storage (Optional)
        let finalStorageUrl = assetUrl || assetBase64;
        const buckets = ['creative_assets', 'pitch_deck_images', 'avatars'];

        for (const bucket of buckets) {
            try {
                const { error: uploadError } = await supabase.storage
                    .from(bucket)
                    .upload(fileName, assetBuffer, {
                        contentType,
                        upsert: true
                    });

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from(bucket)
                        .getPublicUrl(fileName);
                    finalStorageUrl = publicUrl;
                    break;
                }
            } catch (e) {
                // Silently ignore storage errors, we fallback to DB
            }
        }

        // 2. Mandatory Save to Database (Like Pitch Deck)
        const { data: dbData, error: dbError } = await supabase
            .from('creative_assets')
            .insert({
                user_id: user.id,
                asset_type: assetType,
                storage_path: finalStorageUrl,
                prompt_used: prompt
            })
            .select()
            .single();

        if (dbError) {
            console.error("Critical DB Save Error:", dbError);
            return NextResponse.json({ error: "Database save failed", details: dbError.message }, { status: 500 });
        }

        return NextResponse.json({
            publicUrl: finalStorageUrl,
            dbItem: dbData
        });

    } catch (error: any) {
        console.error("Upload/Save API Error:", error);
        return NextResponse.json({
            error: error.message || "Operation failed"
        }, { status: 500 });
    }
}

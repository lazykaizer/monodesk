"use server";

import { createClient } from "@/lib/supabase/server";

export interface CreativeHistoryItem {
    id: string;
    asset_type: 'image' | 'video' | 'logo' | 'agency';
    storage_path: string;
    prompt_used: string;
    created_at: string;
}

/**
 * Fetch creative history for the current user.
 */
export async function fetchCreativeHistory() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from('creative_assets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error("Server Action: fetchCreativeHistory error:", error);
        throw new Error(error.message);
    }

    return data as CreativeHistoryItem[];
}

/**
 * Save a creative asset to history and storage.
 * Handles both Base64 images and Gemini Video URIs.
 */
export async function saveCreativeAsset(assetUrl: string, assetType: string, promptText: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    let finalStorageUrl = assetUrl;
    let fileName = "";

    try {
        const timestamp = Date.now();
        const extension = assetType === "video" ? "mp4" : "jpg";
        fileName = `${user.id}/${timestamp}.${extension}`;

        let assetBuffer: Buffer;
        let contentType = assetType === "video" ? "video/mp4" : "image/jpeg";

        if (assetUrl.startsWith('data:')) {
            // Handle Base64 Image
            const base64Data = assetUrl.replace(/^data:image\/\w+;base64,/, '');
            assetBuffer = Buffer.from(base64Data, 'base64');
        } else if (assetUrl.startsWith('http')) {
            // Handle Gemini Video URI or other external URI
            const response = await fetch(assetUrl);
            if (!response.ok) throw new Error(`Failed to fetch asset from URI: ${response.statusText}`);
            const arrayBuffer = await response.arrayBuffer();
            assetBuffer = Buffer.from(arrayBuffer);
            contentType = response.headers.get('content-type') || contentType;
        } else {
            throw new Error("Invalid asset URL format");
        }

        // Upload to Supabase Storage
        // Using 'pitch_deck_images' bucket for now if others don't exist, 
        // but ideally use 'creative_assets'
        const bucketName = 'creative_assets';

        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, assetBuffer, {
                contentType,
                upsert: true
            });

        if (uploadError) {
            console.error(`Storage upload failed to ${bucketName}. Falling back to DB only.`, uploadError);
            // If upload fails (e.g. bucket doesn't exist), we still want to save the prompt
        } else {
            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(fileName);
            finalStorageUrl = publicUrl;
        }

    } catch (err) {
        console.error("Failed to persist asset to storage:", err);
        // We will save the original URL (if it's short) to the DB as fallback
    }

    // Save to Database
    const { data, error } = await supabase
        .from('creative_assets')
        .insert({
            user_id: user.id,
            asset_type: assetType,
            storage_path: finalStorageUrl,
            prompt_used: promptText
        })
        .select()
        .single();

    if (error) {
        console.error("Server Action: saveCreativeAsset DB error:", error);
        throw new Error(error.message);
    }

    return data as CreativeHistoryItem;
}

/**
 * Delete a creative asset.
 */
export async function deleteCreativeAsset(id: string, storagePath?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // 1. Delete from storage if path exists and is a Supabase URL
    if (storagePath && storagePath.includes('supabase.co/storage')) {
        try {
            // Extract file path from URL
            const urlParts = storagePath.split('/public/creative_assets/');
            if (urlParts.length > 1) {
                const filePath = urlParts[1];
                await supabase.storage.from('creative_assets').remove([filePath]);
            }
        } catch (e) {
            console.warn("Cloud cleanup failed:", e);
        }
    }

    // 2. Delete from DB
    const { error } = await supabase
        .from('creative_assets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) throw new Error(error.message);
    return { success: true };
}

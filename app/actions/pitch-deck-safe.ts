"use server";

import { createClient } from "@/lib/supabase/server";
import { Slide } from "@/lib/types/pitch-deck";

console.log(">>> PITCH DECK SAFE SAVER ACTIVE @ " + new Date().toLocaleTimeString() + " <<<");

export async function vaultPitchDeck(deckData: {
    id?: string;
    deck_title: string;
    idea: string;
    slides_content: Slide[];
}) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    console.log("Server Action: vaultPitchDeck ENTERED @ " + new Date().toLocaleTimeString(), {
        id: deckData.id,
        title: deckData.deck_title,
        slideCount: deckData.slides_content?.length
    });

    const payload = {
        user_id: user.id,
        deck_title: deckData.deck_title,
        idea: deckData.idea,
        slides_content: deckData.slides_content,
        updated_at: new Date().toISOString()
    };

    let result;
    if (deckData.id) {
        result = await supabase
            .from('pitch_decks')
            .update(payload)
            .eq('id', deckData.id)
            .select()
            .single();
    } else {
        result = await supabase
            .from('pitch_decks')
            .insert(payload)
            .select()
            .single();
    }

    if (result.error) {
        console.error("Server Action: savePitchDeck ERROR:", result.error.code, result.error.message, result.error);
        throw result.error;
    }

    return {
        id: result.data.id,
        success: true
    };
}

export async function uploadSlideImageAction(deckId: string, slideId: string, base64Data: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    console.log(`Server Action: uploadSlideImageAction ENTERED for ${deckId}/${slideId}`);
    console.log(`Payload size: ${base64Data.length} chars`);

    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Content, 'base64');
    const fileName = `${deckId}/${slideId}-${Date.now()}.jpg`;

    const { error } = await supabase.storage
        .from('pitch_deck_images')
        .upload(fileName, buffer, {
            contentType: 'image/jpeg',
            upsert: false
        });

    if (error) {
        console.error("Server Action: uploadSlideImageAction error:", error.message, error);
        throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
        .from('pitch_deck_images')
        .getPublicUrl(fileName);

    return { publicUrl, fileName };
}

export async function fetchPitchDeckHistory() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from('pitch_decks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("fetchPitchDeckHistory server error:", error);
        throw error;
    }

    if (!data) return [];

    // LIGHTWEIGHT SYNC: Strip heavy images from all but the first slide to save egress
    const lightweightData = data.map(project => ({
        ...project,
        slides_content: Array.isArray(project.slides_content) ? project.slides_content.map((slide: any, idx: number) => ({
            ...slide,
            // Keep image only for the first slide (preview)
            moodImage: idx === 0 ? slide.moodImage : undefined,
            // We can keep image_url for all as it's just a small string link
        })) : []
    }));

    return lightweightData;
}

export async function fetchPitchDeckById(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from('pitch_decks')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (error) {
        console.error(`fetchPitchDeckById server error for ${id}:`, error);
        throw error;
    }
    return data;
}

export async function deletePitchDeckAction(deckId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from('pitch_decks')
        .delete()
        .eq('id', deckId)
        .eq('user_id', user.id);

    if (error) throw error;
    return { success: true };
}

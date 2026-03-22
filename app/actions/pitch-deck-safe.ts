"use server";

import { createClient } from "@/lib/supabase/server";
import { Slide } from "@/lib/types/pitch-deck";

export async function vaultPitchDeck(deckData: {
    id?: string;
    deck_title: string;
    idea: string;
    slides_content: Slide[];
}) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

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
        throw result.error;
    }

    return {
        id: result.data.id,
        success: true
    };
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
        throw new Error(error.message);
    }

    return data || [];
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
        throw new Error(error.message);
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

    if (error) throw new Error(error.message);
    return { success: true };
}

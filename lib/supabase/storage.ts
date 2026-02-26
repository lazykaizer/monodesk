import { createClient } from './client';

export const uploadSlideImage = async (deckId: string, slideId: string, base64Data: string) => {
    const supabase = createClient();

    // 1. Clean base64 string and convert to Blob manually
    // This is more robust than fetch(data:) which can be blocked by extensions
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = atob(base64Content);
    const array = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
        array[i] = binaryData.charCodeAt(i);
    }
    const blob = new Blob([array], { type: 'image/jpeg' });

    const fileName = `${deckId}/${slideId}-${Date.now()}.jpg`;

    // 2. Upload to Supabase Storage
    const { error } = await supabase.storage
        .from('pitch_deck_images')
        .upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: false // Removing upsert to avoid RLS UPDATE policy requirements
        });

    if (error) {
        console.error("Supabase Storage Error:", error);
        throw error;
    }

    // 3. Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from('pitch_deck_images')
        .getPublicUrl(fileName);

    return { publicUrl, fileName };
};

export const deleteSlideImage = async (storagePath: string) => {
    const supabase = createClient();
    const { error } = await supabase.storage
        .from('pitch_deck_images')
        .remove([storagePath]);

    if (error) {
        console.error("Error deleting image from storage:", error);
    }
};

import { NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
    try {
        // App Router Route Handlers handle large payloads automatically if the global limit is set,
        // but they are often less strictly intercepted than Server Actions.
        const body = await request.json();
        const { id, deck_title, idea, slides_content } = body;

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = {
            user_id: user.id,
            deck_title,
            idea,
            slides_content, // This will contain the Base64 images
            updated_at: new Date().toISOString()
        };

        console.log("API Route: Saving deck payload size approx:", JSON.stringify(payload).length, "bytes");

        let result;
        if (id) {
            result = await supabase
                .from('pitch_decks')
                .update(payload)
                .eq('id', id)
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
            console.error("API Route Supabase Error:", result.error);
            return NextResponse.json({ error: result.error.message }, { status: 500 });
        }

        // Return only the ID and a success flag to avoid sending back the massive slides_content payload
        return NextResponse.json({
            id: result.data.id,
            success: true
        });
    } catch (error: any) {
        console.error("API Route Unhandled Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

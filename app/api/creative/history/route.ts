import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('creative_assets')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(30); // Slightly higher limit for better history visibility

        if (error) {
            console.error("History Fetch API Error:", error);
            return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error("History API Critical Error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch history" }, { status: 500 });
    }
}

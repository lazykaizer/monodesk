"use server";

import { createClient } from "@/lib/supabase/server";

export async function fetchStrategyHistory() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('strategies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return data || [];
}

export async function saveStrategyToHistory(strategyData: {
    project_name: string;
    swot_analysis: any[];
    lean_canvas_data: any[];
    analysis_data: any;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { data, error } = await supabase
        .from('strategies')
        .insert([{
            user_id: user.id,
            project_name: strategyData.project_name,
            swot_analysis: strategyData.swot_analysis,
            lean_canvas_data: strategyData.lean_canvas_data,
            analysis_data: strategyData.analysis_data
        }])
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function deleteStrategyFromHistory(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from('strategies')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        throw error;
    }

    return { success: true };
}

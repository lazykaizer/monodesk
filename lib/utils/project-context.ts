import { Project } from "@/lib/store/useProjectStore";

/**
 * Extracts high-value signals from the Project Knowledge Base 
 * to provide context to the AI without overwhelming it with 
 * raw JSON data, saving tokens and improving focus.
 */
export function summarizeProjectContext(project: Project | null) {
    if (!project || !project.knowledge_base) {
        return null;
    }

    const kb = project.knowledge_base;

    return {
        // Project DNA
        projectName: project.name,
        concept: project.description || "Startup Idea",

        // Validator Insights
        marketScore: kb.validator?.dashboard_summary?.market_score,
        feasibility: kb.validator?.dashboard_summary?.feasibility_score,
        keyRisks: kb.validator?.modules_analysis?.map((m: any) => m.deep_dive?.risks).flat().filter(Boolean).slice(0, 5),
        primaryVerdict: kb.validator?.modules_analysis?.[0]?.quick_view?.verdict,

        // Trends & Strategy
        topCompetitors: kb.trends?.competitors?.map((c: any) => c.name) || kb.validator?.dashboard_summary?.top_competitors?.map((c: any) => c.name),
        marketGaps: kb.trends?.insights?.market_gaps,
        strategicFocus: kb.strategy?.swot?.filter((s: any) => s.impact === 'High').map((s: any) => s.title),

        // Style DNA (For Creative Studio & Visuals)
        styleDNA: project.style_guide?.style_dna || null
    };
}

/**
 * Injects Style DNA into an image prompt if available.
 */
export function injectStyleDNA(prompt: string, styleDNA: string | null) {
    if (!styleDNA) return prompt;

    // Prepend the style DNA to the prompt to maintain consistent aesthetic
    return `${styleDNA}. ${prompt}`;
}

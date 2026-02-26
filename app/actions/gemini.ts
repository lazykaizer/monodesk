"use server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, FunctionCallingMode } from "@google/generative-ai";
const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");
// User explicitly requested "Gemini 2.5 Pro". 
// Found "models/gemini-2.5-pro" in models.json.
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    safetySettings: [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
    ],
    generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        // responseMimeType: "application/json", // MOVED TO PER-FUNCTION LEVEL
    },
}, { timeout: 120000 });
export async function generateIdeaAnalysis(idea: string, selectedModules: string[] = [], context: any = null, mode: 'dashboard' | 'deep' = 'dashboard') {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    // CRITICAL: We strictly respect the user's selection. 
    // If exact topics are not provided, we fall back to defaults, but we NEVER implicitly add extra ones.
    const effectiveModules = selectedModules.length > 0 ? selectedModules : ['Market Fit', 'Competitor Analysis', 'Technical Feasibility'];
    const tools = [
        {
            functionDeclarations: [
                {
                    name: "submit_analysis",
                    description: "Submit the final analysis of the idea.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            global_overview: {
                                type: "OBJECT",
                                properties: {
                                    verdict: { type: "STRING", enum: ["NO_GO", "PIVOT", "GO"] },
                                    score: { type: "NUMBER" },
                                    title: { type: "STRING" },
                                    fatal_flaws: { type: "ARRAY", items: { type: "STRING" } },
                                    pivot_suggestion: { type: "STRING" },
                                    roadmap_tasks: { type: "ARRAY", items: { type: "STRING" } },
                                    pitch_deck_data: { type: "OBJECT", properties: { problem: { type: "STRING" }, solution: { type: "STRING" } } }
                                },
                                // Make required fields flexible based on mode, but schema itself is static
                            },
                            analysis_results: {
                                type: "ARRAY",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        topic: { type: "STRING" },
                                        score: { type: "NUMBER" },
                                        status: { type: "STRING", enum: ["POSITIVE", "NEUTRAL", "NEGATIVE"] },
                                        dashboard_summary: {
                                            type: "OBJECT",
                                            properties: {
                                                verdict: { type: "STRING" },
                                                key_stats: { type: "ARRAY", items: { type: "STRING" } }
                                            }
                                        },
                                        deep_content: {
                                            type: "OBJECT",
                                            properties: {
                                                critical_verdict: { type: "STRING", description: "A punchy headline under 10 words." },
                                                key_highlights: { type: "ARRAY", items: { type: "STRING" }, description: "3-4 short bullet points explaining why this works." },
                                                critical_red_flags: { type: "ARRAY", items: { type: "STRING" }, description: "3-4 short bullet points on risks." },
                                                strategic_advice: { type: "STRING", description: "One powerful pro-tip or strategic move." }
                                            }
                                        }
                                    },
                                    // Make sub-fields optional to save tokens
                                }
                            }
                        },
                        // We relax requirements to allow partial generation
                        required: ["global_overview"]
                    }
                }
            ]
        }
    ];
    let modeInstructions = "";
    if (mode === 'dashboard') {
        modeInstructions = `
        MODE: DASHBOARD OVERVIEW
        - Focus heavily on "global_overview" (Verdict, Score, Key Stats).
        - For "analysis_results", provide ONLY "dashboard_summary".
        - DO NOT generate "deep_content". Leave it empty.
        - OPTIMIZE FOR SPEED.
        `;
    } else {
        modeInstructions = `
        MODE: DEEP DIVE REPORT (SCANNABLE INTELLIGENCE)
        - Focus heavily on "deep_content".
        - DO NOT WRITE PARAGRAPHS.
        - "critical_verdict": A punchy, bold headline (max 8 words).
        - "key_highlights": 3 specific reasons why this is good (max 10 words each).
        - "critical_red_flags": 3 specific risks or gaps (max 10 words each).
        - "strategic_advice": A single, high-impact "Pro Tip".
        - "dashboard_summary" can be minimal.
        `;
    }
    const systemPrompt = `
    You are a Strict Strategic Analyst.
    USER CONFIGURATION:
    - Selected Topics: ${JSON.stringify(effectiveModules)}
    - Mode: ${mode}
    - Context: ${context ? context.projectName : 'None'}
    ${modeInstructions}
    CRITICAL RULES:
    1. Call the 'submit_analysis' tool with your findings.
    2. You must generate a response ONLY for the topics listed in "Selected Topics".
    3. Do NOT add "Market Fit", "Overview" or "Competitors" unless it is explicitly in the list.
    4. Do NOT skip any topic.
    `;
    const userMessage = `Analyze this idea: "${idea}"`;
    try {
        // We use tool calling to enforce structure since responseSchema can be flaky with complex nested arrays in some versions
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\n" + userMessage }] }],
            tools: tools as any,
            toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.ANY } },
            generationConfig: {
                responseMimeType: "text/plain" // Override the JSON mode global setting
            }
        });
        const call = result.response.functionCalls()?.[0];
        if (!call || call.name !== 'submit_analysis') {
            // Fallback to text parsing if tool call fails (rare)
            const text = result.response.text();
            console.log("Fallback Text Response:", text);
            // ... (keep fallback simplistic)
            const cleanJson = (t: string) => {
                let cleaned = t.replace(/```json/g, "").replace(/```/g, "").trim();
                const firstBrace = cleaned.indexOf('{');
                const lastBrace = cleaned.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
                }
                return cleaned;
            };
            return JSON.parse(cleanJson(text));
        }
        const rawData = call.args;
        // ADAPTER: Transform Strict API Response to Frontend-Compatible 'AnalysisResult'
        const globalInfo = (rawData as any).global_overview || {};
        const strictModules = (rawData as any).analysis_results || [];
        // STRICT FILTERING: Only include modules that match the requested `effectiveModules`
        // consistently using fuzzy matching to be safe but strict enough to ban unrequested topics
        const modules_analysis = strictModules
            .filter((item: any) => {
                const topic = item.topic.toLowerCase();
                return effectiveModules.some(requested =>
                    topic.includes(requested.toLowerCase()) ||
                    requested.toLowerCase().includes(topic)
                );
            })
            .map((item: any) => ({
                module_id: item.topic,
                title: item.topic,
                quick_view: {
                    score: item.score,
                    verdict: item.dashboard_summary?.verdict || item.status,
                    key_stats: item.dashboard_summary?.key_stats || []
                },
                deep_dive: {
                    critical_verdict: item.deep_content?.critical_verdict || item.status,
                    key_highlights: item.deep_content?.key_highlights || [],
                    critical_red_flags: item.deep_content?.critical_red_flags || item.deep_content?.risks || [], // Fallback for risks
                    strategic_advice: item.deep_content?.strategic_advice || globalInfo.pivot_suggestion
                }
            }));
        const dashboard_summary: any = {
            ...globalInfo,
            // Explicitly ensure we don't accidentally populate specific card keys 
            // unless they naturally map from the strictly filtered modules_analysis above
            // (The frontend Dashboard reconstructs them from modules_analysis now)
        };
        return {
            dashboard_summary,
            modules_analysis
        };
    } catch (error: any) {
        console.error("Idea Analysis Error:", error);
        return {
            error: true,
            message: error.message || "Failed to parse AI response. Please try again."
        };
    }
}
export async function generateTrendAnalysis(location = "Global") {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    const prompt = `
    Generate a JSON list of 6 emerging tech trends relevant to "${location}" right now.
    
    Return JSON with this exact schema:
    [
        { "id": string, "name": string, "velocity": number (0-100), "volume": string ("High"|"Med"|"Low"), "color": string (tailwind class e.g. "bg-blue-600") }
    ]
    Ensure diverse colors (bg-blue-600, bg-purple-600, bg-green-600, bg-orange-600, bg-pink-600, bg-cyan-600).
    `;
    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        return JSON.parse(responseText);
    } catch (error: any) {
        console.error("Trend Analysis Error:", error);
        throw new Error(`Trend Analysis Failed: ${error.message}`);
    }
}
export async function generateStrategyDetails(businessType: string) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    const prompt = `
    Generate a SWOT analysis for a "${businessType}" business.
    
    Return JSON with this exact schema:
    {
        "strengths": [string, string, string],
        "weaknesses": [string, string, string],
        "opportunities": [string, string, string],
        "threats": [string, string, string],
        "executiveSummary": string
    }
    `;
    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        return JSON.parse(responseText);
    } catch (error: any) {
        console.error("Strategy Gen Error:", error);
        throw new Error(`Strategy Analysis Failed: ${error.message}`);
    }
}
// Used by Creative Studio - Keeping it on Pro ensures high quality prompt enhancement
export async function generateCreativeConcept(promptText: string) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    const prompt = `
    You are an AI Creative Director. Generate a highly detailed visual description and concept analysis for the following art prompt.
    User Prompt: "${promptText}"
    Return JSON with this exact schema:
    {
        "title": string (A catchy title for the artwork),
        "visualDescription": string (A vivid, paragraph-long description of the visual style, lighting, composition, and mood),
        "technicalSpecs": {
            "resolution": string (e.g. "8K"),
            "aspectRatio": string (e.g. "16:9"),
            "styleModel": string (e.g. "Photorealism v5")
        },
        "tags": [string, string, string]
    }
    `;
    try {
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text());
    } catch (error: any) {
        console.error("Creative Concept Error:", error);
        throw new Error(`Creative Concept Failed: ${error.message}`);
    }
}
export async function generateRoadmapSuggestions(context: string) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    const prompt = `
    Generate 3 strategic roadmap tasks for a software product with this context: "${context}".
    
    Return JSON with this exact schema:
    [
        {
            "id": string (e.g. "AI-GEN-01"),
            "name": string (Actionable task name),
            "roi": { "score": string (e.g. "9.2"), "level": "High" | "Med" | "Low", "trend": "up" | "flat" | "down" },
            "effort": string (e.g. "5 pts"),
            "status": "Suggested",
            "isAi": true
        }
    ]
    `;
    try {
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text());
    } catch (error: any) {
        console.error("Roadmap Gen Error:", error);
        throw new Error(`Roadmap Generation Failed: ${error.message}`);
    }
}
export async function analyzePersonaReactions(content: string, personas: any[]) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    const prompt = `
    Analyze this text content: "${content.substring(0, 500)}..."
    
    Roleplay as these personas and provide their specific reactions:
    ${JSON.stringify(personas.map(p => ({ id: p.id, name: p.name, role: p.role, bio: p.bio })))}
    Return JSON with this exact schema:
    [
        {
            "personaId": string (must match one of the input ids),
            "type": "highlight",
            "text": string (a short snippet from the content that triggered the reaction),
            "color": "red" | "green" | "yellow",
            "comment": string (first-person reaction),
            "sentiment": "positive" | "negative" | "neutral",
            "badge": string (short 2-word summary, e.g. "Impact: High")
        }
    ]
    Generate 1 reaction per persona.
    `;
    try {
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text());
    } catch (error: any) {
        console.error("Persona Analysis Error:", error);
        throw new Error(`Persona Analysis Failed: ${error.message}`);
    }
}
export async function generatePitchSlideContent(topic: string, currentSlideContext: any) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    const prompt = `
    Refine and generate content for a pitch deck slide about: "${topic}".
    Current Context: ${JSON.stringify(currentSlideContext)}
    Return JSON with this exact schema:
    {
        "title": string,
        "subtitle": string,
        "content": string, // HTML string for the main slide body
        "imagePrompt": string (Prompt for an image generator)
    }
    RULES:
    - 'content' must be valid HTML (<h3>, <p>, <ul>, <li>).
    - Combine narrative and bullets into this single HTML field.
    `;
    try {
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text());
    } catch (error: any) {
        console.error("Pitch Gen Error:", error);
        throw new Error(`Pitch Generation Failed: ${error.message}`);
    }
}
export async function analyzeFinancials(data: any) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    const prompt = `
    You are an AI CFO. Analyze the following financial data snippet:
    ${JSON.stringify(data)}
    Return JSON with this exact schema:
    {
        "status": string (e.g. "Healthy", "Caution", "Critical"),
        "summary": string (A concise 1-sentence financial insight),
        "tags": [string, string, string] (e.g. ["High Burn", "Growth", "Stable"])
    }
    `;
    try {
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text());
    } catch (error: any) {
        console.error("Finance Analysis Error:", error);
        throw new Error(`Finance Analysis Failed: ${error.message}`);
    }
}
export async function generateTrendHunterData(term: string, mode: 'GLOBAL' | 'NICHE' = 'GLOBAL', context: any = null) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    let trendHunterSystemPrompt = `
    ✅ ACT AS:
    A Market Trend Analyst and Futurist. Your job is to analyze the user's search query (a trend or industry) and provide data that looks like real-time market intelligence.
    ${context ? `**PROJECT CONTEXT (Cumulative Intelligence):**
    - Name: ${context.projectName}
    - Concept: ${context.concept}
    - Known Competitors: ${context.topCompetitors?.join(', ') || 'None'}
    Use this to tailor your trend analysis specifically to how it impacts this specific venture.` : ""}
    🎯 OBJECTIVE:
    Return a JSON object that populates a "Trend Hunter Dashboard". You must simulate historical data and predict future trajectory based on current knowledge.
    🚫 LOGIC GUARDRAILS:
    1. **Momentum Score:** 0-100. (Higher = exploding trend).
    2. **Graph Data:** Provide 12 points of historical data (simulating interest over the last year).
    3. **Sidebar Insights:** Provide 3 concise "bullet points" of recent developments or drivers.
    📦 OUTPUT FORMAT (STRICT JSON):
    {
      "mainTrend": {
        "name": String (Formatted version of user search, e.g., "Crypto Gaming"),
        "momentumScore": Number (0-100),
        "velocityStatus": String ("RISING", "EXPLODING", "STABLE", "COOLING"),
        "summary": String (A 2-sentence AI verdict on the trend's viability.),
        "score": Number (0-100, overall strength),
        "analysis": String (Concise verdict for the UI),
        "horizon": String (Short-term/Mid-term/Long-term),
        "competitionLevel": String (Low/Medium/High),
        "drivers": [String, String],
        "risks": [String, String]
      },
      "momentumGraph": {
        "dataPoints": [ 
          { "month": "Jan", "value": Number }, { "month": "Feb", "value": Number },
          { "month": "Mar", "value": Number }, { "month": "Apr", "value": Number },
          { "month": "May", "value": Number }, { "month": "Jun", "value": Number },
          { "month": "Jul", "value": Number }, { "month": "Aug", "value": Number },
          { "month": "Sep", "value": Number }, { "month": "Oct", "value": Number },
          { "month": "Nov", "value": Number }, { "month": "Dec", "value": Number }
        ]
      },
      "relatedSubTrends": [ 
        { "name": String, "growth": String }
      ],
      "sidebarInsights": [ 
        { "type": "OPPORTUNITY", "title": String, "description": String },
        { "type": "RISK", "title": String, "description": String },
        { "type": "VIRAL_TRIGGER", "title": String, "description": String }
      ],
      "strategyPlan": {
        "gtm": [String, String, String, String],
        "marketEntryAdvice": String
      }
    }
    `;
    // Apply Mode-Specific Instructions
    if (mode === 'NICHE') {
        trendHunterSystemPrompt += `
        \n🔥 CRITICAL INSTRUCTION FOR NICHE MODE:
        - Ignore mainstream/generic results.
        - Focus heavily on "Micro-SaaS ideas", "Underserved problems", and "B2B vertical solutions" related to ${term}.
        - The 'relatedSubTrends' should be low-competition startups or specific niches, not big giants.
        - The 'sidebarInsights' should highlight specific business opportunities a solo founder can build.
        `;
    } else {
        trendHunterSystemPrompt += `
        \n🌍 INSTRUCTION FOR GLOBAL MODE:
        - Focus on broad market adoption, mainstream news, and high volume data.
        - 'relatedSubTrends' should be major market sectors or dominant players.
        `;
    }
    try {
        const parts: any[] = [
            { text: trendHunterSystemPrompt + "\n\nUser Search Trend: " + term }
        ];
        const result = await model.generateContent({
            contents: [{ role: "user", parts: parts }],
            generationConfig: { responseMimeType: "application/json" }
        });
        const responseText = result.response.text();
        return JSON.parse(responseText.replace(/```json|```/g, "").trim());
    } catch (error: any) {
        console.error("Trend Hunter Error:", error);
        throw new Error(`Trend Hunter Failed: ${error.message}`);
    }
}
export async function generateGeminiContent(prompt: string) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    try {
        const flashModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await flashModel.generateContent(prompt);
        return result.response.text();
    } catch (error: any) {
        console.error("Gemini Content Gen Error:", error);
        // Fallback to pro if flash fails or just use the default model instance
        try {
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (fallbackError: any) {
            throw new Error(`Gemini Content Gen Failed: ${error.message}`);
        }
    }
}
export async function generateRoadmapStructure(promptText: string) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    const systemPrompt = `
      ACT AS: Expert Project Manager.
      TASK: Create a development roadmap for: "${promptText}".
      OUTPUT: Return a purely JSON object with tasks categorized into 'backlog', 'todo', 'inProgress'.
      FORMAT: 
      {
        "backlog": [ {"content": "Task name", "priority": "High", "tags": ["UI", "Backend"]} ],
        "todo": [ ... ],
        "inProgress": [ ... ]
      }
      RULES: Keep tasks actionable and specific. Max 3-4 tasks per category.
    `;
    try {
        const result = await model.generateContent(systemPrompt);
        const responseText = result.response.text();
        return JSON.parse(responseText.replace(/```json|```/g, "").trim());
    } catch (error: any) {
        console.error("Roadmap Structure Gen Error:", error);
        throw new Error(`Roadmap Structure Generation Failed: ${error.message}`);
    }
}
export async function generatePitchDeckStructure(idea: string) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    const systemPrompt = `
      ACT AS: Startup Pitch Consultant.
      IDEA: "${idea}"
      TASK: Generate a 10-slide pitch deck structure.
      FORMAT: Return ONLY a JSON array of 10 objects. 
      JSON structure: { 
          "id": number, 
          "title": string, 
          "subtitle": string, 
          "content": string, 
          "styleHint": string 
      }
      RULES:
      - 'content' must be a SINGLE COMPATIBLE HTML STRING.
      - **Structure**:
        - Use \`<h1>\` for the Main Title.
        - Use \`<h2>\` or \`<p>\` for the Subtitle.
        - Use bullet points (\`<ul>\`, \`<li>\`) for key lists.
        - Use \`<strong>\` for emphasis.
      - **Formatting**:
        - Do NOT use Markdown (e.g., \`\`\`html). Return raw HTML string.
        - Do NOT use specific classes (e.g., tailwind), just semantic HTML.
      - Example content: "<h1>Problem</h1><h2>Current solutions are too slow.</h2><ul><li>Inefficient</li><li>Costly</li></ul>"
    `;
    try {
        const result = await model.generateContent(systemPrompt);
        const responseText = result.response.text();
        return JSON.parse(responseText.replace(/```json|```/g, "").trim());
    } catch (error: any) {
        console.error("Pitch Deck Structure Gen Error:", error);
        throw new Error(`Pitch Deck Structure Generation Failed: ${error.message}`);
    }
}
export async function generateInvestorPitchDeck(
    idea: string,
    slidesList: string[],
    context: any = null,
    density: 'minimal' | 'balanced' | 'extensive' = 'balanced',
    tone: 'professional' | 'casual' | 'playful' = 'professional'
) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    // Density Mapping
    const densityInstructions = {
        minimal: "Ultra-concise. EXACTLY 3 bullet points per slide. Each bullet point MUST be under 10 words.",
        balanced: "Standard detail. 3-5 bullet points per slide. Focused and punchy.",
        extensive: "Comprehensive detail. 5-7 bullet points per slide, with more descriptive language and context."
    }[density];

    // Tone Mapping
    const toneInstructions = {
        professional: "VC-ready, sophisticated, authoritative, and data-driven.",
        casual: "Friendly, accessible, conversational, and relatable.",
        playful: "Bold, imaginative, high-energy, and creatively provocative."
    }[tone];

    const systemPrompt = `
    **CONTEXT:**
    You are a world-class Venture Capitalist and Professional Pitch Deck Designer. 
    ${context ? `**PROJECT MASTER DATA (Cumulative Intelligence):**
    - Name: ${context.projectName}
    - Concept: ${context.concept}
    - Competitors: ${context.topCompetitors?.join(', ') || 'N/A'}
    - Market Gaps: ${context.marketGaps || 'N/A'}
    - Strategic Advantage: ${context.strategicFocus?.join(', ') || 'N/A'}
    - Style Preference: ${context.styleDNA || 'Professional minimalist'}
    
    CRITICAL: Use this Master Data to generate a hyper-specific deck. Do not use generic startup examples.` : ""}
    **INPUT DATA:**
    - **Startup Idea:** "${idea}"
    - **Slides to Generate:** ${slidesList.join(", ")}
    - **Total Slide Count:** Exactly ${slidesList.length} slide(s).
    - **Desired Content Density:** ${density.toUpperCase()} (${densityInstructions})
    - **Desired Voice/Tone:** ${tone.toUpperCase()} (${toneInstructions})

    **CRITICAL INSTRUCTIONS:**
    1.  **STRICT COUNT:** You MUST generate EXACTLY ${slidesList.length} slide object(s). No more, no less.
    2.  **STRICT CONTENT:** Generate ONLY the slides listed above. Do NOT add "Thank You", "Title", or "Intro" slides unless they are in the list.
    3.  **Slide Title Matching:** The 'slide_type' field in the JSON MUST match one of the requested slides.
    **CONTENT REQUIREMENTS (Text):**
    1.  **DENSITY CONTROL:** Strictly follow the ${density.toUpperCase()} density rules: ${densityInstructions}
    2.  **TONE CONTROL:** Maintain a ${tone.toUpperCase()} voice throughout: ${toneInstructions}
    3.  **Structure:**
        - **NO MARKDOWN:** Do NOT use markdown bolding (double asterisks **). Use plain text.
        - **Headline:** 3-6 words max.
        - **Sub-headline:** 1 sentence max.
        - **Bullet Points:** Returned in a field named "bullet_points" as an array of strings.
    4.  **SPECIALIZED SLIDE LOGIC:**
        - If generating a **"Financial Projections"** slide: You MUST include realistic placeholders for **Monthly Burn Rate**, **Runway (Months)**, and **Projected Yearly Revenue**. Explain these numbers in the context of the idea.
    
    **VISUAL INTELLIGENCE & LAYOUT LOGIC:**
    You must intelligently assign a 'layout_type' based on the content:
    - **"hero_center":** Intro/Vision (Image 4 style if with image).
    - **"split_image_left":** Storytelling/Pain points.
    - **"three_column_grid":** Standard categorization.
    - **"timeline_vertical":** History or detailed step-by-step.
    - **"horizontal_timeline":** Strategic Roadmap/Future milestones (Image 1 style). Linear horizontal progress.
    - **"circular_step":** Recurring cycles or 4-step methodologies (Image 2 style).
    - **"bento_editorial":** Value Propositions or "Why Us" (Image 3 style). List on one side, hero image on other.
    - **"split_hero":** High-impact Intro/Vision (Image 4 style). Text on L, Full-height Image on R.
    - **"dashboard_editorial":** Product feature highlights (Image 5 style). Image on L, 3-card grid on R.
    - **"stats_grid":** Market Size/Financial KPIs. 2x2 grid of large numbers.
    - **"circular_process":** Loops or continuous methodologies.
    - **"image_card_grid":** Use cases or gallery-style examples.
    - **"financial_chart":** Growth metrics/Revenue.

    
    **AI ICONOGRAPHY LOGIC:**
    For every feature in the 'features' array, assign a 'icon_keyword' from this set:
    [growth, security, speed, global, cloud, users, target, dollar, shield, rocket, brain, zap, search, activity, Layers, Cpu, Database, Mail, Phone, Lock, Unlock, Key, Settings, Trash, Edit, Plus, Minus, Check, X, Info, Help, Alert, Star, Heart, Smile].
    
    **AI DESIGN DNA & THEMING:**
    Analyze the startup sector and assign a 'design_dna' theme:
    - **"Minimalist"**: Ultra-clean, monochromatic, high whitespace.
    - **"Vibrant"**: Playful gradients, organic shapes, energetic.
    - **"Cyberpunk"**: Dark mode, neon accents, high-tech aesthetic.
    - **"Fortune500"**: Professional, stable, deep blues, Serif headers.
    - **"CreativeAgency"**: Bold, high contrast, experimental spacing.
    - **"MonoDark"**: Sleek dark-grey scale with one vivid accent.
    - **"Glassmorphism"**: Frosted glass, soft blurs, futuristic.
    - **"Editorial"**: Magazine-style, Serif body, clean grids.
    - **"TechSaas"**: Modern SaaS look, clean lines, professional.

    Also return a 'theme' object:
    - **primary**: A vibrant brand color (HEX).
    - **secondary**: A complementary color (HEX).
    - **background**: Usually a very dark variant of the primary or deep black (HEX).
    - **accent**: A high-contrast call-to-action color (HEX).
    Example: Fintech (Emerald/Blue), AI (Indigo/Violet), Energy (Amber/DarkGreen).
    
    **IMAGE PROMPT ENGINEERING (High-Impact Aesthetic):**
    For 'image_card_grid', ensure each feature in the 'features' array has a specific 'image_url' prompt (Gemini will convert these to images).
    Use: "Vibrant corporate 3D illustration, cinematic studio lighting, clean editorial photography, abstract technological geometry, high-saturation professional palette."

    **CRITICAL:** Append "cinematic composition, vibrant primary colors, hyper-detailed textures, professional studio lighting" to every image prompt.
    **OUTPUT FORMAT (Strict JSON):**
    Return a valid JSON array where each object represents a slide:
    [
      {
        "slide_type": "The Problem",
        "layout_type": "split_image_left",
        "design_dna": "Cyberpunk",
        "headline": "Current Solutions are Slow",
        "sub_headline": "Enterprises lose 40% of productivity due to outdated workflows.",
        "bullet_points": [
          "Onboarding takes 6 months.",
          "Data silos prevent decisions.",
          "Low employee adoption rates."
        ],
        "features": [
          { "title": "Inefficiency", "description": "Manual entry takes hours.", "image_url": "Image prompt for this feature if using image_card_grid", "icon_keyword": "speed" },
          { "title": "Cost", "description": "Legacy maintenance is rising.", "icon_keyword": "dollar" }
        ],
        "chartData": [
          { "name": "Year 1", "value": 150000 },
          { "name": "Year 2", "value": 450000 },
          { "name": "Year 3", "value": 1200000 }
        ],
        "theme": {
          "primary": "#10b981",
          "secondary": "#3b82f6",
          "background": "#050505",
          "accent": "#f59e0b"
        },
        "image_prompt": "Minimalist corporate 3D illustration of a simple hourglass with sand stuck. Soft studio lighting, clean editorial photography, abstract technological geometry, muted professional palette. minimalist composition, hyper-realistic."
      }
    ]
    `;

    const repairJSON = (raw: string): any => {
        let text = raw.replace(/```json|```/g, "").trim();
        // Try direct parse first
        try { return JSON.parse(text); } catch { }

        // Attempt repair: close unterminated strings and brackets
        // Remove trailing incomplete string value
        text = text.replace(/,\s*"[^"]*$/, '');       // trailing key without value
        text = text.replace(/,\s*"[^"]*":\s*"[^"]*$/, ''); // trailing key:value mid-string
        text = text.replace(/,\s*$/, '');              // trailing comma

        // Count and close unclosed brackets
        const opens = (text.match(/\[/g) || []).length;
        const closes = (text.match(/\]/g) || []).length;
        const openBraces = (text.match(/\{/g) || []).length;
        const closeBraces = (text.match(/\}/g) || []).length;

        // Close any unterminated string
        const quoteCount = (text.match(/(?<!\\)"/g) || []).length;
        if (quoteCount % 2 !== 0) text += '"';

        // Remove trailing comma after closing quotes
        text = text.replace(/,\s*$/, '');

        // Close braces and brackets
        for (let i = 0; i < openBraces - closeBraces; i++) text += '}';
        for (let i = 0; i < opens - closes; i++) text += ']';

        try { return JSON.parse(text); } catch {
            throw new Error("JSON repair failed");
        }
    };

    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const result = await model.generateContent(systemPrompt);
            const responseText = result.response.text();
            const parsed = repairJSON(responseText);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            throw new Error("Empty or invalid slide array");
        } catch (error: any) {
            console.error(`Pitch Deck Gen attempt ${attempt + 1} failed:`, error.message);
            if (attempt === 1) {
                throw new Error(`Investor Pitch Deck Generation Failed: ${error.message}`);
            }
            // Wait before retry
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

export async function suggestPitchDeckSlides(idea: string, availableTopics: string[]) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    const prompt = `
    Analyze this startup idea: "${idea}"
    
    You need to select the most relevant slides for a pitch deck for this specific startup from the list of available topics below.
    Select at least 6-8 slides that tell the most compelling story for this specific idea.
    
    AVAILABLE TOPICS:
    ${availableTopics.join(", ")}
    
    Return ONLY a JSON array of the selected topic names (strings).
    Example: ["Title Slide (Brand Intro)", "The Problem (Pain Points)", "The Solution (Product Reveal)", ...]
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, "").trim();
        return JSON.parse(text);
    } catch (error: any) {
        console.error("Slide Suggestion Error:", error);
        // Fallback to essential slides if AI fails
        return ['Title Slide (Brand Intro)', 'The Problem (Pain Points)', 'The Solution (Product Reveal)', 'Market Opportunity (TAM/SAM/SOM)', 'The Product (Features & Demo)', 'Business Model (How we make money)', 'The Team'];
    }
}
export async function generatePitchDeckImage(prompt: string) {
    const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!API_KEY) throw new Error("GEMINI_API_KEY is not set");
    try {
        const { fetchWithRetry } = await import('@/lib/utils');
        // STRICT REQUIREMENT: Only use nano-banana-pro-preview. No fallbacks.
        const modelName = "nano-banana-pro-preview";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;
        const response = await fetchWithRetry(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `${prompt}. Minimalist corporate aesthetic, clean editorial photography, soft studio lighting, high-end 3D geometric shapes, professional color palette, hyper-realistic textures.` }]
                }],
                generationConfig: {
                    imageConfig: {
                        aspectRatio: "16:9"
                    }
                }
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini Image API Error: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        const candidate = data.candidates?.[0];
        const part = candidate?.content?.parts?.[0];
        const imgObj = part?.inlineData || (part as any)?.image || (part as any)?.fileData;
        if (imgObj && imgObj.mimeType && (imgObj.data || (imgObj as any).bytes)) {
            const bytes = imgObj.data || (imgObj as any).bytes;
            return `data:${imgObj.mimeType};base64,${bytes}`;
        }
        throw new Error("No image data found in response");
    } catch (error: any) {
        console.error("Pitch Deck Image Gen Error:", error);
        throw new Error(`Pitch Deck Image Gen Failed: ${error.message}`);
    }
}
export async function generateDetailedStrategicAnalysis(businessDescription: string, context: any = null, mode: 'dashboard' | 'deep' = 'dashboard') {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    const systemPrompt = `
    ACT AS: Strategic Business Consultant.
    INPUT: User's business description: "${businessDescription}".
    REQUESTED MODE: **${mode === 'dashboard' ? 'SWOT MATRIX' : 'AI INSIGHTS'}**
    
    ${context ? `**PROJECT CONTEXT (Cumulative Intelligence):**
    - Previous Findings: ${context.primaryVerdict || 'No previous data'}
    - Market Context: ${context.marketGaps || 'N/A'}
    Integrate these past findings into your SWOT and TOWS matrix for a truly cumulative strategy.` : ""}
    TASK: Perform a SWOT Analysis and generate a TOWS Strategy Matrix.
    **INSTRUCTIONS FOR ${mode === 'dashboard' ? 'SWOT MATRIX' : 'AI INSIGHTS'} MODE:**
    ${mode === 'dashboard' ? `
    - Focus ONCE on the most impactful high-level points (SWOT Matrix mode).
    - SWOT items should be short (1 sentence max).
    - Provide exactly 3 entries for each SWOT category.
    - provide exactly 2 high-level strategic pairs.
    ` : `
    - Provide deep technical insights and complex strategies (AI Insights mode).
    - Provide at least 5-6 entries for each SWOT category with technical depth.
    - Provide 4+ advanced strategic pairs with detailed actionable steps.
    `}
    OUTPUT JSON FORMAT (Strictly match):
    {
      "commanderIntent": "string (A punchy, 3-sentence executive summary of the strategy)",
      "swot": {
        "strengths": [{"title": "...", "description": "...", "impact": "High" | "Medium" | "Low"}],
        "weaknesses": [{"title": "...", "description": "...", "impact": "High" | "Medium" | "Low"}],
        "opportunities": [{"title": "...", "description": "...", "impact": "High" | "Medium" | "Low"}],
        "threats": [{"title": "...", "description": "...", "impact": "High" | "Medium" | "Low"}]
      },
      "strategies": [
        {
          "id": "unique_string_id",
          "type": "Growth" | "Defense",
          "title": "...",
          "description": "..."
        }
      ]
    }
    Rules:
    - Return ONLY raw JSON.
    - Ensure "commanderIntent" is exactly 3 punchy sentences.
    - Ensure "impact" is exactly one of "High", "Medium", "Low".
    - Ensure "type" is exactly one of "Growth", "Defense".
    `;
    try {
        const result = await model.generateContent(systemPrompt);
        const responseText = result.response.text();
        return JSON.parse(responseText.replace(/```json|```/g, "").trim());
    } catch (error: any) {
        console.error("Strategic Analysis Gen Error:", error);
        throw new Error(`Strategic Analysis Failed: ${error.message}`);
    }
}
export async function simulatePersonaFeedback(persona: any, idea: string) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    const systemPrompt = `
    ✅ ACT AS: ${persona.name}, who is a ${persona.role}.
    🧠 PERSONALITY: ${persona.bio}
You are a simulation of a specific user persona evaluating a startup idea.
    🎯 TASK: 
    Read the user's input below and give CONCISE, SHORT feedback (2-3 sentences MAX). 
    Stay strictly in character. Be direct and to the point.
    Highlight your most critical point by wrapping it in **double asterisks**.
---
**YOUR IDENTITY:**
* **Name:** ${persona.name}
* **Role:** ${persona.role}
* **Personality/Context:** ${persona.bio} (CRITICAL: This determines your behavior)
    📝 USER INPUT:
    "${idea}"
    
    Return ONLY the feedback string.
**YOUR TASK:**
Analyze the user's startup idea strictly through the lens of your defined role.
1.  **Stay in Character:** If you are a Designer, talk about UI/UX. If you are a Lawyer, talk about liability. Do not drift into general business advice unless it fits your role.
2.  **Use Jargon:** Use terminology specific to your role (e.g., "Kerning", "Cap Table", "GDPR", "Latency") to sound authentic.
3.  **Be Critical:** Based on your description ("${persona.bio}"), find the specific flaws in the idea that would annoy YOU specifically.
4. **Highlighting:** Pick the most biting or critical sentence and wrap it in **double asterisks** within the feedback text.
**OUTPUT FORMAT:**
Return strict JSON:
{
  "feedback": "Your raw feedback text here with **highlighted** part...",
  "highlight_quote": "The most biting/critical sentence from your feedback (unwrapped)."
}
---
    `;
    const userMessage = `Analyze this idea: "${idea}"`;
    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\n" + userMessage }] }],
            generationConfig: { responseMimeType: "application/json" }
        });
        const responseText = result.response.text().trim();
        return responseText;
    } catch (error) {
        console.error("Persona simulation failed:", error);
        throw error;
    }
}
export async function simulateGroupFeedback(personas: any[], idea: string) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    const feedbackResults = await Promise.all(
        personas.map(async (p) => {
            const feedback = await simulatePersonaFeedback(p, idea);
            return { persona: p, feedback };
        })
    );
    return feedbackResults;
}
export async function generateSubtasks(taskTitle: string) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    const systemPrompt = `
      ACT AS: Senior Product Manager & Technical Lead.
      TASK: Breakdown the following high-level task into 3-6 actionable, granular subtasks.
      TASK TITLE: "${taskTitle}"
      
      OUTPUT: Return a purely JSON array of strings.
      FORMAT: ["Subtask 1", "Subtask 2", "Subtask 3"]
      RULES: Each subtask must be clear, concise, and executable.
    `;
    try {
        const result = await model.generateContent(systemPrompt);
        const responseText = result.response.text();
        return JSON.parse(responseText.replace(/```json|```/g, "").trim());
    } catch (error: any) {
        console.error("Subtask Gen Error:", error);
        throw new Error(`Subtask Generation Failed: ${error.message}`);
    }
}
export async function consultMilestones(prompt: string) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    const systemPrompt = `
      ACT AS: Elite Product Architect.
      TASK: The user wants to build: "${prompt}". 
      Instead of building everything, act as a strategic consultant.
      
      OUTPUT: Return a purely JSON object:
      {
        "milestones": [
          { "title": "...", "priority": "P1" | "P2" | "P3" }
        ], // MAXIMUM 5
        "questions": [
          "string", "string"
        ] // 2-3 clarifying questions to help the user architect better
      }
      
      RULES: Focus on high-level strategy. Stay professional. No toy-ish language.
    `;
    try {
        const result = await model.generateContent(systemPrompt);
        const responseText = result.response.text();
        return JSON.parse(responseText.replace(/```json|```/g, "").trim());
    } catch (error: any) {
        throw new Error(`Consultation Failed: ${error.message}`);
    }
}
export async function refineBlock(title: string, context: string = "") {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    const systemPrompt = `
      TASK: Breakdown/Refine a single block in a professional roadmap.
      BLOCK TITLE: "${title}"
      CONTEXT: "${context}"
      
      OUTPUT: Return a purely JSON object:
      {
        "subtasks": ["string", "string"], // 3-6 granular subtasks
        "suggestedPriority": "P1" | "P2" | "P3",
        "suggestedEffort": number (hours),
        "aiInsight": "Short strategic tip (max 15 words)"
      }
    `;
    try {
        const result = await model.generateContent(systemPrompt);
        const responseText = result.response.text();
        return JSON.parse(responseText.replace(/```json|```/g, "").trim());
    } catch (error: any) {
        throw new Error(`Refinement Failed: ${error.message}`);
    }
}

export async function generateCopilotResponse(userMessage: string, pageContext: any[]) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    const contextStr = pageContext.length > 0
        ? `Current workspace databases:\n${JSON.stringify(pageContext, null, 2)}`
        : "The workspace is currently empty.";

    const systemPrompt = `
You are "Architect Mode", an AI Copilot embedded in a Notion-style project management workspace.
Your job is to help users manage their roadmap by understanding their intent and taking action.

CURRENT WORKSPACE CONTEXT:
${contextStr}

USER MESSAGE: "${userMessage}"

INSTRUCTIONS:
- Respond conversationally and helpfully in the "content" field.
- If the user wants to CREATE tasks/items, return action type "create_tasks" with an array of tasks.
- If the user wants to UPDATE a specific task, return action type "update_task" with taskId and updates.
- If the user wants to NAVIGATE to a view (table, board, calendar, timeline, list), return action type "navigate" with the view name.
- If no action is needed (just a question/conversation), omit the "action" field.

OUTPUT FORMAT (strict JSON):
{
  "content": "Your conversational response here",
  "action": {
    "type": "create_tasks" | "update_task" | "navigate",
    "tasks": [{ "title": "...", "status": "To Do", "priority": "High" }],
    "taskId": "...",
    "updates": { "status": "Done" },
    "view": "board"
  }
}

RULES:
- Keep "content" under 100 words, friendly and professional.
- For create_tasks, generate 3-8 realistic, actionable tasks.
- Status values: "To Do", "In Progress", "Done", "Blocked"
- Priority values: "High", "Medium", "Low", "None"
- Only include the "action" field if an action is needed.
- Return ONLY the JSON object, no markdown.
    `;

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });
        const responseText = result.response.text().trim();
        const cleaned = responseText.replace(/```json|```/g, "").trim();
        return JSON.parse(cleaned);
    } catch (error: any) {
        return {
            content: "I had trouble processing that. Could you rephrase your request?",
        };
    }
}

export async function generateAgencyDescription(sceneConfig: any) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    const systemPrompt = `
      ACT AS: Professional 3D Lighting Artist & Director.
      SCENE CONTEXT:
      - Camera: ${sceneConfig.camera?.type || 'perspective'} (${sceneConfig.camera?.fov || 45}°)
      - Lighting: ${sceneConfig.lighting?.intensity || 1.2} intensity, ${sceneConfig.lighting?.color || '#ffffff'}
      - Environment: ${sceneConfig.environment || 'studio_soft'}
      - Current Description: "${sceneConfig.description || ''}"
      
      TASK: "Remix" this scene. Generate a more cinematic, professional description of the lighting and environment.
      Also, suggest a refined 'lightingIntensity' value (0.5 to 3.0).
      
      OUTPUT: Return a purely JSON object:
      {
        "description": "string (the new cinematic description)",
        "suggestedSettings": {
          "lightingIntensity": number
        }
      }
      
      RULES: Use technical terminology (e.g., volumetric lighting, subsurface scattering, ambient occlusion, Fresnel effects). Keep it professional. No toy-ish language.
    `;
    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });
        const responseText = result.response.text();
        const cleaned = responseText.replace(/```json|```/g, "").trim();
        return JSON.parse(cleaned);
    } catch (error: any) {
        console.error("Agency Description Gen Error:", error);
        throw new Error(`Scene Remix Failed: ${error.message}`);
    }
}

export async function rewriteSlideText(text: string, tone: 'professional' | 'creative') {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    const systemPrompt = `
      ACT AS: Expert Pitch Deck Copywriter & Narrative Strategist.
      TASK: Rewrite the provided text to better fit a high-stakes investor pitch deck.
      TONE: ${tone === 'professional' ? 'Highly professional, authoritative, data-driven, and enterprise-grade. Avoid fluff.' : 'Visionary, creative, emotionally resonant, and storytelling-focused. Use "Apple-style" impactful language.'}
      
      RULES:
      - Return ONLY the rewritten text.
      - DO NOT return JSON. DO NOT return an object like {"text": "..."}.
      - DO NOT wrap the response in markdown blocks.
      - DO NOT include conversational filler or meta-commentary.
      - DO NOT use any markdown bolding (no double asterisks **).
      - JUST THE RAW REWRITTEN TEXT.

      TEXT TO REWRITE: "${text}"
    `;

    try {
        const result = await model.generateContent(systemPrompt);
        return result.response.text().trim();
    } catch (error: any) {
        console.error("Rewrite Slide Text Error:", error);
        throw new Error(`Rewrite Failed: ${error.message}`);
    }
}

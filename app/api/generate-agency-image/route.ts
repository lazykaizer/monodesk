import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { prompt, productImageBase64, referenceImageBase64, aspectRatio } = body;

        const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!API_KEY) {
            return NextResponse.json({ error: "API Key is missing" }, { status: 500 });
        }

        const model = "nano-banana-pro-preview";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

        console.log("Agency mode generation with images");

        // Build parts array for multimodal input
        const parts: any[] = [];

        // Add product image first if provided
        if (productImageBase64) {
            const base64Data = productImageBase64.split(',')[1];
            const mimeType = productImageBase64.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
            parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
            });
        }

        // Add reference image second if provided
        if (referenceImageBase64) {
            const base64Data = referenceImageBase64.split(',')[1];
            const mimeType = referenceImageBase64.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
            parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
            });
        }

        // Add text prompt
        parts.push({ text: prompt });

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{
                    parts: parts
                }],
                generationConfig: {
                    // Gemini Nano Banana Pro / Imagen 3 payload structure
                    ...(aspectRatio && {
                        imageConfig: {
                            aspectRatio: aspectRatio
                        }
                    }),
                }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Gemini API Error:", errorText);
            return NextResponse.json(
                { error: `API Error: ${response.status} ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Parse for inlineData
        const candidate = data.candidates?.[0];
        const part = candidate?.content?.parts?.[0];
        const inlineData = part?.inlineData;

        if (inlineData && inlineData.mimeType && inlineData.data) {
            return NextResponse.json({
                image: `data:${inlineData.mimeType};base64,${inlineData.data}`
            });
        }

        return NextResponse.json({ error: "No image data found in response" }, { status: 500 });

    } catch (error: any) {
        console.error("API Route Error:", error);
        return NextResponse.json(
            { error: error.message || "Unknown error occurred" },
            { status: 500 }
        );
    }
}

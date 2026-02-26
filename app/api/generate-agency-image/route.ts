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
            let base64Data = productImageBase64;
            let mimeType = 'image/jpeg';
            if (productImageBase64.startsWith('http')) {
                const imgRes = await fetch(productImageBase64);
                if (imgRes.ok) {
                    const buf = await imgRes.arrayBuffer();
                    base64Data = Buffer.from(buf).toString('base64');
                    mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
                }
            } else {
                base64Data = productImageBase64.split(',')[1];
                mimeType = productImageBase64.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
            }

            parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
            });
        }

        // Add reference image second if provided
        if (referenceImageBase64) {
            let base64Data = referenceImageBase64;
            let mimeType = 'image/jpeg';
            if (referenceImageBase64.startsWith('http')) {
                const imgRes = await fetch(referenceImageBase64);
                if (imgRes.ok) {
                    const buf = await imgRes.arrayBuffer();
                    base64Data = Buffer.from(buf).toString('base64');
                    mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
                }
            } else {
                base64Data = referenceImageBase64.split(',')[1];
                mimeType = referenceImageBase64.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
            }
            parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
            });
        }

        // Add text prompt
        parts.push({ text: `A high-fidelity composite image: ${prompt}. Cinematic, professional lighting, photorealistic.` });

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
                    imageConfig: {
                        aspectRatio: aspectRatio || "1:1"
                    }
                }
            }),
        });

        if (!response.ok) {
            let errorText = await response.text();
            try {
                const errJson = JSON.parse(errorText);
                errorText = errJson.error?.message || errorText;
            } catch (e) { }
            console.error("Gemini API Error:", errorText);
            return NextResponse.json(
                { error: `API Error: ${response.status} - ${errorText.substring(0, 50)}` },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Parse for inlineData
        const candidate = data.candidates?.[0];
        const responseParts = candidate?.content?.parts || [];
        const imgPart = responseParts.find((p: any) => p.inlineData || p.image || p.fileData);
        const imgObj = imgPart?.inlineData || (imgPart as any)?.image || (imgPart as any)?.fileData;

        if (imgObj && imgObj.mimeType && (imgObj.data || (imgObj as any).bytes)) {
            const bytes = imgObj.data || (imgObj as any).bytes;
            return NextResponse.json({
                image: `data:${imgObj.mimeType};base64,${bytes}`
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

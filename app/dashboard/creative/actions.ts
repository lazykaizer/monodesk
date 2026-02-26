"use server";

import fs from 'fs';
import path from 'path';

export async function generateCreativeImage(
    prompt: string,
    aspectRatio?: string,
    productImageBase64?: string,
    referenceImageBase64?: string
) {
    const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!API_KEY) {
        return { error: "API Key is missing" };
    }

    try {
        // STRICT REQUIREMENT: Only use nano-banana-pro-preview. No fallbacks.
        const models = ["nano-banana-pro-preview"];
        let lastError = "";

        for (const model of models) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

                console.log(`Generating with ${model}...`);

                // Build parts array for multimodal input
                const parts: any[] = [];

                if (productImageBase64) {
                    const base64Data = productImageBase64.split(',')[1];
                    const mimeType = productImageBase64.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
                    parts.push({ inlineData: { mimeType, data: base64Data } });
                }

                if (referenceImageBase64) {
                    const base64Data = referenceImageBase64.split(',')[1];
                    const mimeType = referenceImageBase64.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
                    parts.push({ inlineData: { mimeType, data: base64Data } });
                }

                parts.push({ text: prompt });

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout

                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts }],
                        generationConfig: {
                            ...(aspectRatio && { imageConfig: { aspectRatio } }),
                        }
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                const data = await response.json();

                // SAVE DEBUG LOG
                try {
                    const logPath = path.join(process.cwd(), 'gemini_debug.json');
                    fs.writeFileSync(logPath, JSON.stringify(data, null, 2));
                    console.log(`Diagnostic log saved to ${logPath}`);
                } catch (e) { }

                if (!response.ok) {
                    console.error(`${model} failed:`, data.error?.message || response.statusText);
                    lastError = data.error?.message || `API Error ${response.status}`;
                    continue; // Try next model
                }

                const candidate = data.candidates?.[0];
                if (candidate?.finishReason && candidate.finishReason !== "STOP") {
                    console.warn(`${model} interrupted: ${candidate.finishReason}`);
                    lastError = `Generation interrupted: ${candidate.finishReason}`;
                    continue;
                }

                const part = candidate?.content?.parts?.[0];
                const imgObj = part?.inlineData || (part as any)?.image || (part as any)?.fileData;

                if (imgObj && imgObj.mimeType && (imgObj.data || (imgObj as any).bytes)) {
                    const bytes = imgObj.data || (imgObj as any).bytes;
                    return { image: `data:${imgObj.mimeType};base64,${bytes}` };
                }

                lastError = "No image data in successful response. Check gemini_debug.json";
                console.error(`Model ${model} returned success but no image.`);

            } catch (err: any) {
                console.error(`Error with model ${model}:`, err.message);
                lastError = err.message;
            }
        }

        return { error: lastError || "Failed to generate image with available models." };

    } catch (error: any) {
        console.error("Server Action Critical Error:", error);
        return { error: error.message || "Unknown error occurred" };
    }
}

export async function generateCreativeVideo(prompt: string, imagePreview?: string) {
    const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!API_KEY) return { error: "API Key is missing" };

    const model = "veo-3.1-generate-preview";

    try {
        const baseUrl = "https://generativelanguage.googleapis.com/v1beta";
        const predictUrl = `${baseUrl}/models/${model}:predictLongRunning?key=${API_KEY}`;

        console.log(`Starting Creative Video Gen (${model}): `, predictUrl);

        const instance: any = { prompt: prompt };
        if (imagePreview) {
            const base64Data = imagePreview.split(',')[1];
            const mimeType = imagePreview.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
            instance.image = {
                mimeType: mimeType,
                bytesBase64Encoded: base64Data
            };
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout

        const response = await fetch(predictUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ instances: [instance] }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        const data = await response.json();

        if (!response.ok) {
            console.error("Video Start Error:", data);
            return { error: data.error?.message || `Start Failed: ${JSON.stringify(data)}` };
        }

        const operationName = data.name;
        if (!operationName) return { error: "No operation name returned" };

        const maxRetries = 40;
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

        for (let i = 0; i < maxRetries; i++) {
            await delay(2000);
            const pollRes = await fetch(`${baseUrl}/${operationName}?key=${API_KEY}`);
            const pollData = await pollRes.json();

            if (pollData.done) {
                if (pollData.error) return { error: pollData.error.message };
                const finalResponse = pollData.response || pollData;
                if (finalResponse.generateVideoResponse?.generatedSamples?.[0]?.video?.uri) {
                    return { video: `${finalResponse.generateVideoResponse.generatedSamples[0].video.uri}&key=${API_KEY}` };
                }
                return { error: "Video finished but no URI found" };
            }
        }

        return { error: "Timeout waiting for video." };

    } catch (error: any) {
        console.error("Video Action Error:", error);
        return { error: error.message };
    }
}

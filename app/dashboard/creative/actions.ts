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
                    parts.push({ inlineData: { mimeType, data: base64Data } });
                }

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
                            imageConfig: {
                                aspectRatio: aspectRatio || "1:1"
                            }
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
                } catch (e) { }

                if (!response.ok) {
                    console.error(`${model} failed:`, data.error?.message || response.statusText);
                    lastError = data.error?.message || `API Error ${response.status}`;
                    continue;
                }

                const candidate = data.candidates?.[0];
                if (candidate?.finishReason && candidate.finishReason !== "STOP" && candidate.finishReason !== "SAFETY") {
                    // Continue to check if there is some data despite finishReason
                }

                const responseParts = candidate?.content?.parts || [];

                // Robust extraction: Search for ANY image data across ALL parts
                for (const p of responseParts) {
                    const img = p.inlineData || (p as any).image || (p as any).fileData;
                    if (img && img.mimeType && (img.data || (img as any).bytes)) {
                        const bytes = img.data || (img as any).bytes;
                        return { image: `data:${img.mimeType};base64,${bytes}` };
                    }
                }

                // If we got here, maybe the model returned text instead of an image
                const textOutput = responseParts.find((p: any) => p.text)?.text;
                if (textOutput) {
                    console.warn(`Model ${model} returned text instead of image:`, textOutput.substring(0, 100));
                    lastError = "Model returned text instead of an image. Reframing prompt...";
                    continue;
                }

                lastError = "No image data in successful response.";
            } catch (err: any) {
                console.error(`Error with model ${model}:`, err.message);
                lastError = err.message;
            }
        }

        return { error: lastError || "Failed to generate image." };

    } catch (error: any) {
        console.error("Server Action Critical Error:", error);
        return { error: error.message || "Unknown error occurred" };
    }
}

export async function generateCreativeVideo(prompt: string, imagePreview?: string) {
    const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!API_KEY) return { error: "API Key is missing" };

    const model = "veo-3.1-generate-preview";

    try {
        const baseUrl = "https://generativelanguage.googleapis.com/v1beta";
        const predictUrl = `${baseUrl}/models/${model}:predictLongRunning?key=${API_KEY}`;

        console.log(`Starting Creative Video Gen (${model}): `, predictUrl);

        const instance: any = { prompt: prompt };
        if (imagePreview) {
            let base64Data = imagePreview;
            let mimeType = 'image/jpeg';

            if (imagePreview.startsWith('http')) {
                try {
                    const imgRes = await fetch(imagePreview);
                    if (imgRes.ok) {
                        const buf = await imgRes.arrayBuffer();
                        base64Data = Buffer.from(buf).toString('base64');
                        mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
                    } else {
                        return { error: "Failed to download the reference image for video generation." };
                    }
                } catch (e) {
                    return { error: "Network error while downloading the reference image." };
                }
            } else if (imagePreview.includes(';base64,')) {
                const parts = imagePreview.split(';base64,');
                mimeType = parts[0].replace('data:', '') || 'image/jpeg';
                base64Data = parts[1];
            } else if (imagePreview.includes(',')) {
                const parts = imagePreview.split(',');
                base64Data = parts[1];
            }

            // OFFICIAL VEO STRUCTURE for image prompts (Variation mode)
            instance.image = {
                bytesBase64Encoded: base64Data,
                mimeType: mimeType
            };
        }

        const response = await fetch(predictUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ instances: [instance] })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Video Start Error:", data);
            return { error: data.error?.message || `Start Failed: ${JSON.stringify(data)}` };
        }

        const operationName = data.name;
        if (!operationName) return { error: "No operation name returned" };

        const maxRetries = 60; // Increased to 2 minutes
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

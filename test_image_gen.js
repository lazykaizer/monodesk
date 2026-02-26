
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: '.env.local' });

async function testImageGen() {
    const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!API_KEY) {
        console.error("API Key is missing from .env.local");
        return;
    }

    const model = "nano-banana-pro-preview";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    console.log(`Testing with model: ${model} WITHOUT imageConfig`);

    const body = {
        contents: [{
            parts: [{ text: "A futuristic city in the style of cyberpunk, 8k, highly detailed" }]
        }]
        // generationConfig: {} // MISSING imageConfig
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        console.log("Response Status:", response.status);

        if (data.candidates?.[0]) {
            const parts = data.candidates[0].content?.parts || [];
            console.log(`Parts count: ${parts.length}`);
            parts.forEach((p, i) => {
                if (p.text) console.log(`Part ${i} text snippet: ${p.text.substring(0, 100)}...`);
                if (p.inlineData) console.log(`Part ${i} mime: ${p.inlineData.mimeType}`);
            });
        }

    } catch (error) {
        console.error("Test failed:", error);
    }
}

testImageGen();

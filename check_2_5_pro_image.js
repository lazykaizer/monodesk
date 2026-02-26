const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const apiKeyLine = envConfig.split('\n').find(line => line.startsWith('GEMINI_API_KEY='));
const apiKey = apiKeyLine ? apiKeyLine.split('=')[1].trim() : null;

const genAI = new GoogleGenerativeAI(apiKey);

// Small 1x1 pixel red dot PNG base64
const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function checkImage() {
    console.log("Testing gemini-2.5-pro with image...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
        const result = await model.generateContent([
            { text: "What is in this image?" },
            { inlineData: { mimeType: "image/png", data: base64Image } }
        ]);
        console.log("✅ SUCCESS: Image analyzed:", result.response.text());
    } catch (error) {
        console.log("❌ FAILED with image");
        console.log("Error:", error.message);
    }
}

checkImage();

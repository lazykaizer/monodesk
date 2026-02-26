const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const apiKeyLine = envConfig.split('\n').find(line => line.startsWith('GEMINI_API_KEY='));
const apiKey = apiKeyLine ? apiKeyLine.split('=')[1].trim() : null;

const genAI = new GoogleGenerativeAI(apiKey);

async function checkModel() {
    console.log("Testing gemini-2.5-pro...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
        const result = await model.generateContent("Hello, are you Gemini 2.5 Pro?");
        console.log("✅ SUCCESS: gemini-2.5-pro response:", result.response.text());
    } catch (error) {
        console.log("❌ FAILED: gemini-2.5-pro");
        console.log("Error:", error.message);
    }
}

checkModel();

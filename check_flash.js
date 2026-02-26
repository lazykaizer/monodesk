const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const apiKeyLine = envConfig.split('\n').find(line => line.startsWith('GEMINI_API_KEY='));
const apiKey = apiKeyLine ? apiKeyLine.split('=')[1].trim() : null;

const genAI = new GoogleGenerativeAI(apiKey);

async function checkFlash() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("✅ GEMINI-1.5-FLASH WORKS!");
    } catch (error) {
        console.log(`❌ GEMINI-1.5-FLASH FAILED: ${error.message}`);
    }
}

checkFlash();

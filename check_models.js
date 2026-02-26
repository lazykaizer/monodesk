const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Load .env.local manually since dotenv might not be installed
const envPath = path.resolve(__dirname, '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const apiKeyLine = envConfig.split('\n').find(line => line.startsWith('GEMINI_API_KEY='));
const apiKey = apiKeyLine ? apiKeyLine.split('=')[1].trim() : null;

if (!apiKey) {
    console.error("GEMINI_API_KEY not found in .env.local");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function checkModels() {
    const models = ["gemini-2.5-pro", "gemini-1.5-pro", "gemini-pro", "gemini-1.5-flash", "gemini-1.0-pro", "gemini-pro-vision"];

    console.log("Checking models...");

    for (const modelName of models) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Test");
            console.log(`✅ ${modelName}: AVAILABLE`);
        } catch (error) {
            console.log(`❌ ${modelName}: FAILED - ${error.message.split('\n')[0]}`);
        }
    }
}

checkModels();

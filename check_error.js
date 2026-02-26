const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const apiKeyLine = envConfig.split('\n').find(line => line.startsWith('GEMINI_API_KEY='));
const apiKey = apiKeyLine ? apiKeyLine.split('=')[1].trim() : null;

const genAI = new GoogleGenerativeAI(apiKey);

async function captureError() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        await model.generateContent("test");
        fs.writeFileSync('error_log.txt', "Success! gemini-1.5-flash works.");
    } catch (error) {
        fs.writeFileSync('error_log.txt', error.message);
    }
}

captureError();

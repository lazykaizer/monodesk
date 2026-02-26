import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function test(modelName) {
    try {
        console.log(`Testing ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        await model.generateContent("Hi");
        fs.appendFileSync('result.log', `SUCCESS: ${modelName} works!\n`);
        console.log(`SUCCESS: ${modelName}`);
    } catch (error) {
        fs.appendFileSync('result.log', `FAILED ${modelName}: ${error.message}\n`);
        console.log(`FAILED: ${modelName}`);
    }
}

async function run() {
    fs.writeFileSync('result.log', '');
    await test("gemini-2.5-flash");
    await test("gemini-flash-latest");
}

run();

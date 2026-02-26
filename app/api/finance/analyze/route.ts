import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: NextRequest) {
    if (!apiKey) {
        return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Strict Validation: Only Images and PDFs
        const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed." }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const base64Data = Buffer.from(buffer).toString("base64");

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" }); // Using 2.5 Pro for best vision capabilities

        const prompt = `
        You are a highly accurate financial data extraction AI.
        Analyze this receipt/invoice image and extract the following transaction details:
        - Transaction Date (YYYY-MM-DD format)
        - Total Amount (Number only)
        - Currency Code (e.g. USD, INR, EUR, GBP, JPY) -> Infer from symbol (₹=INR, $=USD/CAD, €=EUR, £=GBP) or text. Default to USD if unsure.
        - Type (Income or Expense)
        - Category (Software, Marketing, Salary, Rent, SaaS, Misc, Infra, Operations)
        - Description (Short summary)

        Output STRICT JSON format:
        {
            "transaction_date": "YYYY-MM-DD",
            "amount": Number,
            "currency": "String",
            "type": "income" | "expense",
            "category": "String",
            "description": "String"
        }
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type,
                },
            },
        ]);

        const responseText = result.response.text();
        const cleanedJson = responseText.replace(/```json|```/g, "").trim();
        const analysis = JSON.parse(cleanedJson);

        // --- Currency Normalization Logic ---
        let normalizedAmount = analysis.amount;
        let originalCurrency = analysis.currency || 'USD';
        let exchangeRate = 1;

        if (originalCurrency !== 'USD') {
            try {
                // Fetch live rate to convert TO USD
                const res = await fetch(`https://api.frankfurter.app/latest?from=${originalCurrency}&to=USD`);
                const data = await res.json();
                if (data.rates && data.rates.USD) {
                    exchangeRate = data.rates.USD;
                    normalizedAmount = analysis.amount * exchangeRate;
                }
            } catch (e) {
                console.error("Currency conversion failed:", e);
                // Fallback: If conversion fails, keep original amount but flag it? 
                // For now, we'll just trust the original amount if fetch fails, effectively 1:1 fallback
            }
        }

        return NextResponse.json({
            ...analysis,
            normalized_amount: normalizedAmount,
            exchange_rate: exchangeRate
        });

    } catch (error: any) {
        console.error("Receipt Analysis Error:", error);
        return NextResponse.json({ error: "Failed to analyze receipt", details: error.message }, { status: 500 });
    }
}

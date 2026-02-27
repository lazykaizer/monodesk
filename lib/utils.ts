import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function sanitizeAIText(text: string): string {
    if (!text) return "";

    let cleaned = text.trim();

    // 1. Strip Markdown Code Blocks if present (Common AI artifact)
    if (cleaned.includes('```')) {
        cleaned = cleaned.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
    }

    // 2. Check if it's a JSON-like object string
    if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
        try {
            const parsed = JSON.parse(cleaned);
            // If it's a simple object, find the first string value that isn't empty
            const values = Object.values(parsed).filter(v => typeof v === 'string' && v.length > 0);
            if (values.length > 0) return values[0] as string;
        } catch (_e) {
            // If JSON.parse fails, try regex for common key patterns or just quoted strings
            // Specifically look for values after colons, excluding common keys
            const valueMatch = cleaned.match(/:\s*"([^"]+)"/);
            if (valueMatch) return valueMatch[1];

            const generalMatch = cleaned.match(/"([^"]+)"/g);
            if (generalMatch && generalMatch.length > 1) {
                // If multiple quotes, usually the second one is the value in a K-V pair
                return generalMatch[1].replace(/"/g, '');
            }
        }
    }

    // 3. Strip Markdown Bolding (Double asterisks)
    cleaned = cleaned.replace(/\*\*/g, '');

    // 4. Strip leading/trailing quotes and backticks
    return cleaned
        .replace(/^["'`]|["'`]$/g, '')
        .trim();
}

export async function fetchWithRetry(url: string, options: RequestInit, retries = 2, delay = 1000): Promise<Response> {
    try {
        const response = await fetch(url, options);
        if (response.ok) return response;
        if (retries > 0 && response.status >= 500) {
            await new Promise(r => setTimeout(r, delay));
            return fetchWithRetry(url, options, retries - 1, delay * 2);
        }
        return response;
    } catch (error) {
        if (retries > 0) {
            await new Promise(r => setTimeout(r, delay));
            return fetchWithRetry(url, options, retries - 1, delay * 2);
        }
        throw error;
    }
}

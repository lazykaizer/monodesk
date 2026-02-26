"use server";

export async function testImageGenerationAction(apiKey: string, prompt: string, model: string) {
    if (!apiKey) return { error: "API Key is missing" };

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        console.log(`Testing Generation (${model}) via Server Action (generateContent): `, url);

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            }),
        });

        const responseText = await response.text();
        console.log("Server Action Raw Response:", responseText.substring(0, 500));

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            return { error: `Invalid JSON: ${responseText.substring(0, 100)}...` };
        }

        if (!response.ok) {
            console.error("Server Action API Error:", data);
            return { error: data.error?.message || `API Status: ${response.status} - ${JSON.stringify(data)}` };
        }

        return data;

    } catch (error: any) {
        console.error("Server Action Network Error:", error);
        return { error: error.message };
    }
}

export async function testVideoGenerationAction(apiKey: string, prompt: string, model: string) {
    if (!apiKey) return { error: "API Key is missing" };

    try {
        // Veo uses predictLongRunning
        const baseUrl = "https://generativelanguage.googleapis.com/v1beta";
        const predictUrl = `${baseUrl}/models/${model}:predictLongRunning?key=${apiKey}`;

        console.log(`Starting Video Gen (${model}) via predictLongRunning: `, predictUrl);

        // Veo Payload Structure (Vertex AI style often adopted by Gen AI for predict)
        // Trying standard inputs first.
        const response = await fetch(predictUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                // Common structure for predict endpoints
                instances: [
                    { prompt: prompt }
                ]
            }),
        });

        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            return { error: `Invalid JSON from Start: ${responseText}` };
        }

        if (!response.ok) {
            // Fallback: Try 'instances' format if 'inputs' failed logic (though pure API usually accepts just JSON body)
            // But let's log the error first.
            console.error("Video Start Error:", data);
            return { error: data.error?.message || `Start Failed: ${JSON.stringify(data)}` };
        }

        console.log("Video Operation Started:", data);

        // Expecting { name: "operations/..." }
        const operationName = data.name;
        if (!operationName) {
            return { error: "No operation name returned", raw: data };
        }

        // POLLING LOOP
        const maxRetries = 30; // 30 * 2s = 60s timeout (might need more, but good for test)
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

        for (let i = 0; i < maxRetries; i++) {
            await delay(2000); // 2 second delay

            const pollUrl = `${baseUrl}/${operationName}?key=${apiKey}`;
            const pollRes = await fetch(pollUrl);
            const pollData = await pollRes.json();

            console.log(`Polling ${i + 1}/${maxRetries}:`, pollData.done ? "DONE" : "IN_PROGRESS");

            if (pollData.done) {
                if (pollData.error) {
                    return { error: pollData.error.message };
                }

                // Result usually in response
                return pollData.response || pollData; // Return full final data
            }
        }

        return { error: "Timeout waiting for video. Operation is still running.", operationName, manualCheck: `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}` };

    } catch (error: any) {
        console.error("Server Action Network Error:", error);
        return { error: error.message };
    }
}

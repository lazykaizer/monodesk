"use client";

import { useState } from "react";
import { Video, Loader2, AlertTriangle, CheckCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { testImageGenerationAction, testVideoGenerationAction } from "./actions"; // Reusing the action structure

export default function TestGeminiKey() {
    const [prompt, setPrompt] = useState("A cinematic drone shot of a futuristic city on Mars, 8k, detailed");
    const [videoResult, setVideoResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string>("");

    const MODEL_NAME = "veo-3.1-generate-preview";

    const testVideoGen = async () => {
        setLoading(true);
        setVideoResult(null);
        setError(null);
        setLogs("Starting video generation request...\n");

        try {
            const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            if (!API_KEY) {
                throw new Error("API Key not found");
            }

            // We will use the dedicated video action
            const result = await testVideoGenerationAction(API_KEY, prompt, MODEL_NAME);

            setLogs(prev => prev + `Status: Received response.\nRaw Data Snippet: ${JSON.stringify(result).substring(0, 200)}...\n`);

            if (result.error) {
                setError(result.error);
            } else {
                // Formatting for display to find out the structure
                setLogs(prev => prev + `Full Response: ${JSON.stringify(result, null, 2)}`);

                // Corrected parsing based on actual response structure
                if (result.generateVideoResponse?.generatedSamples?.[0]?.video?.uri) {
                    const videoUri = result.generateVideoResponse.generatedSamples[0].video.uri;
                    // Append API Key to the URI for browser access (as it's a private resource)
                    setVideoResult(`${videoUri}&key=${API_KEY}`);
                } else if (result.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                    setVideoResult(`data:${result.candidates[0].content.parts[0].inlineData.mimeType};base64,${result.candidates[0].content.parts[0].inlineData.data}`);
                } else {
                    setError("Success response received but couldn't parse video path. See logs.");
                }
            }

        } catch (err: any) {
            setError(`Client Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans flex flex-col items-center justify-center">
            <div className="max-w-4xl w-full space-y-8 border border-white/10 p-8 rounded-xl bg-zinc-900/50 shadow-2xl">

                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
                        <span className="text-blue-500">Gemini Video Test</span>
                    </h1>
                    <p className="text-zinc-400 text-sm">Testing Model: <code className="text-blue-300 bg-white/5 px-1 rounded">{MODEL_NAME}</code></p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs text-zinc-500 uppercase tracking-widest font-bold ml-1">Video Prompt</label>
                            <div className="flex gap-2">
                                <Input
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="bg-black/50 border-white/10 h-12 text-lg focus-visible:ring-blue-500/50"
                                    placeholder="Enter video prompt..."
                                />
                                <Button
                                    onClick={testVideoGen}
                                    disabled={loading}
                                    className={`h-12 px-6 ${loading ? "opacity-50 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"}`}
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : <Video />}
                                </Button>
                            </div>
                        </div>

                        {/* Error State */}
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-200 text-sm break-all">
                                <strong>Error:</strong> {error}
                            </div>
                        )}

                        {/* Logs */}
                        <div className="p-4 bg-black/40 border border-white/5 rounded-lg font-mono text-[10px] text-zinc-500 whitespace-pre-wrap break-all h-96 overflow-y-auto">
                            {loading && <p className="animate-pulse text-blue-400">Processing... Video generation can take 1-2 minutes...</p>}
                            {logs}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="aspect-video bg-black rounded-lg border border-white/10 flex items-center justify-center overflow-hidden relative">
                            {videoResult ? (
                                <video controls autoPlay loop src={videoResult} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-zinc-700 flex flex-col items-center">
                                    <Video className="w-12 h-12 mb-2 opacity-20" />
                                    <span className="text-sm">Video will appear here</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

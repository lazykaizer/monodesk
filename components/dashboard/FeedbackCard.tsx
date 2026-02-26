"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Persona {
    id: string;
    name: string;
    role: string;
    avatar_url?: string;
    bio: string;
    is_system?: boolean;
    color?: string;
}

interface FeedbackCardProps {
    persona: Persona;
    feedback: string; // Can be raw JSON string or plain text
    onDownload: () => void;
    className?: string;
}

/**
 * Parse feedback text and extract JSON if present
 * Handles cases like: {"feedback": "text..."} or plain text
 */
function parseFeedback(rawFeedback: string): string {
    // First trim the input
    const trimmed = rawFeedback.trim();

    // Check if it looks like JSON (starts with { and ends with })
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
            // Try to parse as JSON
            const parsed = JSON.parse(trimmed);

            // If it's an object with a feedback property, extract it
            if (parsed && typeof parsed === 'object' && 'feedback' in parsed) {
                return parsed.feedback;
            }
        } catch {
            // If JSON parsing fails, try to extract feedback manually
            const match = trimmed.match(/"feedback"\s*:\s*"([^"]*)"/);
            if (match && match[1]) {
                return match[1];
            }
        }
    }

    // If not JSON or parsing failed, return as-is
    return trimmed;
}

/**
 * Highlight text wrapped in ** markers
 * Example: "What's your **moat**?" -> "What's your <span class='highlight'>moat</span>?"
 */
function highlightText(text: string): React.ReactElement[] {
    const parts = text.split(/(\*\*.*?\*\*)/);

    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            const highlightedText = part.slice(2, -2);
            return (
                <span
                    key={index}
                    className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded mx-0.5 font-semibold border-b border-blue-500/50"
                >
                    {highlightedText}
                </span>
            );
        }
        return <span key={index}>{part}</span>;
    });
}

export function FeedbackCard({ persona, feedback, onDownload, className }: FeedbackCardProps) {
    // Parse the feedback (handle JSON if present)
    const parsedFeedback = parseFeedback(feedback);

    // Highlight important text
    const highlightedContent = highlightText(parsedFeedback);

    return (
        <div className={cn("animate-in slide-in-from-bottom-4 duration-500 fade-in", className)}>
            {/* Header: Persona Info + Download Button */}
            <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-10 h-10 border border-white/10 shadow-lg">
                    <AvatarImage
                        src={persona.avatar_url}
                        alt={persona.name}
                        className="object-cover"
                    />
                    <AvatarFallback className="bg-zinc-800 text-white font-bold">
                        {persona.name[0]}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                    <div className="text-sm font-bold text-white">{persona.name}</div>
                    <div className="text-xs text-zinc-400">
                        {persona.role}
                    </div>
                </div>
            </div>

            {/* Body: Feedback with Highlights */}
            <div className="bg-zinc-900/80 p-5 rounded-2xl rounded-tl-none border border-white/10 text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap shadow-xl relative backdrop-blur-sm">
                {/* Speech bubble tail */}
                <div className="absolute top-0 left-0 w-3 h-3 -translate-x-full bg-transparent border-t-[10px] border-l-[10px] border-t-zinc-900/80 border-l-transparent transform rotate-90"></div>

                {/* Highlighted content */}
                <div className="space-y-2">
                    {highlightedContent}
                </div>
            </div>

            {/* Footer: Timestamp */}
            <div className="mt-3 flex justify-end">
                <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider bg-black/30 px-2 py-1 rounded border border-white/5">
                    AI Generated • {new Date().toLocaleTimeString()}
                </div>
            </div>
        </div>
    );
}

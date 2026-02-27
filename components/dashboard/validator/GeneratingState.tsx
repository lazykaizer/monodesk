import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GeneratingStateProps {
    projectName?: string;
}

const STEPS = [
    "Initializing Deep Market Scan...",
    "Aligning Concept with Global Trends...",
    "Identifying Hidden Competitor Gaps...",
    "Calculating Success Probability...",
    "Structuring Strategic Narrative...",
    "Refining MVP Architecture...",
    "Polishing Final Verdict for [Project Name]...",
    "Almost there. Finalizing Intelligence..."
];

export default function GeneratingState({ projectName }: GeneratingStateProps) {
    const [currentStepIdx, setCurrentStepIdx] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const stepInterval = setInterval(() => {
            setCurrentStepIdx((prev) => {
                if (prev < STEPS.length - 1) return prev + 1;
                return prev; // Stay on last message
            });
        }, 2500);

        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev < 90) return prev + 0.5;
                return prev;
            });
        }, 200);

        return () => {
            clearInterval(stepInterval);
            clearInterval(progressInterval);
        };
    }, []);

    const getMessage = (idx: number) => {
        let msg = STEPS[idx];
        if (msg.includes('[Project Name]')) {
            msg = msg.replace('[Project Name]', projectName || 'your idea');
        }
        return msg;
    };

    return (
        <div className="flex flex-col items-center justify-center pt-2 pb-8 px-8 space-y-6">
            {/* Status Stream */}
            <div className="text-center h-8 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStepIdx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                        className="font-mono text-cyan-400 text-sm tracking-widest flex items-center gap-2"
                    >
                        <span className="text-cyan-500/50 mr-2">{">"}</span>
                        {getMessage(currentStepIdx)}
                        {currentStepIdx === STEPS.length - 1 && (
                            <motion.span
                                animate={{ opacity: [1, 0, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            >
                                ...
                            </motion.span>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

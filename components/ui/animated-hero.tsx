"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";

function AnimatedHero() {
    const [titleNumber, setTitleNumber] = useState(0);
    const titles = useMemo(
        () => ["chaotic", "expensive", "slow", "tedious", "outdated"],
        []
    );

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (titleNumber === titles.length - 1) {
                setTitleNumber(0);
            } else {
                setTitleNumber(titleNumber + 1);
            }
        }, 2000);
        return () => clearTimeout(timeoutId);
    }, [titleNumber, titles]);

    return (
        <div className="w-full">
            <div className="container mx-auto">
                <div className="flex gap-8 py-10 lg:py-20 items-center justify-center flex-col">
                    <div>
                        <Button variant="secondary" size="sm" className="gap-4">
                            The End of Tool Fatigue <MoveRight className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex gap-4 flex-col">
                        <h1 className="text-5xl md:text-7xl max-w-4xl tracking-tighter text-center font-regular">
                            <span className="text-white/50">Founding a company is</span>
                            <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1 h-[1.3em]">
                                &nbsp;
                                {titles.map((title, index) => (
                                    <motion.span
                                        key={index}
                                        className="absolute font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400"
                                        initial={{ opacity: 0, y: "100%" }}
                                        transition={{ type: "spring", stiffness: 50 }}
                                        animate={
                                            titleNumber === index
                                                ? {
                                                    y: 0,
                                                    opacity: 1,
                                                }
                                                : {
                                                    y: titleNumber > index ? "-100%" : "100%",
                                                    opacity: 0,
                                                }
                                        }
                                    >
                                        {title}
                                    </motion.span>
                                ))}
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center mx-auto text-white/70">
                            You juggle 100 different tools—spreadsheets for finance, Canva for design, and agencies for marketing.
                            <br className="hidden md:block" />
                            <span className="text-white font-medium">Monodesk is the Unified Operating System that replaces them all.</span> From a "Ruthless VC" Idea Validator to a real-time Finance Heartbeat, we take you from idea to exit in one interface.
                        </p>
                    </div>
                    <div className="flex flex-row gap-3">
                        <Button size="lg" className="gap-4 bg-white text-black hover:bg-white/90">
                            Start Building <MoveRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export { AnimatedHero };

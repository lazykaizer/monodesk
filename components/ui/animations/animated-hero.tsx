"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoveRight } from "lucide-react";
import { Button } from "@/components/ui/core/button";

function AnimatedHero() {
    const [index, setIndex] = useState(0);
    const roles = useMemo(() => ["CEO", "Designer", "Accountant", "Product Manager", "Entire Team"], []);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % roles.length);
        }, 2200);
        return () => clearInterval(interval);
    }, [roles.length]);

    return (
        <section className="w-full relative pt-32 pb-12 overflow-hidden bg-[#030304]">
            {/* Professional Background: Subtle & Deep */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(59,130,246,0.08)_0%,_transparent_50%)]" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col items-center text-center gap-8 md:gap-12">

                    {/* Eyebrow: Minimalist */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-sm">
                            <span className="text-[11px] uppercase tracking-[0.25em] text-blue-400 font-semibold">The End of the Fragmented Office</span>
                            <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                        </div>
                    </motion.div>

                    {/* Headline: Pro Scale & Balanced */}
                    <div className="flex flex-col gap-2 max-w-5xl">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[1.1]"
                        >
                            An entire company. <br />
                            <span className="text-white/40">Built on a single</span>{" "}
                            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                desk
                            </span>
                            .
                        </motion.h1>

                        {/* Sub-animation: Role Label with smooth cycling */}
                        <div className="h-10 flex items-center justify-center mt-2">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={roles[index]}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="text-base md:text-lg font-mono text-blue-400/60 tracking-[0.25em] uppercase font-medium"
                                >
                                    For the {roles[index]}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Paragraph: Readable & Elegant */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="text-lg md:text-xl text-white/50 max-w-2xl leading-relaxed text-balance font-light"
                    >
                        Every role used to need its own isolated space—a desk for the CEO, a canvas for the Designer, a ledger for the CA, and a roadmap for the Product Manager.
                        <span className="text-white/90"> It was chaotic.</span> We built Monodesk because you shouldn't need a dozen different platforms to run one startup.
                        <br className="mt-4 block" />
                        <span className="text-white/70">"Mono" means one. "Desk" is where the work gets done. Your entire company, unified in one place.</span>
                    </motion.p>


                </div>
            </div>
        </section>
    );
}

export { AnimatedHero };

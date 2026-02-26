"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface GooeyTextProps {
    texts: string[];
    morphTime?: number;
    cooldownTime?: number;
    className?: string;
    textClassName?: string;
}

export function GooeyText({
    texts,
    morphTime = 1,
    cooldownTime = 0.25,
    className,
    textClassName
}: GooeyTextProps) {
    const text1Ref = React.useRef<HTMLSpanElement>(null);
    const text2Ref = React.useRef<HTMLSpanElement>(null);

    React.useEffect(() => {
        let textIndex = texts.length - 1;
        let time = new Date();
        let morph = 0;
        let cooldown = cooldownTime;

        const setMorph = (fraction: number) => {
            // Smoother transition curve (Ease In-Out Cubic)
            // Reference: 100px max blur is too much, reducing to 20px
            // Easing function for smoother fade

            const easedFraction = fraction < 0.5
                ? 4 * fraction * fraction * fraction
                : 1 - Math.pow(-2 * fraction + 2, 3) / 2;

            if (text1Ref.current && text2Ref.current) {
                // Reduced max blur from 100px (crazy) to ~12px more reasonable
                // Using exponential decay for natural look
                const blurValue = Math.min(8 / fraction - 8, 20);

                text2Ref.current.style.filter = `blur(${blurValue}px)`;
                text2Ref.current.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

                const fractionReverse = 1 - fraction;
                const blurValueReverse = Math.min(8 / fractionReverse - 8, 20);

                text1Ref.current.style.filter = `blur(${blurValueReverse}px)`;
                text1Ref.current.style.opacity = `${Math.pow(fractionReverse, 0.4) * 100}%`;
            }
        };

        const doCooldown = () => {
            morph = 0;
            if (text1Ref.current && text2Ref.current) {
                text2Ref.current.style.filter = "";
                text2Ref.current.style.opacity = "100%";
                text1Ref.current.style.filter = "";
                text1Ref.current.style.opacity = "0%";
            }
        };

        const doMorph = () => {
            morph -= cooldown;
            cooldown = 0;
            let fraction = morph / morphTime;

            if (fraction > 1) {
                cooldown = cooldownTime;
                fraction = 1;
            }

            setMorph(fraction);
        };

        let animationId: number;

        function animate() {
            animationId = requestAnimationFrame(animate);
            const newTime = new Date();
            const shouldIncrementIndex = cooldown > 0;
            const dt = (newTime.getTime() - time.getTime()) / 1000;
            time = newTime;

            cooldown -= dt;

            if (cooldown <= 0) {
                if (shouldIncrementIndex) {
                    textIndex = (textIndex + 1) % texts.length;
                    if (text1Ref.current && text2Ref.current) {
                        text1Ref.current.textContent = texts[textIndex % texts.length];
                        text2Ref.current.textContent = texts[(textIndex + 1) % texts.length];
                    }
                }
                doMorph();
            } else {
                doCooldown();
            }
        }

        animate();

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [texts, morphTime, cooldownTime]);

    return (
        <div className={cn("relative pointer-events-none select-none", className)}>
            <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
                <defs>
                    <filter id="threshold">
                        <feColorMatrix
                            in="SourceGraphic"
                            type="matrix"
                            values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 255 -100"
                        />
                        {/* Adjusted alpha offset from -140 to -100 for smoother edge */}
                    </filter>
                </defs>
            </svg>

            <div
                className="flex items-center justify-center w-full"
                style={{ filter: "url(#threshold)" }}
            >
                <span
                    ref={text1Ref}
                    className={cn(
                        "absolute inline-block w-full text-center text-4xl md:text-5xl font-bold tracking-tight",
                        "text-white drop-shadow-lg",
                        textClassName
                    )}
                />
                <span
                    ref={text2Ref}
                    className={cn(
                        "absolute inline-block w-full text-center text-4xl md:text-5xl font-bold tracking-tight",
                        "text-white drop-shadow-lg",
                        textClassName
                    )}
                />
            </div>
        </div>
    );
}

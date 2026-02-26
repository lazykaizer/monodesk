"use client";

import { useEffect, useRef, useState } from "react";
import { useScroll, useTransform, motion, AnimatePresence } from "framer-motion";

const FRAME_COUNT = 232;
const IMAGES_DIR = "/hero-sequence";

export default function MonodeskHero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    // Transform scroll progress to frame index
    const frameIndex = useTransform(scrollYProgress, [0, 1], [1, FRAME_COUNT]);

    // Preload images
    useEffect(() => {
        let loadedCount = 0;
        const loadedImages: HTMLImageElement[] = [];

        for (let i = 1; i <= FRAME_COUNT; i++) {
            const img = new Image();
            // Pad with zeros: 001, 002, ... 232
            const paddedIndex = i.toString().padStart(3, "0");
            img.src = `${IMAGES_DIR}/ezgif-frame-${paddedIndex}.jpg`;
            img.onload = () => {
                loadedCount++;
                if (loadedCount === FRAME_COUNT) {
                    setIsLoaded(true);
                }
            };
            loadedImages.push(img);
        }
        setImages(loadedImages);
    }, []);

    // Canvas Rendering Logic
    useEffect(() => {
        if (!isLoaded || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const render = () => {
            // Get current frame index (1-based)
            let index = Math.floor(frameIndex.get());
            if (index < 1) index = 1;
            if (index > FRAME_COUNT) index = FRAME_COUNT;

            const image = images[index - 1];
            if (!image) return;

            // "Cover" scaling logc
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const imgRatio = image.width / image.height;
            const canvasRatio = canvasWidth / canvasHeight;

            let renderWidth, renderHeight, offsetX, offsetY;

            if (canvasRatio > imgRatio) {
                renderWidth = canvasWidth;
                renderHeight = canvasWidth / imgRatio;
                offsetX = 0;
                offsetY = (canvasHeight - renderHeight) / 2;
            } else {
                renderWidth = canvasHeight * imgRatio;
                renderHeight = canvasHeight;
                offsetX = (canvasWidth - renderWidth) / 2;
                offsetY = 0;
            }

            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.drawImage(image, offsetX, offsetY, renderWidth, renderHeight);

            requestAnimationFrame(render);
        };

        const animationId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationId);
    }, [isLoaded, frameIndex, images]);

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };
        window.addEventListener("resize", handleResize);
        handleResize();
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Text Overlay Opacities
    // Text Overlay Opacities removed

    return (
        <div ref={containerRef} className="h-[400vh] relative bg-background">
            <div className="sticky top-0 h-screen w-full overflow-hidden">
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Loading State */}
                {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background z-50">
                        <div className="text-accent-cyan font-mono animate-pulse">
                            Loading System Core...
                        </div>
                    </div>
                )}

                {/* Text Overlays removed per user request */}
            </div>
        </div>
    );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useScroll, useTransform, motion } from "framer-motion";

const FRAME_COUNT = 232;
const IMAGES_DIR = "/hero-sequence";

export default function MonodeskHero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [imgRatioState, setImgRatioState] = useState<number | null>(null);
    const [isMobileState, setIsMobileState] = useState(false);
    const [mobileCanvasHeightPx, setMobileCanvasHeightPx] = useState<number | undefined>(undefined);
    const [windowHeight, setWindowHeight] = useState(0);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    // Frames play through 75% of scroll; last 25% is the slide-up phase (mobile)
    const frameIndex = useTransform(scrollYProgress, [0, 0.75], [1, FRAME_COUNT]);

    // Track window height for mobile centering offset
    useEffect(() => {
        const update = () => setWindowHeight(window.innerHeight);
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    useEffect(() => {
        const check = () => setIsMobileState(window.innerWidth < 1024);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    // Preload images
    useEffect(() => {
        let loadedCount = 0;
        const loadedImages: HTMLImageElement[] = [];
        for (let i = 1; i <= FRAME_COUNT; i++) {
            const img = new Image();
            const paddedIndex = i.toString().padStart(3, "0");
            img.src = `${IMAGES_DIR}/ezgif-frame-${paddedIndex}.jpg`;
            img.onload = () => {
                loadedCount++;
                if (loadedCount === 1) setImgRatioState(img.naturalWidth / img.naturalHeight);
                if (loadedCount === FRAME_COUNT) setIsLoaded(true);
            };
            loadedImages.push(img);
        }
        setImages(loadedImages);
    }, []);

    // Canvas rendering
    useEffect(() => {
        if (!isLoaded || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const render = () => {
            let index = Math.floor(frameIndex.get());
            if (index < 1) index = 1;
            if (index > FRAME_COUNT) index = FRAME_COUNT;
            const image = images[index - 1];
            if (!image) return;

            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const imgRatio = image.width / image.height;
            const canvasRatio = canvasWidth / canvasHeight;
            const isMobile = window.innerWidth < 1024;

            let renderWidth, renderHeight, offsetX, offsetY;
            if (isMobile) {
                renderWidth = canvasWidth;
                renderHeight = canvasWidth / imgRatio;
                offsetX = 0;
                offsetY = 0;
            } else if (canvasRatio > imgRatio) {
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

    // Handle resize - canvas pixel dimensions
    useEffect(() => {
        const handleResize = () => {
            if (!canvasRef.current) return;
            const isMobile = window.innerWidth < 1024;
            const w = window.innerWidth;
            const h = isMobile && imgRatioState ? w / imgRatioState : window.innerHeight;
            canvasRef.current.width = w;
            canvasRef.current.height = h;
            if (isMobile && imgRatioState) setMobileCanvasHeightPx(Math.round(h));
        };
        window.addEventListener("resize", handleResize);
        handleResize();
        return () => window.removeEventListener("resize", handleResize);
    }, [imgRatioState]);

    const stickyHeight = isMobileState && mobileCanvasHeightPx
        ? mobileCanvasHeightPx
        : undefined;

    // On mobile: canvas starts vertically centered, then slides to top in last 25% of scroll
    const mobileOffset = isMobileState && mobileCanvasHeightPx && windowHeight
        ? windowHeight / 2 - mobileCanvasHeightPx / 2
        : 0;

    const mobileY = useTransform(
        scrollYProgress,
        [0, 0.75, 1],
        isMobileState ? [mobileOffset, mobileOffset, 0] : [0, 0, 0]
    );

    // Arrows fade out once user starts scrolling (first 6%)
    const arrowOpacity = useTransform(scrollYProgress, [0, 0.06], [1, 0]);

    return (
        <div
            ref={containerRef}
            className="h-[400vh] max-lg:h-[300vh] relative bg-background"
        >
            <motion.div
                style={{
                    height: stickyHeight ? `${stickyHeight}px` : "100vh",
                    y: mobileY,
                }}
                className="sticky top-0 w-full overflow-hidden"
            >
                <canvas
                    ref={canvasRef}
                    className={isMobileState ? "w-full block" : "absolute inset-0 w-full h-full"}
                    style={isMobileState && stickyHeight ? { height: stickyHeight } : undefined}
                />
                {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background z-50">
                        <div className="text-accent-cyan font-mono animate-pulse">
                            Loading System Core...
                        </div>
                    </div>
                )}

                {/* Mobile-only bouncing scroll hint — absolute bottom center of canvas */}
                {isMobileState && (
                    <motion.div
                        style={{ opacity: arrowOpacity }}
                        className="absolute bottom-5 left-0 right-0 flex flex-col items-center gap-0 pointer-events-none select-none z-20"
                    >
                        <motion.svg
                            animate={{ y: [0, -7, 0] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                            width="32" height="32" viewBox="0 0 24 24" fill="none"
                            className="text-white/80 drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]"
                        >
                            <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </motion.svg>
                        <motion.svg
                            animate={{ y: [0, -7, 0] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                            width="32" height="32" viewBox="0 0 24 24" fill="none"
                            className="text-white/40 -mt-4 drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]"
                        >
                            <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </motion.svg>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}

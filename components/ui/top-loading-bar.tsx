"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useSearchParams } from "next/navigation";

export default function TopLoadingBar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Start loading when pathname or searchParams change
        setLoading(true);

        // Simulating completion after a short delay (once the new page is roughly ready)
        const timer = setTimeout(() => {
            setLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [pathname, searchParams]);

    return (
        <AnimatePresence>
            {loading && (
                <motion.div
                    initial={{ width: 0, opacity: 1 }}
                    animate={{ width: "100%", opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                        width: { duration: 0.4, ease: "circOut" },
                        opacity: { duration: 0.2 }
                    }}
                    className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 z-[99999] shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                />
            )}
        </AnimatePresence>
    );
}

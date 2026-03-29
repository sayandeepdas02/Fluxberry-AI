"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pathname} // Triggers the re-render animation when pathname changes
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ 
                    duration: 0.15,
                    ease: [0.4, 0, 0.2, 1] // Linear-style sharp drop-in easing
                }}
                className="w-full h-full"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}

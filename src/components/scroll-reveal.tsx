"use client";

import { motion, useInView } from "framer-motion";
import { useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
    children: ReactNode;
    width?: "fit-content" | "100%";
    delay?: number;
    className?: string;
}

export default function ScrollReveal({ children, width = "100%", delay = 0, className }: ScrollRevealProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    return (
        <div
            ref={ref}
            className={cn("w-full", className)}
            style={{
                position: "relative",
                overflow: "hidden"
            }}
        >
            <motion.div
                variants={{
                    hidden: { opacity: 0, y: 50 },
                    visible: { opacity: 1, y: 0 },
                }}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                transition={{ duration: 0.5, delay, ease: "easeOut" }}
                className={cn("w-full h-full", className?.includes("h-full") ? "h-full" : "")}
            >
                {children}
            </motion.div>
        </div>
    );
}

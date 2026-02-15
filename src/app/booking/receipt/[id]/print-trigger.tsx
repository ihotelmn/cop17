"use client";

import { useEffect } from "react";

export function PrintTrigger() {
    useEffect(() => {
        // Delay slightly for any fonts/images to settle if needed, 
        // though browser usually handles it well.
        const timer = setTimeout(() => {
            window.print();
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    return null;
}

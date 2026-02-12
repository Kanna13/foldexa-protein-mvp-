"use client";

import { motion } from "framer-motion";

export function HeroVisual() {
    return (
        <div className="relative w-full min-h-screen overflow-hidden bg-black">

            {/* Background Image */}
            <div className="absolute inset-0 -z-10">
                <img
                    src="/hero-bg.png"
                    alt="Protein background"
                    className="w-full h-full object-cover opacity-70"
                />
            </div>

            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/60" />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black" />

            {/* Accent Gradient */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent opacity-50" />

            {/* Tech Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20
                bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),
                linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)]
                bg-[size:40px_40px]" />

            {/* Vignette */}
            <div className="absolute inset-0 pointer-events-none
                bg-[radial-gradient(circle_at_center,transparent_40%,black_100%)]
                opacity-80" />

        </div>
    );
}
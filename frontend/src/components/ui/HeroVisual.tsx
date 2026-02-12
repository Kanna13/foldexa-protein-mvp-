"use client";

import { motion } from "framer-motion";

export function HeroVisual() {
    return (
        <div className="w-full h-[100dvh] relative overflow-hidden bg-black">

            {/* Video Background */}
            <div className="absolute inset-0 flex items-center justify-center">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{ willChange: "transform" }}
                    className="w-full h-full object-cover opacity-60 mix-blend-screen"
                    poster="/hero-bg.png"
                >
                    {/* Place your video file in frontend/public/hero.mp4 */}
                    <source src="/hero.mp4" type="video/mp4" />
                </video>

                {/* Fallback Animated AI Image (Visible if video fails) */}
                <div className="absolute inset-0 -z-10 flex items-center justify-center">
                    <img
                        src="/hero-bg.png"
                        alt="Cinematic Protein Structure Advertisement"
                        className="w-full h-full object-cover animate-ken-burns opacity-70"
                    />
                </div>

                {/* Minimalistic Dark Fade Overlay */}
                <div className="absolute inset-0 bg-black/60" />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black" />

                {/* Fallback Gradient (Simplified for performance) */}
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent opacity-50" />
            </div>

            {/* Overlay Mesh / Grid for "Tech" feel */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />

            {/* Vignette */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-black opacity-80" />
        </div>
    );
}

"use client";

import { motion } from "framer-motion";

export function BetaAccessHero() {
    return (
        <div className="text-center mb-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <span className="inline-block px-3 py-1 mb-6 text-xs font-semibold tracking-wider text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    Private Beta
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
                    Request Early Access <br /> to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">Foldexa</span>
                </h1>
                <p className="max-w-2xl mx-auto text-lg text-neutral-400 leading-relaxed">
                    Foldexa is currently in private beta. Tell us about yourself and your work, and we’ll grant access to selected researchers and teams.
                </p>
            </motion.div>
        </div>
    );
}

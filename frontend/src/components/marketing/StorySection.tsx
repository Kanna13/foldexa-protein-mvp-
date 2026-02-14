"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X } from "lucide-react";

// Founder Data
const FOUNDERS = [
    {
        id: "azamat",
        name: "Azamat",
        role: "Bioengineer — KAIST",
        quote: "Understanding life at molecular level",
        bio: [
            "My journey started in the labs of KAIST, where I realized that traditional methods of protein engineering were too slow for the pace of modern disease.",
            "I spent years manually designing sequences, often hitting dead ends. I knew there had to be a way to simulate nature's complexity before ever touching a pipette.",
            "Foldexa is the tool I wish I had: a bridge between biological intuition and computational power."
        ],
        color: "from-emerald-500/10 to-emerald-500/5",
        border: "group-hover:border-emerald-500/50",
        textAccent: "text-emerald-600",
        initials: "AZ"
    },
    {
        id: "kanat",
        name: "Kanat Tilekov",
        role: "Software Developer & Data Analyst",
        quote: "Building the infrastructure science deserves",
        bio: [
            "Code is the language of logic, but biology is the language of life. Bringing them together requires more than just algorithms—it requires empathy for the scientist.",
            "I built the Foldexa architecture to be invisible. You shouldn't have to be a cloud engineer to run AlphaFold. You should just focus on the science.",
            "We are building the AWS for biology, one microservice at a time."
        ],
        color: "from-blue-500/10 to-blue-500/5",
        border: "group-hover:border-blue-500/50",
        textAccent: "text-blue-600",
        initials: "KT"
    },
    {
        id: "sarzmuza",
        name: "Sarzmuza Issabek",
        role: "Business & Growth",
        quote: "Turning scientific power into real-world impact",
        bio: [
            "Innovation without application is just theory. My mission is to ensure that Foldexa doesn't just stay in the lab, but reaches the pharmaceutical companies that need it most.",
            "I saw the gap between academic breakthrough and commercial reality. Foldexa bridges that gap by making high-performance computing accessible to startups and giants alike.",
            "We aren't just building software; we're accelerating the cure."
        ],
        color: "from-purple-500/10 to-purple-500/5",
        border: "group-hover:border-purple-500/50",
        textAccent: "text-purple-600",
        initials: "SI"
    }
];

export function StorySection() {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSelectedId(null);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <section className="bg-white text-neutral-900 py-32 relative overflow-hidden font-sans">
            {/* Background Ambience - Light Mode */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.03),transparent_60%)] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">

                {/* 1. INTRO BLOCK */}
                <div className="mb-24 text-center max-w-4xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-6xl font-bold tracking-tight mb-8 leading-tight text-neutral-900"
                    >
                        Three different paths.<br />
                        <span className="text-neutral-400">One shared obsession.</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        viewport={{ once: true }}
                        className="text-xl text-neutral-500 leading-relaxed max-w-2xl mx-auto"
                    >
                        We came from different worlds — bioengineering, software, and business.
                        But we shared one belief: <span className="text-neutral-900 font-medium">protein engineering should be accessible to everyone.</span>
                        That belief became Foldexa.
                    </motion.p>
                </div>

                {/* 2. INTERACTIVE FOUNDER CARDS */}
                <div className="relative mb-32">
                    {/* Scroll Area */}
                    <div
                        ref={scrollContainerRef}
                        className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto pb-8 md:pb-0 snap-x snap-mandatory scrollbar-hide"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                    >
                        {FOUNDERS.map((founder) => (
                            <motion.div
                                layoutId={`card-${founder.id}`}
                                key={founder.id}
                                onClick={() => setSelectedId(founder.id)}
                                className={`
                  relative min-w-[85vw] md:min-w-0 snap-center cursor-pointer group
                  bg-white border border-neutral-200 rounded-3xl p-8
                  shadow-sm hover:shadow-xl hover:shadow-neutral-100 transition-all duration-300
                  flex flex-col h-[400px] justify-between
                  overflow-hidden
                  ${selectedId === founder.id ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                `}
                                whileHover={{ y: -5 }}
                            >
                                {/* Glow Effect (Light Mode) */}
                                <div className={`absolute inset-0 bg-gradient-to-b ${founder.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                {/* Content */}
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center font-bold text-lg text-neutral-600 border border-neutral-200">
                                            {founder.initials}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-neutral-900 leading-tight">{founder.name}</h3>
                                            <p className="text-sm text-neutral-500 font-medium">{founder.role}</p>
                                        </div>
                                    </div>

                                    <div className="h-px w-full bg-neutral-100 mb-6" />

                                    <blockquote className="text-2xl font-medium text-neutral-700 leading-snug">
                                        "{founder.quote}"
                                    </blockquote>
                                </div>

                                <div className={`relative z-10 flex items-center text-sm font-bold text-neutral-400 group-hover:${founder.textAccent} transition-colors`}>
                                    Read story <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* EXPANDED OVERLAY */}
                    <AnimatePresence>
                        {selectedId && (
                            <>
                                {/* Backdrop */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setSelectedId(null)}
                                    className="fixed inset-0 bg-neutral-900/20 backdrop-blur-sm z-40 cursor-zoom-out"
                                />

                                {/* Expanded Card */}
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 pointer-events-none">
                                    {FOUNDERS.filter(f => f.id === selectedId).map(founder => (
                                        <motion.div
                                            layoutId={`card-${founder.id}`}
                                            key={founder.id}
                                            className="w-full max-w-3xl bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-2xl pointer-events-auto relative"
                                        >
                                            {/* Close Button */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedId(null); }}
                                                className="absolute top-6 right-6 z-20 w-10 h-10 bg-white/80 hover:bg-neutral-100 rounded-full flex items-center justify-center text-neutral-900 shadow-sm transition-colors border border-neutral-100"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>

                                            <div className="grid md:grid-cols-5 h-full max-h-[85vh] overflow-y-auto">
                                                {/* Sidebar (Visual) */}
                                                <div className={`md:col-span-2 p-10 bg-gradient-to-br ${founder.color} relative flex flex-col justify-end`}>
                                                    <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center font-bold text-3xl text-neutral-700 border border-white/40 mb-8 shadow-sm">
                                                        {founder.initials}
                                                    </div>

                                                    <div className="mt-20">
                                                        <h3 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2">{founder.name}</h3>
                                                        <p className="text-lg text-neutral-600 font-medium">{founder.role}</p>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="md:col-span-3 p-10 md:p-12 bg-white">
                                                    <h4 className={`text-sm font-bold ${founder.textAccent} uppercase tracking-widest mb-8`}>The Story</h4>

                                                    <div className="space-y-6 text-lg text-neutral-600 leading-relaxed">
                                                        {founder.bio.map((paragraph, i) => (
                                                            <p key={i}>{paragraph}</p>
                                                        ))}
                                                    </div>

                                                    <div className="mt-12 pt-8 border-t border-neutral-100">
                                                        <p className="text-neutral-500 italic text-xl">
                                                            "{founder.quote}"
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                {/* 4. FINAL UNITY BLOCK */}
                <div className="text-center max-w-3xl mx-auto">
                    <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-neutral-900"
                    >
                        Three disciplines. Three founders.<br />
                        <span className="text-emerald-600">One platform.</span>
                    </motion.h3>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        viewport={{ once: true }}
                        className="text-lg text-neutral-500 mb-10"
                    >
                        Foldexa brings biology, software, and vision together to accelerate the future of protein engineering.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        viewport={{ once: true }}
                    >
                        <a href="#demo" className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg rounded-full transition-all shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)]">
                            See what we built <ArrowRight className="w-5 h-5" />
                        </a>
                    </motion.div>
                </div>

            </div>
        </section>
    );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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
        image: "/images/team/Azamat.jpeg",
        color: "from-emerald-500/20 to-emerald-900/5",
        border: "group-hover:border-emerald-500/50",
        textAccent: "text-emerald-500",
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
        image: "/images/team/Kanat.JPG",
        color: "from-blue-500/20 to-blue-900/5",
        border: "group-hover:border-blue-500/50",
        textAccent: "text-blue-500",
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
        image: "/images/team/Issabek.png",
        color: "from-purple-500/20 to-purple-900/5",
        border: "group-hover:border-purple-500/50",
        textAccent: "text-purple-500",
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
        <section id="team" className="bg-[#0A0A0A] text-white py-32 relative overflow-hidden font-sans border-t border-white/10">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.05),transparent_50%)] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">

                {/* Section Label */}
                <h3 className="text-5xl md:text-7xl font-bold tracking-tight text-emerald-500 text-center mb-8">
                    We are Foldexa
                </h3>

                {/* 1. INTRO BLOCK */}
                <div className="mb-24 text-center max-w-4xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-6xl font-bold tracking-tight mb-8 leading-tight"
                    >
                        Three different paths.<br />
                        <span className="text-neutral-500">One shared obsession.</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        viewport={{ once: true }}
                        className="text-xl text-neutral-400 leading-relaxed max-w-2xl mx-auto"
                    >
                        We came from different worlds — bioengineering, software, and business.
                        But we shared one belief: <span className="text-white font-medium">protein engineering should be accessible to everyone.</span>
                        That belief became Foldexa.
                    </motion.p>
                </div>

                {/* 2. INTERACTIVE FOUNDER CARDS */}
                <div className="relative mb-32">
                    {/* Scroll Area */}
                    <div
                        ref={scrollContainerRef}
                        className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto pb-4 md:pb-0 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                    >
                        {FOUNDERS.map((founder) => (
                            <motion.div
                                layoutId={`card-${founder.id}`}
                                key={founder.id}
                                onClick={() => setSelectedId(founder.id)}
                                className={`
                  relative min-w-[85vw] md:min-w-0 snap-center cursor-pointer group
                  bg-[#111] border border-neutral-800 rounded-3xl p-8
                  hover:bg-[#161616] transition-colors duration-300
                  flex flex-col h-[400px] justify-between
                  overflow-hidden
                  ${selectedId === founder.id ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                `}
                                whileHover={{ scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            >
                                {/* Glow Effect */}
                                <div className={`absolute inset-0 bg-gradient-to-b ${founder.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                {/* Content */}
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <motion.div
                                            layoutId={`founder-img-${founder.id}`}
                                            className="relative w-14 h-14 overflow-hidden border border-neutral-700 group-hover:border-white/20 transition-colors"
                                            style={{ borderRadius: "50%" }}
                                        >
                                            <Image
                                                src={founder.image}
                                                alt={founder.name}
                                                fill
                                                sizes="(max-width: 768px) 56px, 56px"
                                                className="object-cover"
                                            />
                                        </motion.div>
                                        <div>
                                            <motion.h3 layoutId={`founder-name-${founder.id}`} className="text-xl font-bold text-white leading-tight">{founder.name}</motion.h3>
                                            <motion.p layoutId={`founder-role-${founder.id}`} className="text-sm text-neutral-500 font-medium">{founder.role}</motion.p>
                                        </div>
                                    </div>

                                    <div className="h-px w-full bg-neutral-800 mb-6" />

                                    <blockquote className="text-2xl font-medium text-neutral-300 leading-snug">
                                        "{founder.quote}"
                                    </blockquote>
                                </div>

                                <div className="relative z-10 flex items-center text-sm font-bold text-neutral-500 group-hover:text-white transition-colors">
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
                                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 cursor-zoom-out"
                                />

                                {/* Expanded Card */}
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 pointer-events-none">
                                    {FOUNDERS.filter(f => f.id === selectedId).map(founder => (
                                        <motion.div
                                            layoutId={`card-${founder.id}`}
                                            key={founder.id}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            className="w-full max-w-5xl bg-[#0A0A0A] border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl pointer-events-auto relative flex flex-col md:flex-row h-full max-h-[85vh] cursor-default"
                                        >
                                            {/* Close Button */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedId(null); }}
                                                className="absolute top-6 right-6 z-50 w-10 h-10 bg-black/20 hover:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors border border-white/10"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>

                                            {/* Sidebar (Visual with Background Image) */}
                                            <div
                                                className="relative w-full md:w-2/5 min-h-[300px] md:min-h-full cursor-zoom-out"
                                                onClick={() => setSelectedId(null)}
                                            >
                                                {/* Expanded Image Background */}
                                                <motion.div
                                                    layoutId={`founder-img-${founder.id}`}
                                                    className="absolute inset-0 z-0 overflow-hidden"
                                                    style={{ borderRadius: "0%" }}
                                                >
                                                    <Image
                                                        src={founder.image}
                                                        alt={founder.name}
                                                        fill
                                                        sizes="(max-width: 768px) 100vw, 40vw"
                                                        quality={90}
                                                        className="object-cover brightness-90"
                                                    />
                                                </motion.div>

                                                {/* Gradient Overlay for Text Readability */}
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.5, delay: 0.2 }}
                                                    className="absolute bottom-0 left-0 right-0 h-2/3 z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent"
                                                />

                                                <div className="relative z-20 h-full flex flex-col justify-end p-8 md:p-10 pointer-events-none">
                                                    <motion.h3 layoutId={`founder-name-${founder.id}`} className="text-3xl md:text-4xl font-bold text-white mb-2">{founder.name}</motion.h3>
                                                    <motion.p layoutId={`founder-role-${founder.id}`} className="text-lg text-emerald-400 font-medium">{founder.role}</motion.p>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="relative w-full md:w-3/5 p-10 md:p-12 bg-[#111] overflow-y-auto">
                                                <motion.h4
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.1 }}
                                                    className={`text-sm font-bold ${founder.textAccent} uppercase tracking-widest mb-8`}
                                                >
                                                    The Story
                                                </motion.h4>

                                                <div className="space-y-6 text-lg text-neutral-300 leading-relaxed">
                                                    {founder.bio.map((paragraph, i) => (
                                                        <motion.p
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.2 + (i * 0.1) }}
                                                            key={i}
                                                        >
                                                            {paragraph}
                                                        </motion.p>
                                                    ))}
                                                </div>

                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.5 }}
                                                    className="mt-12 pt-8 border-t border-neutral-800"
                                                >
                                                    <p className="text-neutral-500 italic text-xl">
                                                        "{founder.quote}"
                                                    </p>
                                                </motion.div>
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
                        className="text-3xl md:text-5xl font-bold tracking-tight mb-6"
                    >
                        Three disciplines. Three founders.<br />
                        <span className="text-emerald-500">One platform.</span>
                    </motion.h3>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        viewport={{ once: true }}
                        className="text-lg text-neutral-400 mb-10"
                    >
                        Foldexa brings biology, software, and vision together to accelerate the future of protein engineering.
                    </motion.p>

                    <div className="mt-10">
                        <Link href="/app/new" className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-lg rounded-full transition-colors">
                            See what we built <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>

            </div>
        </section>
    );
}

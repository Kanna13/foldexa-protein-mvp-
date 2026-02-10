"use client";

import { Navbar } from "@/components/ui/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";

const TEAM = [
    {
        name: "Azamat",
        role: "AI & Machine Learning",
        desc: "Leading the development of generative diffusion models for protein design.",
        gradient: "from-blue-500 to-cyan-500"
    },
    {
        name: "Kanat",
        role: "Product & Frontend",
        desc: "Architecting the immersive interface that bridges biology and digital experience.",
        gradient: "from-green-500 to-emerald-500"
    },
    {
        name: "Issabek",
        role: "Biology & Research",
        desc: "Ensuring scientific accuracy and driving the computational biology pipeline.",
        gradient: "from-purple-500 to-pink-500"
    },
];

export default function TeamPage() {
    return (
        <div className="min-h-screen bg-background text-foreground overflow-hidden">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">

                {/* --- Header --- */}
                <section className="text-center mb-24">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl lg:text-7xl font-bold tracking-tighter mb-6"
                    >
                        We are <span className="text-primary">Foldexa.</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-gray-400 max-w-2xl mx-auto"
                    >
                        A multidisciplinary team of engineers, designers, and scientists united by a single mission: to solve the protein folding problem.
                    </motion.p>
                </section>

                {/* --- Team Grid --- */}
                <div className="grid md:grid-cols-3 gap-8">
                    {TEAM.map((member, index) => (
                        <motion.div
                            key={member.name}
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                        >
                            <GlassCard hoverEffect className="h-full flex flex-col items-center text-center group">
                                {/* Avatar Mockup */}
                                <div className={`w-32 h-32 rounded-full bg-gradient-to-tr ${member.gradient} mb-6 blur-[2px] group-hover:blur-0 transition-all duration-500 opacity-80`} />

                                <h3 className="text-2xl font-bold mb-1">{member.name}</h3>
                                <p className="text-primary font-mono text-sm mb-4">{member.role}</p>
                                <p className="text-gray-400 leading-relaxed text-sm">
                                    "{member.desc}"
                                </p>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>

                {/* --- Manifesto --- */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-32 text-center"
                >
                    <p className="text-sm font-mono text-gray-500 uppercase tracking-widest mb-4">Our Vision</p>
                    <h2 className="text-3xl lg:text-4xl font-light italic text-gray-200">
                        "We believe that the future of medicine is <span className="text-primary not-italic font-bold">computational</span>."
                    </h2>
                </motion.div>

            </main>
        </div>
    );
}

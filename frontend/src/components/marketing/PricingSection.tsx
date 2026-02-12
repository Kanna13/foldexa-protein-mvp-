"use client";

import { motion } from "framer-motion";
import { Check, X, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type PricingTier = {
    name: string;
    price: string;
    description: string;
    features: string[];
    isPopular?: boolean;
    cta: string;
    variant: "primary" | "secondary" | "glass";
    limitations?: string[];
};

const tiers: PricingTier[] = [
    {
        name: "Free",
        price: "Free",
        description: "Perfect for students and hobbyists exploring protein design.",
        features: [
            "1/3 Basic Results Metrics",
            "1 Job per day",
            "Public Queue Access",
        ],
        limitations: [
            "No Private Storage",
            "No API Access",
            "Low Priority"
        ],
        cta: "Start Free",
        variant: "glass",
        isPopular: false,
    },
    {
        name: "Standard",
        price: "$9.99",
        description: "For researchers needing reliable metrics and more capacity.",
        features: [
            "2/3 Advanced Results Metrics",
            "10 Candidate Designs / Job",
            "Priority Queue Access",
            "Email Support",
            "Export to PDB",
        ],
        cta: "Get Standard",
        variant: "primary",
        isPopular: true,
    },
    {
        name: "Premium",
        price: "$19.99",
        description: "The complete toolkit for professional bioengineering.",
        features: [
            "All Metrics Unlocked",
            "20 Candidate Designs / Job",
            "Top Priority Computation",
            "Dedicated Support",
            "API Access",
            "Private Artifact Storage",
        ],
        cta: "Go Premium",
        variant: "glass",
        isPopular: false,
    },
];

export function PricingSection() {
    const [expanded, setExpanded] = useState(false);

    return (
        <section id="pricing" className="py-32 bg-neutral-900 text-white relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-5xl font-bold mb-6 tracking-tight"
                    >
                        Choose Your Power
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        viewport={{ once: true }}
                        className="text-xl text-neutral-400 max-w-2xl mx-auto"
                    >
                        Unlock the full potential of your research with plans designed for every stage of your work.
                    </motion.p>
                </div>

                {/* Cards Grid */}
                <div className="grid md:grid-cols-3 gap-8 mb-16 items-start">
                    {tiers.map((tier, idx) => (
                        <motion.div
                            key={tier.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            viewport={{ once: true }}
                            className={`relative p-8 rounded-3xl border flex flex-col h-full ${tier.isPopular
                                ? "bg-white/5 border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.1)] scale-105 z-10"
                                : "bg-neutral-800/50 border-white/5 hover:border-white/10"
                                } backdrop-blur-sm transition-all`}
                        >
                            {tier.isPopular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-black px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/20">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8 text-center md:text-left">
                                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                                <div className="flex items-baseline gap-1 mb-4 justify-center md:justify-start">
                                    <span className="text-5xl font-bold tracking-tight">{tier.price}</span>
                                    {tier.price !== "Free" && <span className="text-neutral-400 text-sm">/mo</span>}
                                </div>
                                <p className="text-neutral-400 text-sm leading-relaxed min-h-[40px]">{tier.description}</p>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {tier.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3 text-sm text-neutral-200">
                                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${tier.isPopular ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-neutral-400"}`}>
                                            <Check className="w-3 h-3" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                                {tier.limitations?.map((limitation) => (
                                    <li key={limitation} className="flex items-start gap-3 text-sm text-neutral-500">
                                        <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-transparent">
                                            <X className="w-3 h-3 opacity-50" />
                                        </div>
                                        {limitation}
                                    </li>
                                ))}
                            </ul>

                            <Button
                                variant={tier.isPopular ? "primary" : "secondary"}
                                className={`w-full py-6 text-base font-semibold ${!tier.isPopular && "bg-white/5 border-white/10 hover:bg-white/10 text-white"}`}
                            >
                                {tier.cta} <ArrowRight className="ml-2 w-4 h-4 opacity-70" />
                            </Button>
                        </motion.div>
                    ))}
                </div>

                {/* Interactive Comparison Toggle */}
                <div className="text-center">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors font-medium text-sm uppercase tracking-wider border-b border-transparent hover:border-white pb-0.5"
                    >
                        {expanded ? "Hide Feature Comparison" : "Compare All Features"}
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>

                {/* Comparison Table (Expandable) */}
                <motion.div
                    initial={false}
                    animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    <div className="pt-12 overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="py-4 pl-4 font-normal text-neutral-500 w-1/3 text-sm uppercase tracking-wider">Feature</th>
                                    <th className="py-4 font-bold text-center w-1/5 text-lg">Free</th>
                                    <th className="py-4 font-bold text-center text-emerald-400 w-1/5 text-lg">Standard</th>
                                    <th className="py-4 font-bold text-center w-1/5 text-lg">Premium</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {[
                                    { feature: "Candidate Generation", free: "1 / Job", standard: "10 / Job", premium: "20 / Job" },
                                    { feature: "Metrics Depth", free: "Basic (1/3)", standard: "Advanced (2/3)", premium: "Full Suite" },
                                    { feature: "Simultaneous Jobs", free: "1", standard: "3", premium: "Unlimited" },
                                    { feature: "Private Storage", free: false, standard: true, premium: true },
                                    { feature: "API Access", free: false, standard: false, premium: true },
                                    { feature: "Priority Support", free: false, standard: "Email", premium: "Dedicated" },
                                ].map((row, idx) => (
                                    <motion.tr
                                        key={row.feature}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="hover:bg-white/5 transition-colors"
                                    >
                                        <td className="py-4 pl-4 text-neutral-300 font-medium">{row.feature}</td>
                                        <td className="py-4 text-center text-neutral-400">
                                            {typeof row.free === 'boolean' ? (row.free ? <Check className="w-5 h-5 mx-auto text-emerald-500" /> : <X className="w-4 h-4 mx-auto opacity-20" />) : row.free}
                                        </td>
                                        <td className="py-4 text-center text-neutral-200 font-medium">
                                            {typeof row.standard === 'boolean' ? (row.standard ? <Check className="w-5 h-5 mx-auto text-emerald-500" /> : <X className="w-4 h-4 mx-auto opacity-20" />) : row.standard}
                                        </td>
                                        <td className="py-4 text-center text-white font-bold">
                                            {typeof row.premium === 'boolean' ? (row.premium ? <Check className="w-5 h-5 mx-auto text-emerald-500" /> : <X className="w-4 h-4 mx-auto opacity-20" />) : row.premium}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

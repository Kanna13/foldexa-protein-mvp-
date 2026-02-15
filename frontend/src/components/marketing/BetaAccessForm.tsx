"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const USAGE_TYPES = [
    "Academic Research",
    "Commercial Use",
    "Startup / Product Development",
    "Personal Exploration"
];

const CONTACT_PREFS = [
    { id: "email", label: "Email" },
    { id: "telegram", label: "Telegram" },
    { id: "linkedin", label: "LinkedIn" }
];

export function BetaAccessForm() {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        org: "",
        role: "",
        usageType: "",
        description: "",
        contactPref: "email",
        contactHandle: "",
        agreement: false
    });

    const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.agreement) return;

        setStatus("loading");

        try {
            const response = await fetch("http://localhost:8000/api/v1/beta/request-access", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setStatus("success");
                console.log("Form Submitted:", formData);
            } else {
                console.error("Submission failed");
                setStatus("idle"); // reset or show error
                alert("Something went wrong. Please try again.");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            setStatus("idle");
            alert("Failed to connect to server.");
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    if (status === "success") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl mx-auto text-center py-20 bg-[#111] border border-white/5 rounded-3xl"
            >
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-500">
                    <Check className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">Request Received</h3>
                <p className="text-neutral-400 text-lg mb-8 max-w-md mx-auto">
                    Thank you for your interest. We've added you to our priority queue and will contact you via {formData.contactPref} soon.
                </p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
                >
                    Return to Homepage
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-xl mx-auto bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
        >
            {/* Glow effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">

                {/* Name & Email */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-300">Full Name</label>
                        <input
                            type="text"
                            name="fullName"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all font-sans"
                            placeholder="Sarah Connor"
                            value={formData.fullName}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-300">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all font-sans"
                            placeholder="sarah@skynet.com"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Org & Role */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-300">Organization</label>
                        <input
                            type="text"
                            name="org"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all font-sans"
                            placeholder="University / Company"
                            value={formData.org}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-300">Role</label>
                        <input
                            type="text"
                            name="role"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all font-sans"
                            placeholder="Researcher, CTO..."
                            value={formData.role}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Usage Type */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Usage Type</label>
                    <div className="relative">
                        <select
                            name="usageType"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all font-sans appearance-none"
                            value={formData.usageType}
                            onChange={handleChange}
                        >
                            <option value="" disabled className="bg-neutral-900 text-neutral-500">Select intended use...</option>
                            {USAGE_TYPES.map(type => (
                                <option key={type} value={type} className="bg-neutral-900 text-white">{type}</option>
                            ))}
                        </select>
                        {/* Check icon or chevron could go here absolutely positioned */}
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Research Goals</label>
                    <textarea
                        name="description"
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all font-sans resize-none"
                        placeholder="Tell us what you plan to build or research using Foldexa..."
                        value={formData.description}
                        onChange={handleChange}
                    />
                </div>

                {/* Contact Preference */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-neutral-300">Preferred Contact Method</label>
                    <div className="flex gap-4">
                        {CONTACT_PREFS.map((pref) => (
                            <label key={pref.id} className="flex items-center cursor-pointer group">
                                <input
                                    type="radio"
                                    name="contactPref"
                                    value={pref.id}
                                    checked={formData.contactPref === pref.id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, contactPref: e.target.value }))}
                                    className="hidden"
                                />
                                <div className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                                    formData.contactPref === pref.id
                                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                                        : "bg-white/5 border-transparent text-neutral-400 group-hover:bg-white/10"
                                )}>
                                    {pref.label}
                                </div>
                            </label>
                        ))}
                    </div>

                    <AnimatePresence>
                        {formData.contactPref !== 'email' && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <input
                                    type="text"
                                    name="contactHandle"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all font-sans mt-2"
                                    placeholder={`Your ${formData.contactPref === 'telegram' ? 'Telegram handle (@username)' : 'LinkedIn URL'}`}
                                    value={formData.contactHandle}
                                    onChange={handleChange}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Agreement */}
                <div className="pt-4">
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex items-center mt-1">
                            <input
                                type="checkbox"
                                name="agreement"
                                checked={formData.agreement}
                                onChange={(e) => setFormData(prev => ({ ...prev, agreement: e.target.checked }))}
                                className="peer appearance-none w-5 h-5 rounded border border-white/20 checked:bg-emerald-500 checked:border-emerald-500 transition-colors"
                            />
                            <Check className="absolute w-3.5 h-3.5 text-black pointer-events-none opacity-0 peer-checked:opacity-100 left-0.5" strokeWidth={3} />
                        </div>
                        <span className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors">
                            I understand Foldexa is in private beta and access is limited to selected applicants.
                        </span>
                    </label>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={!formData.agreement || status === "loading"}
                    className={cn(
                        "w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20",
                        !formData.agreement
                            ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                            : "bg-emerald-500 text-black hover:bg-emerald-400 hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0"
                    )}
                >
                    {status === "loading" ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                        </>
                    ) : (
                        <>
                            Request Access <ChevronRight className="w-5 h-5" />
                        </>
                    )}
                </button>

            </form>
        </motion.div>
    );
}

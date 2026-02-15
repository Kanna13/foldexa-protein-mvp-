"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-emerald-500/30 flex flex-col">
            <Navbar variant="contrast" />

            <main className="flex-1 flex items-center justify-center relative px-6 py-32">
                {/* Background ambient lighting */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="w-full max-w-md relative z-10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back</h1>
                        <p className="text-neutral-400">Sign in to your Foldexa account</p>
                    </div>

                    <div className="bg-[#111] border border-white/10 rounded-2xl p-8 shadow-xl backdrop-blur-sm bg-black/40">
                        <form className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">Email</label>
                                <input
                                    type="email"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all font-sans placeholder:text-neutral-600"
                                    placeholder="name@company.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-neutral-300">Password</label>
                                    <a href="#" className="text-xs text-emerald-500 hover:text-emerald-400">Forgot password?</a>
                                </div>
                                <input
                                    type="password"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all font-sans placeholder:text-neutral-600"
                                    placeholder="••••••••"
                                />
                            </div>

                            <Button className="w-full py-6 mt-2 bg-white text-black hover:bg-neutral-200 font-semibold text-base">
                                Sign In
                            </Button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-white/5 text-center text-sm text-neutral-500">
                            Don't have an account?{" "}
                            <Link href="/beta-access" className="text-emerald-500 hover:text-emerald-400 font-medium inline-flex items-center gap-1 group">
                                Request Access <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-8 text-center text-neutral-600 text-xs">
                <p>&copy; {new Date().getFullYear()} Foldexa Inc. All rights reserved.</p>
            </footer>
        </div>
    );
}

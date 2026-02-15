"use client";

import { Navbar } from "@/components/ui/Navbar";
import { BetaAccessHero } from "@/components/marketing/BetaAccessHero";
import { BetaAccessForm } from "@/components/marketing/BetaAccessForm";

export default function BetaAccessPage() {
    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-emerald-500/30">
            <Navbar variant="contrast" />

            <main className="relative pt-32 pb-24 px-6">
                {/* Background ambient lighting */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="relative z-10 max-w-7xl mx-auto">
                    <BetaAccessHero />
                    <BetaAccessForm />
                </div>
            </main>

            <footer className="py-12 text-center text-neutral-600 text-sm">
                <p>&copy; {new Date().getFullYear()} Foldexa Inc. Private Beta.</p>
            </footer>
        </div>
    );
}

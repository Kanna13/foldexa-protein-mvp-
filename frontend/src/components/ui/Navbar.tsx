"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Dna, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

const navLinks = [
    { name: "Platform", href: "#platform" },
    { name: "History", href: "/app/history" },
    { name: "About", href: "#about" },
    { name: "Team", href: "/team" },
];

interface NavbarProps {
    variant?: "default" | "light" | "contrast";
}

export function Navbar({ variant = "default" }: NavbarProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // "contrast" = Always black background, white text (High visibility on white pages)
    // "light" = Transparent then white on scroll (Standard clean)
    // "default" = Transparent then black on scroll (Dark mode)

    const isContrast = variant === "contrast";
    const isLight = variant === "light";

    // If contrast, always white text. If light, dark text.
    const textColor = isContrast ? "text-white" : (isLight ? "text-neutral-900" : "text-white");
    const subTextColor = isContrast ? "text-white hover:text-white" : (isLight ? "text-neutral-500 hover:text-neutral-900" : "text-white hover:text-white");

    // Background logic
    let navBg = "bg-transparent";
    let borderClass = "";

    if (isContrast) {
        // Always black padding, minimal transparency
        navBg = "bg-[#0A0A0A] border-b border-white/5 shadow-sm";
    } else if (isScrolled) {
        navBg = isLight ? "bg-white/80 backdrop-blur-md" : "bg-black/80 backdrop-blur-md";
        borderClass = isLight ? "border-black/5" : "border-white/5";
    }

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-2",
                navBg,
                borderClass
            )}
        >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-1 group">
                    <img src="/icon.png" alt="Foldexa Icon" className="w-8 h-8 md:w-9 md:h-9 object-contain" />
                    <span className={cn("text-base font-medium tracking-tight leading-none", textColor === "text-white" ? "text-[#FFFFF0]" : textColor)}>Foldexa</span>
                </Link>

                {/* Desktop Links */}
                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-6">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={cn("text-sm font-medium transition-colors font-mono hover:text-primary", subTextColor)}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* CTA */}
                <div className="hidden md:flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("h-7 px-3 text-xs font-medium hover:bg-white/5", isContrast ? "text-white" : "text-emerald-400 hover:text-emerald-300")}
                    >
                        Watch Demo
                    </Button>
                    <Link href="/app/new">
                        <Button variant="primary" size="sm" className="gap-1 h-7 px-3 text-xs font-medium bg-emerald-500 hover:bg-emerald-400 text-black border-0">
                            Start Folding
                        </Button>
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    className={cn("md:hidden", textColor)}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="md:hidden bg-[#0A0A0A] border-b border-white/10"
                >
                    <div className="flex flex-col p-6 gap-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-lg text-white font-mono"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <Link href="/app/new" onClick={() => setMobileMenuOpen(false)}>
                            <Button className="w-full">Start Folding</Button>
                        </Link>
                    </div>
                </motion.div>
            )}
        </motion.nav>
    );
}

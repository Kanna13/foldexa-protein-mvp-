"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Dna, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

const navLinks = [
    { name: "Platform", href: "/#platform" },
    { name: "History", href: "/app/history" },
    { name: "About", href: "/#about" },
    { name: "Team", href: "/#team" },
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

    const isContrast = variant === "contrast";
    const isLight = variant === "light";

    const textColor = isContrast ? "text-white" : (isLight ? "text-neutral-900" : "text-white");
    // Premium typography: heavier weight, tighter tracking
    const linkColor = isContrast ? "text-white/80 hover:text-white" : (isLight ? "text-neutral-600 hover:text-black" : "text-neutral-300 hover:text-white");

    let navBg = "bg-transparent";
    let borderClass = "";

    if (isContrast) {
        navBg = "bg-[#0A0A0A] border-b border-white/5 shadow-sm";
    } else if (isScrolled) {
        navBg = isLight ? "bg-white/80 backdrop-blur-xl" : "bg-black/60 backdrop-blur-xl supports-[backdrop-filter]:bg-black/60";
        borderClass = isLight ? "border-black/5" : "border-white/5";
    }

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-500 py-3",
                navBg,
                borderClass
            )}
        >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-12">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10">
                        <Image src="/icon.png" alt="Foldexa Icon" width={20} height={20} className="object-contain" />
                    </div>
                    <span className={cn("text-lg font-semibold tracking-tight leading-none", textColor === "text-white" ? "text-white" : textColor)}>
                        Foldexa
                    </span>
                </Link>

                {/* Desktop Links - Premium Typography */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            onClick={(e) => {
                                if (pathname === "/" && link.href.startsWith("/#")) {
                                    e.preventDefault();
                                    const id = link.href.replace("/#", "");
                                    const element = document.getElementById(id);
                                    if (element) {
                                        element.scrollIntoView({ behavior: "smooth" });
                                    }
                                }
                            }}
                            className={cn("text-sm font-medium tracking-wide transition-all duration-300", linkColor)}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Right Side Actions */}
                <div className="hidden md:flex items-center gap-4">
                    {/* Ghost Login Button */}
                    <Link
                        href="/login"
                        className={cn(
                            "text-sm font-medium tracking-tight transition-colors px-4 py-2 rounded-full hover:bg-white/5",
                            textColor
                        )}
                    >
                        Log in
                    </Link>

                    {/* Premium Get Access CTA (Static) */}
                    <Link href="/beta-access">
                        <div className="relative group overflow-hidden rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors">
                            <span className="relative z-10">Get Access</span>
                        </div>
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    className={cn("md:hidden p-2 rounded-md hover:bg-white/5 transition-colors", textColor)}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Menu - Premium Feel */}
            <motion.div
                initial={false}
                animate={mobileMenuOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                className="md:hidden overflow-hidden bg-[#0A0A0A] border-b border-white/10"
            >
                <div className="flex flex-col p-6 gap-2">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-2xl font-medium tracking-tight text-white/90 py-3 border-b border-white/5"
                            onClick={(e) => {
                                setMobileMenuOpen(false);
                                if (pathname === "/" && link.href.startsWith("/#")) {
                                    e.preventDefault();
                                    const id = link.href.replace("/#", "");
                                    const element = document.getElementById(id);
                                    if (element) {
                                        element.scrollIntoView({ behavior: "smooth" });
                                    }
                                }
                            }}
                        >
                            {link.name}
                        </Link>
                    ))}
                    <div className="flex flex-col gap-3 mt-6">
                        <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-center text-neutral-400 py-3">
                            Log in
                        </Link>
                        <Link href="/beta-access" onClick={() => setMobileMenuOpen(false)}>
                            <Button className="w-full bg-emerald-500 text-black font-semibold rounded-full py-6">
                                Get Early Access
                            </Button>
                        </Link>
                    </div>
                </div>
            </motion.div>
        </motion.nav>
    );
}

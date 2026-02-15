"use client";

import Link from "next/link";
import { Github, Linkedin, Mail, Twitter } from "lucide-react";

const FOOTER_LINKS = {
    product: [
        { name: "Platform", href: "/#platform" },
        { name: "Pricing", href: "/#pricing" },
        { name: "API", href: "#", disabled: true }, // Placeholder
        { name: "Docs", href: "#", disabled: true }, // Placeholder
    ],
    company: [
        { name: "About", href: "/#about" },
        { name: "Team", href: "/team" },
        { name: "Contact", href: "/#contact" },
        { name: "Careers", href: "#", disabled: true }, // Placeholder
    ],
    legal: [
        { name: "Privacy Policy", href: "#" },
        { name: "Terms of Service", href: "#" },
        { name: "Cookies", href: "#" },
        { name: "Security", href: "#" },
    ],
};

export function Footer() {
    return (
        <footer className="bg-[#0A0A0A] border-t border-white/10">



            {/* 2. MAIN FOOTER GRID (Dark Theme) */}
            <div className="max-w-7xl mx-auto px-6 py-16 text-neutral-400">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

                    {/* COLUMN 1 - BRAND */}
                    <div className="flex flex-col items-center md:items-start space-y-6">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 border border-white/10">
                                <img src="/icon.png" alt="Foldexa Icon" className="w-5 h-5 object-contain" />
                            </div>
                            <span className="text-lg font-semibold tracking-tight text-white">
                                Foldexa
                            </span>
                        </Link>

                        <p className="text-neutral-500 text-sm font-medium">
                            Engineering Life, Digitally.
                        </p>

                        <div className="flex items-center gap-4">
                            <a href="https://linkedin.com/company/foldexa" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-[#0077b5] transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </a>
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-white transition-colors">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="mailto:contact@foldexa.com" className="text-neutral-500 hover:text-emerald-500 transition-colors">
                                <Mail className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* COLUMN 2 - PRODUCT */}
                    <div className="text-center md:text-left">
                        <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-6">Product</h4>
                        <ul className="space-y-4">
                            {FOOTER_LINKS.product.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className={`text-sm hover:text-emerald-500 transition-colors ${link.disabled ? 'opacity-50 cursor-not-allowed hover:text-neutral-400' : ''}`}
                                        onClick={link.disabled ? (e) => e.preventDefault() : undefined}
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* COLUMN 3 - COMPANY */}
                    <div className="text-center md:text-left">
                        <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-6">Company</h4>
                        <ul className="space-y-4">
                            {FOOTER_LINKS.company.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className={`text-sm hover:text-emerald-500 transition-colors ${link.disabled ? 'opacity-50 cursor-not-allowed hover:text-neutral-400' : ''}`}
                                        onClick={link.disabled ? (e) => e.preventDefault() : undefined}
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* COLUMN 4 - LEGAL */}
                    <div className="text-center md:text-left">
                        <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-6">Legal</h4>
                        <ul className="space-y-4">
                            {FOOTER_LINKS.legal.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-sm hover:text-emerald-500 transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </div>

            {/* 3. DIVIDER & BOTTOM BAR */}
            <div className="border-t border-white/5 bg-black">
                <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">

                    <div className="text-xs text-neutral-500 text-center md:text-left">
                        &copy; {new Date().getFullYear()} Foldexa, Inc. All rights reserved.
                    </div>

                    <div className="text-xs text-neutral-500 font-medium text-center md:text-right">
                        Built with biology, software, and vision.
                    </div>

                </div>
            </div>
        </footer>
    );
}

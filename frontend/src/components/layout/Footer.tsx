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
        <footer className="bg-white border-t border-neutral-200">

            {/* 1. TOP CTA STRIP (Lightweight, Premium) */}
            <div className="bg-[#0A0A0A] text-white py-12 px-6 text-center relative overflow-hidden">
                {/* Subtle background accent */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-900/20 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10 max-w-2xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 text-white">
                        Accelerating the future of protein engineering.
                    </h2>
                    <p className="text-neutral-400 text-lg font-light">
                        Start designing proteins with next-generation AI.
                    </p>
                </div>
            </div>

            {/* 2. MAIN FOOTER GRID */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

                    {/* COLUMN 1 - BRAND */}
                    <div className="flex flex-col items-center md:items-start space-y-6">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-black/5 border border-black/10">
                                <img src="/icon.png" alt="Foldexa Icon" className="w-5 h-5 object-contain invert" /> {/* Invert for dark icon on light bg */}
                            </div>
                            <span className="text-lg font-semibold tracking-tight text-neutral-900">
                                Foldexa
                            </span>
                        </Link>

                        <p className="text-neutral-500 text-sm font-medium">
                            Engineering Life, Digitally.
                        </p>

                        <div className="flex items-center gap-4">
                            <a href="https://linkedin.com/company/foldexa" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-[#0077b5] transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </a>
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-black transition-colors">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="mailto:contact@foldexa.com" className="text-neutral-400 hover:text-emerald-600 transition-colors">
                                <Mail className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* COLUMN 2 - PRODUCT */}
                    <div className="text-center md:text-left">
                        <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-6">Product</h4>
                        <ul className="space-y-4">
                            {FOOTER_LINKS.product.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className={`text-sm text-neutral-500 hover:text-emerald-600 transition-colors ${link.disabled ? 'opacity-50 cursor-not-allowed hover:text-neutral-500' : ''}`}
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
                        <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-6">Company</h4>
                        <ul className="space-y-4">
                            {FOOTER_LINKS.company.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className={`text-sm text-neutral-500 hover:text-emerald-600 transition-colors ${link.disabled ? 'opacity-50 cursor-not-allowed hover:text-neutral-500' : ''}`}
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
                        <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-6">Legal</h4>
                        <ul className="space-y-4">
                            {FOOTER_LINKS.legal.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-sm text-neutral-500 hover:text-emerald-600 transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </div>

            {/* 3. DIVIDER & BOTTOM BAR */}
            <div className="border-t border-neutral-100 bg-neutral-50/50">
                <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">

                    <div className="text-xs text-neutral-400 text-center md:text-left">
                        &copy; {new Date().getFullYear()} Foldexa, Inc. All rights reserved.
                    </div>

                    <div className="text-xs text-neutral-400 font-medium text-center md:text-right">
                        Built with biology, software, and vision.
                    </div>

                </div>
            </div>
        </footer>
    );
}

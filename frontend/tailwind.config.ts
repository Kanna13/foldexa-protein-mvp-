import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: "var(--primary)",
                    dark: "var(--primary-dark)",
                },
                secondary: "var(--secondary)",
                card: {
                    DEFAULT: "var(--card)",
                    foreground: "var(--card-foreground)",
                },
                border: "var(--border)",
                glass: {
                    border: "var(--glass-border)",
                    bg: "var(--glass-bg)",
                },
            },
            fontFamily: {
                sans: ["var(--font-inter)"],
                mono: ["var(--font-space-grotesk)"],
            },
            animation: {
                float: "float 6s ease-in-out infinite",
                "ken-burns": "kenburns 40s infinite linear",
            },
            keyframes: {
                float: {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-20px)" },
                },
                kenburns: {
                    "0%": { transform: "scale(1.1) translate(0%, 0%)" },
                    "50%": { transform: "scale(1.2) translate(-3%, -2%)" },
                    "100%": { transform: "scale(1.1) translate(0%, 0%)" },
                },
            },
        },
    },
    plugins: [],
};
export default config;

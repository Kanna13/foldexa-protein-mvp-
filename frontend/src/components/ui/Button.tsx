"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "glass" | "ghost";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {

        const variants = {
            primary: "bg-primary text-black font-bold shadow-[0_0_15px_rgba(0,255,148,0.2)] hover:bg-[#00e685] hover:shadow-[0_0_25px_rgba(0,255,148,0.4)] border-0",
            secondary: "bg-secondary text-foreground border border-white/10 hover:bg-white/5",
            glass: "bg-white/5 backdrop-blur-md border border-white/10 text-foreground hover:bg-white/10 shadow-lg",
            ghost: "bg-transparent text-foreground hover:text-primary",
        };

        const sizes = {
            sm: "h-8 px-4 text-xs font-mono",
            md: "h-11 px-6 text-sm tracking-wide",
            lg: "h-14 px-8 text-base tracking-wider uppercase",
        };

        return (
            <motion.button
                ref={ref as any}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                    "relative inline-flex items-center justify-center rounded-full transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none overflow-hidden",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...(props as any)} // Cast props to satisfy HTMLMotionProps (mostly compatible)
            >
                {isLoading && (
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                <span className="relative z-10 flex items-center gap-2">{children}</span>

                {/* Subtle shine effect for primary buttons */}
                {variant === "primary" && (
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
                )}
            </motion.button>
        );
    }
);
Button.displayName = "Button";

export { Button };

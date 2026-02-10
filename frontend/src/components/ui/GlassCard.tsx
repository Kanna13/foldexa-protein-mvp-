import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    hoverEffect?: boolean;
}

export function GlassCard({ className, hoverEffect = false, children, ...props }: GlassCardProps) {
    return (
        <div
            className={cn(
                "bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-2xl p-6",
                hoverEffect && "transition-all duration-300 hover:bg-white/10 hover:border-primary/30",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

import { cn } from "@/lib/utils";

type PillVariant = "orange" | "navy" | "ghost" | "white";

interface PillProps {
  children: React.ReactNode;
  variant?: PillVariant;
  className?: string;
}

const variantStyles: Record<PillVariant, string> = {
  orange: "bg-orange text-white",
  navy: "bg-navy text-ink-light",
  ghost: "border border-ink/20 text-ink",
  white: "bg-white/10 text-ink-light border border-white/20",
};

export function Pill({ children, variant = "ghost", className }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-mono text-label-sm uppercase tracking-widest px-2.5 py-1",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

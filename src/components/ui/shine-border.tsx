import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface ShineBorderProps extends HTMLAttributes<HTMLDivElement> {
  borderWidth?: number;
  duration?: number;
  color?: "primary" | "accent" | "white";
}

const ShineBorder = forwardRef<HTMLDivElement, ShineBorderProps>(
  ({ className, borderWidth = 2, duration = 10, color = "primary", children, ...props }, ref) => {
    const colors = {
      primary: "hsl(var(--primary))",
      accent: "hsl(var(--accent))",
      white: "#ffffff",
    };

    return (
      <div
        ref={ref}
        className={cn("relative rounded-xl overflow-hidden", className)}
        style={{
          padding: borderWidth,
        }}
        {...props}
      >
        <div
          className="absolute inset-0 rounded-xl animate-gradient-shift"
          style={{
            background: `linear-gradient(90deg, transparent, ${colors[color]}, transparent)`,
            backgroundSize: '200% 100%',
            animationDuration: `${duration}s`,
          }}
        />
        <div className="relative bg-background rounded-lg h-full w-full">
          {children}
        </div>
      </div>
    );
  }
);

ShineBorder.displayName = "ShineBorder";

export { ShineBorder };

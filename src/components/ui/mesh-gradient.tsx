import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface MeshGradientProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "subtle" | "vibrant" | "dark";
  animated?: boolean;
}

const MeshGradient = forwardRef<HTMLDivElement, MeshGradientProps>(
  ({ className, variant = "subtle", animated = true, ...props }, ref) => {
    const variants = {
      subtle: "bg-[radial-gradient(ellipse_at_top_left,_hsl(var(--primary)/0.1),transparent_50%),radial-gradient(ellipse_at_top_right,_hsl(var(--accent)/0.1),transparent_50%),radial-gradient(ellipse_at_bottom,_hsl(var(--primary-glow)/0.05),transparent_50%)]",
      vibrant: "bg-[radial-gradient(ellipse_at_top_left,_hsl(var(--primary)/0.25),transparent_50%),radial-gradient(ellipse_at_top_right,_hsl(var(--accent)/0.2),transparent_50%),radial-gradient(ellipse_at_bottom,_hsl(var(--primary-glow)/0.15),transparent_50%)]",
      dark: "bg-[radial-gradient(ellipse_at_top_left,_hsl(var(--primary)/0.05),transparent_50%),radial-gradient(ellipse_at_bottom_right,_hsl(var(--accent)/0.05),transparent_50%)]",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "absolute inset-0 -z-10",
          variants[variant],
          animated && "animate-gradient-shift bg-[length:200%_200%]",
          className
        )}
        style={{
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
        {...props}
      />
    );
  }
);

MeshGradient.displayName = "MeshGradient";

export { MeshGradient };

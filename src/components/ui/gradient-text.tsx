import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface GradientTextProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
  variant?: "primary" | "accent" | "rainbow" | "sunset";
  animated?: boolean;
}

const GradientText = forwardRef<HTMLHeadingElement, GradientTextProps>(
  ({ className, as: Component = "h2", variant = "primary", animated = false, children, ...props }, ref) => {
    const gradients = {
      primary: "from-primary via-primary-glow to-accent",
      accent: "from-accent via-primary to-primary-glow",
      rainbow: "from-pink-500 via-purple-500 to-cyan-500",
      sunset: "from-orange-500 via-pink-500 to-purple-600",
    };

    return (
      <Component
        ref={ref}
        className={cn(
          "bg-gradient-to-r bg-clip-text text-transparent font-bold",
          gradients[variant],
          animated && "bg-[length:200%_auto] animate-gradient-shift",
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

GradientText.displayName = "GradientText";

export { GradientText };

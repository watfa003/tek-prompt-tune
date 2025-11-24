import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef, useState, MouseEvent } from "react";

interface RippleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline";
}

const RippleButton = forwardRef<HTMLButtonElement, RippleButtonProps>(
  ({ className, variant = "default", children, onClick, ...props }, ref) => {
    const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newRipple = { x, y, id: Date.now() };
      setRipples((prev) => [...prev, newRipple]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 600);

      onClick?.(e);
    };

    const variants = {
      default: "bg-gradient-to-tr from-primary to-accent text-primary-foreground shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-glow)]",
      ghost: "hover:bg-accent/50 hover:text-accent-foreground",
      outline: "border-2 border-input bg-background/50 backdrop-blur-sm hover:bg-accent/50 hover:border-primary/30",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "relative overflow-hidden inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-[background-color,border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 active:scale-[0.98]",
          variants[variant],
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 pointer-events-none animate-ripple"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 10,
              height: 10,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
        {children}
      </button>
    );
  }
);

RippleButton.displayName = "RippleButton";

export { RippleButton };

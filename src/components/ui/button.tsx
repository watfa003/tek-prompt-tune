import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-[background-color,border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border-2 border-transparent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "relative overflow-hidden bg-gradient-to-tr from-primary to-accent text-primary-foreground shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-glow)] hover:scale-[1.02] after:absolute after:inset-0 after:bg-gradient-to-tr after:from-foreground/10 after:to-transparent after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-200",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-[1.02]",
        outline: "border-2 border-input bg-background/50 backdrop-blur-sm hover:bg-accent/50 hover:text-accent-foreground hover:border-primary/30 hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)] hover:scale-[1.02]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70 hover:scale-[1.02]",
        ghost: "hover:bg-accent/50 hover:text-accent-foreground hover:scale-[1.02]",
        link: "text-primary underline-offset-4 hover:underline",
        premium: "relative overflow-hidden bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_35px_hsl(var(--primary)/0.5)] hover:bg-[position:100%_0] hover:scale-[1.02] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700",
        glass: "relative overflow-hidden bg-background/30 backdrop-blur-md border-2 border-primary/20 text-foreground shadow-[0_8px_32px_0_rgba(110,231,255,0.1)] hover:border-primary/40 hover:shadow-[0_8px_32px_0_rgba(110,231,255,0.2)] hover:scale-[1.02]",
        neon: "relative overflow-hidden bg-background border-2 border-primary text-primary shadow-[0_0_15px_hsl(var(--primary)/0.5),inset_0_0_15px_hsl(var(--primary)/0.2)] hover:shadow-[0_0_25px_hsl(var(--primary)/0.7),inset_0_0_25px_hsl(var(--primary)/0.3)] hover:text-primary-glow hover:scale-[1.02]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

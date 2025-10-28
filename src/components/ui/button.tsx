import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-2 border-transparent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "relative overflow-hidden bg-gradient-to-tr from-primary to-accent text-primary-foreground shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-glow)] hover:-translate-y-1 transition-[box-shadow,transform] after:absolute after:inset-0 after:bg-gradient-to-tr after:from-foreground/10 after:to-transparent after:opacity-0 hover:after:opacity-100 after:transition-opacity",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:-translate-y-0.5 transition-all",
        outline: "border-2 border-input bg-background/50 hover:bg-accent/50 hover:text-accent-foreground hover:border-primary/30 hover:shadow-glow transition-all",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70 hover:-translate-y-0.5 transition-all",
        ghost: "hover:bg-accent/50 hover:text-accent-foreground transition-all",
        link: "text-primary underline-offset-4 hover:underline",
        premium: "relative overflow-hidden bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] text-primary-foreground shadow-[0_0_30px_rgba(110,231,255,0.3)] hover:shadow-[0_0_50px_rgba(110,231,255,0.5)] hover:-translate-y-1 hover:bg-[position:100%_0] transition-all duration-300",
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

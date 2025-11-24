import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-xl border bg-card/60 backdrop-blur text-card-foreground shadow-[var(--shadow-card)] transition-[border-color,box-shadow] duration-200", className)} {...props} />
));
Card.displayName = "Card";

const CardGlass = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-xl border-2 border-primary/10 bg-background/20 backdrop-blur-xl text-card-foreground shadow-[0_8px_32px_0_rgba(110,231,255,0.1)] hover:border-primary/20 hover:shadow-[0_8px_32px_0_rgba(110,231,255,0.2)] transition-[border-color,box-shadow] duration-200", className)} {...props} />
));
CardGlass.displayName = "CardGlass";

const CardInteractive = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-xl border bg-card/60 backdrop-blur text-card-foreground shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] hover:border-primary/30 hover:-translate-y-1 transition-all duration-200 cursor-pointer", className)} {...props} />
));
CardInteractive.displayName = "CardInteractive";

const CardNeon = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-xl border-2 border-primary/50 bg-background/90 backdrop-blur text-card-foreground shadow-[0_0_20px_hsl(var(--primary)/0.3),inset_0_0_20px_hsl(var(--primary)/0.1)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.5),inset_0_0_30px_hsl(var(--primary)/0.2)] transition-[border-color,box-shadow] duration-200", className)} {...props} />
));
CardNeon.displayName = "CardNeon";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardGlass, CardInteractive, CardNeon, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };

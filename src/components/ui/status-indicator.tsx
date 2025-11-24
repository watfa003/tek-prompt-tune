import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: "online" | "offline" | "busy" | "away";
  size?: "sm" | "md" | "lg";
  withPulse?: boolean;
  className?: string;
}

export function StatusIndicator({ 
  status, 
  size = "md", 
  withPulse = true,
  className 
}: StatusIndicatorProps) {
  const sizes = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const colors = {
    online: "bg-success",
    offline: "bg-muted-foreground",
    busy: "bg-destructive",
    away: "bg-warning",
  };

  const glowColors = {
    online: "shadow-[0_0_8px_hsl(var(--success))]",
    offline: "shadow-none",
    busy: "shadow-[0_0_8px_hsl(var(--destructive))]",
    away: "shadow-[0_0_8px_hsl(var(--warning))]",
  };

  return (
    <span className={cn("relative inline-flex", className)}>
      <span
        className={cn(
          "rounded-full",
          sizes[size],
          colors[status],
          glowColors[status]
        )}
      />
      {withPulse && status !== "offline" && (
        <span
          className={cn(
            "absolute inline-flex rounded-full opacity-75 animate-ping",
            sizes[size],
            colors[status]
          )}
        />
      )}
    </span>
  );
}

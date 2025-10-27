import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllOutputTypes, OutputType } from '@/lib/output-formatters';
import { cn } from '@/lib/utils';

interface OutputTypeSelectorProps {
  value: OutputType;
  onChange: (type: OutputType) => void;
  className?: string;
}

export const OutputTypeSelector: React.FC<OutputTypeSelectorProps> = ({
  value,
  onChange,
  className
}) => {
  const outputTypes = getAllOutputTypes();
  const [hoveredType, setHoveredType] = React.useState<OutputType | null>(null);
  const [tooltipPosition, setTooltipPosition] = React.useState<{ top: number; left: number } | null>(null);

  const handleMouseEnter = (config: any, event: React.MouseEvent<HTMLButtonElement>) => {
    setHoveredType(config.id);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      top: rect.top - 60,
      left: rect.left + rect.width / 2
    });
  };

  const handleMouseLeave = () => {
    setHoveredType(null);
    setTooltipPosition(null);
  };

  return (
    <>
      <div className={cn("flex flex-wrap gap-2", className)}>
        {outputTypes.map((config) => {
          const Icon = config.icon;
          const isActive = value === config.id;

          return (
            <motion.button
              key={config.id}
              onClick={() => onChange(config.id)}
              onMouseEnter={(e) => handleMouseEnter(config, e)}
              onMouseLeave={handleMouseLeave}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200",
                "border border-border/40 backdrop-blur-sm",
                isActive 
                  ? "bg-primary/10 text-primary border-primary/40 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)]" 
                  : "bg-card/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-border"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
            >
              {/* Icon */}
              <Icon className={cn(
                "h-4 w-4 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
              
              {/* Label */}
              <span className="text-sm">{config.label}</span>

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute inset-0 border-2 border-primary rounded-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Custom Glass Tooltip with Neon Accent */}
      <AnimatePresence>
        {hoveredType && tooltipPosition && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed z-[100] pointer-events-none"
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="relative">
              {/* Neon glow effect */}
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-lg" />
              
              {/* Glass tooltip */}
              <div className="relative px-4 py-2.5 rounded-lg bg-background/95 backdrop-blur-xl border border-primary/30 shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)]">
                <p className="text-xs text-foreground font-medium whitespace-nowrap max-w-xs">
                  {outputTypes.find(t => t.id === hoveredType)?.description}
                </p>
                
                {/* Tooltip arrow */}
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-primary/30" />
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-[7px] w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-background/95" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

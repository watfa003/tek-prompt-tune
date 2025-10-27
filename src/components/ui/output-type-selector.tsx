import React from 'react';
import { motion } from 'framer-motion';
import { getAllOutputTypes, OutputType } from '@/lib/output-formatters';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

  return (
    <TooltipProvider>
      <div className={cn("flex flex-wrap gap-2", className)}>
        {outputTypes.map((config) => {
          const Icon = config.icon;
          const isActive = value === config.id;

          return (
            <Tooltip key={config.id}>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => onChange(config.id)}
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
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="font-medium">{config.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

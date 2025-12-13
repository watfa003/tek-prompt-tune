import React, { useState } from 'react';
import { getAllOutputTypes, OutputType } from '@/lib/output-formatters';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface OutputTypeSelectorProps {
  value: OutputType;
  onChange: (type: OutputType) => void;
  className?: string;
  disabled?: boolean;
}

export const OutputTypeSelector: React.FC<OutputTypeSelectorProps> = ({
  value,
  onChange,
  className,
  disabled = false
}) => {
  const outputTypes = getAllOutputTypes();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const hoveredConfig = outputTypes.find(c => c.id === hoveredItem);

  return (
    <div className="relative">
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={className} disabled={disabled}>
          <SelectValue placeholder="Select output type" />
        </SelectTrigger>
        <SelectContent className="bg-background border-border shadow-lg z-50">
          {outputTypes.map((config) => {
            const Icon = config.icon;
            
            return (
              <SelectItem 
                key={config.id}
                value={config.id} 
                className="cursor-pointer"
                onMouseEnter={() => setHoveredItem(config.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{config.label}</span>
                </div>
              </SelectItem>
            );
          })}
          
          {/* Tooltip panel that appears when hovering items */}
          {hoveredConfig && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-[200] pointer-events-none">
              <div className="bg-popover text-popover-foreground border border-border rounded-lg p-3 shadow-lg min-w-[220px] max-w-xs animate-in fade-in-0 zoom-in-95 duration-150">
                <p className="text-xs font-medium mb-1">{hoveredConfig.label}</p>
                <p className="text-xs text-muted-foreground">{hoveredConfig.tooltip}</p>
              </div>
            </div>
          )}
        </SelectContent>
      </Select>
      
      {/* Inline tooltip for the selected value */}
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              type="button"
              className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-xs">{outputTypes.find(c => c.id === value)?.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

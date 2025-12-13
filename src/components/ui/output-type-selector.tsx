import React from 'react';
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
              <TooltipProvider key={config.id} delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SelectItem 
                      value={config.id} 
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="start" sideOffset={4} className="max-w-xs">
                    <p className="text-xs font-medium mb-1">{config.label}</p>
                    <p className="text-xs text-muted-foreground">{config.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
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

import React from 'react';
import { getAllOutputTypes, OutputType } from '@/lib/output-formatters';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    <TooltipProvider delayDuration={300}>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={className} disabled={disabled}>
          <SelectValue placeholder="Select output type" />
        </SelectTrigger>
        <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50">
          {outputTypes.map((config) => {
            const Icon = config.icon;
            
            return (
              <Tooltip key={config.id}>
                <TooltipTrigger asChild>
                  <SelectItem value={config.id} className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{config.label}</span>
                    </div>
                  </SelectItem>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-xs">{config.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </SelectContent>
      </Select>
    </TooltipProvider>
  );
};

import React from 'react';
import { PROVIDER_CONFIGS } from '@/lib/selector-configs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProviderSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  value,
  onChange,
  className,
  disabled = false
}) => {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className} disabled={disabled}>
        <SelectValue placeholder="Select AI provider" />
      </SelectTrigger>
      <SelectContent className="bg-background border-border shadow-lg z-50">
        {PROVIDER_CONFIGS.map((config) => (
          <TooltipProvider key={config.id} delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <SelectItem value={config.id} className="cursor-pointer">
                  {config.label}
                </SelectItem>
              </TooltipTrigger>
              <TooltipContent side="left" align="center" className="max-w-xs">
                <p className="text-xs">{config.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </SelectContent>
    </Select>
  );
};

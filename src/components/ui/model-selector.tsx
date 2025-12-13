import React from 'react';
import { getModelsForProvider } from '@/lib/selector-configs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  provider: string;
  className?: string;
  disabled?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  onChange,
  provider,
  className,
  disabled = false
}) => {
  const models = getModelsForProvider(provider);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className} disabled={disabled}>
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent className="bg-background border-border shadow-lg z-50">
        {models.map((config) => (
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

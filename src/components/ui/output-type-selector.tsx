import React, { useState } from 'react';
import { getAllOutputTypes, OutputType } from '@/lib/output-formatters';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <div className="relative">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Select output type" />
        </SelectTrigger>
        <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50">
          {outputTypes.map((config) => {
            const Icon = config.icon;
            
            return (
              <div 
                key={config.id}
                onMouseEnter={() => setHoveredItem(config.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className="relative"
              >
                <SelectItem value={config.id} className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{config.label}</span>
                  </div>
                </SelectItem>
                
                {hoveredItem === config.id && (
                  <div className="absolute left-full top-0 ml-2 z-[100] pointer-events-none">
                    <div className="bg-background/95 backdrop-blur-xl border border-primary/30 rounded-lg p-3 shadow-lg shadow-primary/10 min-w-[200px] max-w-xs animate-in fade-in-0 zoom-in-95 duration-150">
                      <p className="text-xs text-muted-foreground">{config.description}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

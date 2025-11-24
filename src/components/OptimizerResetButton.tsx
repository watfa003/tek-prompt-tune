import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const OptimizerResetButton = () => {
  const { toast } = useToast();

  const handleReset = () => {
    console.log('🔄 Emergency Reset - Clearing all optimizer state');
    
    // Clear all localStorage
    localStorage.removeItem('promptOptimizer_isOptimizing');
    localStorage.removeItem('promptOptimizer_startTime');
    localStorage.removeItem('promptOptimizer_sessionKey');
    localStorage.removeItem('promptOptimizer_payload');
    
    console.log('✅ All optimizer state cleared');
    
    toast({
      title: 'Optimizer Reset',
      description: 'All cached state cleared. Try optimizing again.',
    });
    
    // Force page reload to ensure clean slate
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleReset}
      className="gap-2"
    >
      <RotateCcw className="h-4 w-4" />
      Reset Optimizer
    </Button>
  );
};

import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const OptimizerResetButton = () => {
  const { toast } = useToast();

  const handleReset = () => {
    console.log('🔄 Emergency reset triggered');
    
    // Clear all localStorage keys related to optimizer
    localStorage.removeItem('promptOptimizer_isOptimizing');
    localStorage.removeItem('promptOptimizer_startTime');
    localStorage.removeItem('promptOptimizer_sessionKey');
    
    // Clear any other cached optimizer state
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.startsWith('promptOptimizer_') || key.startsWith('opt-')) {
        localStorage.removeItem(key);
        console.log('Cleared:', key);
      }
    });
    
    // Reload the page to reset all React state
    toast({
      title: 'Optimizer Reset',
      description: 'All optimizer state has been cleared. Reloading...',
    });
    
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <Button
      onClick={handleReset}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <RefreshCw className="h-4 w-4" />
      Reset Optimizer
    </Button>
  );
};

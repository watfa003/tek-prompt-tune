import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDataCleanup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const cleanupOldData = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('cleanup-old-data', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      const deleted = data.deleted;
      const totalDeleted = 
        deleted.prompts + 
        deleted.optimizations + 
        deleted.speedOptimizations + 
        deleted.chatSessions + 
        deleted.chatMessages;

      if (totalDeleted > 0) {
        toast({
          title: 'Data cleaned up successfully',
          description: `Deleted ${totalDeleted} old records based on your retention settings.`,
        });
      } else {
        toast({
          title: 'No old data found',
          description: 'All your data is within the retention period.',
        });
      }

      return data;
    } catch (error) {
      console.error('Error cleaning up data:', error);
      toast({
        title: 'Cleanup failed',
        description: error.message || 'Failed to clean up old data',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cleanupOldData,
    isLoading,
  };
};

-- Add unique constraint to optimization_progress table
-- This ensures only one progress entry per session_key and user_id combination
ALTER TABLE public.optimization_progress 
DROP CONSTRAINT IF EXISTS optimization_progress_session_user_unique;

ALTER TABLE public.optimization_progress 
ADD CONSTRAINT optimization_progress_session_user_unique 
UNIQUE (session_key, user_id);